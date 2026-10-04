#!/usr/bin/env python3
"""Dreamward API — LLM comparison summaries and dream interpretation.
Rate-limited (10 requests per IP per hour) and uses Haiku for cost efficiency.
"""
import json
import re
import time
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from anthropic import Anthropic

app = FastAPI()

# --- CORS: allow the GitHub Pages deployment and localhost ---
ALLOWED_ORIGINS = [
    "https://more-reese.github.io",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic()

# --- Rate limiting: 10 requests per IP per hour, in-memory ---
RATE_LIMIT = 10  # max requests per window
RATE_WINDOW = 3600  # 1 hour in seconds
_request_log: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(client_ip: str) -> None:
    """Raise 429 if client has exceeded the rate limit."""
    now = time.time()
    # Prune old entries
    _request_log[client_ip] = [
        t for t in _request_log[client_ip] if now - t < RATE_WINDOW
    ]
    if len(_request_log[client_ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. You've made 10 requests this hour. Please try again later.",
        )
    _request_log[client_ip].append(now)


# Use Haiku for cost efficiency (~10x cheaper than Sonnet)
MODEL = "claude-haiku-4-5"


class CompareRequest(BaseModel):
    traditions: list[dict]


@app.post("/api/compare-summary")
def compare_summary(req: CompareRequest):
    # Rate limit based on client IP (passed by Railway/proxy)
    client_ip = ""
    # In production, Railway sets X-Forwarded-For
    client_ip = req.__dict__  # placeholder, real IP comes from request
    names = [t.get("name", "Unknown") for t in req.traditions]

    # Build a rich prompt with all tradition data
    tradition_details = ""
    for t in req.traditions:
        tradition_details += f"\n## {t.get('name', 'Unknown')}\n"
        tradition_details += f"- Cluster: {t.get('cluster', 'N/A')}\n"
        tradition_details += f"- Epistemology: {t.get('epistemologyPrimary', 'N/A')}\n"
        tradition_details += f"- Ontology: {', '.join(t.get('ontology', [])) if isinstance(t.get('ontology'), list) else t.get('ontology', 'N/A')}\n"
        tradition_details += f"- Functions: {', '.join(t.get('functions', [])) if isinstance(t.get('functions'), list) else t.get('functions', 'N/A')}\n"
        tradition_details += f"- Agency Style: {t.get('agencyStyle', 'N/A')}\n"
        tradition_details += f"- Period: {t.get('period', 'N/A')}\n"
        tradition_details += f"- Region: {t.get('region', 'N/A')}\n"

    prompt = f"""You are a comparative religion and dream studies scholar. Compare these {len(names)} dream traditions: {', '.join(names)}.

Here is detailed data on each:
{tradition_details}

Write a scholarly but accessible 3-4 paragraph comparative analysis covering:
1. Key philosophical/ontological differences and what they reveal
2. Surprising commonalities or convergences across these traditions
3. How their epistemological approaches differ (how each tradition "knows" about dreams)
4. Practical implications — how would a dreamer's experience differ under each framework?

Be specific, use the actual data provided, and avoid generic statements. Write in a warm scholarly tone. Do not use bullet points — write flowing prose paragraphs."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"summary": message.content[0].text}


@app.post("/api/interpret-dream")
async def interpret_dream(request: Request):
    # Rate limit
    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    _check_rate_limit(client_ip)

    body = await request.json()
    dream_text = body.get("dream_text", "")
    tradition = body.get("tradition", {})

    # Length guard: reject excessively long dreams
    if len(dream_text) > 5000:
        raise HTTPException(status_code=400, detail="Dream text too long (max 5000 characters).")

    ontology = tradition.get("ontology", "")
    if isinstance(ontology, list):
        ontology = ", ".join(ontology)

    functions = tradition.get("functions", "")
    if isinstance(functions, list):
        functions = ", ".join(functions)

    system_prompt = """You are a dream interpretation assistant for Dreamward, a comparative atlas of dream traditions. You interpret dreams strictly through the lens of a specific tradition provided to you. You are NOT a general dream interpreter — you embody the framework, vocabulary, and worldview of the given tradition.

Rules:
1. Stay faithful to the tradition's ontology, epistemology, and agency style. Do not blend in concepts from other traditions.
2. Write the narrative interpretation in 2–3 paragraphs, as if a knowledgeable practitioner of this tradition were speaking to a curious layperson. Be warm but intellectually honest.
3. For Key Symbols: identify 3–5 specific images or elements from the dream and explain what they mean within this tradition's framework. If the tradition would NOT assign symbolic meaning (e.g., Activation-Synthesis, Hall/Van de Castle), say so explicitly and describe what the tradition WOULD do with those elements instead.
4. For Emotional Themes: list 2–4 emotional or psychological themes the tradition would identify.
5. For Reflection Questions: provide 2–3 questions the tradition would encourage the dreamer to consider. If the tradition does not use reflective questioning (e.g., empirical/measurement traditions), instead provide observational prompts like "Notice whether..." or "Track whether...".
6. Do NOT provide medical, clinical, or spiritual advice. Frame everything as one tradition's perspective, not truth.
7. Keep total output under 600 words.

Respond in valid JSON only, with this exact structure:
{
  "narrative": "string with paragraphs separated by \\n\\n",
  "symbols": [{"symbol": "string", "meaning": "string"}],
  "themes": ["string"],
  "questions": ["string"]
}"""

    user_prompt = f"""Tradition: {tradition.get('name', '')}
Cluster: {tradition.get('cluster', '')}
Ontology: {ontology}
Epistemology: {tradition.get('epistemologyPrimary', '')}
Agency Style: {tradition.get('agencyStyle', '')}
Functions: {functions}
Key Figures: {tradition.get('keyFigures', '')}

Dream:
"{dream_text}"

Interpret this dream through the lens of {tradition.get('name', '')}. Follow the JSON response format specified in your instructions."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    response_text = message.content[0].text

    try:
        # Strip markdown code fences if present
        clean = re.sub(r'^```json\s*|\s*```$', '', response_text.strip())
        result = json.loads(clean)
    except Exception:
        result = {
            "narrative": response_text,
            "symbols": [],
            "themes": [],
            "questions": [],
        }

    return result


@app.get("/")
async def root():
    return {"status": "ok", "service": "dreamward-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

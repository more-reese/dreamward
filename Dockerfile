# --- Dreamward API Server (for Railway) ---
# Serves the FastAPI backend for AI features (interpret, compare-summary).

FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api_server.py .

# Railway sets PORT automatically; default to 8000 for local
ENV PORT=8000
EXPOSE ${PORT}
CMD uvicorn api_server:app --host 0.0.0.0 --port ${PORT}

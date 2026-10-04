# Dreamward

**A comparative atlas of dream traditions**

Dreamward is a scholarly research tool mapping 32 dream traditions across history, culture, and discipline — from Tibetan Dream Yoga to Activation-Synthesis Hypothesis, from Anishinaabe dreaming to Freudian psychoanalysis.

## Views

### Dream Entry (`#entry`)
The landing screen. Describe a dream in free text and Dreamward will tokenize and score your description against each tradition's `dreamKeywords`, returning the top 5 resonant traditions highlighted in the Graph.

### Graph View (`#graph`)
D3 v7 force-directed network. Nodes are colored by cluster; edges connect traditions sharing cluster (thin, colored), epistemology (neutral), or agency style (dotted). Controls panel: group by cluster/epistemology/agency, filter by cluster, toggle connections. When accessed from Dream Entry, matched traditions are highlighted and others dimmed.

### Matrix View (`#matrix`)
2D scatter plot. Select two axes from: Epistemology, Agency Style, Cluster, Period, Ontology. Traditions plotted as colored dots (by cluster) with jitter to reduce overlap. Hover for the shared hover card.

### Profile View (`#profile/:id`)
Full tradition detail — synthesized concept paragraph, contextual reading, key figures & texts, source notes with bias flags highlighted, and filtered resources from the 168-item bibliography.

### Comparator (`#compare`)
Side-by-side comparison of 2–3 traditions. Shared values are highlighted in gold. Add traditions via hover card "Compare +" or profile "Add to Comparator" buttons. An AI-generated comparative analysis is available when the API server is running.

### Interpret (`#interpret`)
Dream interpretation through tradition lenses. Enter a dream, get matched to the top 5 traditions, then select up to 3 to generate interpretations through each tradition's framework. Each interpretation includes a narrative, key symbols, emotional themes, reflection questions, and suggested resources. AI-generated and clearly labeled as such — not clinical advice.

### Glossary (`#glossary`)
Key terms and concepts from across the dream studies tradition, with cross-references to the traditions that use them.

### Resources (`#resources`)
The full 168-item bibliographic database, filterable by tradition, type, and cluster.

### About (`#about`)
Project description and methodology.

## Data

- **`/data/traditions.json`** — 32 entries (Traditions and Provocations) with fields: `id`, `entryType`, `cluster`, `name`, `epistemologyPrimary`, `epistemologySecondary`, `ontology`, `functions`, `institutionalHome`, `agencyStyle`, `period`, `region`, `keyFigures`, `sourceNotes`, `dreamKeywords`
- **`/data/resources.json`** — 168 bibliographic resources linked to traditions
- **`/data/glossary.json`** — glossary terms with cross-references

## Quick Start

### Frontend only (no API key needed)

```bash
# From the project directory, serve with any static file server:
python3 -m http.server 8001
# Then open http://localhost:8001
```

All views work except AI-generated features (Interpret, Comparator AI Summary), which require the API server.

### Full app (with AI features)

```bash
# 1. Start the API server (requires ANTHROPIC_API_KEY)
pip install fastapi uvicorn anthropic
export ANTHROPIC_API_KEY=your-key-here
python3 api_server.py

# 2. Serve the frontend
python3 -m http.server 8001
# Open http://localhost:8001
```

The API server runs on port 8000 and provides two endpoints:
- `POST /api/interpret-dream` — interprets a dream through a specific tradition's lens
- `POST /api/compare-summary` — generates a comparative analysis of 2–3 traditions

## Technical

- Vanilla HTML/CSS/JS — no build step required
- D3.js v7 from CDN
- Hash-based SPA routing (`#entry`, `#graph`, `#matrix`, `#profile/:id`, `#compare`, `#interpret`, `#glossary`, `#resources`, `#about`)
- All state in JS variables (no localStorage)
- Google Fonts: Playfair Display (serif headings) + Inter (body/UI)
- Dark mode only
- Optional FastAPI backend (`api_server.py`) for AI-powered features

## Design

Dark scholarly aesthetic. Background `#0f0f0f`. Primary accent: warm gold `#c9a84c`. Eight muted cluster colors (amber, rose, sage, slate-blue, dusty-teal, ochre, soft-violet, grey).

## Protocol Specification

The protocol specification (`docs/dreamward_protocol_spec_v0.5.1.md`) describes the full architecture: design invariants, the four protocol-level nodes (DreamNode, TraditionNode, TraditionActivation, EngagementNode), and the two-layer model (Dream Capture + Tradition Shelf).

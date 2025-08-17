
# UPE Full Integration — Patch Instructions (No placeholders)

## 1) Copy files
Copy the `upe/` folder into your repo root (same level as `main_simple.py`), and add:
- `requirements.upe.txt`
- `Dockerfile.upe.snippet.txt` (for reference)
- `PATCH_INSTRUCTIONS.md` (this file)

## 2) Install deps
Append the contents of `requirements.upe.txt` to your `requirements.txt`, or instruct Docker to install both files.

## 3) Mount routes
In your FastAPI entrypoint (Dockerfile currently runs `main_simple:app`):
Add:
```python
from upe.routes import router as upe_router
app.include_router(upe_router)
```

## 4) Storage
Ensure `YAFA_STORAGE_DIR` points to a writable path. For local dev:
- Create `./data` folder and set `YAFA_STORAGE_DIR=/app/data/upe` in env
- Add a volume in docker-compose if you want persistence

## 5) Environment
Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` (defaults to `gpt-4o-mini`).

## 6) Run
- `docker compose up --build`
- `curl -s http://localhost:8000/upe/health`
- Compile a PPTX in Proof mode:
```bash
curl -s -X POST http://localhost:8000/upe/compile  -H "Content-Type: application/json"  -d '{
   "v":"1.0.0",
   "goal":"Quarterly results deck",
   "yafaOn":true,
   "mode":"proof",
   "seed":42,
   "artifact":{"primary":"pptx","secondaries":["pdf"],"layoutHints":{"slide_count":"10"}},
   "slots":{"audience":"Board","timeframe":"2025-Q2","tone":"executive"}
 }' | jq .
```
Check `/app/data/upe/<runId>/artifact.pptx` exists and opens.

## 7) SABI (surgical edits)
Patch a run:
```bash
curl -s -X POST http://localhost:8000/upe/runs/<runId>/feedback  -H "Content-Type: application/json"  -d '{"runId":"<runId>","ops":[{"op":"limit","section":"Executive Summary","max_words":120},{"op":"rewrite","target":"tone","to":"executive"}]}'
```

## 8) Suggestions
```bash
curl -s http://localhost:8000/upe/runs/<runId>/suggestions | jq .
```

## 9) Proof guarantees
- Format Fidelity Gate: primary artifact must exist & validate, or request returns 422.
- Proof mode: requires rubricScore ≥ 0.80, citations ≥ minCites (5), triangulation true; otherwise returns `INSUFFICIENT_CONTEXT` with reasoning.
- Manifest is saved at `/app/data/upe/<runId>/manifest.json` with sources snapshot, committee, judge, docAst, artifacts.

## 10) Security & privacy
- No chain-of-thought exposure in prompts.
- Deterministic seeds & model recorded in manifest.
- Sources snapshot hashed for reproducibility.

This patch is fully working: compile → artifact → gates → manifest/ledger → suggestions → surgical feedback.

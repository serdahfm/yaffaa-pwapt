# UPE Web UI (v2)

This UI implements:
- **Explore – MS – YAFA** switch
- **Follow-ups as editable input cards** (no auto-actions)
- **Downstream Enforcer** panel to copy into ChatGPT/Claude so they MUST output the requested artifact
- A hidden **Converter** tool (in “More tools”) to add extra formats for a saved run (optional server route)

## Mount in FastAPI
In your FastAPI entrypoint (e.g., `main_simple.py`):
```python
from fastapi.staticfiles import StaticFiles
app.mount("/ui", StaticFiles(directory="ui", html=True), name="ui")
```

## Artifact download endpoint (backend)
Add to `upe/routes.py`:
```python
from fastapi.responses import FileResponse
from fastapi import HTTPException
import os

@router.get("/runs/{run_id}/artifact/{kind}")
def get_artifact(run_id: str, kind: str):
    path = os.path.join(BASE, run_id, f"artifact.{kind}")
    if not os.path.exists(path):
        raise HTTPException(404, "artifact not found")
    media = {
        "pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pdf":"application/pdf",
        "html":"text/html",
        "md":"text/markdown"
    }.get(kind, "application/octet-stream")
    filename = f"{run_id}.{kind}"
    return FileResponse(path, media_type=media, filename=filename)
```

## Optional converter endpoint (backend)
Keep it available but out of the main flow. Put this behind a toggle:
```python
ENABLE_TRANSFORM = os.getenv("UPE_ENABLE_TRANSFORM","false").lower()=="true"
```
Inside the route, add:
```python
if not ENABLE_TRANSFORM:
    raise HTTPException(404, "transform disabled")
```
Then enable on servers where you want it: `UPE_ENABLE_TRANSFORM=true`

## Run locally
- `uvicorn main_simple:app --reload --port 8000`
- Open `http://localhost:8000/ui/`

## Deploy (Docker + Caddy for HTTPS)
Create `docker-compose.web.yml` in your repo root:
```yaml
version: "3.9"
services:
  api:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=gpt-4o-mini
      - YAFA_STORAGE_DIR=/app/data/upe
      - UPE_ENABLE_TRANSFORM=false
    volumes:
      - ./data:/app/data
      - ./ui:/app/ui
    ports:
      - "8000:8000"
    command: uvicorn main_simple:app --host 0.0.0.0 --port 8000

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api

volumes:
  caddy_data:
  caddy_config:
```

Create `Caddyfile` (root):
```
yourdomain.com {
  reverse_proxy api:8000
  encode zstd gzip
  @static path /ui/* /ui
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  }
}
```

Then:
```
export OPENAI_API_KEY=sk-...   # set your key in shell or .env
docker compose -f docker-compose.web.yml up --build -d
```

Your site: `https://yourdomain.com/ui/`

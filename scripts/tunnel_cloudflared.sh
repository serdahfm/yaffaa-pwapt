
#!/usr/bin/env bash
set -euo pipefail
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Install cloudflared: brew install cloudflare/cloudflare/cloudflared"
  exit 1
fi
echo "Starting Cloudflare quick tunnel -> http://localhost:8000"
echo "Login may pop in browser; follow prompts."
cloudflared tunnel --url http://localhost:8000

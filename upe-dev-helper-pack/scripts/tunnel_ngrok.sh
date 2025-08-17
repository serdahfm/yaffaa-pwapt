
#!/usr/bin/env bash
set -euo pipefail
if ! command -v ngrok >/dev/null 2>&1; then
  echo "Install ngrok: brew install ngrok"
  exit 1
fi
if ! [ -f "$HOME/Library/Application Support/ngrok/ngrok.yml" ] && ! [ -f "$HOME/.config/ngrok/ngrok.yml" ]; then
  echo "Run once: ngrok config add-authtoken <YOUR_TOKEN>"
  exit 1
fi
echo "Starting ngrok tunnel -> http://localhost:8000"
ngrok http 8000

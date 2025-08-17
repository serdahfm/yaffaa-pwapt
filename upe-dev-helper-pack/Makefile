
.PHONY: venv deps run smoke ngrok cloudflare

venv:
	python3 -m venv .venv

deps:
	. .venv/bin/activate && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && if [ -f requirements.upe.txt ]; then python -m pip install -r requirements.upe.txt; fi && python -m pip install openai

run:
	. .venv/bin/activate && uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000

smoke:
	bash scripts/upe_smoke.sh

ngrok:
	bash scripts/tunnel_ngrok.sh

cloudflare:
	bash scripts/tunnel_cloudflared.sh

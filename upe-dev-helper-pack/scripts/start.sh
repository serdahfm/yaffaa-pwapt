
#!/usr/bin/env bash
set -euo pipefail
python -m uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000

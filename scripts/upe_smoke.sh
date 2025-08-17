
#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:8000"
JQ=$(command -v jq || true)
CURL="curl -sS"

if [ -z "$JQ" ]; then
  echo "jq is required. Install: brew install jq"
  exit 1
fi

echo "1) Health check"
$CURL "$API/upe/health" | jq .

echo "2) Compile (mentor, primary=docx, secondaries=pdf,md)"
RESP=$($CURL -X POST "$API/upe/compile" -H "Content-Type: application/json" -d '{
  "v":"1.0.0",
  "goal":"Smoke test: generate a short report about the UPE system",
  "yafaOn":true,
  "mode":"mentor",
  "seed":42,
  "artifact":{"primary":"docx","secondaries":["pdf","md"]},
  "slots":{"audience":"QA","timeframe":"2025-Q3","tone":"neutral","explore":"MS"}
}')
echo "$RESP" | jq .
MID=$(echo "$RESP" | jq -r .manifestId)
STATUS=$(echo "$RESP" | jq -r .status)
if [ -z "$MID" ] || [ "$MID" = "null" ]; then
  echo "Manifest ID missing"; exit 1
fi
echo "Manifest: $MID (status: $STATUS)"

echo "3) Get run manifest"
$CURL "$API/upe/runs/$MID" | jq '.id, .status, .artifacts | length'

echo "4) Download artifacts (docx, pdf, md)"
for k in docx pdf md; do
  OUT="art_${MID}.${k}"
  http_code=$(curl -s -w "%{http_code}" -o "$OUT" "$API/upe/runs/$MID/artifact/$k" || true)
  echo "  $k -> HTTP $http_code, size: $(stat -f%z "$OUT" 2>/dev/null || echo 0)"
done

echo "5) SABI: limit Executive Summary to 120 words"
$CURL -X POST "$API/upe/runs/$MID/feedback" -H "Content-Type: application/json" -d "{
  \"runId\":\"$MID\",
  \"ops\":[{\"op\":\"limit\",\"section\":\"Executive Summary\",\"max_words\":120}]
}" | jq .

echo "6) Suggestions"
$CURL "$API/upe/runs/$MID/suggestions" | jq .

echo "7) Compile (proof, primary=docx)"
RESP2=$($CURL -X POST "$API/upe/compile" -H "Content-Type: application/json" -d '{
  "v":"1.0.0",
  "goal":"Smoke test: produce a 1-page executive summary with citations",
  "yafaOn":true,
  "mode":"proof",
  "seed":43,
  "artifact":{"primary":"docx","secondaries":["pdf"]},
  "slots":{"audience":"Leadership","timeframe":"2025-Q3","tone":"executive","explore":"YAFA"}
}')
echo "$RESP2" | jq .
MID2=$(echo "$RESP2" | jq -r .manifestId)
echo "Manifest2: $MID2"

echo "8) Download docx/pdf"
for k in docx pdf; do
  OUT="art_${MID2}.${k}"
  http_code=$(curl -s -w "%{http_code}" -o "$OUT" "$API/upe/runs/$MID2/artifact/$k" || true)
  echo "  $k -> HTTP $http_code, size: $(stat -f%z "$OUT" 2>/dev/null || echo 0)"
done

echo "SMOKE TEST COMPLETE ✅"


from __future__ import annotations
from typing import List, Dict, Any

def followups_for(goal: str, mode: str, manifest_id: str) -> List[Dict[str,Any]]:
    items = []
    items.append({
        "id":"verify_claims",
        "label":"Verify claims",
        "rationale":"Increase evidence thresholds and re-run judge.",
        "action":{"route":"/upe/compile","requestBody":{"mode":"proof"}},
        "impact":["accuracy","safety","quality"]
    })
    items.append({
        "id":"transform_pdf",
        "label":"Also export as PDF",
        "rationale":"Share a read-only version.",
        "action":{"route":"/upe/compile","requestBody":{"artifact":{"secondaries":["pdf"]}}},
        "impact":["format"]
    })
    items.append({
        "id":"tighten_scope",
        "label":"Tighten scope",
        "rationale":"Reduce length, enforce must-include list.",
        "action":{"route":"/upe/runs/"+manifest_id+"/feedback","requestBody":{"ops":[{"op":"limit","section":"Executive Summary","max_words":180}]}},
        "impact":["quality","latency"]
    })
    return items

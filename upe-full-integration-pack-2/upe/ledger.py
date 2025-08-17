
from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Ledger(BaseModel):
    candidates: List[Dict[str, Any]]
    winnerId: str
    rationale: List[str]
    diffs: Optional[Dict[str, Any]] = None

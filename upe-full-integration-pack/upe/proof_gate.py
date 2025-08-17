
from __future__ import annotations

def proof_gate(*, rubric_score: float, min_cites: int, cites_count: int, triangulated: bool) -> tuple[bool,str]:
    if rubric_score < 0.80:
        return (False, "score_below_threshold")
    if cites_count < min_cites:
        return (False, "not_enough_evidence")
    if not triangulated:
        return (False, "no_dual_path_agreement")
    return (True, "ok")

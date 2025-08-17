
from __future__ import annotations

def format_fidelity(*, primary: str, produced: list[str]) -> tuple[bool,str]:
    ok = primary in produced
    return (ok, "ok" if ok else "missing_primary_artifact")

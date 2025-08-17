
from __future__ import annotations
import os

def validate_pdf(path: str) -> tuple[bool,str]:
    # A minimal check: non-empty bytes and starts with %PDF
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return (False, "empty_pdf")
    with open(path, "rb") as f:
        head = f.read(4)
    return (head.startswith(b"%PDF"), "ok" if head.startswith(b"%PDF") else "bad_magic")

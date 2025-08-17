
from __future__ import annotations
import os

def validate_html(path: str) -> tuple[bool,str]:
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return (False, "empty_html")
    return (True, "ok")

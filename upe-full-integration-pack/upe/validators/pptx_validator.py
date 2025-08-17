
from __future__ import annotations
from pptx import Presentation

def validate_pptx(path: str, min_slides: int = 1) -> tuple[bool,str]:
    prs = Presentation(path)
    if len(prs.slides) < min_slides:
        return (False, "too_few_slides")
    return (True, "ok")


from __future__ import annotations
from docx import Document

def validate_docx(path: str) -> tuple[bool,str]:
    d = Document(path)
    # if can open, it passes
    return (True, "ok")

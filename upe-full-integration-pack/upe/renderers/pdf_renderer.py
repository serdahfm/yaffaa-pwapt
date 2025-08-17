
from __future__ import annotations
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from upe.doc_ast import Doc

def render_pdf(doc: Doc, out_path: str) -> None:
    c = canvas.Canvas(out_path, pagesize=LETTER)
    width, height = LETTER
    y = height - 1*inch
    c.setFont("Helvetica-Bold", 18)
    c.drawString(1*inch, y, doc.title)
    y -= 0.4*inch
    c.setFont("Helvetica", 11)
    for sec in doc.sections:
        if y < 1*inch:
            c.showPage()
            y = height - 1*inch
        c.setFont("Helvetica-Bold", 14)
        c.drawString(1*inch, y, sec.heading); y -= 0.3*inch
        c.setFont("Helvetica", 11)
        for block in sec.blocks:
            if block.kind == "para":
                for line in block.text.split("\n"):
                    if y < 1*inch: c.showPage(); y = height - 1*inch
                    c.drawString(1*inch, y, line); y -= 0.22*inch
            elif block.kind == "list":
                for item in block.items:
                    if y < 1*inch: c.showPage(); y = height - 1*inch
                    c.drawString(1*inch, y, f"• {item}"); y -= 0.22*inch
    c.showPage()
    c.save()

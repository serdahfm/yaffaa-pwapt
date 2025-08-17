
from __future__ import annotations
from openpyxl import Workbook
from upe.doc_ast import Doc

def render_xlsx(doc: Doc, out_path: str) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Summary"
    ws.append(["Title", doc.title])
    for sec in doc.sections:
        ws.append([])
        ws.append([sec.heading])
        for block in sec.blocks:
            if block.kind == "para":
                ws.append([block.text])
            elif block.kind == "list":
                for item in block.items:
                    ws.append(["- ", item])
            elif block.kind == "table":
                for row in block.rows:
                    ws.append(row)
    wb.save(out_path)

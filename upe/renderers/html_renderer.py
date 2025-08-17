
from __future__ import annotations
from upe.doc_ast import Doc

def render_html(doc: Doc) -> str:
    from html import escape
    html = [f"<html><head><meta charset='utf-8'><title>{escape(doc.title)}</title></head><body>"]
    html.append(f"<h1>{escape(doc.title)}</h1>")
    for sec in doc.sections:
        html.append(f"<h2>{escape(sec.heading)}</h2>")
        for block in sec.blocks:
            if block.kind == "para":
                html.append(f"<p>{escape(block.text)}</p>")
            elif block.kind == "list":
                html.append("<ul>")
                for item in block.items:
                    html.append(f"<li>{escape(item)}</li>")
                html.append("</ul>")
    html.append("</body></html>")
    return "\n".join(html)

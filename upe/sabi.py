
from __future__ import annotations
from typing import List, Dict, Any
from upe.doc_ast import Doc, Section, Para, ListBlock, Table, Chart

def apply_edit_ops(doc: Doc, ops: List[Dict[str,Any]]) -> Doc:
    # Mutates a copy of the doc and returns it
    import copy
    ndoc = copy.deepcopy(doc)
    for op in ops:
        if op.get("op") == "remove":
            target = op.get("target","").lower()
            ndoc.sections = [s for s in ndoc.sections if s.heading.lower() != target]
        elif op.get("op") == "focus":
            # Add a bullet under the first section mentioning topic
            topic = op.get("topic","")
            if ndoc.sections:
                blk = ListBlock(items=[f"Focus on: {topic}"])
                ndoc.sections[0].blocks.append(blk)
        elif op.get("op") == "rewrite":
            target = op.get("target")
            to = op.get("to","")
            # simple tone tag in title
            if target == "tone":
                ndoc.title = f"{ndoc.title} [{to}]"
        elif op.get("op") == "limit":
            section = op.get("section","").lower()
            max_words = int(op.get("max_words", 200))
            for s in ndoc.sections:
                if s.heading.lower() == section:
                    for b in s.blocks:
                        if hasattr(b, "text"):
                            words = b.text.split()
                            if len(words) > max_words:
                                b.text = " ".join(words[:max_words])
    return ndoc

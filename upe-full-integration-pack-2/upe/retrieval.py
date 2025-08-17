
from __future__ import annotations
import hashlib
from typing import List, Dict, Any

def _sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def deterministic_snapshot(docs: List[Dict[str,str]], topK: int) -> List[Dict[str,str]]:
    # docs = [{"id":..., "title":..., "body":...}]
    docs_sorted = sorted(docs, key=lambda d: (d.get("title",""), d.get("id","")))
    snap = []
    for d in docs_sorted[:topK]:
        snap.append({
            "id": d["id"],
            "title": d["title"],
            "hash": _sha256(d.get("body",""))
        })
    return snap

def load_from_chromadb(collection_name: str="yafa", topK: int=12) -> List[Dict[str,str]]:
    try:
        import chromadb  # type: ignore
        client = chromadb.Client()
        col = client.get_or_create_collection(collection_name)
        # This is a deterministic sample of first N for snapshot; real search can be added later
        results = col.get(include=["documents","metadatas","ids"])
        docs = []
        for i, doc in enumerate(results.get("documents", [])[:topK]):
            title = results.get("metadatas", [{}])[i].get("title", f"Doc {i+1}")
            docs.append({"id": results["ids"][i], "title": title, "body": doc or ""})
        return docs
    except Exception:
        return []

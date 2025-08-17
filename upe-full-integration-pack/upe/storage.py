
from __future__ import annotations
import os, json, hashlib
from typing import Dict, Any, Tuple

BASE = os.getenv("YAFA_STORAGE_DIR", "/app/data/upe")

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def write_file(path: str, data: bytes) -> Tuple[int,str]:
    ensure_dir(os.path.dirname(path))
    with open(path, "wb") as f:
        f.write(data)
    size = os.path.getsize(path)
    h = hashlib.sha256()
    h.update(data)
    return size, h.hexdigest()

def write_json(path: str, obj: Dict[str,Any]) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)

def read_json(path: str) -> Dict[str,Any]:
    with open(path, "r") as f:
        return json.load(f)

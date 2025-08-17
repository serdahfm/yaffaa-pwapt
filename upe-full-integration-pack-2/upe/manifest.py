
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ArtifactMeta(BaseModel):
    kind: str
    path: str
    bytes: int
    sha256: str
    primary: bool = False

class RunManifest(BaseModel):
    id: str
    parentId: Optional[str] = None
    createdAt: str
    request: Dict[str, Any]
    engine: Dict[str, Any]
    retrieval: Dict[str, Any]
    committee: List[Dict[str, Any]]
    judge: Dict[str, Any]
    docAst: Dict[str, Any]
    artifacts: List[ArtifactMeta]
    timings: Dict[str, float]
    status: str
    error: Optional[Dict[str, Any]] = None

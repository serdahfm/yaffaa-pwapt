
from __future__ import annotations
from pydantic import BaseModel, Field, conlist, ConfigDict
from typing import Literal, Optional, Dict, List, Any

Mode = Literal["turbo","mentor","proof"]
ArtifactKind = Literal["pptx","xlsx","docx","pdf","md","html","react_app","api_code","script"]

class ArtifactRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    primary: ArtifactKind
    secondaries: Optional[List[ArtifactKind]] = None
    layoutHints: Optional[Dict[str,str]] = None

class PabiInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    v: Literal["1.0.0"]
    goal: str
    yafaOn: bool = True
    mode: Mode
    slots: Optional[Dict[str,str]] = None
    seed: Optional[int] = None
    quality: Optional[Literal["fast","balanced","t_inf"]] = None
    artifact: ArtifactRequest

class Evidence(BaseModel):
    id: str
    source_id: str
    quote: str
    confidence: float = Field(ge=0, le=1)

class FollowupSuggestion(BaseModel):
    id: str
    label: str
    rationale: str
    action: Dict[str, Any]
    impact: List[Literal["quality","latency","safety","accuracy","cost","format","automation"]]
    previewDiff: Optional[List[Dict[str, Any]]] = None

class PabiOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    v: Literal["1.0.0"]
    bundle: Dict[str, Any]  # engineeredPrompt, runInstructions, followups
    manifestId: str
    seed: int
    model: str
    cartridge: str
    proof: Optional[Dict[str, Any]] = None
    status: Literal["OK","INSUFFICIENT_CONTEXT","POLICY_BLOCK","TOOL_ERROR"]

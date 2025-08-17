
from __future__ import annotations
from typing import List, Literal, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class Claim(BaseModel):
    id: str
    text: str
    sourceId: Optional[str] = None
    confidence: Optional[float] = None

class Para(BaseModel):
    kind: Literal["para"] = "para"
    text: str
    claims: Optional[List[Claim]] = None

class ListBlock(BaseModel):
    kind: Literal["list"] = "list"
    items: List[str]

class Table(BaseModel):
    kind: Literal["table"] = "table"
    rows: List[List[str]]

class Chart(BaseModel):
    kind: Literal["chart"] = "chart"
    spec: Any

Block = Para | ListBlock | Table | Chart

class Section(BaseModel):
    id: str
    heading: str
    blocks: List[Block]

class Doc(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    sections: List[Section]

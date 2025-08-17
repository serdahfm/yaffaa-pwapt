
from __future__ import annotations
from typing import TypedDict, List

class GearProfile(TypedDict, total=False):
    k: int
    temps: List[float]
    reflect: int
    ragTopK: int
    web: bool
    coach: bool
    proofGate: bool
    latencyMs: int
    minCites: int
    rubricMin: float
    triangulate: bool

gearProfiles: dict[str, GearProfile] = {
    "turbo":  {"k":1, "temps":[0.3],        "reflect":0, "ragTopK":6,  "web":False, "coach":False, "proofGate":False, "latencyMs":6000},
    "mentor": {"k":3, "temps":[0.2,0.5],    "reflect":1, "ragTopK":12, "web":False, "coach":True,  "proofGate":False, "latencyMs":8000},
    "proof":  {"k":9, "temps":[0.1,0.3,0.7],"reflect":3, "ragTopK":32, "web":True,  "coach":False, "proofGate":True,  "latencyMs":30000,
               "minCites":5, "rubricMin":0.80, "triangulate":True}
}

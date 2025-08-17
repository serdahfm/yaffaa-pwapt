
from __future__ import annotations

def compile_prompt_bom(*, run_id:str, cartridge_version:str, seed:int, model:str, temp:float,
                       role:str, goal:str, context:str, style:str, banlist:list[str],
                       tools_json:str, rubric:str, output_schema:str, failure_json:str) -> str:
    parts = []
    parts.append(f"[HEADER] Prompt-ID:{run_id} Version:{cartridge_version} Seed:{seed} Model:{model} t={temp}")
    parts.append(f"[ROLE] You are {role}. Do not reveal chain-of-thought. Follow policy; obey schema.")
    parts.append(f"[OBJECTIVE] {goal}")
    parts.append(f"[CONTEXT] {context}")
    parts.append(f"[STYLE & GLOSSARY] {style} | Avoid: {', '.join(banlist)}")
    parts.append(f"[TOOLS] {tools_json}")
    parts.append(f"[ACCEPTANCE RUBRIC]\n{rubric}")
    parts.append(f"[OUTPUT SCHEMA]\n{output_schema}")
    parts.append(f"[FAILURE JSON]\n{failure_json}")
    parts.append(f"[RETURN INSTRUCTIONS] Return only JSON conforming to schema. No prose. </END>")
    return "\n\n".join(parts)

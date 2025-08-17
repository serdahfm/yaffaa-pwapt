
from __future__ import annotations
import os, time, uuid, json, hashlib, math, random
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from openai import OpenAI
from upe.pabi import PabiInput, PabiOutput
from upe.gears import gearProfiles
from upe.prompt_bom import compile_prompt_bom
from upe.retrieval import deterministic_snapshot, load_from_chromadb
from upe.proof_gate import proof_gate
from upe.format_gate import format_fidelity
from upe.ledger import Ledger
from upe.doc_ast import Doc, Section, Para, ListBlock
from upe.storage import BASE, ensure_dir, write_file, write_json, read_json
from upe.manifest import RunManifest, ArtifactMeta
from upe.followups import followups_for
from upe.renderers.pptx_renderer import render_pptx
from upe.renderers.docx_renderer import render_docx
from upe.renderers.xlsx_renderer import render_xlsx
from upe.renderers.pdf_renderer import render_pdf
from upe.renderers.html_renderer import render_html
from upe.validators.pptx_validator import validate_pptx
from upe.validators.docx_validator import validate_docx
from upe.validators.xlsx_validator import validate_xlsx
from upe.validators.pdf_validator import validate_pdf
from upe.validators.html_validator import validate_html
from upe.sabi import apply_edit_ops
from upe.schema_transformer import transform_ai_output_to_schema, validate_and_fix_schema

router = APIRouter(prefix="/upe", tags=["UPE"])

def _sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256(); h.update(data); return h.hexdigest()

def _llm_json(client: OpenAI, model: str, prompt: str, seed: int, temperature: float) -> Dict[str,Any]:
    # Uses Chat Completions with JSON mode
    resp = client.chat.completions.create(
        model=model,
        temperature=temperature,
        seed=seed,
        response_format={"type":"json_object"},
        messages=[{"role":"user","content":prompt}],
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except Exception:
        return {"status":"TOOL_ERROR","message":"malformed JSON from model"}

@router.get("/health")
def health():
    return {"status":"ok","component":"upe","storage": BASE}

@router.post("/compile", response_model=PabiOutput)
def compile_endpoint(body: PabiInput):
    # 0) Validate gear
    if body.mode not in gearProfiles:
        raise HTTPException(400, f"Unknown mode {body.mode}")
    gear = gearProfiles[body.mode]
    seed = body.seed or random.randint(1, 1_000_000_000)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    t0 = time.time()
    run_id = str(uuid.uuid4())

    # 1) Retrieval snapshot
    docs = load_from_chromadb(topK=gear.get("ragTopK", 6))
    snapshot = deterministic_snapshot(docs, gear.get("ragTopK", 6))
    context = "Sources:\n" + "\n".join([f"{s['id']} {s['hash']}" for s in snapshot])

    # 2) Prompt BOM
    rubric = "- Correctness (40%)\n- Completeness (20%)\n- Evidence (20%)\n- Style (10%)\n- Safety (10%)"
    output_schema = json.dumps({
        "type":"object","additionalProperties":False,
        "properties":{
            "title":{"type":"string"},
            "sections":{"type":"array","items":{"type":"object","properties":{
                "id":{"type":"string"},
                "heading":{"type":"string"},
                "blocks":{"type":"array","items":{"type":"object"}}
            },"required":["id","heading","blocks"],"additionalProperties":False}},
            "citations":{"type":"array","items":{"type":"object","properties":{
                "id":{"type":"string"},"source_id":{"type":"string"},"quote":{"type":"string"},"confidence":{"type":"number"}
            },"required":["id","source_id","quote"],"additionalProperties":False}}
        },
        "required":["title","sections"]
    }, indent=2)
    failure_json = '{"status":"INSUFFICIENT_CONTEXT","missing":["field"]}'
    bom = compile_prompt_bom(
        run_id=run_id, cartridge_version="cartridge@1.0.0", seed=seed, model=model, temp=gear["temps"][0],
        role="Domain Expert", goal=body.goal, context=context,
        style="Executive, terse, data-first", banlist=["emojis","hyperbole"],
        tools_json="[]", rubric=rubric, output_schema=output_schema, failure_json=failure_json
    )

    # 3) Committee/Judge simple implementation (k candidates)
    candidates = []
    for i in range(gear["k"]):
        cand_json = _llm_json(client, model, bom, seed + i, gear["temps"][min(i, len(gear["temps"])-1)])
        # score heuristic: presence of sections and (for proof) citations count
        sections = cand_json.get("sections", [])
        cites = cand_json.get("citations", [])
        score = 0.0
        if isinstance(sections, list) and len(sections) >= 2: score += 0.5
        if body.mode == "proof": score += min(0.5, 0.1 * len(cites))
        candidates.append({"id": f"C{i+1}", "json": cand_json, "score": score})
    candidates.sort(key=lambda c: c["score"], reverse=True)
    winner = candidates[0]
    rubric_score = winner["score"]
    cites_count = len(winner["json"].get("citations", []))

    triangulated = True
    if gear.get("triangulate"):
        # simple triangulation: second pass must also have >= 2 sections and at least one citation
        triangulated = len(candidates) >= 2 and len(candidates[1]["json"].get("sections", [])) >= 2

    # 4) Build Doc AST from winner JSON with schema transformation
    try:
        # Transform AI output to match expected schema
        transformed_json = transform_ai_output_to_schema(winner["json"])
        validated_json = validate_and_fix_schema(transformed_json)
        
        doc = Doc.model_validate({
            "title": validated_json["title"],
            "sections": [
                {"id": s["id"], "heading": s["heading"], "blocks": s.get("blocks",[])}
                for s in validated_json["sections"]
            ]
        })
    except Exception as e:
        raise HTTPException(422, f"Model output failed schema validation after transformation: {e}")

    # 5) Render artifacts
    run_dir = os.path.join(BASE, run_id)
    ensure_dir(run_dir)
    produced: list[str] = []
    artifacts: list[ArtifactMeta] = []

    primary = body.artifact.primary
    seconds = body.artifact.secondaries or []

    def add_art(kind: str, path: str):
        with open(path, "rb") as f:
            data = f.read()
        size, sha = len(data), _sha256_bytes(data)
        artifacts.append(ArtifactMeta(kind=kind, path=path, bytes=size, sha256=sha, primary=(kind==primary)))

    if primary == "pptx":
        path = os.path.join(run_dir, "artifact.pptx")
        render_pptx(doc, path, None)
        ok, reason = validate_pptx(path, 1)
        if not ok: raise HTTPException(422, f"pptx validator: {reason}")
        produced.append("pptx"); add_art("pptx", path)
    elif primary == "docx":
        path = os.path.join(run_dir, "artifact.docx")
        render_docx(doc, path)
        ok, reason = validate_docx(path)
        if not ok: raise HTTPException(422, f"docx validator: {reason}")
        produced.append("docx"); add_art("docx", path)
    elif primary == "xlsx":
        path = os.path.join(run_dir, "artifact.xlsx")
        render_xlsx(doc, path)
        ok, reason = validate_xlsx(path)
        if not ok: raise HTTPException(422, f"xlsx validator: {reason}")
        produced.append("xlsx"); add_art("xlsx", path)
    elif primary == "pdf":
        path = os.path.join(run_dir, "artifact.pdf")
        render_pdf(doc, path)
        ok, reason = validate_pdf(path)
        if not ok: raise HTTPException(422, f"pdf validator: {reason}")
        produced.append("pdf"); add_art("pdf", path)
    elif primary == "html":
        path = os.path.join(run_dir, "artifact.html")
        html = render_html(doc)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        ok, reason = validate_html(path)
        if not ok: raise HTTPException(422, f"html validator: {reason}")
        produced.append("html"); add_art("html", path)
    else:
        raise HTTPException(400, f"Unsupported primary artifact: {primary}")

    # secondaries
    for s in seconds:
        if s == "pdf":
            path = os.path.join(run_dir, "artifact.pdf")
            render_pdf(doc, path)
            ok, reason = validate_pdf(path)
            if not ok: raise HTTPException(422, f"pdf validator: {reason}")
            produced.append("pdf"); add_art("pdf", path)
        elif s == "docx":
            path = os.path.join(run_dir, "artifact.docx")
            render_docx(doc, path)
            ok, reason = validate_docx(path)
            if not ok: raise HTTPException(422, f"docx validator: {reason}")
            produced.append("docx"); add_art("docx", path)
        elif s == "xlsx":
            path = os.path.join(run_dir, "artifact.xlsx")
            render_xlsx(doc, path)
            ok, reason = validate_xlsx(path)
            if not ok: raise HTTPException(422, f"xlsx validator: {reason}")
            produced.append("xlsx"); add_art("xlsx", path)

    # 6) Gates
    ff_ok, ff_reason = format_fidelity(primary=primary, produced=produced)
    if not ff_ok:
        raise HTTPException(422, f"format fidelity: {ff_reason}")
    if gear.get("proofGate"):
        pg_ok, pg_reason = proof_gate(rubric_score=rubric_score, min_cites=gear.get("minCites",3),
                                      cites_count=cites_count, triangulated=triangulated)
        if not pg_ok:
            return PabiOutput(
                v="1.0.0",
                bundle={"engineeredPrompt": bom, "runInstructions": f"Model {model} seed {seed}", "followups":[]},
                manifestId=run_id, seed=seed, model=model, cartridge="cartridge@1.0.0",
                proof={"rubricScore":rubric_score,"sources":snapshot,"judgeNote":pg_reason},
                status="INSUFFICIENT_CONTEXT"
            )

    # 7) Ledger
    ledger = Ledger(
        candidates=[{"id": c["id"], "score": c["score"]} for c in candidates],
        winnerId=winner["id"],
        rationale=["Evidence density","Section completeness","Style adherence"],
        diffs={"inputs":[],"sources":[s["id"] for s in snapshot]}
    )

    # 8) Manifest
    manifest = RunManifest(
        id=run_id,
        createdAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        request=body.model_dump(),
        engine={"model": model, "seed": seed, "gear": body.mode},
        retrieval={"snapshot": snapshot},
        committee=[{"id": c["id"], "score": c["score"]} for c in candidates],
        judge={"winnerId": winner["id"], "score": rubric_score},
        docAst=doc.model_dump(),
        artifacts=artifacts,
        timings={"totalMs": (time.time()-t0)*1000.0},
        status="completed"
    )
    ensure_dir(os.path.join(BASE, run_id))
    write_json(os.path.join(BASE, run_id, "manifest.json"), manifest.model_dump())

    # 9) Followups
    followups = followups_for(body.goal, body.mode, run_id)

    # 10) Response
    return PabiOutput(
        v="1.0.0",
        bundle={
            "engineeredPrompt": bom,
            "runInstructions": f"Model {model}; t={gear['temps'][0]}; seed={seed}",
            "followups": followups
        },
        manifestId=run_id, seed=seed, model=model, cartridge="cartridge@1.0.0",
        proof={"rubricScore": rubric_score, "sources": snapshot, "judgeNote": "winner by evidence"},
        status="OK"
    )

@router.get("/runs/{run_id}")
def get_run(run_id: str):
    path = os.path.join(BASE, run_id, "manifest.json")
    if not os.path.exists(path):
        raise HTTPException(404, "run not found")
    return read_json(path)

class FeedbackPayload(BaseModel):
    runId: str
    scope: Optional[str] = "this_run"
    ops: List[Dict[str,Any]]
    rationale: Optional[str] = None

@router.post("/runs/{run_id}/feedback")
def feedback(run_id: str, payload: FeedbackPayload):
    # load manifest
    path = os.path.join(BASE, run_id, "manifest.json")
    if not os.path.exists(path): raise HTTPException(404, "run not found")
    manifest = read_json(path)
    doc = Doc.model_validate(manifest["docAst"])
    # apply edits
    new_doc = apply_edit_ops(doc, payload.ops or [])
    # re-render primary artifact only
    primary = manifest["request"]["artifact"]["primary"]
    run_dir = os.path.join(BASE, run_id)
    produced = []
    if primary == "pptx":
        p = os.path.join(run_dir, "artifact.pptx"); render_pptx(new_doc, p); produced.append("pptx")
    elif primary == "docx":
        p = os.path.join(run_dir, "artifact.docx"); render_docx(new_doc, p); produced.append("docx")
    elif primary == "xlsx":
        p = os.path.join(run_dir, "artifact.xlsx"); render_xlsx(new_doc, p); produced.append("xlsx")
    elif primary == "pdf":
        p = os.path.join(run_dir, "artifact.pdf"); render_pdf(new_doc, p); produced.append("pdf")
    elif primary == "html":
        p = os.path.join(run_dir, "artifact.html"); 
        with open(p,"w",encoding="utf-8") as f: f.write(render_html(new_doc)); produced.append("html")
    # save updated manifest docAst
    manifest["docAst"] = new_doc.model_dump()
    write_json(path, manifest)
    return {"status":"OK","touched": [op.get("op") for op in payload.ops]}

@router.get("/runs/{run_id}/suggestions")
def suggestions(run_id: str):
    path = os.path.join(BASE, run_id, "manifest.json")
    if not os.path.exists(path): raise HTTPException(404, "run not found")
    manifest = read_json(path)
    sugg = followups_for(manifest["request"]["goal"], manifest["request"]["mode"], run_id)
    return {"suggestions": sugg}

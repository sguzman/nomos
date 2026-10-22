#!/usr/bin/env python3
"""Advisory, auditable rule relationship discovery. Nothing is auto-approved."""
import json
import re
from pathlib import Path
from validate import overlaps

ROOT = Path(__file__).resolve().parents[1]
REVIEWED = ROOT / "relationships" / "reviewed.json"
TYPES = {"equivalent", "refines", "complements", "conflicts_with", "exceptions_to",
         "possible_equivalent", "possible_refinement", "possible_overlap", "possible_conflict"}
STOP = set("a an and or the to in of for on with without by as from all any each do does not only must may should when before after project projects rule rules tarium public".split())
def tokens(rule):
    raw = (rule["title"] + " " + rule.get("summary", "")).lower()
    return {w for w in re.findall(r"[a-z][a-z0-9]+", raw) if len(w) >= 4 and w not in STOP}
def semantic_terms(rule):
    obj = rule.get("semantic") or {}
    return {obj["concept"], *(obj.get("aliases") or [])} if obj.get("concept") else set()
def effect_relation(a, b):
    kinds = {a["norm"]["kind"], b["norm"]["kind"]}
    if kinds == {"prohibition", "obligation"}:
        return "possible_conflict"
    if kinds == {"prohibition", "permission"}:
        p = a if a["norm"]["kind"] == "permission" else b
        return "possible_conflict" if p["norm"]["permission_strength"] == "strong" else "possible_overlap"
    if kinds == {"obligation"} and a["norm"].get("value_constraint") and b["norm"].get("value_constraint"):
        return "possible_conflict" if a["norm"]["value_constraint"] != b["norm"]["value_constraint"] else "possible_equivalent"
    return None
def infer(a, b):
    if not overlaps(a, b):
        return None
    terms = semantic_terms(a) & semantic_terms(b)
    exact = a["norm"]["predicate"] == b["norm"]["predicate"]
    if terms or exact:
        opposed = effect_relation(a, b)
        relation = opposed or ("possible_equivalent" if exact and a["scope"] == b["scope"] and a["norm"]["kind"] == b["norm"]["kind"]
                               else "possible_refinement" if exact or terms else "possible_overlap")
        evidence = ("Matching normalized predicate" if exact else "Shared semantic concept: "+", ".join(sorted(terms)))
        return relation, "high" if exact else "medium", evidence+"; applicability and conditions require review"
    # Textual matches are candidate discovery only. Never infer definitive semantics.
    x, y = tokens(a), tokens(b)
    shared = x & y
    similarity = len(shared)/len(x | y) if x | y else 0
    if len(shared) >= 3 and similarity >= .48:
        return "possible_overlap", "low", "Shared descriptive terms: "+", ".join(sorted(shared)[:9])+"; textual heuristic, not semantic proof"
    return None

def validate_reviewed(data, rules):
    errors, ids, seen = [], {r["id"] for r in rules}, set()
    if not isinstance(data, dict) or set(data) != {"edges"} or not isinstance(data["edges"], list):
        return ["Relationship registry requires exactly an edges array"]
    for e in data["edges"]:
        if (not isinstance(e, dict) or set(e) != {"source","target","kind","evidence"}
            or e.get("source") not in ids or e.get("target") not in ids
            or e.get("source") == e.get("target") or e.get("kind") not in TYPES
            or not isinstance(e.get("evidence"), str) or not e.get("evidence").strip()):
            errors.append("Invalid reviewed relationship edge: "+str(e))
            continue
        key=tuple(sorted((e["source"], e["target"])))
        if key in seen: errors.append("Repeated reviewed relationship: "+str(key))
        seen.add(key)
    return errors

def build_relationships(rules, root=ROOT):
    data=json.loads((root / "relationships" / "reviewed.json").read_text(encoding="utf-8"))
    errors=validate_reviewed(data, rules)
    if errors: raise ValueError("; ".join(errors))
    result=[]
    reviewed=set()
    for e in data["edges"]:
        key=tuple(sorted((e["source"],e["target"])))
        reviewed.add(key)
        result.append({**e,"status":"reviewed","confidence":"high","method":"explicit_editorial_review"})
    # Inference may suggest relationships but never changes or overrides editorial judgments.
    for i,a in enumerate(rules):
        if a.get("registry","catalog")=="candidate": continue
        for b in rules[i+1:]:
            if b.get("registry","catalog")=="candidate": continue
            if tuple(sorted((a["id"],b["id"]))) in reviewed: continue
            found=infer(a,b)
            if found:
                kind, confidence, evidence = found
                result.append({"source":a["id"],"target":b["id"],"kind":kind,
                               "status":"candidate","confidence":confidence,"method":"rule_metadata_heuristic",
                               "evidence":evidence})
    return sorted(result,key=lambda e:(e["source"],e["target"],e["status"]))

if __name__ == "__main__":
    from validate import load_catalog
    _,rules=load_catalog()
    edges=build_relationships(rules)
    print(f"Validated {len(edges)} relationship edges; {sum(e['status']=='reviewed' for e in edges)} reviewed, {sum(e['status']=='candidate' for e in edges)} candidates.")

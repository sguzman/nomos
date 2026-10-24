#!/usr/bin/env python3
"""Check linked proposals remain intake-only and preserve the established prompts."""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KINDS = [
    "situations", "atomic_intents", "intent_families_and_compositions",
    "prompt_versions_as_implementations", "execution_constraints_and_conditions",
    "outcome_evaluations",
]
EXPECTED_COUNTS = [8, 19, 8, 8, 7, 7]
REQUIRED = {
    "id", "kind", "status", "topic", "purpose", "candidates",
    "design_constraints", "open_review_questions", "context_references",
    "authorization", "governance",
}


def inspect(root=ROOT):
    errors = []
    path = root / "queues" / "situational-ontology"
    expected = {f"SITO-IDEA-{i:04d}.json" for i in range(1, 7)}
    observed = {p.name for p in path.glob("SITO-IDEA-*.json")}
    if observed != expected:
        errors.append("queue members differ: " + str(sorted(observed ^ expected)))
    proposals = {}
    canonical = {}
    for p in sorted((root / "situational-prompts").glob("SIT-*.json")):
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
            canonical[r["id"]] = r
        except (OSError, ValueError, KeyError) as exc:
            errors.append(f"{p}: {exc}")

    for idx in range(1, 7):
        filename = f"SITO-IDEA-{idx:04d}.json"
        p = path / filename
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            errors.append(f"{p}: {exc}")
            continue
        proposals[idx] = r
        if not isinstance(r, dict) or set(r) != REQUIRED:
            errors.append(f"{p}: unexpected or missing fields")
            continue
        if r.get("id") != p.stem or r.get("kind") != "situational_ontology_idea":
            errors.append(f"{p}: identity or kind mismatch")
        if r.get("topic") != KINDS[idx - 1] or r.get("status") != "processed":
            errors.append(f"{p}: wrong topic or state")
        if not isinstance(r.get("purpose"), str) or not r["purpose"].strip():
            errors.append(f"{p}: empty purpose")
        a = r.get("authorization")
        if a != {"intake_authorized": True, "processing_authorized": True,
                 "publication_authorized": True, "auto_apply": False}:
            errors.append(f"{p}: unauthorized execution, publication, or application")
        candidates = r.get("candidates")
        if not isinstance(candidates, list) or len(candidates) != EXPECTED_COUNTS[idx - 1]:
            errors.append(f"{p}: wrong number of candidates")
            continue
        ids = [c.get("id") for c in candidates if isinstance(c, dict)]
        if len(ids) != len(candidates) or len(ids) != len(set(ids)):
            errors.append(f"{p}: missing or duplicate concept identifiers")
        for key in ("design_constraints", "open_review_questions"):
            values = r.get(key)
            if not isinstance(values, list) or not values or not all(isinstance(v, str) and v.strip() for v in values):
                errors.append(f"{p}: malformed {key}")
        for ref in r.get("context_references", []):
            if ref not in canonical:
                errors.append(f"{p}: unknown canonical reference {ref}")
        g = r.get("governance", {})
        if g.get("source_kind") != "owner_requested_synthetic_summary":
            errors.append(f"{p}: unexpected source provenance")
        for field in ("queued_on", "updated_on"):
            try:
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", g[field]):
                    raise ValueError("bad date")
                date.fromisoformat(g[field])
            except (TypeError, ValueError, KeyError):
                errors.append(f"{p}: invalid governance {field}")

    if set(proposals) != set(range(1, 7)):
        return proposals, errors
    for index in range(1, 7):
        trace=root/"processing"/"situational-ontology"/f"PROC-SITO-IDEA-{index:04d}.json"
        try:
            detail=json.loads(trace.read_text(encoding="utf-8"))
            if detail.get("status") != "completed" or detail.get("intake_id") != f"SITO-IDEA-{index:04d}":
                errors.append(f"{trace}: mismatched processing trace")
        except (OSError, ValueError) as exc:
            errors.append(f"{trace}: {exc}")
    situations = proposals[1]["candidates"]
    intents = proposals[2]["candidates"]
    families = proposals[3]["candidates"]
    versions = proposals[4]["candidates"]
    conditions = proposals[5]["candidates"]
    evaluations = proposals[6]["candidates"]
    sid, iid = {s["id"] for s in situations}, {x["id"] for x in intents}
    condition_ids = {c["id"] for c in conditions}
    if sid != {f"S{i}" for i in range(1, 9)}:
        errors.append("missing situation candidates")
    if iid != {f"I{i}" for i in range(1, 20)}:
        errors.append("missing intent candidates")
    if condition_ids != {f"C{i}" for i in range(1, 8)}:
        errors.append("missing execution-condition candidates")
    if {e["id"] for e in evaluations} != {f"E{i}" for i in range(1, 8)}:
        errors.append("missing evaluation-facet candidates")
    by_situation = {s["id"]: s for s in situations}
    for s in situations:
        if any(ref not in sid or ref == s["id"] for ref in s["component_situation_ids"]):
            errors.append(f"{s['id']}: invalid situation decomposition")
    if (by_situation.get("S8", {}).get("classification_hypothesis") != "candidate_composite" or
            set(by_situation["S8"]["component_situation_ids"]) != {"S3", "S6", "S7"}):
        errors.append("S8 must remain a *proposed* composite of S3, S6, S7")
    if by_situation.get("S5", {}).get("classification_hypothesis") != "candidate_condition":
        errors.append("S5's situation-versus-condition question must be preserved")
    expected_families = {f"SIT-{i:04d}" for i in range(1, 9)}
    if {f["canonical_prompt_id"] for f in families} != expected_families:
        errors.append("eight compositions must refer to existing canonical families")
    if {v["canonical_family_id"] for v in versions} != expected_families:
        errors.append("eight version proposals must preserve each family")
    for f in families:
        if any(x not in sid for x in f["situation_ids"]):
            errors.append(f"{f['id']}: dangling situation reference")
        if any(x not in iid for x in f["proposed_intent_ids"]):
            errors.append(f"{f['id']}: dangling intent reference")
        if set(f["versions"]) != {"1.0.0", "2.0.0", "3.0.0"}:
            errors.append(f"{f['id']}: incomplete generation coverage")
        if not f.get("version_scope_note"):
            errors.append(f"{f['id']}: no warning about version-specific mappings")
    for v in versions:
        fid = v["canonical_family_id"]
        if v["preserved_published_reference"] != fid + "@1.0.0":
            errors.append(f"{v['id']}: incorrect immutable original reference")
        if v["queued_version_refs"] != [f"SIT-REV-{fid[-4:]}-02", f"SIT-REV-{fid[-4:]}-03"]:
            errors.append(f"{v['id']}: incorrect revision lineage")
        if canonical.get(fid, {}).get("version") != "1.0.0":
            errors.append(f"{v['id']}: published baseline unexpectedly changed")
        for revision in v["queued_version_refs"]:
            if not (root / "queues" / "situational-prompts" / "revisions" / (revision + ".json")).is_file():
                errors.append(f"{v['id']}: missing existing queued revision {revision}")
    return proposals, errors


def main():
    proposals, errors = inspect()
    for error in errors: print("ERROR:", error)
    if errors: raise SystemExit(1)
    print(f"Validated {len(proposals)} processed ontology proposals, "
          f"{sum(len(x['candidates']) for x in proposals.values())} concept candidates")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Validate formal situational concepts, family graphs and immutable prompt generations."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

COLLECTIONS = (
    ("situations", "SITU", 48, "situation"),
    ("intents", "INTENT", 72, "intent"),
    ("families", "FAMILY", 8, "intent_family"),
    ("conditions", "CONDITION", 7, "execution_condition"),
    ("evaluation-dimensions", "EVAL-DIM", 7, "evaluation_dimension"),
)


def read_registry(root, folder, prefix, count, kind, errors):
    found = {}
    directory = root / "ontology" / folder
    paths = sorted(directory.glob(f"{prefix}-*.json"))
    if len(paths) != count:
        errors.append(f"{directory}: expected {count}, found {len(paths)}")
    for path in paths:
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as exc:
            errors.append(f"{path}: {exc}")
            continue
        ident = record.get("id")
        if (ident != path.stem or not re.fullmatch(rf"{prefix}-[0-9]{{4}}", ident or "")
                or record.get("kind") != kind or record.get("status") != "published"
                or record.get("version") != "1.0.0"):
            errors.append(f"{path}: invalid identity, lifecycle or version")
        if ident in found:
            errors.append(f"{path}: duplicate ID")
        found[ident] = record
        source = record.get("provenance", {}).get("queue_id")
        if source not in {f"SITO-IDEA-{i:04d}" for i in range(1, 7)} and not re.fullmatch(r"RIA-[0-9]{4}", source or ""):
            errors.append(f"{path}: no source provenance")
    return found


def load_formal(root=ROOT):
    errors = []
    data = {folder: read_registry(root, folder, prefix, count, kind, errors)
            for folder, prefix, count, kind in COLLECTIONS}
    situations, intents, families = data["situations"], data["intents"], data["families"]
    conditions, dimensions = data["conditions"], data["evaluation-dimensions"]
    for s in situations.values():
        for ref in s.get("component_situation_ids", []):
            if ref not in situations or ref == s["id"]:
                errors.append(f"{s['id']}: invalid component {ref}")
    if situations.get("SITU-0008", {}).get("component_situation_ids") != [
            "SITU-0003", "SITU-0006", "SITU-0007"]:
        errors.append("Composite context recovery must preserve three component situations")
    if situations.get("SITU-0005", {}).get("classification") != "execution_state":
        errors.append("Possible completion is an execution-state classification")
    codes = [s.get("code") for s in situations.values()]
    if len(codes) != len(set(codes)):
        errors.append("duplicate situation codes")
    allowed_roles = {"goal", "method", "constraint", "reporting", "stopping_policy"}
    for r in intents.values():
        if r.get("semantic_role") not in allowed_roles:
            errors.append(f"{r['id']}: unknown semantic role")
        if r.get("atomicity") not in ("single_intent_candidate", "composite_method", "compound_policy", "composite_report"):
            errors.append(f"{r['id']}: unknown atomicity interpretation")
    for family in families.values():
        ref = family.get("canonical_prompt_id")
        if not re.fullmatch(r"SIT-[0-9]{4}", ref or ""):
            errors.append(f"{family['id']}: invalid canonical prompt family")
            continue
        if family["id"][-4:] != ref[-4:]:
            errors.append(f"{family['id']}: prompt/family mapping mismatch")
        if set(family.get("versions", [])) != {"1.0.0", "2.0.0", "3.0.0"}:
            errors.append(f"{family['id']}: missing generations")
        if family.get("default_version") != "1.0.0":
            errors.append(f"{family['id']}: default unexpectedly advanced")
        for sit in family.get("situation_ids", []):
            if sit not in situations:
                errors.append(f"{family['id']}: missing situation {sit}")
        for c in family.get("condition_ids", []):
            if c not in conditions:
                errors.append(f"{family['id']}: missing condition {c}")
        all_intents = set(family.get("intent_ids", []))
        for intent in all_intents:
            if intent not in intents:
                errors.append(f"{family['id']}: unknown intent {intent}")
        mapped = family.get("version_intent_ids", {})
        if set(mapped) != {"1.0.0", "2.0.0", "3.0.0"}:
            errors.append(f"{family['id']}: version-specific intent maps missing")
        for version, linked in mapped.items():
            if not linked or not set(linked).issubset(all_intents):
                errors.append(f"{family['id']}@{version}: broken intent references")
        if not family.get("interpretation_note"):
            errors.append(f"{family['id']}: no annotation uncertainty marker")
    for ident, dim in dimensions.items():
        if not dim.get("code") or not dim.get("definition"):
            errors.append(f"{ident}: invalid evaluation dimension")
    try:
        from validate_situational_prompts import check_record
        from validate_situational_prompt_revisions import load_and_validate as check_revisions
        original = {}
        for p in sorted((root / "situational-prompts").glob("SIT-*.json")):
            obj = json.loads(p.read_text(encoding="utf-8"))
            original[obj["id"]] = obj
            errors.extend(check_record(obj, p.name))
        if len(original) != 8:
            errors.append("expected eight immutable published v1 baselines")
        rev, revision_errors = check_revisions(root)
        errors.extend(revision_errors)
        versions = {}
        for path in sorted((root / "situational-prompts" / "versions").glob("SIT-*-v*.json")):
            obj = json.loads(path.read_text(encoding="utf-8"))
            cid, version = obj["id"], obj["version"]
            if path.name != f"{cid}-v{version}.json":
                errors.append(f"{path}: mismatched filename")
            errors.extend(check_record(obj, f"{cid}.json"))
            pair = (cid, version)
            if pair in versions:
                errors.append(f"{path}: duplicate family+version")
            versions[pair] = obj
            if cid not in original or version not in ("2.0.0", "3.0.0"):
                errors.append(f"{path}: version without canonical published parent")
            elif (obj.get("situation", {}).get("code") != original[cid]["situation"]["code"] or
                    obj.get("interaction", {}).get("invocation") != "explicit_only"):
                errors.append(f"{path}: identity or explicit-only invocation changed")
        if len(versions) != 16:
            errors.append(f"expected 16 separate v2/v3 versions, got {len(versions)}")
        for fid, family in families.items():
            for ver in family.get("versions", []):
                if ver != "1.0.0" and (family["canonical_prompt_id"], ver) not in versions:
                    errors.append(f"{fid}: missing published generation {ver}")
        data["prompts_v1"] = original
        data["prompt_versions"] = versions
    except (OSError, ValueError, ImportError, KeyError) as exc:
        errors.append(f"version registry: {exc}")
    # The evaluation collection is evidence only. No synthetic success results.
    eval_dir = root / "ontology" / "evaluations"
    evaluations = []
    for path in sorted(eval_dir.glob("EVALUATION-*.json")):
        try:
            r = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as exc:
            errors.append(f"{path}: {exc}")
            continue
        if (r.get("id") != path.stem or r.get("family_id") not in families or
                r.get("prompt_version") not in ("1.0.0", "2.0.0", "3.0.0") or
                r.get("status") != "observed" or not r.get("evidence")):
            errors.append(f"{path}: unsupported observational result")
        evaluations.append(r)
    data["evaluations"] = evaluations
    return data, errors


def main():
    data, errors = load_formal()
    for error in errors: print("ERROR:", error)
    if errors: raise SystemExit(1)
    print("Validated 48 situations, 72 intents, 8 compositions, 7 conditions, "
          "7 evaluation dimensions, 24 versioned prompts, and evidence-backed evaluations")


if __name__ == "__main__":
    main()

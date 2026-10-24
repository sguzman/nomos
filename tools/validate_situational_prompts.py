#!/usr/bin/env python3
"""Validate the distinct, inert situational-prompt registry without external dependencies."""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODES = {
    "normal_continuation", "interrupted_execution", "conversation_limit_recovery",
    "interrupted_execution_with_completion_gate", "interruption_diagnosis",
    "progress_audit", "scope_refocus", "context_recovery_and_audit",
}
STATUSES = {"draft", "reviewed", "published", "deprecated"}
FIELDS = {"id", "kind", "version", "title", "summary", "status", "text", "situation",
          "applicability", "execution", "failure_modes", "interaction", "relations",
          "provenance", "governance"}

def check_record(record, filename):
    issues = []
    rid = record.get("id", "<missing>")
    def fail(message): issues.append(f"{filename}: {message}")
    if set(record) != FIELDS: fail(f"unexpected/missing fields {sorted(set(record) ^ FIELDS)}")
    if not re.fullmatch(r"SIT-[0-9]{4,}", str(rid)) or filename != rid + ".json": fail("invalid record ID or filename")
    if record.get("kind") != "situational_prompt": fail("wrong kind")
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", str(record.get("version"))): fail("invalid version")
    if record.get("status") not in STATUSES: fail("invalid status")
    for key in ("title", "summary", "text"):
        if not isinstance(record.get(key), str) or not record[key].strip(): fail("empty " + key)
    expected = {
        "situation": {"code", "trigger", "purpose"},
        "applicability": {"appropriate_when", "not_appropriate_when", "preconditions"},
        "execution": {"mode", "objective", "handoff", "progress_evidence"},
        "failure_modes": {"guards_against", "tradeoffs"},
        "interaction": {"invocation", "target", "shortcut_key"},
        "relations": {"related_prompt_ids"},
        "provenance": {"source_type", "reference", "notes"},
        "governance": {"created_on", "updated_on", "review_status"},
    }
    for group, keys in expected.items():
        value = record.get(group)
        if not isinstance(value, dict) or set(value) != keys:
            fail("invalid " + group + " fields")
            return issues
    situ, app, ex = record["situation"], record["applicability"], record["execution"]
    if situ["code"] not in CODES: fail("invalid situation code")
    for key in ("trigger", "purpose"):
        if not isinstance(situ[key], str) or not situ[key].strip(): fail("empty situation." + key)
    for group, fields in ((app, ("appropriate_when", "not_appropriate_when", "preconditions")),
                          (record["failure_modes"], ("guards_against", "tradeoffs")),
                          (record["relations"], ("related_prompt_ids",))):
        for key in fields:
            values=group[key]
            if (not isinstance(values, list) or len(values) != len(set(map(str, values)))
                    or any(not isinstance(s, str) or not s.strip() for s in values)
                    or (key in ("appropriate_when", "not_appropriate_when", "guards_against") and not values)):
                fail("invalid list " + key)
    if ex["mode"] not in ("sustained_execution", "diagnosis_only"): fail("invalid execution mode")
    if ex["handoff"] != ("after_available_work" if ex["mode"] == "sustained_execution" else "diagnostic_response"):
        fail("execution handoff inconsistent with mode")
    if not isinstance(ex["objective"], str) or not ex["objective"].strip(): fail("empty execution objective")
    if type(ex["progress_evidence"]) is not bool: fail("progress_evidence must be boolean")
    interaction=record["interaction"]
    if interaction["invocation"] != "explicit_only" or interaction["target"] not in ("chatgpt", "general_agent"):
        fail("invalid invocation/target")
    if interaction["shortcut_key"] is not None and not re.fullmatch(r"[A-Z]", str(interaction["shortcut_key"])):
        fail("invalid shortcut key")
    for linked in record["relations"]["related_prompt_ids"]:
        if not re.fullmatch(r"SIT-[0-9]{4,}", linked) or linked == rid: fail("invalid related_prompt_ids")
    provenance=record["provenance"]
    if provenance["source_type"] not in ("owner_authored","synthetic","public_reference"): fail("invalid provenance source_type")
    if provenance["reference"] is not None and not isinstance(provenance["reference"], str): fail("invalid provenance reference")
    if not isinstance(provenance["notes"], str): fail("invalid provenance notes")
    governance=record["governance"]
    for field in ("created_on","updated_on"):
        try:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", governance[field]): raise ValueError
            date.fromisoformat(governance[field])
        except (ValueError, TypeError, KeyError): fail("invalid governance date " + field)
    if governance["review_status"] not in ("pending","reviewed","approved"): fail("invalid review status")
    if record["status"] == "published" and governance["review_status"] != "approved":
        fail("published prompt requires approved review")
    return issues

def load_prompts(root=ROOT):
    records, issues = [], []
    directory = root / "situational-prompts"
    ids, shortcuts = set(), set()
    for path in sorted(directory.glob("SIT-*.json")):
        try: record=json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            issues.append(f"{path}: {exc}")
            continue
        if not isinstance(record, dict):
            issues.append(f"{path}: record is not an object")
            continue
        issues.extend(check_record(record,path.name))
        rid=record.get("id")
        if rid in ids: issues.append(f"{path}: duplicate id {rid}")
        ids.add(rid)
        interaction=record.get("interaction",{})
        key=interaction.get("shortcut_key") if isinstance(interaction,dict) else None
        if key and key in shortcuts: issues.append(f"{path}: duplicate shortcut {key}")
        if key: shortcuts.add(key)
        records.append(record)
    for record in records:
        for target in record.get("relations",{}).get("related_prompt_ids",[]):
            if target not in ids: issues.append(f"{record.get('id')}: unknown related prompt {target}")
    return records, issues

def main():
    _, issues=load_prompts()
    for issue in issues: print("ERROR:",issue)
    if issues: raise SystemExit(1)
    print("Situational-prompt registry valid")

if __name__ == "__main__":
    main()

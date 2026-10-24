#!/usr/bin/env python3
"""Validate inert, version-linked situational prompt revisions and their source checksums."""
import hashlib
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION_DIR = Path("queues/situational-prompts/revisions")
REQUIRED = {
    "id", "kind", "canonical_prompt_id", "situation_code", "status",
    "proposed_version", "base_published_version", "predecessor_ref",
    "source", "proposed_text", "review", "governance",
}
FLAGS = {"reinforcement_to_execution_requires_review", "blocker_handoff_policy_review"}
ID_PATTERN = re.compile(r"SIT-REV-([0-9]{4})-([0-9]{2})\Z")


def validate_records(records, canonical):
    """records is a sequence of (path, record); canonical is ID -> published record."""
    issues = []
    seen, versions = set(), set()
    by_id = {r.get("id"): r for _, r in records if isinstance(r, dict)}
    if len(by_id) != len(records):
        issues.append("duplicate revision identity")
    for path, r in records:
        where = str(path)
        def error(message): issues.append(where + ": " + message)
        if not isinstance(r, dict):
            error("not an object")
            continue
        if set(r) != REQUIRED:
            error("unexpected or missing top-level properties")
            continue
        rid = r["id"]
        match = ID_PATTERN.fullmatch(rid) if isinstance(rid, str) else None
        if not match or path.stem != rid:
            error("invalid revision ID or filename")
            continue
        number, seq = match.group(1), int(match.group(2))
        cid = "SIT-" + number
        if rid in seen: error("duplicate revision ID")
        seen.add(rid)
        if r["kind"] != "situational_prompt_revision": error("incorrect kind")
        if r["canonical_prompt_id"] != cid: error("not linked to its canonical family")
        if r["status"] not in ("queued", "processed", "deferred", "cancelled"):
            error("invalid revision lifecycle state")
        if seq < 2 or r["proposed_version"] != f"{seq}.0.0":
            error("proposed version inconsistent with revision sequence")
        if (cid, r["proposed_version"]) in versions: error("duplicate family version")
        versions.add((cid, r["proposed_version"]))
        base = canonical.get(cid)
        if base is None or base.get("status") != "published":
            error("missing published canonical prompt")
        else:
            if r["base_published_version"] != base.get("version"):
                error("incorrect published base version")
            if r["situation_code"] != base.get("situation", {}).get("code"):
                error("situation code changed across revisions")
        predecessor = cid + "@" + r["base_published_version"] if seq == 2 else f"SIT-REV-{number}-{seq-1:02d}"
        if r["predecessor_ref"] != predecessor:
            error("invalid predecessor link")
        if seq > 2 and predecessor not in by_id:
            error("missing immediately preceding queued version")
        source = r["source"]
        if not isinstance(source, dict) or set(source) != {"artifact", "artifact_version", "entry_ordinal", "content_sha256"}:
            error("invalid source fields")
            continue
        if (not isinstance(source["artifact"], str) or
                not re.fullmatch(r"[A-Za-z0-9._-]+\.json", source["artifact"])):
            error("invalid source artifact")
        if source["artifact_version"] != 1 or source["entry_ordinal"] != int(number):
            error("input format or original position changed")
        if source["artifact"] != f"items{seq}.json":
            error("source version label is inconsistent")
        content = r["proposed_text"]
        if not isinstance(content, str) or not content.strip():
            error("missing proposed text")
        elif hashlib.sha256(content.encode("utf-8")).hexdigest() != source["content_sha256"]:
            error("proposed text fails original source checksum")
        review = r["review"]
        if not isinstance(review, dict) or set(review) != {"processing_authorized", "publication_authorized", "flags"}:
            error("invalid review fields")
            continue
        authorized = r["status"] == "processed"
        if (review["processing_authorized"] is not authorized or
                review["publication_authorized"] is not authorized):
            error("revision authorization flags inconsistent with status")
        flags = review["flags"]
        if not isinstance(flags, list) or len(flags) != len(set(flags)) or set(flags) - FLAGS:
            error("invalid review flags")
        elif base and base.get("execution", {}).get("mode") == "reinforcement_only":
            if "reinforcement_to_execution_requires_review" not in flags:
                error("behavioral escalation from a reminder must be flagged")
        for stamp in ("created_on", "updated_on"):
            try:
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["governance"][stamp]):
                    raise ValueError("noncanonical date")
                date.fromisoformat(r["governance"][stamp])
            except (ValueError, KeyError, TypeError, AttributeError):
                error("invalid governance date " + stamp)
    return issues


def load_and_validate(root=ROOT):
    records, problems = [], []
    for path in sorted((root / REVISION_DIR).glob("SIT-REV-*.json")):
        try:
            records.append((path, json.loads(path.read_text(encoding="utf-8"))))
        except (OSError, ValueError) as exc:
            problems.append(f"{path}: {exc}")
    canonical = {}
    for path in sorted((root / "situational-prompts").glob("SIT-*.json")):
        try:
            obj = json.loads(path.read_text(encoding="utf-8"))
            canonical[obj["id"]] = obj
        except (OSError, ValueError, KeyError) as exc:
            problems.append(f"{path}: {exc}")
    problems.extend(validate_records(records, canonical))
    for path, revision in records:
        if revision.get("status") != "processed":
            continue
        cid, version = revision["canonical_prompt_id"], revision["proposed_version"]
        published_path = root/"situational-prompts"/"versions"/f"{cid}-v{version}.json"
        trace_path = root/"processing"/"situational-prompts"/"revisions"/f"PROC-{revision['id']}.json"
        try:
            published = json.loads(published_path.read_text(encoding="utf-8"))
            trace = json.loads(trace_path.read_text(encoding="utf-8"))
            if (published.get("id") != cid or published.get("version") != version or
                    published.get("text") != revision["proposed_text"] or
                    published.get("status") != "published" or
                    published.get("governance",{}).get("review_status") != "approved"):
                problems.append(f"{published_path}: published version/text/status mismatch")
            if (trace.get("source_revision_id") != revision["id"] or
                    trace.get("output_path") != str(published_path.relative_to(root)) or
                    trace.get("status") != "published" or
                    trace.get("governance",{}).get("publication_authorized") is not True):
                problems.append(f"{trace_path}: missing publication provenance")
            if cid in ("SIT-0006","SIT-0007") and published.get("execution",{}).get("mode") != "sustained_execution":
                problems.append(f"{published_path}: escalation mode not resolved")
            if cid == "SIT-0005" and published.get("execution",{}).get("mode") != "diagnosis_only":
                problems.append(f"{published_path}: diagnostic-only contract violated")
        except (OSError, ValueError, KeyError) as exc:
            problems.append(f"{path}: missing or invalid published version: {exc}")
    return records, problems


def main():
    records, errors = load_and_validate()
    for error in errors:
        print("ERROR:", error)
    if errors:
        raise SystemExit(1)
    print(f"Validated {len(records)} versioned revisions, with canonical links and source hashes")


if __name__ == "__main__":
    main()

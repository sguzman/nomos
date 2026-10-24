#!/usr/bin/env python3
"""Verify one-to-one, evidence-backed intake -> processing -> canonical prompt links."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check_links(root=ROOT):
    errors = []
    def load(folder, glob):
        result = {}
        for file in sorted((root / folder).glob(glob)):
            try:
                data = json.loads(file.read_text(encoding="utf-8"))
                if not isinstance(data, dict) or data.get("id") != file.stem:
                    errors.append(f"{file}: invalid ID or data")
                    continue
                if data["id"] in result:
                    errors.append(f"{file}: duplicate ID")
                result[data["id"]] = data
            except (ValueError, OSError, KeyError) as exc:
                errors.append(f"{file}: {exc}")
        return result

    intake = load("queues/situational-prompts", "SIT-IDEA-*.json")
    processing = load("processing/situational-prompts", "PROC-SIT-IDEA-*.json")
    canonical = load("situational-prompts", "SIT-*.json")

    used = {}
    for qid, q in intake.items():
        ids = q.get("review", {}).get("linked_prompt_ids", [])
        proc = processing.get("PROC-" + qid)
        if q.get("status") == "instantiated":
            if len(ids) != 1 or proc is None:
                errors.append(f"{qid}: processed intake must have exactly one prompt and processing record")
                continue
            pid = ids[0]
            if pid not in canonical:
                errors.append(f"{qid}: missing canonical prompt {pid}")
                continue
            if pid in used:
                errors.append(f"{qid}: duplicate canonical link {pid}")
            used[pid] = qid
            if proc.get("intake_id") != qid or proc.get("output_prompt_id") != pid:
                errors.append(f"{qid}: processing links disagree")
            if proc.get("disposition") != "normalized_to_reviewed_entry":
                errors.append(f"{qid}: unsupported processing disposition")
            record = canonical[pid]
            if record.get("situation", {}).get("code") != q.get("situation", {}).get("code"):
                errors.append(f"{qid}: situation meaning drift")
            if record.get("provenance", {}).get("reference") != "queues/situational-prompts/" + qid + ".json":
                errors.append(f"{qid}: missing canonical provenance link")
            published = record.get("status") == "published"
            authorized = q.get("review", {}).get("publication_authorized") is True
            approved = proc.get("publication") == "owner_approved"
            if published != authorized or published != approved:
                errors.append(f"{qid}: publication status, queue approval, and processing approval disagree")
            if published:
                if record.get("governance", {}).get("review_status") != "approved":
                    errors.append(f"{qid}: published record lacks approved governance")
                if not isinstance(proc.get("publication_authorization"), str) or not proc["publication_authorization"].strip():
                    errors.append(f"{qid}: missing publication authorization provenance")
        else:
            if ids or proc:
                errors.append(f"{qid}: uninstantiated intake cannot have output records")

    for procid, proc in processing.items():
        if proc.get("intake_id") not in intake or intake[proc["intake_id"]].get("status") != "instantiated":
            errors.append(f"{procid}: orphan processing record")
        if proc.get("output_prompt_id") not in canonical:
            errors.append(f"{procid}: orphan output record")
    for pid in canonical:
        if pid not in used:
            errors.append(f"{pid}: canonical record not linked from reviewed intake")
    return errors


def main():
    errors=check_links()
    for issue in errors: print("ERROR:",issue)
    if errors: raise SystemExit(1)
    print("Verified situational-prompt intake, processing, and canonical provenance links")

if __name__=="__main__":
    main()

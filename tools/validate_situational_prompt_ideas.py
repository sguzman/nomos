#!/usr/bin/env python3
"""Validate public-safe, non-published situational prompt intake records."""
import json
import pathlib
import re
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parents[1]
CODES = ["normal_continuation","interrupted_execution","conversation_limit_recovery","interrupted_execution_with_completion_gate","interruption_diagnosis","progress_audit","scope_refocus","context_recovery_and_audit"]
EXPECTED_KEYS = ["F", "J", "K", "L", "I", "U", "E", "D"]
MODES = {"continuation": "continue_as_possible", "diagnosis": "diagnostic_answer", "reinforcement": "none_specified"}
FIELDS = {"id","kind","status","title","summary","source","situation","applicability",
          "expected_behavior","failure_modes","review","governance"}

def validate(records):
    errors, ids, shortcuts, indexes = [], set(), set(), set()
    for path, r in records:
        where = str(path)
        def fail(s): errors.append(where + ": " + s)
        if not isinstance(r, dict):
            fail("record is not an object")
            continue
        rid=r.get("id")
        if not isinstance(rid,str) or not re.fullmatch(r"SIT-IDEA-[0-9]{4,}",rid) or path.name!=rid+".json":
            fail("invalid identity or filename")
        if rid in ids: fail("duplicate id")
        ids.add(rid)
        if set(r)!=FIELDS: fail("missing/unknown top-level fields")
        if r.get("kind")!="situational_prompt_idea": fail("incorrect species")
        if r.get("status") not in ("queued","deferred","cancelled","instantiated"): fail("bad status")
        for name in ("title","summary"):
            if not isinstance(r.get(name),str) or not r[name].strip(): fail("empty "+name)
        groups = {
          "source":{"batch_version","entry_index","shortcut_key","source_label","verbatim_text_retained"},
          "situation":{"code","trigger"},
          "applicability":{"appropriate_when","not_appropriate_when","preconditions"},
          "expected_behavior":{"mode","handoff","purpose"},
          "failure_modes":{"guards_against","tradeoffs"},
          "review":{"content_state","publication_authorized","linked_prompt_ids"},
          "governance":{"created_on","updated_on"}
        }
        if any(not isinstance(r.get(g),dict) or set(r[g])!=fields for g,fields in groups.items()):
            fail("missing/unknown nested metadata fields")
            continue
        source=r["source"]
        if source["batch_version"]!=1 or type(source["entry_index"]) is not int or source["entry_index"]<1:
            fail("invalid batch index")
        if source["entry_index"] in indexes: fail("duplicate batch index")
        indexes.add(source["entry_index"])
        key=source["shortcut_key"]
        if not isinstance(key,str) or not re.fullmatch(r"[A-Z]",key): fail("invalid shortcut")
        if key in shortcuts: fail("duplicate shortcut")
        shortcuts.add(key)
        if source["source_label"]!=r.get("title"): fail("label/title mismatch")
        if source["verbatim_text_retained"] is not False: fail("private text must not be retained")
        if r["situation"]["code"] not in CODES: fail("unknown situation code")
        for obj, field in ((r["situation"],"trigger"),(r["expected_behavior"],"purpose")):
            if not isinstance(obj[field],str) or not obj[field].strip(): fail("empty "+field)
        for obj,group in ((r["applicability"],"applicability"),(r["failure_modes"],"failure_modes"),
                          (r["review"],"review")):
            for field in ("appropriate_when","not_appropriate_when","preconditions") if group=="applicability" else (
                       ("guards_against","tradeoffs") if group=="failure_modes" else ("linked_prompt_ids",)):
                values=obj[field]
                if (not isinstance(values,list) or any(not isinstance(x,str) or not x.strip() for x in values)
                    or len(values)!=len(set(values)) or (field in ("appropriate_when","not_appropriate_when","guards_against") and not values)):
                    fail("invalid list: "+field)
        expected=r["expected_behavior"]
        if expected["mode"] not in MODES or expected["handoff"]!=MODES.get(expected["mode"]):
            fail("handoff/mode mismatch")
        review=r["review"]
        if review["content_state"]!="awaiting_publication_review" or review["publication_authorized"] is not False:
            fail("queue is not a publication authorization")
        linked=review["linked_prompt_ids"]
        if r["status"]=="instantiated" and not linked: fail("instantiated item must link actual prompt")
        if r["status"]!="instantiated" and linked: fail("queued item cannot link a published prompt")
        for linked_id in linked:
            if not re.fullmatch(r"SIT-[0-9]{4,}",linked_id): fail("invalid linked prompt ID")
        for field in ("created_on","updated_on"):
            try: date.fromisoformat(r["governance"][field])
            except (TypeError, ValueError, KeyError): fail("invalid governance date")
    return errors

def load_and_validate(root=ROOT):
    folder=root/"queues"/"situational-prompts"
    records=[]
    for file in sorted(folder.glob("SIT-IDEA-*.json")):
        try: records.append((file,json.loads(file.read_text(encoding="utf-8"))))
        except (ValueError,OSError) as exc:
            return [],[str(file)+": "+str(exc)]
    return records,validate(records)

def main():
    records,errors=load_and_validate()
    for e in errors: print("ERROR:",e,file=sys.stderr)
    if errors:return 1
    print(f"Validated {len(records)} public-safe situational-prompt intake proposals")
    return 0

if __name__=="__main__":raise SystemExit(main())

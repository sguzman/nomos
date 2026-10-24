#!/usr/bin/env python3
"""Audit 137 individually reviewed rule-to-situation and rule-to-intent links.

Mappings are descriptive, never additional rules, inferred scope restrictions, or applied profiles.
"""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
N=137

def read(root,path):
    return json.loads((root/path).read_text(encoding="utf-8"))

def git_blob(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def load_links(root=ROOT):
    errors=[]
    cross=read(root,Path("ontology/rule-analysis/crosswalk.json"))
    cases=cross.get("entries",{})
    if (cross.get("status")!="reviewed" or
        cross.get("source_commit")!="ab9b06e947284dab83fe19519be21dc1b0ad5051" or
        len(cases)!=N):
        errors.append("crosswalk is incomplete or source snapshot not preserved")
    files=list((root/"ontology/rule-links").glob("RLINK-*.json"))
    traces=list((root/"processing/rule-situation-intent").glob("PROC-RIA-*.json"))
    if len(files)!=N or len(traces)!=N:
        errors.append(f"expected 137 link objects and processing traces, found {len(files)}, {len(traces)}")
    situations={p.stem for p in (root/"ontology/situations").glob("SITU-*.json")}
    intents={p.stem for p in (root/"ontology/intents").glob("INTENT-*.json")}
    links={}
    used_s=set()
    used_i=set()
    for n in range(1,N+1):
        x=f"{n:04d}"
        qid="RIA-"+x;rid="NOM-"+x
        try:
            queue=read(root,Path(f"queues/rule-situation-intent/{qid}.json"))
            trace=read(root,Path(f"processing/rule-situation-intent/PROC-{qid}.json"))
            link=read(root,Path(f"ontology/rule-links/RLINK-{x}.json"))
            rule=read(root,Path(f"rules/{rid}.json"))
        except (OSError,ValueError) as exc:
            errors.append(f"{rid}: missing or malformed artifact: {exc}")
            continue
        source=queue["source"]
        if (queue.get("status")!="processed" or
            queue.get("processing",{}).get("state")!="closed" or
            queue.get("processing",{}).get("record")!=f"processing/rule-situation-intent/PROC-{qid}.json" or
            source!=trace.get("source") or
            source["rule_id"]!=rid or
            source["snapshot_commit"]!=cross.get("source_commit")):
            errors.append(f"{rid}: incomplete authorized processing lineage")
        if not (trace.get("authorization",{}).get("processing") and
                trace.get("authorization",{}).get("normalization") and
                trace.get("authorization",{}).get("publication") and
                trace.get("authorization",{}).get("canonical_rule_edit") is False and
                trace.get("authorization",{}).get("profile_edit") is False):
            errors.append(f"{rid}: processing not independently authorized or overreaching")
        if trace.get("status")!="closed" or trace.get("disposition",{}).get("link_path")!=f"ontology/rule-links/RLINK-{x}.json":
            errors.append(f"{rid}: processing trace not closed or wrong output")
        payload=(root/source["path"]).read_bytes()
        if git_blob(payload)!=source["git_blob_sha"]:
            errors.append(f"{rid}: source drift requires explicit reconciliation")
        expected=cases.get(qid,{})
        sid=[a["id"] for a in link.get("situations",[])]
        iid=[a["id"] for a in link.get("intents",[])]
        if (link.get("id")!="RLINK-"+x or link.get("rule_id")!=rid or
            link.get("rule_version")!=rule["version"] or
            sid!=expected.get("situation_ids") or iid!=expected.get("intent_ids") or
            trace.get("disposition",{}).get("situation_ids")!=sid or
            trace.get("disposition",{}).get("intent_ids")!=iid):
            errors.append(f"{rid}: incomplete or inconsistent situation/intent mapping")
        used_s.update(sid);used_i.update(iid)
        if not sid or not iid or len(sid)!=len(set(sid)) or len(iid)!=len(set(iid)):
            errors.append(f"{rid}: missing or duplicate concepts")
        if not set(sid)<=situations or not set(iid)<=intents:
            errors.append(f"{rid}: dangling formal references")
        expected_status="published" if rule["status"]=="published" else "reviewed_draft_source"
        if (link.get("status")!=expected_status or
            link.get("rule_editorial_status")!=rule["status"] or
            link.get("evidence",{}).get("source_statement")!=rule["statement"] or
            link.get("evidence",{}).get("source_blob_sha")!=source["git_blob_sha"] or
            link.get("evidence",{}).get("normalized_predicate")!=rule["norm"]["predicate"]):
            errors.append(f"{rid}: editorial status or source evidence mismatch")
        if (not link.get("interpretation",{}).get("situation_scope") or
            not link.get("interpretation",{}).get("intent_semantics")):
            errors.append(f"{rid}: scope-preservation explanation absent")
        if link.get("provenance",{}).get("queue_id")!=qid:
            errors.append(f"{rid}: lost queue provenance")
        links[rid]=link
    for prefix,lower,upper,used in (("SITU",9,48,used_s),("INTENT",20,72,used_i)):
        unreferenced={f"{prefix}-{i:04d}" for i in range(lower,upper+1)}-used
        if unreferenced:
            errors.append("unreferenced normalized concepts: "+", ".join(sorted(unreferenced)))
    if len(links)!=N:
        errors.append(f"missing full link registry: {len(links)}/{N}")
    # Provenance must cite a rule that actually supports each newly normalized concept.
    for folder,prefix,start,end,relation in (
            ("situations","SITU",9,48,"situations"),
            ("intents","INTENT",20,72,"intents")):
        for n in range(start,end+1):
            cid=f"{prefix}-{n:04d}"
            try:
                concept=read(root,Path("ontology")/folder/(cid+".json"))
                source=concept["provenance"]["queue_id"]
                if not source.startswith("RIA-"):
                    errors.append(f"{cid}: missing rule-analysis intake provenance")
                    continue
                supporting=links.get("NOM-"+source[-4:])
                if supporting is None or cid not in [x["id"] for x in supporting[relation]]:
                    errors.append(f"{cid}: declared provenance {source} is not a supporting source")
            except (OSError,ValueError,KeyError) as exc:
                errors.append(f"{cid}: malformed or missing source provenance: {exc}")
    return links,errors

def main():
    links,errors=load_links()
    for issue in errors:
        print("ERROR:",issue)
    if errors:
        raise SystemExit(1)
    print(f"Validated {len(links)} source-grounded rule associations and processing traces")

if __name__=="__main__":
    main()

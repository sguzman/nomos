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

    # This extension is independent of the immutable 137-rule baseline.
    extension_dir=root/"ontology/rule-links/port-remediation"
    extended=sorted(extension_dir.glob("RLINK-*.json"))
    cross2=read(root,Path("ontology/rule-analysis/port-remediation-crosswalk.json"))
    cases2=cross2.get("entries",{})
    if len(extended)!=38 or len(cases2)!=38 or cross2.get("status")!="reviewed":
        errors.append("expected 38 independently verified port remediation links")
    for path in extended:
        link=read(root,path.relative_to(root))
        rid=link.get("rule_id","")
        if not rid.startswith("NOM-") or not rid[4:].isdigit():
            errors.append("malformed extension link "+str(path))
            continue
        qid="RIA-"+rid[-4:]
        if rid in links or int(rid[4:]) not in range(138,176):
            errors.append("duplicate or out-of-range port link "+rid)
            continue
        rule=read(root,Path("rules")/(rid+".json"))
        queue=read(root,Path("queues/port-remediation")/(qid+".json"))
        trace=read(root,Path("processing/port-remediation")/("PROC-"+qid+".json"))
        source=queue.get("source",{})
        sids=[x["id"] for x in link.get("situations",[])]
        iids=[x["id"] for x in link.get("intents",[])]
        match=cases2.get(qid,{})
        if (rule.get("status")!="published" or link.get("rule_editorial_status")!="published" or
            link.get("id")!="RLINK-"+rid[-4:] or link.get("status")!="published" or
            link.get("rule_version")!=rule.get("version") or
            match.get("rule_id")!=rid or match.get("situation_ids")!=sids or match.get("intent_ids")!=iids or
            sids!=trace.get("disposition",{}).get("situation_ids") or
            iids!=trace.get("disposition",{}).get("intent_ids") or
            not sids or not iids or len(sids)!=len(set(sids)) or len(iids)!=len(set(iids)) or
            not set(sids)<=situations or not set(iids)<=intents):
            errors.append(rid+": invalid semantic extension")
        if (source!=trace.get("source") or
            source.get("rule_id")!=rid or source.get("path")!=f"rules/{rid}.json" or
            git_blob((root/source["path"]).read_bytes())!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_blob_sha")!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_statement")!=rule.get("statement") or
            link.get("evidence",{}).get("normalized_predicate")!=rule.get("norm",{}).get("predicate") or
            link.get("provenance",{}).get("queue_id")!=qid):
            errors.append(rid+": source provenance mismatch")
        authorization=trace.get("authorization",{})
        if (not authorization.get("processing") or not authorization.get("publication") or
            authorization.get("selection_confirmation") is not False or
            authorization.get("rule_activation") is not False or
            queue.get("status")!="processed" or trace.get("status")!="closed"):
            errors.append(rid+": authorization or processing status invalid")
        links[rid]=link
    if len(links)!=175:
        errors.append(f"incomplete combined rule associations: {len(links)}/175")
    for prefix,start,end,folder,relation in (("SITU",49,60,"situations","situations"),("INTENT",73,89,"intents","intents")):
        for n in range(start,end+1):
            cid=f"{prefix}-{n:04d}"
            obj=read(root,Path("ontology")/folder/(cid+".json"))
            supporting=links.get("NOM-"+obj.get("provenance",{}).get("queue_id","")[-4:])
            if not supporting or cid not in [c["id"] for c in supporting[relation]]:
                errors.append(cid+": missing genuine source rule")

    # C++-to-Rust independent extension retains both original and Python source history.
    cppdir=root/"ontology/rule-links/cpp-remediation"
    files=sorted(cppdir.glob("RLINK-*.json"))
    cpp_cross=read(root,Path("ontology/rule-analysis/cpp-remediation-crosswalk.json"))
    if cpp_cross.get("status")!="reviewed" or len(files)!=24 or len(cpp_cross.get("entries",{}))!=24:
        errors.append("expected 24 C++-to-Rust evidence mappings")
    for path in files:
        link=read(root,path.relative_to(root))
        rid=link.get("rule_id","")
        if rid in links or not rid.startswith("NOM-") or not rid[4:].isdigit() or int(rid[4:]) not in range(176,200):
            errors.append("invalid duplicate or out of range C++ rule link "+rid)
            continue
        qid="RIA-"+rid[-4:]
        rule=read(root,Path("rules")/(rid+".json"))
        queue=read(root,Path("queues/cpp-remediation")/(qid+".json"))
        trace=read(root,Path("processing/cpp-remediation")/("PROC-"+qid+".json"))
        source=queue.get("source",{})
        situation_ids=[x["id"] for x in link.get("situations",[])]
        intent_ids=[x["id"] for x in link.get("intents",[])]
        expected=cpp_cross.get("entries",{}).get(qid,{})
        if (rule.get("status")!="published" or link.get("rule_editorial_status")!="published" or
            link.get("rule_version")!=rule.get("version") or link.get("status")!="published" or
            expected.get("rule_id")!=rid or expected.get("situation_ids")!=situation_ids or
            expected.get("intent_ids")!=intent_ids or not situation_ids or not intent_ids or
            len(situation_ids)!=len(set(situation_ids)) or len(intent_ids)!=len(set(intent_ids)) or
            not set(situation_ids)<=situations or not set(intent_ids)<=intents or
            trace.get("disposition",{}).get("situation_ids")!=situation_ids or
            trace.get("disposition",{}).get("intent_ids")!=intent_ids):
            errors.append("invalid C++ rule concepts "+rid)
        if (source!=trace.get("source") or source.get("rule_id")!=rid or
            source.get("path")!=f"rules/{rid}.json" or
            git_blob((root/source["path"]).read_bytes())!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_blob_sha")!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_statement")!=rule.get("statement") or
            link.get("evidence",{}).get("normalized_predicate")!=rule.get("norm",{}).get("predicate") or
            link.get("provenance",{}).get("queue_id")!=qid):
            errors.append("C++ rule provenance mismatch "+rid)
        auth=trace.get("authorization",{})
        if (queue.get("status")!="processed" or trace.get("status")!="closed" or
            not auth.get("processing") or not auth.get("publication") or
            auth.get("selection_confirmation") is not False or auth.get("rule_activation") is not False):
            errors.append("C++ processing authorization invalid "+rid)
        links[rid]=link
    if len(links)!=199:
        errors.append(f"combined rule mapping count {len(links)}, expected 199")
    for prefix,start,end,folder,relation in (("SITU",61,70,"situations","situations"),("INTENT",90,104,"intents","intents")):
        for n in range(start,end+1):
            cid=f"{prefix}-{n:04d}"
            obj=read(root,Path("ontology")/folder/(cid+".json"))
            supporting=links.get("NOM-"+obj.get("provenance",{}).get("queue_id","")[-4:])
            if not supporting or cid not in [x["id"] for x in supporting[relation]]:
                errors.append(cid+": missing C++ source provenance")

    # Independent C source analysis; the 137-rule source corpus and later port history remain immutable.
    cdir=root/"ontology/rule-links/c-remediation"
    cs=sorted(cdir.glob("RLINK-*.json"))
    ccross=read(root,Path("ontology/rule-analysis/c-remediation-crosswalk.json"))
    if len(cs)!=23 or len(ccross.get("entries",{}))!=23 or ccross.get("status")!="reviewed":
        errors.append("expected 23 independent C-specific source mappings")
    for path in cs:
        link=read(root,path.relative_to(root))
        rid=link.get("rule_id","")
        if rid in links or not rid.startswith("NOM-") or not rid[4:].isdigit() or int(rid[4:]) not in range(200,223):
            errors.append("unexpected or duplicate C-specific rule mapping "+rid)
            continue
        qid="RIA-"+rid[-4:]
        rule=read(root,Path("rules")/(rid+".json"))
        queue=read(root,Path("queues/c-remediation")/(qid+".json"))
        trace=read(root,Path("processing/c-remediation")/("PROC-"+qid+".json"))
        source=queue.get("source",{})
        sids=[x["id"] for x in link.get("situations",[])]
        iids=[x["id"] for x in link.get("intents",[])]
        expected=ccross.get("entries",{}).get(qid,{})
        if (rule.get("status")!="published" or
            link.get("status")!="published" or link.get("rule_editorial_status")!="published" or
            link.get("rule_version")!=rule.get("version") or
            expected.get("rule_id")!=rid or expected.get("situation_ids")!=sids or expected.get("intent_ids")!=iids or
            trace.get("disposition",{}).get("situation_ids")!=sids or
            trace.get("disposition",{}).get("intent_ids")!=iids or
            not sids or not iids or len(sids)!=len(set(sids)) or len(iids)!=len(set(iids)) or
            not set(sids)<=situations or not set(iids)<=intents):
            errors.append("invalid C port rule concepts "+rid)
        if (source!=trace.get("source") or
            source.get("rule_id")!=rid or source.get("path")!=f"rules/{rid}.json" or
            git_blob((root/source["path"]).read_bytes())!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_blob_sha")!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_statement")!=rule.get("statement") or
            link.get("evidence",{}).get("normalized_predicate")!=rule.get("norm",{}).get("predicate") or
            link.get("provenance",{}).get("queue_id")!=qid):
            errors.append("C-specific source provenance mismatch "+rid)
        auth=trace.get("authorization",{})
        if (queue.get("status")!="processed" or trace.get("status")!="closed" or
            not auth.get("processing") or not auth.get("publication") or
            auth.get("profile_finalization") is not False or
            auth.get("rule_activation") is not False):
            errors.append("invalid source publication authorization "+rid)
        links[rid]=link
    if len(links)!=222:
        errors.append(f"combined source-link registry is {len(links)}, expected 222")
    for prefix,start,end,folder,relation in (("SITU",71,80,"situations","situations"),("INTENT",105,118,"intents","intents")):
        for n in range(start,end+1):
            cid=f"{prefix}-{n:04d}"
            concept=read(root,Path("ontology")/folder/(cid+".json"))
            source=concept.get("provenance",{}).get("queue_id","")
            supporting=links.get("NOM-"+source[-4:])
            if not supporting or cid not in [x["id"] for x in supporting[relation]]:
                errors.append(cid+": incorrect C source provenance")

    # Independent new-Rust-project profile extension: preserve original and strict-port history.
    scratch=root/"ontology/rule-links/new-rust-remediation"
    files=sorted(scratch.glob("RLINK-*.json"))
    scross=read(root,Path("ontology/rule-analysis/new-rust-remediation-crosswalk.json"))
    if len(files)!=13 or len(scross.get("entries",{}))!=13 or scross.get("status")!="reviewed":
        errors.append("expected 13 reviewed new-Rust-project rule mappings")
    for path in files:
        link=read(root,path.relative_to(root))
        rid=link.get("rule_id","")
        if rid in links or not rid.startswith("NOM-") or not rid[4:].isdigit() or int(rid[4:]) not in range(223,236):
            errors.append("invalid new Rust source link "+rid)
            continue
        qid="RIA-"+rid[-4:]
        rule=read(root,Path("rules")/(rid+".json"))
        queue=read(root,Path("queues/new-rust-remediation")/(qid+".json"))
        trace=read(root,Path("processing/new-rust-remediation")/("PROC-"+qid+".json"))
        source=queue.get("source",{})
        sids=[x["id"] for x in link.get("situations",[])]
        iids=[x["id"] for x in link.get("intents",[])]
        expected=scross.get("entries",{}).get(qid,{})
        if (rule.get("status")!="published" or link.get("status")!="published" or
            link.get("rule_editorial_status")!="published" or link.get("rule_version")!=rule.get("version") or
            expected.get("rule_id")!=rid or expected.get("situation_ids")!=sids or expected.get("intent_ids")!=iids or
            trace.get("disposition",{}).get("situation_ids")!=sids or trace.get("disposition",{}).get("intent_ids")!=iids or
            not sids or not iids or len(sids)!=len(set(sids)) or len(iids)!=len(set(iids)) or
            not set(sids)<=situations or not set(iids)<=intents):
            errors.append("invalid new Rust source concepts "+rid)
        if (source!=trace.get("source") or source.get("rule_id")!=rid or
            source.get("path")!=f"rules/{rid}.json" or
            git_blob((root/source["path"]).read_bytes())!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_blob_sha")!=source.get("git_blob_sha") or
            link.get("evidence",{}).get("source_statement")!=rule.get("statement") or
            link.get("evidence",{}).get("normalized_predicate")!=rule.get("norm",{}).get("predicate") or
            link.get("provenance",{}).get("queue_id")!=qid):
            errors.append("new Rust source provenance mismatch "+rid)
        auth=trace.get("authorization",{})
        if (queue.get("status")!="processed" or trace.get("status")!="closed" or
            not auth.get("publication") or not auth.get("processing") or
            auth.get("profile_selection_confirmation") is not False or auth.get("profile_finalization") is not False or
            auth.get("rule_activation") is not False):
            errors.append("new Rust authorization violation "+rid)
        links[rid]=link
    if len(links)!=235:
        errors.append(f"combined rule-link registry {len(links)}, expected 235")
    for prefix,start,end,folder,relation in (("SITU",81,89,"situations","situations"),("INTENT",119,131,"intents","intents")):
        for n in range(start,end+1):
            cid=f"{prefix}-{n:04d}"
            obj=read(root,Path("ontology")/folder/(cid+".json"))
            queue_id=obj.get("provenance",{}).get("queue_id","")
            support=links.get("NOM-"+queue_id[-4:])
            if not support or cid not in [x["id"] for x in support[relation]]:
                errors.append(cid+": missing new Rust source evidence")
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

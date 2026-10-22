#!/usr/bin/env python3
"""Overlap-aware project applicability with explicit rather than inferred exclusivity."""
import json
from functools import lru_cache
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

@lru_cache(maxsize=4)
def read_hierarchy(root=ROOT):
    return json.loads((root/"taxonomy/project-types.json").read_text(encoding="utf-8"))

def validate_hierarchy(hierarchy, taxonomy=None):
    errors=[]
    if hierarchy.get("wildcard")!="any" or hierarchy.get("schema_version")!=1:
        errors.append("Invalid project hierarchy metadata")
    types=hierarchy.get("types",[])
    ids=[r.get("id") for r in types if isinstance(r,dict)]
    if len(ids)!=len(types) or len(set(ids))!=len(ids) or "any" in ids:
        errors.append("Project IDs must be distinct concrete types")
    index={r["id"]:r for r in types if isinstance(r,dict) and r.get("id")}
    if taxonomy is not None and set(taxonomy.get("project_types",[]))!=set(ids)|{"any"}:
        errors.append("Project type vocabulary differs from hierarchy")
    for id,record in index.items():
        if not isinstance(record.get("parents"),list) or len(record["parents"])!=len(set(record["parents"])):
            errors.append(id+": invalid parent list")
            continue
        for parent in record["parents"]:
            if parent not in index or parent==id:
                errors.append(id+": invalid parent "+str(parent))
        for peer in record.get("exclusive_with",[]):
            if peer not in index or id not in index.get(peer,{}).get("exclusive_with",[]):
                errors.append(id+": exclusivity must be reciprocal")
    done=set()
    def visit(node,stack):
        if node in stack:
            errors.append("Project type inheritance cycle: "+node);return
        if node in done:return
        for parent in index[node].get("parents",[]):
            if parent in index:visit(parent,stack|{node})
        done.add(node)
    for node in index:visit(node,set())
    return errors

def ancestors(id,hierarchy):
    index={r["id"]:r for r in hierarchy["types"]}
    seen=set()
    def walk(cur):
        if cur in seen:return
        seen.add(cur)
        for p in index.get(cur,{}).get("parents",[]):walk(p)
    walk(id)
    return seen

def applies(rule_types, project_type, hierarchy, include_any=False):
    if "any" in rule_types:
        return include_any
    return bool(set(rule_types)&ancestors(project_type,hierarchy))

def types_can_overlap(left,right,hierarchy):
    """Different types can coexist unless explicitly marked exclusive.
    A public Tarium project may also be a Rust project: never assume disjointness.
    """
    if "any" in left or "any" in right:return True
    index={r["id"]:r for r in hierarchy["types"]}
    for a in left:
        for b in right:
            if a==b or b not in index.get(a,{}).get("exclusive_with",[]):
                return True
    return False

#!/usr/bin/env python3
"""Deterministically build the public client catalog; candidate records stay candidates."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "docs" / "catalog.json"


def build(root=ROOT):
    records, ids = [], set()
    required = {"id", "title", "version", "status", "summary", "statement",
                "norm", "categories", "scope", "authority", "relations",
                "provenance", "governance", "export_targets"}
    for location, registry in (("rules", "catalog"),
                               ("processing/specimens/candidates", "candidate")):
        for path in sorted((root / location).glob("NOM-*.json")):
            rule = json.loads(path.read_text(encoding="utf-8"))
            if required - rule.keys():
                raise ValueError(f"{path}: missing required fields")
            if rule["id"] in ids or path.stem != rule["id"]:
                raise ValueError(f"{path}: duplicate or mismatched ID")
            if registry == "candidate" and rule["status"] != "draft":
                raise ValueError(f"{path}: candidate must remain draft")
            if rule["status"] not in ("published", "draft", "reviewed", "deprecated"):
                raise ValueError(f"{path}: unknown status")
            if not isinstance(rule["scope"]["axes"], dict):
                raise ValueError(f"{path}: malformed scope")
            ids.add(rule["id"])
            records.append({**rule, "registry": registry})
    if not records:
        raise ValueError("Refusing to publish empty catalog")
    records.sort(key=lambda rule: rule["id"])
    return {"schema_version": "1.0",
            "source": "Nomos public catalog and distinct unapproved rule candidates",
            "rules": records}


def main():
    data = build()
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    print(f"Built {CATALOG.relative_to(ROOT)} with {len(data['rules'])} entries")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Deterministically build the public client catalog; candidate records stay candidates."""
import json
import hashlib
import re
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
            if path.stem != rule["id"]:
                raise ValueError(f"{path}: mismatched ID")
            # Retain original candidate records as provenance, not duplicates.
            if registry == "candidate" and rule["id"] in ids:
                continue
            if rule["id"] in ids:
                raise ValueError(f"{path}: duplicate catalog ID")
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
    groups = [json.loads(path.read_text(encoding="utf-8"))
              for path in sorted((root / "groups").glob("GROUP-*.json"))]
    from groups import validate_groups
    group_errors = validate_groups(groups, records)
    if group_errors:
        raise ValueError("; ".join(group_errors))
    return {"schema_version": "2.0",
            "source": "Nomos public catalog and independent published virtual groups",
            "rules": records, "groups": groups}


def fingerprint_assets(root=ROOT):
    """Use content-addressed URLs to avoid mixing cached old JS with new HTML."""
    docs = root / "docs"
    index = docs / "index.html"
    html = index.read_text(encoding="utf-8")
    asset_names = (
        "styles.css", "rule-colors.js", "reasoning.js", "groups.js",
        "catalog-browser.js", "app.js", "catalog.json"
    )
    for asset in asset_names:
        digest = hashlib.sha256((docs / asset).read_bytes()).hexdigest()[:12]
        target = "./" + asset + "?v=" + digest
        pattern = re.escape("./" + asset) + r"(?:\?v=[0-9a-f]+)?"
        html, count = re.subn(pattern, target, html)
        if count != 1:
            raise ValueError(f"Expected one HTML asset reference for {asset}; saw {count}")
    index.write_text(html, encoding="utf-8")


def main():
    data = build()
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    fingerprint_assets()
    print(f"Built {CATALOG.relative_to(ROOT)} with {len(data['rules'])} entries and versioned assets")


if __name__ == "__main__":
    main()

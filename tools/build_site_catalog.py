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
    profiles = []
    published = {r["id"] for r in records if r["status"] == "published" and r["registry"] == "catalog"}
    for path in sorted((root / "profiles").glob("PROFILE-*.json")):
        profile = json.loads(path.read_text(encoding="utf-8"))
        if path.stem != profile.get("id") or profile.get("kind") != "rule_profile":
            raise ValueError(f"{path}: invalid profile identity")
        if profile.get("status") not in ("draft", "finalized", "deprecated"):
            raise ValueError(f"{path}: invalid profile state")
        ids = profile.get("selected_rule_ids")
        if not isinstance(ids, list) or len(ids) != len(set(ids)) or not set(ids).issubset(published):
            raise ValueError(f"{path}: unknown, unpublished, or duplicate profile members")
        if not isinstance(profile.get("review", {}).get("selection_confirmed"), bool):
            raise ValueError(f"{path}: invalid selection review state")
        if profile["status"] in ("finalized", "deprecated") and profile["review"]["selection_confirmed"] is not True:
            raise ValueError(f"{path}: only an owner-reviewed selection can be finalized")
        if profile["status"] == "draft" and profile["review"].get("finalization_confirmed") is not False:
            raise ValueError(f"{path}: draft is incorrectly marked finalized")
        if profile["status"] == "finalized" and profile["review"].get("finalization_confirmed") is not True:
            raise ValueError(f"{path}: finalization was not confirmed")
        profiles.append(profile)
    from validate_formal_situational_ontology import load_formal
    formal, prompt_errors = load_formal(root)
    if prompt_errors:
        raise ValueError("; ".join(prompt_errors))
    situational_prompts = sorted(formal["prompts_v1"].values(), key=lambda p: p["id"])
    situational_prompt_versions = sorted(formal["prompt_versions"].values(),
                                         key=lambda p: (p["id"], p["version"]))
    # Distinct canonical v1 plus immutable v2/v3 versions; no auto-upgrade.
    if len(situational_prompts) != 8 or len(situational_prompt_versions) != 16:
        raise ValueError("Expected eight preserved v1 and sixteen additional prompt generations")
    from validate_rule_situation_intent_links import load_links
    analyzed_links, link_errors=load_links(root)
    if link_errors:
        raise ValueError("; ".join(link_errors))
    # Descriptive labels are added to the SITE representation, never written into canonical rules.
    for item in records:
        link=analyzed_links.get(item["id"])
        if link:
            item["situational_analysis"]={
                "situation_ids": [s["id"] for s in link["situations"]],
                "intent_ids": [i["id"] for i in link["intents"]],
                "source_status": link["rule_editorial_status"],
                "review_status": link["status"]
            }
    from relationships import build_relationships
    relationships=build_relationships(records,root)
    from project_types import read_hierarchy
    hierarchy=read_hierarchy(root)
    domain_definitions=json.loads((root/"taxonomy/domains.json").read_text(encoding="utf-8"))
    return {"schema_version": "3.0",
            "source": "Nomos public catalog of atomic rules, virtual groups, opt-in profiles, and situational prompts",
            "rules": records, "groups": groups, "profiles": profiles,
            "rule_situation_intent_links": sorted(analyzed_links.values(),key=lambda x:x["rule_id"]),
            "situational_prompts": situational_prompts,
            "situational_prompt_versions": situational_prompt_versions,
            "situations": sorted(formal["situations"].values(), key=lambda p: p["id"]),
            "intents": sorted(formal["intents"].values(), key=lambda p: p["id"]),
            "intent_families": sorted(formal["families"].values(), key=lambda p: p["id"]),
            "execution_conditions": sorted(formal["conditions"].values(), key=lambda p: p["id"]),
            "evaluation_dimensions": sorted(formal["evaluation-dimensions"].values(), key=lambda p: p["id"]),
            "situational_evaluations": formal["evaluations"],
            "relationships": relationships,
            "project_types": [r["id"] for r in hierarchy["types"]],
            "project_hierarchy": hierarchy,
            "domain_definitions": domain_definitions}


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
    # The second browse surface has independent scripts and styles, but shares
    # the same generated catalog snapshot. Skip when older minimal fixtures omit it.
    situational = docs / "situational-prompts.html"
    if situational.exists():
        html = situational.read_text(encoding="utf-8")
        for asset in ("styles.css", "situational-prompts.css", "situational-prompts.js", "catalog.json"):
            digest = hashlib.sha256((docs / asset).read_bytes()).hexdigest()[:12]
            pattern = re.escape("./" + asset) + r"(?:\?v=[0-9a-f]+)?"
            html, count = re.subn(pattern, "./" + asset + "?v=" + digest, html)
            if count != 1:
                raise ValueError(f"Expected one situational asset reference for {asset}; saw {count}")
        situational.write_text(html, encoding="utf-8")
    ontology = docs / "situational-ontology.html"
    if ontology.exists():
        html = ontology.read_text(encoding="utf-8")
        for asset in ("styles.css", "situational-ontology.css", "situational-ontology.js", "catalog.json"):
            digest = hashlib.sha256((docs / asset).read_bytes()).hexdigest()[:12]
            pattern = re.escape("./" + asset) + r"(?:\?v=[0-9a-f]+)?"
            html, count = re.subn(pattern, "./" + asset + "?v=" + digest, html)
            if count != 1:
                raise ValueError(f"Expected one ontology asset reference for {asset}; saw {count}")
        ontology.write_text(html, encoding="utf-8")


def main():
    data = build()
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    fingerprint_assets()
    print(f"Built {CATALOG.relative_to(ROOT)} with {len(data['rules'])} entries and versioned assets")


if __name__ == "__main__":
    main()

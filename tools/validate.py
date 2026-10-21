#!/usr/bin/env python3
"""Small stdlib-only metadata validator and potential-conflict scanner.

Does not implement complete JSON Schema or decide arbitrary natural-language conflicts.
"""
import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_catalog(root=ROOT):
    taxonomy = json.loads((root / "taxonomy/categories.json").read_text())
    rules = [json.loads(path.read_text()) for path in sorted((root / "rules").glob("*.json"))]
    return taxonomy, rules


def overlaps(a, b):
    """Controlled applicability facets: disjoint on any axis => no overlap."""
    for key in ("channel", "visibility", "artifact_kind", "actor"):
        left, right = set(a["scope"]["axes"][key]), set(b["scope"]["axes"][key])
        if "any" not in left and "any" not in right and not (left & right):
            return False
    return True


def possible_conflict(a, b):
    """Candidate only; does not resolve precedence, exceptions or free text."""
    if a["norm"]["predicate"] != b["norm"]["predicate"] or not overlaps(a, b):
        return False
    kinds = {a["norm"]["kind"], b["norm"]["kind"]}
    if kinds == {"prohibition", "obligation"}:
        return True
    if kinds == {"prohibition", "permission"}:
        permission = a if a["norm"]["kind"] == "permission" else b
        return permission["norm"]["permission_strength"] == "strong"
    return False


def validate(taxonomy, rules):
    errors = []
    seen = set()
    required = {"id", "version", "title", "summary", "statement", "rationale", "language",
                "status", "norm", "categories", "scope", "authority", "relations",
                "provenance", "governance", "export_targets"}
    for rule in rules:
        rid = rule.get("id", "<missing id>")
        missing = required - set(rule)
        if missing:
            errors.append(f"{rid}: missing fields {sorted(missing)}")
            continue
        if rid in seen:
            errors.append(f"{rid}: duplicate ID")
        seen.add(rid)
        if rule["status"] not in taxonomy["status_values"]:
            errors.append(f"{rid}: unknown status")
        norm = rule["norm"]
        if norm.get("kind") not in taxonomy["norm_kinds"]:
            errors.append(f"{rid}: unknown normative kind")
        if set(norm.get("predicate", {})) != {"action", "object", "target"}:
            errors.append(f"{rid}: predicate must specify action/object/target")
        if norm.get("permission_strength") not in ("strong", "weak", "not_applicable"):
            errors.append(f"{rid}: invalid permission strength")
        if norm.get("kind") != "permission" and norm.get("permission_strength") != "not_applicable":
            errors.append(f"{rid}: only permissions have permission strength")
        if norm.get("kind") == "permission" and norm.get("permission_strength") == "not_applicable":
            errors.append(f"{rid}: permission needs strength")
        for group, vocab in (("categories", taxonomy["category_axes"]),
                             ("scope", taxonomy["scope_axes"])):
            value = rule[group] if group == "categories" else rule["scope"].get("axes", {})
            for axis, allowed in vocab.items():
                labels = value.get(axis, [])
                if not labels or len(labels) != len(set(labels)) or not set(labels) <= set(allowed):
                    errors.append(f"{rid}: invalid {group}.{axis}: {labels}")
                if group == "scope" and "any" in labels and len(labels) != 1:
                    errors.append(f"{rid}: 'any' must be the only scope value on {axis}")
        authority = rule["authority"]
        if authority.get("tier") not in taxonomy["authority_tiers"]:
            errors.append(f"{rid}: invalid authority tier")
        if authority.get("override_policy") not in taxonomy["override_policies"]:
            errors.append(f"{rid}: invalid override policy")
        if not isinstance(authority.get("priority"), int) or isinstance(authority.get("priority"), bool):
            errors.append(f"{rid}: authority priority must be integer")
        if set(rule["export_targets"]) - set(taxonomy["export_targets"]):
            errors.append(f"{rid}: unknown export target")
    for rule in rules:
        for rel, targets in rule.get("relations", {}).items():
            if rel not in ("conflicts_with", "exceptions_to", "refines", "depends_on"):
                errors.append(f"{rule['id']}: unknown relation {rel}")
            for target in targets:
                if target == rule["id"] or target not in seen:
                    errors.append(f"{rule['id']}: invalid relation to {target}")
    return errors


def conflicts(rules):
    return [(a["id"], b["id"]) for i, a in enumerate(rules)
            for b in rules[i + 1:] if possible_conflict(a, b)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict-conflicts", action="store_true",
                        help="fail on unresolved metadata conflict candidates")
    args = parser.parse_args()
    try:
        taxonomy, rules = load_catalog()
        errors = validate(taxonomy, rules)
        candidates = conflicts(rules) if not errors else []
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"Validation could not finish: {exc}", file=sys.stderr)
        return 2
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    for a, b in candidates:
        print(f"POSSIBLE CONFLICT: {a} <-> {b} (requires human/semantic review)")
    if errors:
        return 1
    print(f"Validated {len(rules)} rule records; {len(candidates)} potential conflict pair(s).")
    return 1 if args.strict_conflicts and candidates else 0


if __name__ == "__main__":
    raise SystemExit(main())

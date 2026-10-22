#!/usr/bin/env python3
"""Small stdlib-only metadata validator and potential-conflict scanner.

Does not implement complete JSON Schema or decide arbitrary natural-language conflicts.
"""
import argparse
import json
import pathlib
import sys
from project_types import read_hierarchy, types_can_overlap, validate_hierarchy

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
    return types_can_overlap(a.get("scope", {}).get("project_types", ["any"]),
                             b.get("scope", {}).get("project_types", ["any"]),
                             read_hierarchy())


def value_relation(a, b, context=None):
    """Exclusive single-value settings: same, different, dynamic, or unspecified."""
    left = a["norm"].get("value_constraint")
    right = b["norm"].get("value_constraint")
    if not left or not right or left["field"] != right["field"]:
        return "unspecified"

    def resolve(expr):
        if expr["operator"] == "equals":
            return expr.get("value")
        return (context or {}).get("latest_stable_supported_edition")

    x, y = resolve(left), resolve(right)
    if x is None or y is None:
        return "dynamic_unknown"
    if x != y:
        return "different"
    if left["operator"] != "equals" or right["operator"] != "equals":
        return "dynamic_equal"
    return "equal"



def validate_bounds(rule):
    """Check typed quantification without silently inferring meaning from 'any'."""
    rid = rule.get("id", "<unknown>")
    b = rule.get("norm", {}).get("bounds")
    if not isinstance(b, dict):
        return [f"{rid}: norm.bounds must be a structured object"]
    errors = []
    allowed = {
        "quantifier": {"all", "any", "some", "none", "unspecified"},
        "interpretation": {"universal", "existential", "free_choice", "zero", "unspecified"},
        "frequency": {"always", "never", "sometimes", "unspecified"},
        "unit": {"occurrences", "entities", "unspecified"},
        "basis": {"explicit_text", "reviewed_inference", "unresolved"},
    }
    expected = set(allowed) | {"minimum", "maximum", "window", "cue"}
    if set(b) != expected:
        return [f"{rid}: norm.bounds fields mismatch: {sorted(set(b) ^ expected)}"]
    for k, values in allowed.items():
        if b[k] not in values:
            errors.append(f"{rid}: invalid bounds.{k}")
    for k in ("minimum", "maximum"):
        n = b[k]
        if n is not None and (not isinstance(n, int) or isinstance(n, bool) or n < 0):
            errors.append(f"{rid}: bounds.{k} must be a nonnegative integer or null")
    if b["minimum"] is not None and b["maximum"] is not None and isinstance(b["minimum"], int) and isinstance(b["maximum"], int):
        if b["minimum"] > b["maximum"]:
            errors.append(f"{rid}: bounds lower limit exceeds upper limit")
    for k in ("cue", "window"):
        if b[k] is not None and (not isinstance(b[k], str) or not b[k].strip()):
            errors.append(f"{rid}: bounds.{k} must be null or nonempty text")
    # A lexical 'any' cannot be assigned universal semantics just from the word.
    if b["quantifier"] == "any" and b["basis"] == "unresolved" and b["interpretation"] != "unspecified":
        errors.append(f"{rid}: ambiguous any must remain uninterpreted pending review")
    if b["frequency"] == "never" and b["maximum"] != 0:
        errors.append(f"{rid}: never requires maximum 0 occurrences")
    if b["frequency"] == "never" and b["unit"] != "occurrences":
        errors.append(f"{rid}: never requires unit occurrences")
    if b["frequency"] == "sometimes" and (b["minimum"] is None or b["minimum"] < 1):
        errors.append(f"{rid}: sometimes requires at least one occurrence")
    if b["basis"] == "unresolved" and (b["frequency"] != "unspecified" or b["minimum"] is not None or b["maximum"] is not None):
        errors.append(f"{rid}: unresolved bounds cannot assert occurrence limits")
    if b["quantifier"] == "all" and b["interpretation"] != "universal":
        errors.append(f"{rid}: all must have universal interpretation")
    if b["quantifier"] == "some" and b["interpretation"] != "existential":
        errors.append(f"{rid}: some must have existential interpretation")
    if b["quantifier"] == "none" and b["interpretation"] != "zero":
        errors.append(f"{rid}: none must have zero interpretation")
    return errors


def bounds_incompatible(a, b):
    """Only prove disjoint numeric intervals with matching count unit and window."""
    left, right = a.get("norm", {}).get("bounds"), b.get("norm", {}).get("bounds")
    if not isinstance(left, dict) or not isinstance(right, dict):
        return False
    if left.get("basis") == "unresolved" or right.get("basis") == "unresolved":
        return False
    if left.get("unit") not in ("occurrences", "entities") or left.get("unit") != right.get("unit"):
        return False
    if left.get("window") != right.get("window"):
        return False
    lo, hi, rlo, rhi = left.get("minimum"), left.get("maximum"), right.get("minimum"), right.get("maximum")
    return (hi is not None and rlo is not None and hi < rlo) or (rhi is not None and lo is not None and rhi < lo)

def assess_pair(a, b, context=None):
    """Conservative normative analysis: no hidden priority decisions."""
    if not overlaps(a, b):
        return "disjoint"
    if a["norm"]["predicate"] != b["norm"]["predicate"]:
        return "unrelated"
    left, right = a["norm"], b["norm"]
    kinds = {left["kind"], right["kind"]}
    values = value_relation(a, b, context)
    if kinds == {"prohibition", "obligation"}:
        return "possible_conflict"
    if kinds == {"prohibition", "permission"}:
        permission = a if left["kind"] == "permission" else b
        return "possible_conflict" if permission["norm"]["permission_strength"] == "strong" else "overlap"
    if kinds == {"obligation"}:
        if bounds_incompatible(a, b):
            return "possible_conflict"
        if values == "different":
            return "possible_conflict"
        if values in ("dynamic_unknown", "dynamic_equal"):
            return "conditional"
    if kinds == {"obligation", "permission"}:
        permission = a if left["kind"] == "permission" else b
        if permission["norm"]["permission_strength"] == "strong":
            if values == "different":
                return "possible_conflict"
            if values in ("dynamic_unknown", "dynamic_equal"):
                return "conditional"
    return "overlap"


def possible_conflict(a, b, context=None):
    return assess_pair(a, b, context) == "possible_conflict"


def validate(taxonomy, rules):
    errors = []
    seen = set()
    errors.extend(validate_hierarchy(read_hierarchy(),taxonomy))
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
        project_types = rule["scope"].get("project_types", ["any"])
        allowed_project_types = set(taxonomy["project_types"])
        if (not isinstance(project_types, list) or not project_types
            or len(project_types) != len(set(project_types))
            or not set(project_types) <= allowed_project_types
            or ("any" in project_types and len(project_types) > 1)):
            errors.append(f"{rid}: invalid scope.project_types")
        semantic = rule.get("semantic")
        if semantic is not None:
            import re
            if (not isinstance(semantic, dict) or set(semantic) != {"concept", "aliases"}
                or not isinstance(semantic["concept"], str)
                or not re.fullmatch(r"[a-z][a-z0-9_]*", semantic["concept"])
                or not isinstance(semantic["aliases"], list)
                or any(not isinstance(x, str) or not re.fullmatch(r"[a-z][a-z0-9_]*", x) for x in semantic["aliases"])
                or len(semantic["aliases"]) != len(set(semantic["aliases"]))):
                errors.append(f"{rid}: invalid semantic annotation")
        norm = rule["norm"]
        errors.extend(validate_bounds(rule))
        constraint = norm.get("value_constraint")
        if constraint is not None:
            if not isinstance(constraint, dict):
                errors.append(f"{rid}: value_constraint must be object")
            elif (constraint.get("field") != "package.edition"
                  or constraint.get("operator") not in ("equals", "latest_stable_supported")
                  or (constraint.get("operator") == "equals" and not isinstance(constraint.get("value"), str))
                  or (constraint.get("operator") == "latest_stable_supported" and "value" in constraint)
                  or norm.get("predicate") != {"action": "set", "object": "rust_edition", "target": "cargo_manifest"}):
                errors.append(f"{rid}: invalid Cargo edition value_constraint")
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


def conditional_pairs(rules, context=None):
    return [(a["id"], b["id"]) for i, a in enumerate(rules)
            for b in rules[i + 1:] if assess_pair(a, b, context) == "conditional"]


def conflicts(rules, context=None):
    return [(a["id"], b["id"]) for i, a in enumerate(rules)
            for b in rules[i + 1:] if possible_conflict(a, b, context)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--strict-conflicts", action="store_true",
                        help="fail on unresolved metadata conflict candidates")
    args = parser.parse_args()
    try:
        taxonomy, rules = load_catalog()
        errors = validate(taxonomy, rules)
        candidates = conflicts(rules) if not errors else []
        conditional = conditional_pairs(rules) if not errors else []
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"Validation could not finish: {exc}", file=sys.stderr)
        return 2
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    for a, b in candidates:
        print(f"POSSIBLE CONFLICT: {a} <-> {b} (requires human/semantic review)")
    for a, b in conditional:
        print(f"CONDITIONAL: {a} <-> {b} (edition/toolchain context required)")
    if errors:
        return 1
    print(f"Validated {len(rules)} rule records; {len(candidates)} potential conflict pair(s), {len(conditional)} conditional pair(s).")
    return 1 if args.strict_conflicts and candidates else 0


if __name__ == "__main__":
    raise SystemExit(main())

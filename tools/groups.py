"""Validation and recursive membership expansion for first-class virtual groups."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_groups(root=ROOT):
    return [json.loads(p.read_text(encoding="utf-8"))
            for p in sorted((root / "groups").glob("GROUP-*.json"))]


def expand_member_ids(group_id, groups, published_rules=None):
    """Dedupe rules; cycles are errors; no group implies active instructions."""
    by_id = {group["id"]: group for group in groups}
    permitted = None if published_rules is None else set(published_rules)
    seen, result = set(), []

    def visit(gid, stack):
        if gid in stack:
            raise ValueError("group cycle: " + " -> ".join([*stack, gid]))
        if gid not in by_id:
            raise ValueError("missing group " + gid)
        group = by_id[gid]
        for rid in group["member_rule_ids"]:
            if rid not in seen and (permitted is None or rid in permitted):
                seen.add(rid)
                result.append(rid)
        if group["composition"]["include_descendants"]:
            for child in group["child_group_ids"]:
                visit(child, [*stack, gid])

    visit(group_id, [])
    return result


def validate_groups(groups, rules):
    errors = []
    by_id = {g["id"]: g for g in groups}
    if len(by_id) != len(groups):
        errors.append("duplicate group IDs")
    rule_by_id = {r["id"]: r for r in rules}
    required = {"id", "kind", "version", "status", "title", "summary",
                "metadata_labels", "parent_group_ids", "child_group_ids",
                "member_rule_ids", "color", "composition", "provenance", "governance"}
    for group in groups:
        gid = group.get("id", "<missing>")
        if required - group.keys():
            errors.append(f"{gid}: missing required group fields")
            continue
        if group["kind"] != "virtual_rule_group" or group["status"] != "published":
            errors.append(f"{gid}: group is not a published virtual group")
        for field in ("member_rule_ids", "child_group_ids", "parent_group_ids", "metadata_labels"):
            values = group[field]
            if not isinstance(values, list) or len(set(values)) != len(values):
                errors.append(f"{gid}: duplicate or malformed {field}")
                continue
        for rid in group["member_rule_ids"]:
            rule = rule_by_id.get(rid)
            if rule is None or rule.get("status") != "published":
                errors.append(f"{gid}: member {rid} missing or not published")
        for child_id in group["child_group_ids"]:
            child = by_id.get(child_id)
            if not child or gid not in child.get("parent_group_ids", []):
                errors.append(f"{gid}: missing or non-reciprocal child {child_id}")
        for parent_id in group["parent_group_ids"]:
            parent = by_id.get(parent_id)
            if not parent or gid not in parent.get("child_group_ids", []):
                errors.append(f"{gid}: missing or non-reciprocal parent {parent_id}")
        color = group["color"]
        if color.get("space") != "OKLCH" or color.get("identity_string") != gid or color.get("scheme") != "oklab_maximin_v2":
            errors.append(f"{gid}: invalid stable color identity")
        if not isinstance(color.get("hue_degrees"), (int, float)) or not 0 <= color["hue_degrees"] < 360:
            errors.append(f"{gid}: hue outside 0..360")
        cmp = group["composition"]
        if (cmp.get("opt_in_only") is not True or
            cmp.get("no_implicit_activation") is not True or
            cmp.get("deduplicate_rule_ids") is not True or
            cmp.get("exclude_unpublished_members") is not True):
            errors.append(f"{gid}: unsafe group composition behavior")
    for group in groups:
        try:
            expand_member_ids(group["id"], groups)
        except ValueError as err:
            errors.append(str(err))
    return sorted(set(errors))

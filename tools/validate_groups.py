#!/usr/bin/env python3
"""Validate the independent virtual-group ontology and published membership."""
from groups import load_groups, validate_groups
from validate import load_catalog

def main():
    _, rules = load_catalog()
    groups = load_groups()
    issues = validate_groups(groups, rules)
    for issue in issues:
        print("ERROR:", issue)
    if issues:
        return 1
    print(f"Validated {len(groups)} groups and their rule memberships.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

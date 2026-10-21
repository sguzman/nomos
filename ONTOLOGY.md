# Minimal ontology and rich rule metadata

Nomos has three independently identified ontological kinds:

1. **Rule:** an independently versioned normative proposition.
2. **Category:** a controlled label or applicability facet used to classify and compare rules.
3. **Virtual rule group:** a first-class, versioned, non-normative collection of references to atomic rules and optional child groups.

Relationships between rules are metadata references, not additional standalone ontological kinds. Compositions, use cases, tasks, and specimens are operational concepts, not catalog rule or group entities.

## Rule record

A rule JSON record in `rules/` contains:

| Group | Properties | Function |
| --- | --- | --- |
| Identity | `id`, `version`, `title`, `summary`, `statement`, `rationale`, `language`, `status` | Stable identification and editorial lifecycle |
| Norm | `kind`, `predicate.action/object/target`, `permission_strength`, `conditions`, `exceptions` | Machine-comparable normative effect |
| Categories | `domains`, `topics`, `audiences` | Discovery and faceted navigation |
| Scope | `axes.channel/visibility/artifact_kind/actor`, `preconditions`, `exclusions` | Applicability and possible intersection |
| Authority | `source`, `tier`, `priority`, `override_policy` | Provenance of normative weight, not automatic supremacy |
| Relations | `conflicts_with`, `exceptions_to`, `refines`, `depends_on` | Explicit, auditable cross-rule references |
| Provenance | `source_type`, `reference`, `license`, `notes` | Public-safe attribution and origin |
| Governance | `created_on`, `updated_on`, `review_status` | Change tracking |
| Targets | `export_targets` | Intended future output compatibility, not an instruction to export |

See [schema/rule.schema.json](schema/rule.schema.json) for types and [taxonomy/categories.json](taxonomy/categories.json) for allowed category values.

## Semantics

- `prohibition`: the actor must not perform the normalized predicate in scope.
- `obligation`: the actor must perform the predicate in scope.
- `permission`: the actor may perform it. **Strong** permission is an explicit allowance; **weak** permission merely indicates absence of a rule prohibiting it and does not override prohibition.
- `any` is a wildcard on a scope axis and must be its only value on that axis.
- Empty arrays in `conditions`, `preconditions`, and `exclusions` mean no extra human-readable qualifications recorded; nonempty text requires manual assessment.
- `status` governs catalog editorial lifecycle, **not** whether the rule is applied by an agent.

## Conflict analysis (initial approximation)

For a selected pair of rules:

1. Compare their structured predicates: same action, object and target.
2. Intersect each controlled scope axis, considering `any` a wildcard. A disjoint axis means the rules cannot conflict within the represented scope.
3. If scopes intersect and one norm forbids what another obliges or **strongly** permits, report **possible conflict**.
4. Inspect conditions, exclusions, authority, and relations to determine whether the candidate is real or explicitly resolved. Priority alone does not decide it.
5. If the system cannot decide, report uncertainty. Metadata-only checks are deliberately sound about **candidate detection**, not complete logical satisfiability.

A public-repository prohibition and a private-diary allowance can coexist when their visibility facets are disjoint. If a permission instead includes public diaries, the same predicate may yield an overlap candidate.

## Ontology boundaries

Do not force persistence of a website user's temporary mix-and-match selection. Do not treat an exported `AGENTS.md` or Custom Instructions file as a canonical rule. Rendering is a projection of selected rules, not the ontology itself.

## Cargo edition value constraints

Optional `norm.value_constraint` specifies a single-valued configuration decision: `field: package.edition`, with `operator: equals` and a fixed `value`, or `operator: latest_stable_supported` to resolve from the target Rust toolchain at the decision time. Two overlapping edition obligations can conflict when resolved values differ. Missing toolchain context, or currently equal dynamic and fixed values that might later diverge, are **conditional**, not proven conflicts. Weak permission to select an alternative does not override a contrary obligation; strong permission may create a conflict candidate. Authority and free-text exceptions still require review.

The Rust Edition Guide documents 2024 as the latest stable edition as of 2026-10-21. This dated observation is not the permanent meaning of `latest`. Approved catalog entries are inert until explicitly selected for a consumer. Retained processing candidates are historical provenance, not duplicate catalog records.

## Virtual rule group contract

A group in `groups/GROUP-*.json` is a **first-class entity with independent ID and version**, title, summary, metadata labels, published status, OKLCH identity from its own ID, provenance, governance, canonical `member_rule_ids`, and bidirectional `parent_group_ids`/`child_group_ids`. The machine-readable contract lives at `schema/group.schema.json`.

Group membership does **not** modify a member rule's authority, normative kind, version or applicability. A rule may belong to any number of groups and can always be selected separately. `GROUP-0001` is an umbrella grouping containing seven child groups; the hierarchy expands to 54 **unique** atomic rule IDs. No rule is duplicated in the catalog.

Selecting "Add all" on a group is an **explicit, ephemeral UI action** that recursively adds eligible published members. Unpublished members are omitted; identical IDs are deduplicated across direct and nested membership. Cycles, broken references and mismatched parent/child links fail validation. A group card cannot silently activate member rules outside the current composition; exports include the **selected independent rules**, not opaque group instructions.

The normalized development-hygiene rules are conditional on their documented project triggers and task authorizations, especially release, deployment, or potentially destructive activities. Catalog approval never grants execution authority.

## Project management and porting group expansion

`GROUP-0009` is a second independent umbrella with four children: `GROUP-0010` (Progress Reporting, three atomic rules), `GROUP-0011` (Completion Reporting, two), `GROUP-0012` (Project Identity, one) and `GROUP-0013` (Porting & Compatibility, three). Selecting the umbrella explicitly adds nine distinct catalog rules, not an indivisible combined instruction. Each atomic rule remains selectable without the group.

Progress reporting distinguishes first-time completion announcement (`NOM-0071`) from suppression of previously announced 100% items in later **routine** reports (`NOM-0072`). Suppression does not remove roadmap records; reopened items can be reported again when incomplete. `NOM-0073` is a standalone README color-presentation refinement of `NOM-0009`, not a rewrite of the underlying deterministic color rule. Strict port rules apply only to an authorized project with an agreed source baseline and MVP acceptance criteria; they do not apply to every Rust project automatically.

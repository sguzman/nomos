# Minimal ontology and rich rule metadata

Nomos currently has only two primary ontological kinds:

1. **Rule:** an independently versioned normative proposition.
2. **Category:** a controlled label or applicability facet used to classify and compare rules.

Relationships between rules are metadata references, not additional standalone ontological kinds. Compositions, use cases, tasks, and specimens are distinct operational concepts and need not be ontology entities.

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

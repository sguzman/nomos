# Minimal ontology and rich rule metadata

Nomos has four independently identified ontological kinds:

1. **Rule:** an independently versioned normative proposition.
2. **Category:** a controlled label or applicability facet used to classify and compare rules.
3. **Virtual rule group:** a first-class, versioned, non-normative predefined collection of atomic rules and optional child groups.
4. **Rule profile:** a first-class, versioned, *optional* and user-reviewed preset of selected atomic rule IDs for a particular kind of work or instruction export.

Relationships between rules are metadata references, not additional standalone ontological kinds. Temporary compositions, use-case discussion, proposed selections, tasks, and specimens remain operational concepts; they are not automatically catalog objects.

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

Do not force persistence of a website user's temporary mix-and-match selection or conversational use-case discussion. Do not treat an exported `AGENTS.md` or Custom Instructions file as a canonical rule. Rendering is a projection of selected rules, not the ontology itself. An explicitly instantiated, finalized rule profile is a reusable *optional selection preset*, not a rule, group, authority source, mandatory workflow, or automatically applied export.

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

## Quantifiers, frequency and numeric bounds (rule metadata 1.1)

Every active catalog rule has an independent `norm.bounds` object in addition to `norm.kind` (obligation, prohibition, strong/weak permission) and `norm.predicate` (action, object, target). `bounds.quantifier` stores quantity wording: `all`, `any`, `some`, `none` or `unspecified`. `bounds.interpretation` is separately typed as `universal`, `existential`, `free_choice`, `zero` or `unspecified`; crucially **any has no fixed interpretation**. `bounds.frequency` tracks `always`, `never`, `sometimes` or `unspecified`. `minimum` and `maximum` are nullable occurrence or entity count limits, alongside `unit`, `window`, a short public-safe textual `cue`, and `basis` (`explicit_text`, `reviewed_inference`, or `unresolved`).

- **Never** denotes a zero-allowed-occurrence constraint (`frequency: never`, `maximum: 0`, `unit: occurrences`) *within the predicate's applicable scope*; it does not describe past observed behavior or automatically override explicit exceptions.
- **Always** denotes every applicable opportunity; it does **not** imply infinitely many required events when no opportunity arises.
- **All** quantifies universally over an identifiable collection of entities or acts.
- **Any** may mean any arbitrary selected member, every member, or existence of at least one member. Retain the lexical cue without forcing an interpretation unless the context resolves it.
- **Sometimes** entails at least one relevant occurrence, not necessarily every occurrence; a window may remain unknown and must not be invented.
- **Exactly once** uses `minimum: 1`, `maximum: 1`, `unit: occurrences` with the relevant event window if specified.

Earlier rule records receive `basis: unresolved` and unspecified bounds by default, **not invented linguistic readings**. Explicitly reviewed instances may receive narrower constraints. Do not infer an `always` frequency merely from the existence of an obligation or a `never` frequency merely from a prohibition. A normal prohibition still forbids its action within scope regardless of whether optional frequency metadata is resolved. Rules in historical specimen-candidate snapshots retain their original schema to preserve provenance.

Conflict evaluation remains conservative: the original predicate+scope+norm-kind comparison is maintained; additionally, **disjoint numerical intervals on two obligations** are a conflict candidate only if both have reviewed bounds, matching units and the same explicit/unspecified window. Opposing ranges with different windows, ambiguous “any”, lexical synonyms and natural-language exceptions are not automatically proven to conflict.

## Optional rule profiles (fourth ontology kind)

A profile in `profiles/PROFILE-*.json` is a **purpose-specific reusable preset**, not a virtual group, new normative rule or command to use it. Its machine contract is [schema/profile.schema.json](schema/profile.schema.json), and its user-controlled workflow is [PROFILE_WORKFLOW.md](PROFILE_WORKFLOW.md). The identity, version, title, state (`draft`, `finalized`, `deprecated`), selected canonical rule IDs, supported instruction export formats, two separate review confirmations, and governance dates form its deliberately **small** record. It does not store a mandatory original conversation, elaborate intent analysis, or AI-generated rationale for every rule.

- **Virtual group:** a curated, named rule collection that can be expanded when explicitly selected; may have hierarchical membership.
- **Profile:** a user-reviewed, use-case-oriented **preset**, with no group nesting, no rule inheritance, and no use requirement. Individual rules remain fully independent. Two profiles may reuse the same rule without duplication.
- **Discussion/proposal:** transient collaboration to identify a use case and propose candidate rule IDs; it is not an instantiated profile, stored instruction, or job.
- **Draft:** created only when the user explicitly approves instantiating the reviewed selection; the user may add or remove published rules before finalization, including temporarily leaving a draft empty.
- **Finalized:** becomes reusable only after **separate explicit finalization approval** and at least one selected published rule. A finalized preset still does **nothing** until the user explicitly selects or exports it.

Profiles can name output targets `agents_md` (agent instructions), `chatgpt_custom_instructions`, or `plain_text`; format support does not grant permission to install or apply instructions anywhere. Missing new rule ideas must follow ordinary specimen processing and publication rather than being hallucinated into a profile. Machine checks reject duplicate rule IDs, unpublished references, invalid export targets and unsupported state transitions; existing conservative rule-conflict analysis is reused to flag potential incompatibilities before finalization. Catalog revisions do not silently change the selected IDs or add rules.

**No default profile is required. No rule profile has been instantiated merely by adding this ontology kind.**

## MVP graduation collection and de-duplicated intake

The approved `GROUP-0014` is a virtual rule group, **not** an applied workflow or a rule profile. Its 50 canonical published rule references combine cross-cutting QA, release and compatibility atoms with narrowly scoped MVP acceptance, inauguration and post-maintenance rules. The 27 MVP-specific intake specimens do not imply 27 new catalog entries: four reuse existing canonical definitions after explicit comparison, and 23 add independently defined normative atoms. A project may opt in to individual rules or to the group; none is mandated by the presence of an MVP project.

Prohibited actions remain marked `norm.kind: prohibition` with independently reviewable `norm.bounds`. The case-insensitive name-suffix restriction, YAML job safety constraints and per-modification browser artifact version requirements have separate predicates; their authorization conditions must be checked for actual applicability. Automatic conflict scanning is conservative and does not infer arbitrary natural-language semantic contradictions.

## Explicit project applicability and semantic relation review (rule metadata 1.2)

Optional `scope.project_types` is an independent first-class applicability facet; absence means `["any"]` for legacy rules. A specific project type never overrides task authorization or the rule's other scope facets. The project types `tarium_project`, `rust_project_from_scratch`, `rust_fork_maintenance`, and `c_to_rust_port` are distinct. A rule with `["any"]` overlaps those contexts as a generic rule. A rule with incompatible specific types is disjoint for conflict screening.

Optional `semantic.concept` and `semantic.aliases` annotate a normalized meaning across differently worded rules. Shared declared concepts trigger **candidate** relationship review; equal names and lexical word overlap do not establish semantic identity or legal priority. `tools/relationships.py` proposes possible equivalence, refinement, overlap, or conflict from compatible scopes, predicates and declared concepts, plus lower-confidence descriptive-term matches. It preserves uncertainty and evidence. It is a metadata/lexical heuristic, not a language model or proof of natural-language entailment. No candidate is automatically confirmed or used to rewrite either rule.

Reviewed edges live in `relationships/reviewed.json` with public-safe evidence. They may mark `equivalent`, `refines`, `complements`, `conflicts_with`, or `exceptions_to`. Explicit reviewed edges take precedence over **duplicate candidate display** for that pair only, not over source rule authority. The site displays both reviewed and candidate links per rule. A relationship graph does **not** apply, override, select or export rules; a possible conflict still requires human review, and existing strict norm checks remain separate.

Scope metadata is used for **filtering and review**, not to infer approval to enroll a project in Tarium, release code, create a profile, or perform work in another repository.

## Retrospective domain and project classification (2026-10-22)

The 114 original rules were classified individually without rewriting their normative statements. The evidence and old/new fields are recorded in `audits/legacy-classification-2026-10-22.json`. Domains are controlled subject labels documented in `taxonomy/domains.json` and may co-occur. Topics are narrower, with 54 legacy `development_hygiene` items receiving specific replacements. No domain implies instruction activation.

The independent project hierarchy is `taxonomy/project-types.json`, with `project` and `software_project` parents, `rust_project` and `software_port` subtrees, and distinct browser and Tarium contexts. Multiple inheritance is supported (e.g. C-to-Rust ports descend from both software port and Rust project). **These are not mutually exclusive categories:** a Tarium project may also be a Rust project. Only expressly documented exclusive pairs can prove disjointness in rule analysis. For project filters, a selected concrete type includes rules scoped to that type or its parents, while truly universal `any` rules remain available under All. Filtering does not select or activate rules.

Reviewed relationships and inferential candidate edges continue to be maintained separately. Classification and inheritance do not grant enrollment, editing, release or profile-instantiation permission. Former published rule versions and previous metadata remain inspectable in Git history.

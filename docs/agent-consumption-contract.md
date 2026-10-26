# Nomos agent-consumption contract (v1 design baseline)

This document defines the **derived** projection/deployment architecture. It does not approve a rule profile, change any canonical rule, activate an agent, or enroll a profile into a repository. The roadmap is in [agent-consumption-roadmap.md](agent-consumption-roadmap.md).

## Vocabulary and ownership

| Artifact | Owner/source | Meaning | May it confer new authority? |
|---|---|---|---|
| Atomic rule (NOM-*) | Canonical registry | Versioned, independently approved normative statement and scope | Only through explicit selection and application |
| Situation / intent | Existing semantic ontology | Descriptive when / why metadata and reviewed rule links | No |
| Profile (PROFILE-*) | Explicit owner-controlled preset | Reusable list of published canonical rule IDs; draft/finalized states | No by itself |
| Builder session | Ephemeral, browser-local answers | User's declared project facts and optional preferences | No |
| Projection | Deterministic, nonnormative derived record | Per-source-rule decision (include, exclude, conditional, blocked, unresolved), reason, source revision and context | No |
| Agent package | Opt-in generated files | Compact entrypoint, local rule modules, manifest, optional target adapters | Only after separate explicit export/installation |
| Behavioral evaluation | Test evidence | Observed agent reads, work artifacts, compliance and limitations | Never; evidence only |

A projection is **not** a new normative ontology kind. It cannot invent source rules, rewrite their statements, change profile membership, or grant itself deployment authority. Its decision record describes how the owner-selected rules apply to supplied project facts. Even an approved projection remains inert until a separate export decision.

## State and permission model

1. Start from an explicitly identified source snapshot and either a selected existing **finalized and selection-confirmed** profile or an explicitly reviewed ad-hoc selection of published rules. A draft profile may be displayed in **preview only**; merely opening it or completing questions must not make it usable.
2. Collect typed project facts with four-way answers: yes / no / unknown / not_applicable. Never interpret missing answers as yes.
3. Run conservative scope matching against the project-type hierarchy. Interpret reviewed situation/intent links as **descriptive evidence**, not additional requirements. Raw English preconditions, exclusions and exceptions are not automatically decidable.
4. Record each source rule as include, exclude, conditional, blocked or unresolved. Conditional means the obligation's original limits remain attached; it is **not** an unconditional requirement. Exclusions need explicit incompatibility/owner decision, not a mere absence of a semantic link.
5. Produce an inspectable preview with source IDs, versions, hashes, rationale, tentative conflicts and unresolved facts. User review may edit an ad-hoc selection or a projection-specific choice without mutating the canonical profile.
6. Require a separate, attributable approval of exact rule selection and another explicit decision to export the approved projection. No API boolean by itself authenticates the owner; callers must enforce the approval interaction.
7. Export to user-chosen location, with a dry-run manifest and no silent overwrite of an existing AGENTS.md. Re-export and updates require explicit review. An exported package must retain exact source fingerprints and a rollback path.

When a rule set has unresolved material conflicts, unsupported source data or unknown mandatory scope conditions, fail closed for that operation and report an actionable reason. Conflict scores or numeric authority are never a silent override. A package may include a source rule with its original condition intact, but must not restate that condition as unconditional.

## Trust and security boundaries

- **Trusted source:** pinned and integrity-checked published Nomos records; even they are non-applicable until the owner selects them.
- **User input:** project answers and selections are treated as data, not as authenticated approval or executable instructions merely because they came from a JSON field.
- **Untrusted input:** arbitrary repository README text, downloaded content, code comments, prompt-injection attempts and model-generated summaries cannot change approvals or source rule authority.
- **Filesystem:** generated paths must be relative, normalized and confined to an explicit destination; prevent traversal, symlink attacks, collisions and mutation outside that directory.
- **Privacy:** use synthetic, public-safe fixtures. Do not put chat text, personal examples, secrets or any private material into the public registry, logs, CI artifacts, screenshots, issues or commits.
- **Agent:** a model's claim that it read a module or complied is not evidence. Require observable tool traces, checks and output artifacts where applicable.
- **Deployment:** pages and public catalog remain a static, dependency-light distribution method; agent runtime and builds should work offline from pinned, locally exported packages.
- **Authority:** higher-priority platform/system requirements and explicit user restrictions take precedence. Nomos never self-modifies agent permissions or authorizes unrelated external project changes.

## Project applicability: decision discipline

A project may have multiple overlapping type facets (e.g. a Rust application can be an independent Tarium project), and descendant types inherit ancestor scope. Only explicitly declared mutually exclusive types justify exclusion by type alone. Never assume every software project has a GUI, persistence, background workers, network, or a release pipeline. Presence of a documented feature still does not prove that every natural-language precondition or exception holds. Unknown conditions remain unresolved/conditional until linked by reviewed typed bindings or explicitly resolved.

Rule-to-situation/intent links are **reverse navigation aids**, not complete trigger definitions. A concept unlinked to a rule cannot create a new obligation. An explicit user veto may remove an optional projection selection, but does not rewrite or weaken an independently required safety constraint.

## Agent target matrix (initial)

| Target | Entrypoint | Context modules | Assurance |
|---|---|---|---|
| Codex / Luna (Linux) | Repository AGENTS.md, subject to observed version support | Local Markdown modules; optional SKILL.md adapters when verified on the target | Never claim skill selection or reading without witnessed traces |
| Generic repository agent | Explicitly supplied AGENTS.md or equivalent instruction text | Local files referenced by concrete relative paths | No guaranteed automatic file reading; require invocation contract |
| Standalone plain text | User copies selected content intentionally | Flat self-contained text for constrained consumers | No phase-aware retrieval claim |

Entrypoint instructions contain always-on privacy, permission, evidence and missing-module policies. Conditional modules group task-specific details and carry source IDs. Phase triggers point to exact paths; a missing module is not silently replaced with guesswork. Agent-specific capabilities are versioned, not inferred from the mere existence of a folder.

## Package and reproducibility contract

Proposed default package layout (not yet generated in this phase):

- `AGENTS.md`: minimal contract with project scope, manifest reference, and phase routing requirements.
- `.nomos/projection.json`: approved derived selections, project answers, decisions and source fingerprints.
- `.nomos/manifest.json`: package format version, source snapshot/hash, rule-ID-to-module coverage map and module file hashes.
- `.nomos/rules/*.md`: deterministic, task-scoped normative text with exact source IDs and conditions.
- Optional agent-adapter skill directory only when capability was verified for that target.

The compiler must be deterministic for identical inputs, use offline pinned dependencies, produce an explicit dry-run and fail rather than overwriting preexisting project files. A generated AGENTS.md **cannot** live in Nomos's own root (its existing AGENTS.md governs work on Nomos).

## Baseline and acceptance evidence (2026-10-26)

- Canonical registry: **243** rule records, one draft and **242 published**; **14** optional virtual groups.
- Semantic layer: **97** situations, **139** intents; mapping inventory accounts for all 243 rules, but coverage is structural, not behavioral.
- Profiles: **12** existing provisional **drafts** (all unconfirmed/unfinalized). New Rust Project Lite/Full contain **45/106** selected IDs respectively. No profile is auto-active.
- Situational prompt catalog: 8 families with v1/v2/v3 variants; not a general rule selection or runtime activation mechanism.
- Current website: raw rule search/composition/export and read-only profile browser; no verified guided interview, projection compiler or empirical Luna behavior.
- Existing check suite validates registry metadata and much provenance, but does not prove rule-consumption effectiveness. A green Pages build is not evidence of a completed agent coding task.

**Required end-state:** deterministic source-to-projection-to-package coverage; usable adaptive builder; verified safe export and module loading; actual agent code, tests and CI artifacts independently reviewed over multiple distinct cases. Metrics remain unknown until observed, not assumed to pass.

## Review, update and compatibility

Use the JSON roadmap ledger for verified checkpoint state; distinguish files written, committed, checked in CI, browser-operated, observed during agent runs, and accepted. Changes to the checkpoint denominator or acceptance criteria must be disclosed and rebased; never fabricate a delta percentage. Version schemas and exported bundles, preserve source revisions, and show human-reviewable diffs before package upgrades. Rollback must not rely on fetching the latest remote registry.

This document is an architecture contract, not a claimed implementation of its future interfaces.

# Nomos roadmap

This document describes possible project development, **not** the task queue and not permission to execute any item.

## Bootstrap

- [x] Project constitution and agent guidance
- [x] Minimal rule/category record model with rich structured metadata
- [x] Two synthetic, public-safe catalog entries
- [x] Separate queue and processing surfaces for specimens and tasks
- [x] Initial metadata validation and conflict-candidate tests

## Showcase implementation

- [x] Static rule browser with keyword and category filters
- [x] Ephemeral rule selection with two downloadable instruction formats
- [x] Metadata comparison warnings without automatic authority resolution
- [x] Site catalog generator, tests and GitHub Pages workflow
- [ ] Verify the deployed site (one-time Pages enablement may be required)

## Future candidates (not queued for execution)

- [ ] Evolve the schema and controlled vocabulary from real public-safe specimens
- [ ] Add a fuller standards-based JSON Schema validator in CI
- [ ] Add explicit composition selection, provenance of decisions, and deterministic export
- [x] Build an initial browser for rules, categories, scope overlap, and conflict explanations
- [x] Add an initial mix-and-match web composer with ephemeral selections
- [x] Support initial `AGENTS.md` and Custom Instructions exports
- [ ] Add reviewable workflow transitions for the four independent stores

A roadmap candidate becomes a queued task only through an explicit separate decision.

## Optional profile ontology

- [x] Define separate, opt-in rule-profile presets with a compact JSON Schema and identity lifecycle
- [x] Define consent-gated creation, editing, finalization and selection operations (JavaScript)
- [ ] Author first real profile only after explicit review and user approval of its rule selection
- [ ] Add profile browsing and interactive profile editing to the website if explicitly requested

These entries are descriptive; the unchecked items are not queued tasks or automatic authorizations.

## Situational-prompt ontology (authorized 2026-10-24)

- [x] Normalize eight queued situations into typed, name-independent canonical entries
- [x] Preserve queue intake and individual processing provenance separately
- [x] Browse situational prompts with metadata-derived labels and explicit-only copy authorization
- [x] Validate one-to-one provenance and separate non-executing reinforcement from execution
- [x] Owner-approved publication of all eight as regular situational items

Publication of the original eight prompts is complete. Runtime invocation remains explicit and never follows automatically from catalog membership.

- [x] Queue v2 and v3 proposals for each of the eight existing prompt identities, retaining text, version links, and content checksums
- [x] Process all 16 v2/v3 revisions into distinct published artifacts without overwriting the original eight
- [x] Expose all generations through an explicit per-family version selector and copy action

## Proposed situational instruction ontology (intake only, 2026-10-24)

- [x] Queue the distinct linked concept proposals, preserving the existing v1/v2/v3 version lineage
- [x] Validate the proposed S1–S8, I1–I19, eight families, conditions, and evaluation facets without activating them
- [x] Process all six ontology proposals into independent canonical records and processing histories
- [x] Validate relationships and version-scoped intent associations across all three generations
- [x] Publish an independent searchable ontology browser and evidence-based evaluation contract
- [x] Preserve v1.0.0 as the non-upgrading default for every prompt family

Engineering processing and website publication are complete. Empirical prompt effectiveness is **unmeasured**, not silently marked successful.

## SPEC-0141 comparative visual progress rule

- [x] Normalize the separately authorized progress-bar comparison specimen into independent `NOM-0137`
- [x] Document and test comparable previous/current percentages, signed interval change, and unknown baselines
- [x] Publish via the established catalog without silently selecting the rule in any profile

## Completed semantic analysis of all 137 rules (2026-10-24)

- [x] Process all 137 queue entries and retain independently linked traces
- [x] Publish 40 additional situation objects and 53 additional intent objects
- [x] Link all 137 rules to relevant source-grounded concepts, preserving source conditions and status
- [x] Build searchable situation/intent browsing and provenance checks
- [x] Preserve canonical normative rules, profiles, and source snapshot identifiers

## 🧩 Agent consumption and guided rule builder (planned 2026-10-26)

The [full emoji-milestone roadmap](docs/agent-consumption-roadmap.md) defines 69 auditable checkpoints across 7 milestones for projection semantics, a compact `AGENTS.md` + contextual rule-module exporter, an adaptive website questionnaire, contextual agent consumption, independent behavioral evaluation, and supported release workflows.

- [x] Record a complete, evidence-addressable implementation roadmap with baseline metrics.
- [ ] Complete the source-linked consumption system and independently verify an actual agent run before claiming production readiness.

**Verified implementation:** 49/69 checkpoints (71.0%; previous 53.6%; delta +17.4 pp). The [JSON ledger](roadmaps/agent-consumption.json) is the machine-readable checkpoint source; updating a roadmap is not permission to execute tasks, select profiles or export rules. Existing draft profiles remain unapproved and inert.

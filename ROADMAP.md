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
- [ ] Process queued revisions only after separate authorization

# Nomos agent-consumption and guided-builder roadmap

**Baseline:** 2026-10-26  
**Scope:** a projection-based, opt-in agent-consumption workflow with a guided website builder, deterministic export packages, contextual module retrieval, and behaviorally verified agent execution.  
**Source of truth:** [machine-readable checkpoint ledger](../roadmaps/agent-consumption.json). This roadmap is a readable view of those checkpoints, **not** a task queue, approval to begin arbitrary tasks, rule-profile approval, or agent activation.

## Definition of done (100%)

100% means **all 69 checkpoints** have explicit evidence-backed `done` states and every phase acceptance gate passes. Architectural descriptions, passing static tests, deployed website assets, and live-agent reliability are **different** kinds of evidence. No claim of reliable agent behavior is allowed without observed end-to-end runs. A milestone must not pass if a critical privacy, authorization, conflict, or instruction-loading requirement fails.

### In-scope product contract

1. **Registry:** atomic `NOM-*` rules and their source-reviewed scopes, situation/intent links and relationships stay independent, inert and canonical.
2. **Profile:** an optional preset of rule IDs. Existing provisional drafts remain unconfirmed and unfinalized; a builder session cannot silently approve them.
3. **Projection:** a derived, reproducible **nonnormative** artifact that records an explicitly chosen source selection, project answers, included/excluded/conditional/blocked rule decisions, rationales, versions and hashes.
4. **Package:** opt-in, local, versioned deliverables: small `AGENTS.md` contract, readable rule modules, applicability manifest and optional agent-specific skills. The core contract carries always-on safeguards; on-demand references cover phase-specific details.
5. **Builder:** an adaptive, accessible interview driven by reviewed semantics and actual project context, not a 106-checkbox catalog. It asks a question only when the answer can affect an applicable rule, supports uncertainty, explains decisions and requires explicit confirmation.
6. **Runtime:** rule lookups are prompted by explicit task/phase mappings and verified where possible. Do not assume mere file links guarantee reads or that an agent will remember all rules indefinitely.
7. **Evaluation:** use mechanical and behavioral tests; release claims distinguish generated, tested, installed, executed, and independently verified states.

### Constraints and non-goals

- Do not change normative meaning to make the compiler or UI convenient; propose any truly missing rule through the existing separate specimen workflow.
- Do not treat a situation/intent match as a permission to add unrelated rules. Unknown project facts stay unknown; conflict detection stays conservative.
- Never infer permission to instantiate, confirm or finalize a profile or to export or install its instructions from reading the catalog or completing a questionnaire.
- No automatic background updates, agent-installed global instructions, credentials, user conversations, nonpublic fixtures, paid dependencies or mandatory hosted backend.
- Preserve existing AGENTS.md and external project files unless the user explicitly authorizes the proposed changes; never overwrite without inspection.
- Initial production gate targets new Rust projects with Codex/Luna and a generic portable fallback; the architecture must remain extendable to the other existing profile families without claiming their empirical validation.

## Measured progress

**Implementation:** **49/69 verified checkpoints = 71.0%**. **Previous:** 53.6%. **Current:** 71.0%. **Delta:** +17.4 percentage points. Guided review, version diffs, installed-package integrity, synthetic acceptance, adversarial safeguards and real Chromium browser smoke tests passed [CI 40399342237](https://github.com/sguzman/nomos/actions/runs/40399342237). Actual Luna coding behavior remains unmeasured.

`completion_percent = 100 × done_checkpoints / 69`; phase progress uses its own exact denominator. Use unrounded fractions as the source for arithmetic, display one decimal place, and compare only the same roadmap revision and acceptance denominator. A changed denominator must be disclosed and prior/current percentages marked non-comparable until rebased. Every change to `done` needs a concrete evidence link (file, commit, CI run, test fixture, or witnessed agent run); moving `done` back to `planned` is valid when evidence fails.

| Phase | Outcome | Checkpoints | Done | Progress | Dependencies |
|---|---|---:|---:|---:|---|
| 🧭 ARC | Consumption architecture and governance | 8 | 8 | 100.0% | None |
| 🧬 PRJ | Projection ontology and resolver | 11 | 11 | 100.0% | ARC |
| 📦 PKG | Deterministic agent-package compiler | 10 | 10 | 100.0% | PRJ |
| 🗣️ BLD | Guided website rule builder | 12 | 9 | 75.0% | PRJ, PKG |
| 🔌 RUN | Agent integration and contextual retrieval | 8 | 5 | 62.5% | PKG |
| 🧪 EVAL | Behavioral evaluation and production gates | 12 | 4 | 33.3% | BLD, RUN |
| 🚀 REL | Delivery, documentation and maintenance | 8 | 2 | 25.0% | BLD, RUN, EVAL |
| **Total** | **All gates must pass** | **69** | **49** | **71.0%** | |

## 🧭 ARC · Consumption architecture and governance

**Deliverable:** A stable, reviewable contract separates the registry, approved selections, derived projections, execution packages, and evaluations.

**Completion gate:** The contract names every transition and approval boundary; static examples show how a Rust project reaches an inert projection without activating a draft.

- [x] **ARC-01 — Vocabulary and artifact boundaries.** Define catalog rule, profile, builder session, projection, agent package, module, and evaluation distinctly.
- [x] **ARC-02 — Projection lifecycle.** Specify proposed, reviewed, compiled, exported, superseded and invalid states without giving projections independent normative authority.
- [x] **ARC-03 — Existing approval integration.** Map profile draft, selection confirmation, finalization, and explicit export to the current PROFILE_WORKFLOW without bypasses.
- [x] **ARC-04 — Threat and trust boundaries.** Specify trusted rule sources, untrusted project files, privacy boundaries, and authority precedence.
- [x] **ARC-05 — Target capability matrix.** Describe Codex AGENTS.md, optional Skills, and fallback plain agent targets as explicit capability variants.
- [x] **ARC-06 — Offline consumption contract.** Specify reproducible local output from pinned public catalog inputs without paid services, accounts, or runtime network requirements.
- [x] **ARC-07 — Roadmap ledger integrity.** Validate checkpoint IDs, statuses, evidence links, gate rules, and reproducible completion percentages.
- [x] **ARC-08 — Baseline corpus and success criteria.** Record the existing 12 profiles, published-versus-draft status, source mapping inventory, and no-empirical-evidence baseline.

## 🧬 PRJ · Projection ontology and resolver

**Deliverable:** A deterministic, reviewable semantic projection resolves an explicitly selected profile or rule set against project context.

**Completion gate:** Fixtures prove the same source snapshot and answers produce identical decisions; unknowns/conflicts cannot silently become active obligations.

- [x] **PRJ-01 — Projection JSON Schema.** Define a strictly validated, versioned nonnormative projection record with context, decisions, provenance and export state.
- [x] **PRJ-02 — Project-context answer schema.** Model project type, work modes, audience, distribution, interface, persistence, concurrency, and unknown or not-applicable answers without presuming features.
- [x] **PRJ-03 — Pinned source provenance.** Bind each selected rule to stable ID, version, status, source hash, and registry revision.
- [x] **PRJ-04 — Explicit selection prerequisite.** Reject silent profile instantiation, automatic selection, unpublished rules, and unconfirmed draft activation.
- [x] **PRJ-05 — Applicability evaluator.** Combine existing project-type hierarchy and per-rule scope/predicate data with actual project answers.
- [x] **PRJ-06 — Situation and intent alignment.** Use reviewed situation/intent links as contextual evidence, not as extra instructions or automatic new rules.
- [x] **PRJ-07 — Decision and explanation matrix.** Produce stable selected, excluded, conditional, blocked and unresolved records with per-rule rationale and source IDs.
- [x] **PRJ-08 — Conditional obligation policy.** Keep feature-specific obligations dormant until supported by affirmative applicable facts; handle unknown answers explicitly.
- [x] **PRJ-09 — Conflict and precedence review.** Reuse the conservative reasoning engine; distinguish candidate conflicts, disjointness, exceptions and unresolved collisions.
- [x] **PRJ-10 — Override and recomposition semantics.** Support explicit owner edits, vetoes, answer changes, deterministic diffs and no hidden rule insertion.
- [x] **PRJ-11 — Resolver fixtures and adversarial tests.** Verify privacy, draft gating, empty inputs, contradictory answers, unsupported scope, stable ordering, and unknowns.

## 📦 PKG · Deterministic agent-package compiler

**Deliverable:** An approved projection becomes a small core contract plus inspectable conditional modules and a manifest.

**Completion gate:** Two exports of the same approved projection are byte-identical; a validator proves complete applicable-rule coverage and no hidden activation.

- [x] **PKG-01 — Compiler API and offline command.** Provide a documented local compiler consuming an approved projection and an explicit target variant.
- [x] **PKG-02 — Compact AGENTS.md template.** Keep always-on safety, authority, phase triggers, compliance duties and reference instructions short and unambiguous.
- [x] **PKG-03 — Rule module partitioning.** Generate context-scoped engineering, testing, CI, data, GUI, release and governance modules without dropping source IDs.
- [x] **PKG-04 — Manifest and activation map.** Emit machine-readable paths, hashes, rule IDs, phase triggers, source versions and mandatory-versus-conditional flags.
- [x] **PKG-05 — Complete coverage verifier.** Prove every applicable selected rule is represented once, with unresolved rules identified rather than silently omitted.
- [x] **PKG-06 — Codex Skill adapters.** Generate valid task-oriented SKILL.md wrappers and supporting references only for supported agent targets.
- [x] **PKG-07 — Generic agent fallback.** Generate standalone Markdown modules when agent-specific skill loading is unavailable.
- [x] **PKG-08 — Read-on-demand behavior contract.** Define when the entrypoint must load a module, how it confirms loading, and what to do if the reference is missing.
- [x] **PKG-09 — Safe filesystem export.** Use dry-run previews, explicit destination choice, deterministic names, and non-destructive refusal on collisions or unrelated AGENTS.md content.
- [x] **PKG-10 — Golden file and round-trip tests.** Test stable output bytes, link validity, normalized paths, fingerprint drift, Unicode, and no private metadata leakage.

## 🗣️ BLD · Guided website rule builder

**Deliverable:** Someone unfamiliar with canonical rule IDs can configure an agent through a short, adaptive, accessible interview.

**Completion gate:** A first-time user can finish a New Rust Project projection without browsing 106 rules; no action silently confirms a draft or exports to a repo.

- [x] **BLD-01 — Builder navigation and start state.** Add a clear guided entry distinct from the advanced raw-rule catalog.
- [x] **BLD-02 — Intent and project-type intake.** Ask what the user is making and whether they start, port, or maintain; avoid assuming a specific project kind.
- [x] **BLD-03 — Question-definition model.** Represent prompts, descriptions, answer choices, dependencies, source mappings, and explainability in structured data.
- [x] **BLD-04 — Situation-driven question generation.** Derive relevant questions from reviewed project scope and situation/intent mappings; allow authored disambiguation only when necessary.
- [x] **BLD-05 — Adaptive branching and skipping.** Ask only questions that can change applicable-rule decisions and show why a branch was skipped.
- [x] **BLD-06 — Yes, no, unsure and not-applicable states.** Retain unanswered and unknown facts without coercing affirmative selections.
- [x] **BLD-07 — Selection rationale preview.** Show included, excluded, conditional and blocked rules with source IDs and plain-language explanations.
- [x] **BLD-08 — Review, override and veto controls.** Let users adjust optional selections, supply project facts, and inspect changes before confirmation.
- [ ] **BLD-09 — Conflict-resolution dialogue.** Present opposing norms and material uncertainty without silent priority-based resolution.
- [ ] **BLD-10 — Explicit approval transitions.** Distinguish preview, proposal, owner-confirmed selection, profile finalization, projection confirmation and export.
- [x] **BLD-11 — Accessible responsive flow.** Test keyboard-only navigation, visible focus, readable labels, mobile layout, error recovery and progress/resume within session.
- [ ] **BLD-12 — Private static export and browser QA.** Build without accounts or hidden persistence; test real browsers and downloaded agent package validation.

## 🔌 RUN · Agent integration and contextual retrieval

**Deliverable:** An agent can locate authoritative modules at task boundaries and recover safely when context or references change.

**Completion gate:** Harness tests demonstrate critical rules were consulted at the intended points or the run explicitly reports a blocking gap.

- [ ] **RUN-01 — Agent bootstrap verification.** Document exactly which entrypoint files are automatically read versus only referenced for each target.
- [x] **RUN-02 — Phase-triggered module routing.** Map planning, implementation, review, CI, release and shutdown events to required reference modules.
- [x] **RUN-03 — Mandatory instruction preservation.** Ensure always-on constraints, especially privacy and permission boundaries, do not depend on optional contextual skill discovery.
- [x] **RUN-04 — Rule-refresh protocol.** Specify explicit reload or recheck on phase transition and stale hashes rather than assuming model memory refresh.
- [x] **RUN-05 — Missing or inaccessible module policy.** Fail clearly, request authorized recovery or restrict the affected action rather than improvise instructions.
- [ ] **RUN-06 — Existing repository coexistence.** Do not clobber preexisting project instructions; surface actual scope or hierarchy conflicts for review.
- [x] **RUN-07 — Version pinning and updates.** Make upgrades explicit and produce inspectable old-versus-new module and rule diffs.
- [ ] **RUN-08 — Target compatibility probes.** Test the supported Codex configuration and a generic fallback against observable file-loading traces.

## 🧪 EVAL · Behavioral evaluation and production gates

**Deliverable:** Behavioral claims are backed by actual observable agent work rather than structural coverage or CI alone.

**Completion gate:** Three distinct recorded real agent runs plus independent evaluation satisfy all mandatory criteria; failures are corrected and re-tested without hiding them.

- [x] **EVAL-01 — Evaluation rubric and severity.** Separate mandatory invariant violations from minor formatting differences and assign clear pass/fail conditions.
- [x] **EVAL-02 — Golden projection fixture suite.** Cover CLI-only, GUI/persistence and mixed-scope Rust scenarios, including deliberate no/unsure answers.
- [x] **EVAL-03 — Negative and adversarial scenarios.** Test unapproved draft, unsupported agent, conflicting rule, prompt injection, stale reference, and path-collision failure.
- [ ] **EVAL-04 — Mechanical compilation gate.** Run schema, hashes, full coverage, exported link and deterministic-byte validation on every relevant change.
- [ ] **EVAL-05 — Browser builder interaction suite.** Automate adaptive branching, undo, keyboard, responsive layout, conflict handling and explicit approval transitions.
- [x] **EVAL-06 — Offline installation and round trip.** Export the package to a disposable target and prove it remains usable without the Nomos website.
- [ ] **EVAL-07 — Agent-read evidence harness.** Capture module reads, applicable trigger fulfillment and tool outputs without treating text claims as evidence.
- [ ] **EVAL-08 — Rust task end-to-end case.** Run a new Rust implementation with builds, automated tests, CI configuration, commits and verifiable handoff.
- [ ] **EVAL-09 — Alternate lifecycle case.** Run a different Rust workflow that exercises persistence or GUI, regression recovery and release preparation.
- [ ] **EVAL-10 — Independent conformance review.** Score actual repo diffs and execution traces against expected source-rule obligations.
- [ ] **EVAL-11 — Repeated Luna evaluation.** Perform at least three recorded runs across distinct scopes with no uncorrected mandatory violations and disclose variance.
- [ ] **EVAL-12 — Production acceptance decision.** Publish evidence-backed pass/fail, residual limits, re-test after fixes and explicit readiness classification.

## 🚀 REL · Delivery, documentation and maintenance

**Deliverable:** A versioned, tested builder and exporter can be adopted without browsing hundreds of rules or relying on live hosted services.

**Completion gate:** A documented release is reproducible; onboarding reaches a working package, CI is green and limitations remain visible.

- [x] **REL-01 — Public-facing quickstart.** Explain the guided interview and local-agent installation without requiring readers to understand the ontology first.
- [x] **REL-02 — Advanced reference documentation.** Document projection schema, provenance, trust boundaries, module routing, approval policy and compatibility.
- [ ] **REL-03 — Builder deployment checks.** Verify GitHub Pages build, downloadable assets, cache/fingerprint behavior and a deployed end-user walkthrough.
- [ ] **REL-04 — Validation and release CI.** Run projection, compiler, site, compatibility and privacy tests on pushes and before a release.
- [ ] **REL-05 — Backward-compatibility policy.** Specify projection/package schema versioning, migration and safe refusal for unsupported versions.
- [ ] **REL-06 — Change and rollback documentation.** Preserve generated package identity, update diffs, rollback steps and reproducible source snapshots.
- [ ] **REL-07 — Release notes and evidence ledger.** Publish tests, supported agent variants, known limitations and real-run evidence without overstating QA.
- [ ] **REL-08 — Final 100-percent closure audit.** Confirm every checkpoint has linked evidence and all milestone gates hold; correct any unjustified completion claims.

## Dependency and acceptance sequence

`ARC → PRJ → PKG → RUN`. `BLD` depends on `PRJ + PKG`. `EVAL` depends on `BLD + RUN`. `REL` is gated by `BLD + RUN + EVAL`. Parallel work is allowed where dependencies are satisfied; final completion is not.

## Reporting contract for each development round

Report a short progress table or bars for affected phases and the whole initiative: **previous verified % → current verified % (signed delta in percentage points)**, exact completed/total counts, new evidence links, failed/blocked gates, changed denominator if any, and genuine owner decisions required to proceed. Status labels distinguish **planned, authored, committed, statically validated, CI-verified, browser-verified, live-agent-verified and accepted**; only evidence-backed accepted checkpoints count as done. Do not inflate progress for discussion, activity, or repeated reporting.

## Approval and ownership boundary

This is a public, source-neutral design roadmap authorized for planning. The existing four stores (`queues/specimens`, `processing/specimens`, `queues/tasks`, `processing/tasks`) and the profile opt-in lifecycle remain separate. Roadmap publication is not task-queue enrollment and cannot be used by an agent to grant itself additional authority. No existing profile is approved, finalized, selected, exported or applied by this roadmap.

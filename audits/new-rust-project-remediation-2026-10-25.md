# New Rust Project from Scratch coverage remediation (2026-10-25)

This is the owner-authorized examination and remediation of the two *new Rust project from scratch* profile drafts. It does not instantiate a separate software project, start any build, or activate rules.

## Existing coverage retained

The original Full profile had 90 rules, covering Rust compilation and linting, unit/integration/regression testing, CI workflows, release controls, roadmap governance, real MVP usability and owner acceptance. Those norms remain intact, with their original meanings. No new rules duplicate them.

Three existing, separately approved general rules were also selected instead of copied: NOM-0135 (clear user-action requirements), NOM-0136 (approachable README separated from change history) and NOM-0137 (previous/current/delta progress reporting). Lite selects the first two.

## Verified-gap normalization

13 new, individually scoped rules (NOM-0223–0235) cover early accepted requirements and exclusions; architecture and state ownership; reproducible Rust toolchain and target metadata; dependency need/license/maintenance review; recoverable errors; runtime configuration semantics; interruption-safe persisted writes; untrusted input boundaries; orderly shutdown; measured resource requirements; task lifecycle; keyboard-accessible GUI operation; and privacy-safe diagnostics.

Obligations apply only when corresponding project features or accepted behaviors are relevant. A simple CLI, library, website, long-running daemon or GUI is not presumed to need all other kinds of application functionality.

All 13 are source-linked to 13 independent review queues, processing traces and rule mappings, with a separately verified crosswalk. Nine new situations (SITU-0081–0089) and 13 new intents (INTENT-0119–0131) describe their triggers and outcomes.

## Revised descriptive companions

| Profile | Prior rules | Current rules | Situations | Intents | State |
| --- | ---: | ---: | ---: | ---: | --- |
| New Rust Project Lite (PROFILE-0003) | 35 | 45 | 25 | 33 | Unconfirmed draft |
| New Rust Project Full (PROFILE-0004) | 90 | 106 | 39 | 55 | Unconfirmed draft |

No C, C++, Python, fork or Tarium profile has been changed. Earlier rule-analysis and strict-port source history remain unchanged.

Source audit: [coverage analysis](new-rust-project-coverage-2026-10-25.json). Selection evidence: [remediation manifest](new-rust-project-remediation-manifest-2026-10-25.json).

## Acceptance boundary

This verifies coverage of the reviewed reusable *profile* obligations, not correctness or empirical completeness of any particular Rust application. Its runtime acceptance is separately governed by source-project targets, executed tests and user acceptance. Neither draft is finalized, explicitly selection-confirmed, or automatically exported.

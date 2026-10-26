# Agent consumption v1: evidence and readiness record

**Recorded:** 2026-10-26  
**Current classification:** **Engineering preview; not production-accepted for autonomous Luna/Codex use.**  
**Scope:** projection resolver, guided website intake, deterministic package compilation, contextual rule references, and evaluation evidence. This is a project-status document, not authorization to finalize a profile or deploy an agent.

## Capability matrix

| Capability | Implemented artifact | Verification level | Current limitation |
| --- | --- | --- | --- |
| Canonical source / projection | `tools/projections.cjs`, pinned registry and rule fingerprints, JSON Schemas | Automated deterministic and adversarial tests | Approval provenance still requires a distinct owner action |
| Guided interview | `docs/rule-builder.html`, `docs/builder-logic.js` | Node unit tests and real headless Chromium interaction | Browser exports an **unapproved** draft, not installable instructions |
| Target instruction package | `tools/agent_package.cjs`, `AGENTS.md`, local source modules, `.nomos/manifest.json` | Byte-integrity and package coverage tests | Neither generated target has passed a live GPT-6 Luna coding task |
| Contextual reading | `tools/agent_phase_reader.cjs`, bundled `.nomos/read-phase.cjs` | Actual CLI execution in synthetic, disposable test directories, with verified read receipts | No measured autonomous Codex phase selection or instructions-compliance trace |
| Model compatibility | Codex-targeted optional Skills plus a generic Markdown fallback | Generated files and phase-routing validated with Node integration tests | Skill discovery / model understanding / autonomous project behavior not empirically established |
| Evaluation | `tools/validate_agent_run_evidence.cjs`, public-safe schema and conformance rubric | Mechanical evidence-schema tests, negative and adversarial cases | **0 accepted independent, live Luna end-to-end runs** |
| Public website | GitHub Pages with site/catalog smoke checks and interactive Chromium workflow | CI evidence as linked in roadmap; deploy status must be checked per revision | Static-site usability is not evidence of agent reliability |

## Actual evidence versus required production evidence

**Available:** source hashes; selected-rule manifests; deterministic generation checks; opt-in export refusal tests; filesystem/symlink checks; browser clicks, keyboard and responsive behavior in CI; local CLI module read receipts; and coverage validation for synthetic Rust profiles.

**Missing:** a captured Luna/Codex CLI session showing actual project bootstrapping, correct phase-reader/module loading, autonomous Rust implementation, compiler/test/CI output, actual git commits and error recovery; a different GUI or persistence scenario; and a third independent, distinct scope with external review of all applicable obligations.

The existing acceptance requirement is **three independently recorded, distinct real-agent runs**, zero unresolved critical/major rule violations, supported tool/read traces, and verified target behavior. A textual description, hypothetical transcript, synthetic fixture or green Nomos Pages build must not count as a live run. No such run has been accepted.

## Profile and deployment controls

All 12 preexisting rule profiles remain draft/unconfirmed and inert. The New Rust Project Lite/Full configurations are useful reference selections, but their 45/106 source rules do **not** automatically confer project-level instructions or user permission. The guided website stops at a reviewable JSON draft, with exact rule IDs, candidate omissions/additions, unknown answers and potential conflicts.

The opt-in compiler requires a separately reviewed and approved source selection and projection; the installer inspects the explicit destination, refuses existing files and symbolic-link collisions, and never silently overwrites an `AGENTS.md`. The package contains a self-checking reader that refuses stale manifests and source modules. None of those mechanics prove the receiving agent's compliance.

## Next acceptance gates

1. Verify the current GitHub Pages revision via the automated deployed-site Chromium walkthrough, not merely local HTML assets.
2. Witness and record target-specific entrypoint / phase-reader behavior for the actual supported Luna/Codex build, including the generic fallback.
3. Run the three planned distinct Rust coding scenarios with reproducible source/target versions, offline module-read receipts and real build/test outputs.
4. Have an independent evaluator inspect actual tool traces and repository diffs for every applicable rule; fail any missing or contradictory mandatory behavior.
5. Publish the measured pass/fail verdict and limitations, reconcile the 69-checkpoint ledger, and only then declare a scoped production release.

These are explicit conditions, not a request that the owner manually QA hundreds of rules. They must be automated and evidenced by the executing agent or a separate reviewer. There is currently no justified 100% or production-readiness claim.

## References

- [Agent consumption roadmap](agent-consumption-roadmap.md)
- [Target loading and contextual verification](agent-target-loading.md)
- [Upgrade and rollback compatibility](agent-package-compatibility.md)
- [Conformance and acceptance rubric](agent-consumption-evaluation.md)
- [Guided rule builder](rule-builder.html)
- [Automated CI history](https://github.com/sguzman/nomos/actions/workflows/pages.yml)

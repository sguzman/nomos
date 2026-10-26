# Agent-consumption delivery and evidence record

**Scope:** the optional Nomos projection compiler, guided builder and agent package tooling.  
**Classification:** engineering preview / production behavior **not accepted** as of 2026-10-26.  
**No profile activation:** all 12 published profile records in this source snapshot are provisional, unconfirmed drafts. No rule is selected for another project merely by catalog membership or by opening the builder.

## Shipped, mechanically testable capabilities

| Deliverable | Verification | Limitation |
| --- | --- | --- |
| Nonnormative projection with typed project facts and source fingerprints | [Projection unit suite](../tests/test_projections.cjs), CI | No automatic owner authorization; unknown applicability remains conditional/unresolved |
| Deterministic compact `AGENTS.md` + source-linked modules and manifest | [Package tests](../tests/test_agent_package.cjs) | No guarantee that an unknown agent reads or obeys the instructions |
| Offline verifier, explicit phase reader and source identity checks | [Runtime tool tests](../tests/test_agent_phase_reader.cjs), [offline verifier](../tools/agent_package_verify.cjs) | Tool-read receipts do not prove model comprehension |
| Opt-in nonclobbering installation and package differences | [Package tests](../tests/test_agent_package.cjs), [diff tests](../tests/test_agent_package_diff.cjs) | No automatic in-place upgrade; owner must approve installation and rollback |
| Guided Rust questionnaire with source-linked candidate reasoning and visible approval stages | [Builder unit tests](../tests/test_rule_builder.cjs), [headless Chromium interaction test](../tests/test_rule_builder_browser.cjs) | The public static builder exports an **unapproved draft only**, not a production AGENTS.md |
| Evidence completeness and critical failure classification | [Trace validator](../tools/validate_agent_run_evidence.cjs), [synthetic tests](../tests/test_agent_run_evidence.cjs) | The public fixtures are explicitly synthetic, not observed Luna performance |

### Reproducible evidence entrypoints

- [Nomos main validation workflow](../.github/workflows/pages.yml) runs on main pushes, version-tag pushes and published releases. It verifies registry/profiles, deterministic packages, selected rule coverage, browser behavior and trace record structure.
- [CI run 40401165989](https://github.com/sguzman/nomos/actions/runs/40401165989): complete package, rule and phase evidence tests passed.
- [CI run 40402104446](https://github.com/sguzman/nomos/actions/runs/40402104446): guided-builder approval-state and browser workflow checks passed.
- [CI run 40402665866](https://github.com/sguzman/nomos/actions/runs/40402665866): full browser conflict review regression passed.
- The deployed-site smoke check is required by CI; a green deploy job with its final smoke step is needed before asserting the *public website* is currently accessible. A historical green build alone is not that assertion.

These links are pinned evidence of repository checks, not a reliability percentage for an autonomous agent.

## Supported vs unverified targets

**Mechanically generated and tested:** `generic` and `codex` agent-package variants, including optional Codex Skills and exact phase-module references.  
**Not yet independently observed:** automatic `AGENTS.md` discovery, Skill selection, phase-reader invocation, code implementation quality, and adherence to project-specific rules by the user's desired GPT-6 Luna setup. The latter requires a separately authorized actual target run and read/tool traces.

See [agent entrypoint loading](agent-target-loading.md) for where automatic loading ends and explicit reference reading begins.

## Production-acceptance blockers

1. An independently observable new-Rust CLI Luna run with committed code, builds, tests, CI configuration and rule-by-rule evidence.
2. A separate nontrivial Rust GUI/persistence lifecycle run with actual target behavior and appropriate regression/release checks.
3. At least three distinct recorded real-agent executions with module-read traces, independent conformance review and zero unresolved major/critical violations.
4. A transparent production verdict that distinguishes satisfied, violated, not-applicable and unobserved requirements, and includes corrected reruns when needed.

An invented or illustrative transcript, generated AGENTS.md, passed local unit suite, model summary or successful static website deployment cannot close these gates.

## Upgrade, privacy and rollback

Installation is opt-in and collision-safe; the compiler refuses existing agent files and symbolic links. Source rule fingerprints, registry digest, projection digest and file hashes identify a package version. Verify each candidate and compare it to the previous pinned package before separate approval. Keep a complete verified previous package in a separate location so rollback never requires guessing from the latest catalog. See [compatibility and rollback](agent-package-compatibility.md).

Only source-neutral synthetic fixtures and public-safe build metadata belong in this public repository. Do not publish user conversations, credentials, private project logs, personal data or raw agent transcripts in tests, issues, docs or release notes.

**Conclusion:** Nomos now has a reusable, auditable *engineering preview* of agent instruction delivery. Its effectiveness with an actual Luna agent is still **unmeasured**. The release/production status must be updated only from separately verified empirical evidence and authorized decisions.

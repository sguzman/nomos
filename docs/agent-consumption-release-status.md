# Agent consumption v1: evidence and readiness record

**Recorded:** 2026-10-26  
**Current classification:** **Engineering preview; not production-accepted for autonomous Luna/Codex use.**  
**Scope:** projection resolver, guided website intake, deterministic package compilation, contextual rule references, and evaluation evidence. This is a project-status document, not authorization to finalize a profile or deploy an agent.

## Capability matrix

| Capability | Implemented artifact | Verification level | Current limitation |
| --- | --- | --- | --- |
| Canonical source / projection | `tools/projections.cjs`, pinned registry and rule fingerprints, JSON Schemas | Automated deterministic and adversarial tests | Approval provenance still requires a distinct owner action |
| Guided interview | `docs/rule-builder.html`, `docs/builder-logic.js` | Node unit tests and real headless Chromium interaction | Browser exports an **unapproved** draft, not installable instructions |
| Target instruction package | `tools/agent_package.cjs`, `AGENTS.md`, local source modules, `.nomos/manifest.json` | Byte-integrity tests and six local Codex CLI attempts, four mechanically complete | No independently accepted Codex run; generic-agent target remains unverified live |
| Contextual reading | `tools/agent_phase_reader.cjs`, bundled `.nomos/read-phase.cjs` | Synthetic CLI tests plus six phase-reader receipts in the mechanically complete Rust probe | Verified reading is not proof of obeying the selected rules; generic fallback not observed |
| Model compatibility | Codex-targeted optional Skills plus a generic Markdown fallback | Generated files and phase-routing validated with Node integration tests | Skill discovery / model understanding / autonomous project behavior not empirically established |
| Evaluation | `tools/validate_agent_run_evidence.cjs`, disposable Rust runner, conformance rubric | Six genuine `RUST-CLI` attempts; first two lacked commits; later four passed the mechanical gate, but no independent conformance review accepted a run | **0 independently accepted end-to-end runs** |
| Public website | GitHub Pages with site/catalog smoke checks and interactive Chromium workflow | CI evidence as linked in roadmap; deploy status must be checked per revision | Static-site usability is not evidence of agent reliability |

## Actual evidence versus required production evidence

**Available:** source hashes; selected-rule manifests; deterministic generation checks; opt-in export refusal tests; filesystem/symlink checks; browser clicks, keyboard and responsive behavior in CI; local CLI module read receipts; and coverage validation for synthetic Rust profiles.

**Missing:** a complete, independently accepted Luna/Codex run with actual agent-created Git commits, clean worktree, verified end-to-end instructions compliance and full per-rule review; an alternate GUI/persistence run; a third distinct run; and independent assessment of the recorded code and tool traces.

The existing acceptance requirement is **three independently recorded, distinct real-agent runs**, zero unresolved critical/major rule violations, supported tool/read traces, and verified target behavior. A textual description, hypothetical transcript, synthetic fixture or green Nomos Pages build must not count as a live run. No such run has been accepted.

## First observed live Rust CLI probe (2026-10-26, not accepted)

A user-supplied, private local review bundle contained Rust CLI sources and a machine-observation summary from one Codex CLI 0.163.0 test. It showed five successful `read-phase` receipts across **planning, implementation, testing, review, shutdown**, a final successful Cargo test, and three unit plus three integration tests. Two earlier in-agent test commands had failed before a later test command succeeded. The projected selection contained 90 source-rule IDs in this local snapshot and 89 installed rules; that snapshot does not replace the generated public catalog's independently reviewed 106-member New Rust Full draft.

**Blocking failure:** no recognized agent-created commit event was present; the recorded Git log was consistent with only the original disposable baseline commit and the Git worktree status was nonempty. An agent turn completing with exit code zero is not equivalent to accomplishing its Git/QA requirements. All 89 source-rule dispositions remain unobserved by the mechanical validator; independent review of the full raw transcript and exact Git diff was not included in the shareable bundle.

The raw trace, private paths and any full conversation outputs stay outside the public repository. The current scoped verdict for this trial is **incomplete / not accepted**, not a production readiness claim. The disposable runner now checks commit count against the baseline, worktree cleanliness and post-run Cargo status separately from model turn completion.

## Third live Rust CLI probe: mechanically complete, conformance not accepted (2026-10-26)

The user-executed Codex CLI 0.163.0 run with the corrected disposable sandbox reported **one agent-created commit**, a clean working tree, successful offline Cargo tests, and six successful phase-read receipts spanning planning, implementation, testing, review and shutdown. The runner correctly assigned `awaiting_independent_review` rather than claiming production acceptance.

A subsequent limited independent review of the user-provided source and observation archive verified all **24 generated package-file hashes** and **89 installed-rule references**, and reproduced the package's offline verifier. The Rust CLI source implements Unicode trimming and repeated ASCII-space collapse, rejects missing/extra/empty input, and includes **3 unit and 4 integration tests**. The recorded run reports the Cargo tests passed. The original archive excludes `.git` and raw Codex commands, so the exact commit contents, full formatting/lint history and any assertions beyond reported tool-event evidence could not be independently replayed.

**Unresolved substantive findings:**
- `NOM-0010`: The new-from-scratch Rust project contains no roadmap with phases, milestones and stable emoji IDs, despite that source rule's creation condition.
- `NOM-0042`: The user-facing CLI project contains no README documenting purpose, build/setup and usage.
- `NOM-0024` / `NOM-0025`: Rust formatting and Clippy checks have not been independently established from the limited evidence; absence of those logs is **unknown**, not proof a command was never attempted.
- `EVAL-08` case-design gap: its acceptance criterion includes CI configuration, but the current `RUST-CLI` task did not require a CI workflow. Treat this as a harness/scenario defect, not as an unprompted agent violation.

A separate limited per-rule review of this archive classified **15 source obligations as supported by the available artifact/report evidence, 2 violated, 46 outside the scoped run's conditions, and 26 unobserved**. These classifications are **not** a validated production agent-compliance report: the machine observer intentionally leaves all 89 rule assessments unobserved pending complete independent evidence. The review's full private artifact, raw logs, generated context and user machine paths must not be published to this repository. At least two substantive compliance findings remain unresolved; this run is **not accepted**. The accepted roadmap remains at **62/69 (89.9%)**.



## Fourth Rust CLI probe: successful mechanics, independent conformance rejected (2026-10-27)

A subsequent local Codex CLI 0.163.0 run produced a fresh agent-created commit and a clean disposable worktree. The private review package contained the actual source patch, a recorded JSONL command trace, post-run Cargo output, and a pinned package manifest. The reviewer independently verified the archive hash, all 24 installed package-file digests, all 89 selected rule references, and five phase-read receipts for planning, implementation, testing, review, and shutdown. The generated Rust project passed three unit and three integration tests; offline formatting and Clippy checks succeeded; the new README and offline GitHub Actions CI workflow were present. The CI workflow was **configured, not observed running on GitHub**.

**Independent verdict: not accepted.** The selected `NOM-0010` source rule applies explicitly when creating a project from scratch. The planning-phase command demonstrably loaded it, but the committed project still contained no source-required roadmap with phases, milestones, subtasks, features and stable emoji identities. The reviewer also found incomplete conformance review and handoff under `NOM-0064`, `NOM-0066`, and `NOM-0067`, because the agent finalized without identifying the missing obligation. An independent file-by-file and trace review classified the 89 installed rules as **35 satisfied, 4 violated, 46 not applicable, 4 unobserved** for this bounded exercise. These are **reviewer classifications**, not the machine observer's independent automated pass; conditional applicability remains uncertain for the unobserved set. No generic-target run is evidenced.

This trial shows why observed module reads, commits, passing Cargo checks and a functioning CI definition cannot substitute for source-rule conformance. The generated agent contract and disposable runner were subsequently strengthened to require an explicit active-rule deliverable checklist and to classify known missing artifacts as `requires_artifact_remediation` rather than presenting the run as merely awaiting review. The changes do not retroactively accept this failed run, guarantee future Codex compliance, or authorize any profile activation. The production completion ledger remains **62/69 (89.9%)**. No private raw transcript, private review archive, machine pathname, or full user data is published here.

## Fifth Rust CLI probe: artifact remediation still required (2026-10-27)

A later user-executed Codex CLI 0.163.0 run used the strengthened generated checklist but still omitted the source-required project roadmap. The user-provided runner JSON reported one agent-created commit, clean worktree, offline Cargo tests, format and Clippy passing, README and CI files present, six phase-read receipts (including CI), and **`requires_artifact_remediation`** with `missing_roadmap`. The runner did **not** claim independent acceptance. The subsequent private archive independently verified the 24 generated package hashes and 89 rule references; the source patch and recorded tool trace show three Rust unit tests and four integration tests passing, with offline formatting and Clippy checks successful. Critically, the phase reader supplied `NOM-0010` in planning, but the agent treated the pre-initialized Cargo skeleton as an incremental CLI bootstrap and incorrectly deemed the new-project roadmap rule inapplicable. No full independent disposition of every source rule or accepted production run is claimed for this trial.

The discrepancy between the explicitly pinned `rust_project_from_scratch` context and the harness-provisioned Cargo starter files also led to an explicit project-fact clarification in the disposable evaluation prompt; this states that the starter files are scaffolding, not a preexisting application. This clarifies the test case without rewriting normative rules or proving future compliance. The repeat omission prompted a narrower mechanical safeguard: the *disposable acceptance repository only* now receives a selected-source-rule Git pre-commit check for staged project-bootstrap artifacts. This is explicitly test-specific and never installs a hook into real projects or the user's global Git settings. It guards against another successful commit silently lacking the selected roadmap, but the hook cannot determine roadmap quality or prove general agent behavior. The engineering ledger remains **62/69 (89.9%)** pending real passing conformance evidence.

## Sixth Rust CLI probe: real roadmap artifact, but source-rule conformance rejected (2026-10-27)

An opt-in Codex CLI 0.163.0 run on the corrected disposable harness created one commit (`2d8bc684af667a33cd9c8aad6318739e3d54f61a`) with a clean worktree, six passing Rust tests (three unit and three integration), successful offline Rust format, compile and Clippy checks, a README and CI workflow, and five verified phase-reader receipts (planning, implementation, testing, review, shutdown). The review archive matched the runner's recorded SHA-256, all **24/24 package files** matched the manifest, and all **89 selected rule references** were present. GitHub Actions was configured in the disposable CLI but **not actually executed on GitHub**; only local equivalents ran.

The new pre-commit presence guard and `repository_artifact_observations` found `ROADMAP.md`, thus the runner mechanically reported `awaiting_independent_review`. **Independent acceptance rejected the run**: the roadmap contains section-level emoji but its items use only status checkmarks, without the required stable *per-item* identifying emojis. The document also lacks distinct phases/milestones/features/subtasks hierarchy. This is a clear violation of the selected, applicable `NOM-0010` source rule. The roadmap further marks running GitHub Actions complete even though no hosted workflow ran (`NOM-0043`); the agent's conformance review overlooked the missing structure (`NOM-0064`) and the completion handoff did not disclose that gap (`NOM-0066`). The complete private review classified **34 satisfied, 4 violated, 46 not applicable, 5 unobserved**; these are human reviewer dispositions, not an automated production proof, and the private archive and full trace stay out of the public repo.

The exact defect prompted a **disposable-test-only** structural preflight for `NOM-0010`: the local Git pre-commit check now checks staged roadmap item identities, explicit phase/milestone/feature/subtask labels and a basic hierarchy. The post-run preflight independently reports structural gaps. This intentionally conservative heuristic catches the observed shallow-roadmap regression but **cannot replace semantic independent review or guarantee Codex compliance**. After publishing the scoped 89-rule review, checkpoint `EVAL-10` (independent scoring) was evidence-backed and closed, raising the milestone ledger to **63/69 (91.3%)** from **62/69 (89.9%)**, a **+1.4 percentage-point** change. The [public-safe per-rule disposition report](../audits/agent-consumption-rust-cli-2026-10-27-review.json) preserves the four blocking violations without publishing raw traces. **No real-agent run has been independently accepted**, so `EVAL-08`, `EVAL-09`, `EVAL-11`, `EVAL-12` and final release gates remain open.

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

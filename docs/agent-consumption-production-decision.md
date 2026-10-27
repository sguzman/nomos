# Nomos agent-consumption v1: scoped acceptance and release decision

**Decision date:** 2026-10-27  
**Independent evaluation outcome:** **PASS** for the explicitly bounded, synthetic Rust-project acceptance protocol.  
**Deployment / profile activation:** **NOT AUTHORIZED.** Completing an engineering acceptance checkpoint does not approve, finalize, export, install, or activate a user's profile.

## Decision evidence

| Distinct accepted scenario | Instruction target / executor | Direct evidence | Per-rule review |
| --- | --- | --- | --- |
| Rust CLI from scratch | Codex adapter / Codex CLI 0.163.0 | Real implementation, 3 unit + 4 integration tests, fmt/Clippy, two Git commits, honest hosted-CI limitation, 5 phase reads | [43 satisfied / 46 inapplicable / 0 violations](../audits/agent-consumption-rust-cli-110018b-accepted-review.json) |
| Rust persistent journal | Codex adapter / Codex CLI 0.163.0 | Safe refusal on corrupt headers and UTF-8, salvage of valid records, 4 unit + 6 process tests, two commits, real phase reads | [44 satisfied / 45 inapplicable / 0 violations](../audits/agent-consumption-rust-persist-ad52a07-accepted-review.json) |
| Mixed-scope key/value parser | Generic Markdown package **explicitly supplied** to Codex CLI 0.163.0 | Verified actual `cat AGENTS.md`, no Skills wrappers, 11 manifest-matching phase receipts across five distinct phases, 6 unit tests and manual CLI subprocess probes, two Git commits | [43 satisfied / 46 inapplicable / 0 violations](../audits/agent-consumption-rust-mixed-ebdcfdb-accepted-review.json) |

All three accepted scenarios have checksum-linked independent source/trace reviews and no uncorrected mandatory source-rule violations **within their authorized conditions**. The third scenario satisfies generic **package delivery and explicit read**, not unprompted auto-discovery by an unspecified agent.

## Failure history and variance

- The CLI scenario took **eight** observed trials; earlier runs included absent commits, incomplete roadmaps, incorrectly marked milestones, and missing progress reporting.
- The persistence scenario took **three** observed trials; the earlier attempts lacked integration/error-path coverage or contained destructive recovery when a file header was corrupt. The final run corrected those defects.
- The mixed-scope generic Markdown case was accepted on its **first** observed trial after an independent reviewer rejected the runner's Codex-only observer assumption and a false-positive completion heuristic. The raw execution trace and source were reviewed without replaying the model or changing canonical rules.

This is **three distinct accepted scopes**, not a statistically meaningful 3/3 reliability estimate. The failures remain part of the historical record and cannot be retroactively marked accepted. A passing Cargo build or a phase receipt alone was never treated as proof of source-rule conformance.

## Supported claims

**PASS — bounded engineering gate:** deterministic selected-rule package generation, unchanged canonical source-rule obligations, safe local manifest integrity checks, explicit generic entrypoint loading, observed contextual module reads, actual Rust development/checks/commits, and independently justified source-rule dispositions for three different authorized scenarios.

**PASS — documentation and honesty gate:** all artifacts have a traceable audit, the generated roadmaps disclosed that hosted GitHub Actions workflows were configured but **not run in the disposable target repositories**, and completion progress was reported without claiming an unobserved target CI result. Nomos repository CI is separately verified; its success is not a substitute for target-run acceptance.

## Unsupported or authorization-dependent claims

- **No proof of universal agent reliability:** results are limited to Codex CLI 0.163.0 on synthetic Rust tasks. No other model, OS, unrestricted user project, or long-running autonomous release workflow was accepted.
- **No proof of automatic generic-agent discovery:** the generic Markdown contract was explicitly provided, then read through Codex CLI. No arbitrary external agent was tested for automatic discovery or Skills use.
- **No host-CI claim for disposable targets:** no synthetic generated project was pushed to a hosted remote to execute its configured workflow.
- **No finalized production rule profile:** existing drafts are inert. Finalization, explicit selection, export, installation, and any real-repository modification each require owner approval under the separate workflow.
- **No private-data or production deployment experiment:** private acceptance bundles stay off the public repository; the public records contain only synthetic, privacy-safe assessments.

## Readiness classification

**Nomos agent-consumption v1: scoped engineering acceptance PASS; controlled owner-approved piloting is technically supported.** This is a positive outcome on the project's defined three-distinct-run evidence gate, not a blanket production authorization. **Unattended deployment and any live user profile activation remain unapproved and must not occur implicitly.**

Future deployment beyond the verified envelope must be evaluated against its own agent version, project scope, module-read evidence, and explicit owner permissions. The canonical rules must not be weakened to improve an evaluation score.

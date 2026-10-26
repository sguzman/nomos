# Guided agent-consumption quickstart

The [guided rule builder](https://sguzman.github.io/nomos/rule-builder.html) is the simplest current entrypoint. It asks about the project rather than requiring you to browse hundreds of canonical rules.

## 1. Inspect a proposed rule selection

1. Open the guided builder from the [Nomos catalog](https://sguzman.github.io/nomos/).
2. Choose a project type/profile. **New Rust Project** provides feature-specific questions. Other existing profile families remain visible for review, but do not yet have all their own context questions.
3. Choose answers such as **Yes**, **No**, **Not sure yet**, or **Not applicable**. The builder retains uncertainty and shows why a published source rule might be relevant, conditional or potentially excluded.
4. Review any optional additions, proposed vetoes and possible normative conflicts. The builder never silently resolves conflicting rules or alters a canonical profile.
5. Download the **unapproved draft configuration** if you want an inspectable record. It is not an `AGENTS.md` and does not authorize use by Luna.

The website is static; project answers are held only in the browser session and downloaded locally if requested. No account, subscription, npm installation or server-side collection is required for this exploration.

## 2. Understand the deployment boundary

A canonical published rule is not an applied instruction. The existing 12 profile selections are all provisional, draft and unconfirmed. In particular, the New Rust Project Full profile contains 106 proposed rules, but a valid profile ID alone cannot create a deployed package.

The source-to-agent process is:

**Published rules → explicitly reviewed selection → typed project facts → inert projection preview → separately approved projection → inspected deterministic package → explicitly authorized installation → target-specific independent evaluation.**

The production export and owner-review frontend are still in development. The current builder intentionally stops at preview. Do not use its draft JSON as if it had undergone approval.

## 3. Available advanced tooling

The repository includes self-contained Node (without npm dependencies) for developers testing an **already separately approved** ad-hoc selection or finalized profile:

- `tools/projections.cjs`: conservative project scope and rule decision resolution; rejects unsupported facts, unpublished members, conflicts and unconfirmed profile activation.
- `tools/agent_package.cjs`: deterministic package compiler. Generates a compact `AGENTS.md`, indexed `.nomos/rules/*.md` reference modules, a pinned manifest and optional Codex Skills.
- `tools/export_agent_package.cjs`: defaults to a **dry run**. Requires explicit export confirmation for any write; never replaces existing `AGENTS.md` files.
- `tools/agent_package_verify.cjs`: rechecks installed module hashes and selected-rule coverage offline at task start or work-phase transition.
- `tools/agent_package_diff.cjs`: compares two independently verified installed packages and lists changes **without** applying them.

These tools require a local pinned catalog, source-backed projection and explicit destination. They do not connect to a cloud service, execute agent jobs, or approve anything on your behalf.

### Package layout

A successfully compiled package (for a separately approved selection) contains a small `AGENTS.md` entrypoint, `.nomos/projection.json`, `.nomos/manifest.json`, `.nomos/rules/*.md`, and a bundled `.nomos/verify.cjs`. A Codex-targeted variant additionally includes optional `.agents/skills/nomos-*/SKILL.md` instructions.

The entrypoint says when to consult rules and how to detect changed references. Merely providing a file path does **not** prove an agent opened it. Actual compliance requires tool trace evidence and independent acceptance of the work.

## 4. What is not ready yet

- No existing draft profile is finalized or automatically applied.
- The website's guided interview produces only inert review drafts; a fully integrated owner approval and package export flow is pending.
- Contextual skill auto-discovery and reading are not yet verified with a live Luna/Codex run.
- Real-world end-to-end Rust task, GUI, build, release and independent conformance evaluations are not yet complete.
- The repository's static checks and GitHub Actions results do not establish production behavior.

Track [the evidence-weighted roadmap](agent-consumption-roadmap.md) and [evaluation rubric](agent-consumption-evaluation.md). The goal is production-level confidence **without requiring the owner to manually QA every rule**; until the empirical gates pass, treat agent packages as an engineering preview rather than a production guarantee.

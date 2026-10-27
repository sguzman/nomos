# Agent entrypoint loading: guaranteed vs conditional

This is the **supported adapter contract**, not a claim that any particular GPT-6/Luna run has been observed. Generated packages remain inert until separately approved and explicitly installed.

| Target | Automatically available at startup | Loaded only when explicitly used | What Nomos can verify |
| --- | --- | --- | --- |
| Codex CLI (compatible versions) | Applicable `AGENTS.md` content from global and ancestor working-directory locations, subject to Codex's documented precedence and size cap | Agent Skills: the agent discovers name/description and selects `SKILL.md`; linked references and local scripts require additional reads | Generated files, exact relative references, phases, hashes and local CLI reads; **not** that an unknown Luna session chose a Skill |
| Generic repository agent | Nothing guaranteed: the caller must provide `AGENTS.md` or equivalent text | Linked local rule modules and phase-reader command, only when that agent actually opens/invokes them | Deterministic generated package and explicit file/tool read events |
| Plain-text consumer | User-chosen pasted instructions only | No automatic local file access | Exported text contents only |

Nomos's root `AGENTS.md` is **for contributing to Nomos**, not a generated configuration for unrelated repositories. The generated target repository's `AGENTS.md` is a separate artifact and must not overwrite existing agent instructions.

## Why the entrypoint is small

Codex CLI's documented convention automatically includes applicable `AGENTS.md` instructions, with global and working-directory ancestor discovery. Its Skills mechanism is *progressive disclosure*: the Skill name and description may be discovered; the Skill body is loaded only if selected. A Markdown path reference is not an automatic file read.

Therefore Nomos's generated `AGENTS.md` contains always-on safeguards and explicit phase routes, while `.nomos/rules/*.md` holds conditional, source-identifiable modules. Optional Codex `.agents/skills/nomos-*/SKILL.md` wrappers supplement the deterministic route; they never replace it.

## Enforceable phase handoff

At task start and every phase transition, run `node .nomos/read-phase.cjs <phase>` from the installed target root. This command first verifies the installed manifest, prints every module assigned to the specified phase, and emits a machine-checkable `NOMOS_PHASE_READ` receipt. Valid phases are `planning`, `implementation`, `review`, `testing`, `ci`, `release`, `shutdown`, and `maintenance`.

If Node or the phase reader is unavailable, the agent must instead check the manifest and open each referenced module with an equivalent local tool, retaining observable evidence. If the manifest or module hashes mismatch, stop that affected operation and report the failure. Merely printing a receipt proves a tool read, **not** reasoning quality, compliance, or a successful project.

## Target-specific uncertainty

- Two user-executed Codex CLI 0.163.0 trials produced tool-trace-backed phase reads and actual agent-created disposable Git commits. Independent reviews found substantive omissions, so **no live run is accepted**. This evidence does not establish compliance for other Codex versions, automatic Skill selection, generic agents, or production deployments.
- Skills may not self-activate; for high-priority requirements the always-on entrypoint plus a verified phase-reader invocation is safer than relying on model-selected Skill discovery.
- The generic adapter intentionally makes no claims about automatic AGENTS.md discovery. The host/invoker owns that bootstrap.
- If a Codex version changes its discovery behavior, inspect the actual installed target, record the version and observed read paths, and update the compatibility matrix only after evidence.

## Sources and evidence

- [Codex prompting guide: AGENTS.md discovery](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)
- [OpenAI Skills: metadata discovery and task-specific loading](https://developers.openai.com/api/docs/guides/tools-skills)
- [Nomos package compiler](../tools/agent_package.cjs), [phase reader](../tools/agent_phase_reader.cjs), [offline verifier](../tools/agent_package_verify.cjs), and associated unit/integration tests
- Live target behavior remains part of the separate [behavioral acceptance rubric](agent-consumption-evaluation.md).

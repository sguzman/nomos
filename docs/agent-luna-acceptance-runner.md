# Disposable Luna/Codex acceptance runner

**State: implemented and mechanically tested; no live Luna run accepted.** This utility is for isolated behavioral evaluation, not for normal application development or activation of the draft Rust profile.

## Cases and isolation

The runner `tools/run_luna_acceptance.cjs` prepares three public-safe Rust exercises aligned with the agent-consumption acceptance matrix: `RUST-CLI` for normalizing command-line input, `RUST-PERSIST` for durable journal state, and `RUST-MIXED` for overlapping Tarium/Rust project facets and untrusted input. They deliberately use a *synthetic, disposable, ad-hoc selection* of the 106 published source rules referenced by the **unconfirmed** Rust Full draft. No actual profile is finalized, selected for a real project, or published.

For all three scenarios without repeated manual setup, `node tools/run_luna_acceptance_suite.cjs` previews them together. `node tools/run_luna_acceptance_suite.cjs --model MODEL --execute` explicitly invokes an already authenticated Codex CLI for the three isolated scenarios; it still leaves independent acceptance pending, even if all Cargo tests succeed.

The default command is a harmless planning preflight:

`node tools/run_luna_acceptance.cjs --case RUST-CLI`

It computes the pinned projection/package and prints a public-safe plan. It does not call Codex, Cargo, Git, an external API, or any live project. CI tests this planning behavior without agent authentication.

Actual unattended execution is **separately opt-in**, with an already installed and authenticated Codex CLI:

`node tools/run_luna_acceptance.cjs --case RUST-CLI --model MODEL --execute`

The model flag is optional and must be chosen from those available in the authenticated account; the runner does not invent model availability. It uses the documented Codex CLI noninteractive `codex exec --json --sandbox workspace-write --ask-for-approval never --ephemeral` interface. It does not use npm, `--yolo`, paid external development tools, or extra GitHub permissions. It makes no claim that this interface works with every historical Codex version.

When explicitly executed, it creates a new temporary Git repository and Cargo project under OS-managed temporary directories, installs a separate synthetic test package there, and invokes Codex only against that test directory. It then runs `cargo test --offline` and `cargo metadata --offline`, queries Git status and history, and saves raw JSONL tool events and stderr to a separate private temporary evidence directory with restricted permissions. It never points at an actual user project, uploads raw logs, approves a real profile, or pushes commits to a remote.

## Observable evidence

`tools/codex_trace_observer.cjs` parses Codex's `item.completed` command-execution JSONL events and identifies successful `node .nomos/read-phase.cjs <phase>` commands with matching `NOMOS_PHASE_READ` receipts. It validates those receipts against the package's pinned manifest and records actual command statuses. It does **not** treat an agent's natural-language claim as a tool event and it never marks applicable rules `satisfied` automatically.

The runner leaves its output as `awaiting_independent_review`, with `production_accepted: false` and `rule_assessments_complete: false`, even if Cargo tests pass. A separate reviewer must inspect the original tool traces, project diffs, phase transitions, applicable conditions, builds, tests and any missing work. The existing conformance rubric requires three independent, distinct, accepted real-agent runs before a scoped production claim.

## Known limitations

- No existing Codex/Luna installation or authentication has been accessed by this repository's CI. Tests only exercise inert scenario planning and synthetic trace parsing.
- The runner records command-event evidence but does not independently authenticate the model or determine whether an observed command reflects useful reasoning. Tool output can contain private content; raw logs stay in private local temporary storage and must never be checked into the public repository.
- A 15-minute model-run limit, workspace-write sandbox, and offline Cargo testing may expose target-specific failures. Those must be recorded, not waived to make a scenario pass.
- A GUI-specific end-to-end case and external target-environment verification remain separate future validation work; `RUST-PERSIST` covers the non-GUI alternate case only.
- This is an opt-in test tool, not a permanent service or background automation. It will not start unrequested paid inference.

## Documentation

The exact release gate is in [agent-consumption-evaluation.md](agent-consumption-evaluation.md), with unverified capabilities explicitly listed in [agent-consumption-release-status.md](agent-consumption-release-status.md). The target instruction-loading contract is in [agent-target-loading.md](agent-target-loading.md).

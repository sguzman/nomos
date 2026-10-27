# Disposable Luna/Codex acceptance runner

**State: implemented and mechanically tested; no live Luna run accepted.** This utility is for isolated behavioral evaluation, not for normal application development or activation of the draft Rust profile.

## Cases and isolation

The runner `tools/run_luna_acceptance.cjs` prepares three public-safe Rust exercises aligned with the agent-consumption acceptance matrix: `RUST-CLI` for normalizing command-line input, `RUST-PERSIST` for durable journal state, and `RUST-MIXED` for overlapping Tarium/Rust project facets and untrusted input. They deliberately use a *synthetic, disposable, ad-hoc selection* of the 106 published source rules referenced by the **unconfirmed** Rust Full draft. No actual profile is finalized, selected for a real project, or published.

For all three scenarios without repeated manual setup, `node tools/run_luna_acceptance_suite.cjs` previews them together. `node tools/run_luna_acceptance_suite.cjs --model MODEL --execute` explicitly invokes an already authenticated Codex CLI for the three isolated scenarios; it still leaves independent acceptance pending, even if all Cargo tests succeed.

The default command is a harmless planning preflight:

`node tools/run_luna_acceptance.cjs --case RUST-CLI`

It computes the pinned projection/package and prints a public-safe plan. It does not call Codex, Cargo, Git, an external API, or any live project. CI tests this planning behavior without agent authentication.

Actual unattended execution is **separately opt-in**, with an already installed and authenticated Codex CLI. Before allocating either temporary directory, the runner checks the local parser with `codex --ask-for-approval never exec --help`. A parser error stops the run clearly and is not reported as an agent trial.

`node tools/run_luna_acceptance.cjs --case RUST-CLI --model MODEL --execute`

The model flag is optional and must be chosen from those available in the authenticated account; the runner does not invent model availability. It uses `codex --ask-for-approval never exec --sandbox workspace-write --ephemeral --json --cd <temp-repo> -`; the prompt is still sent on stdin. This ordering supports Codex CLI 0.163.0, where placing the approval flag after `exec` fails parsing. It does not use npm, `--yolo`, `--danger-full-access`, paid external development tools, or extra GitHub permissions.

When explicitly executed, it creates a new temporary Git repository and Cargo project under OS-managed temporary directories, configures a synthetic Git identity **only in that temporary repository**, installs a separate synthetic test package there, and invokes Codex only against that test directory. It then runs `cargo test --offline` and `cargo metadata --offline`, queries Git status and history, and saves raw JSONL tool events and stderr to a separate private temporary evidence directory with restricted permissions. It never points at an actual user project, uploads raw logs, approves a real profile, or pushes commits to a remote.

## Observable evidence

`tools/codex_trace_observer.cjs` parses Codex's `item.completed` command-execution JSONL events and identifies successful `node .nomos/read-phase.cjs <phase>` commands with matching `NOMOS_PHASE_READ` receipts. It validates those receipts against the package's pinned manifest and records actual command statuses. It does **not** treat an agent's natural-language claim as a tool event and it never marks applicable rules `satisfied` automatically.

The report distinguishes `invocation_attempted`, `session_started` (a JSONL `thread.started` event), and `agent_turn_completed` (a genuine `turn.completed` event plus zero CLI exit and no `turn.failed`). A parser exit with no session event is `launch_failed`. A completed turn **without** a fresh post-baseline Git commit, a clean worktree, and a successful post-run Cargo test is `agent_workflow_incomplete`, not `awaiting_independent_review`; those mechanical facts are separately reported as `agent_created_commit_count`, `worktree_clean`, and `code_test_commit_gate_met`. A qualifying mechanical run still requires independent rule-by-rule assessment. Cargo success on the untouched synthetic baseline is not agent work. `production_accepted: false` and `independent_reviewer_accepted: false` remain fixed. A separate reviewer must inspect actual agent-created commits and changes separately from the baseline, original tool traces, phase transitions, applicable conditions, builds, tests and any missing work. The existing conformance rubric requires three independent, distinct, accepted real-agent runs before a scoped production claim.

Minimal RUST-CLI rerun: `node tools/run_luna_acceptance.cjs --case RUST-CLI --execute`. Keep the generated evidence directory private. A run without `thread.started` is a launch failure; a real session remains pending independent review.

## Known limitations

- No existing Codex/Luna installation or authentication has been accessed by this repository's CI. Tests only exercise inert scenario planning and synthetic trace parsing.
- The runner records command-event evidence but does not independently authenticate the model or determine whether an observed command reflects useful reasoning. Tool output can contain private content; raw logs stay in private local temporary storage and must never be checked into the public repository.
- A 15-minute model-run limit, workspace-write sandbox, and offline Cargo testing may expose target-specific failures. Those must be recorded, not waived to make a scenario pass.
- A GUI-specific end-to-end case and external target-environment verification remain separate future validation work; `RUST-PERSIST` covers the non-GUI alternate case only.
- This is an opt-in test tool, not a permanent service or background automation. It will not start unrequested paid inference.

## Documentation

The exact release gate is in [agent-consumption-evaluation.md](agent-consumption-evaluation.md), with unverified capabilities explicitly listed in [agent-consumption-release-status.md](agent-consumption-release-status.md). The target instruction-loading contract is in [agent-target-loading.md](agent-target-loading.md).

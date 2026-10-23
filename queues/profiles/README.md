# Profile idea queue — intake only

This directory stores **ideas for possible future rule profiles**, not profile records or instructions to process anything. The six user-nominated profile ideas were explicitly instantiated as provisional drafts for owner review on 2026-10-22. Their selected rule lists have **not** been approved or finalized.

## Queue contract

- Stable intake IDs: `PROFILE-IDEA-0001`, `PROFILE-IDEA-0002`, etc. These **never** become or reserve `PROFILE-*` IDs.
- One public-safe JSON record per idea, conforming to [profile-idea.schema.json](../../schema/profile-idea.schema.json).
- A record has a short title and optional summary; optional proposed rule/group IDs are **unreviewed hints**, not an approved selection.
- Initial status is `queued`. Later `deferred` / `cancelled` are administrative labels. `instantiated` is only valid after a **separately and explicitly authorized** draft profile is actually created, with its real `PROFILE-*` ID linked. No automatic promotion or mass processing.
- Queue entries are operational records, **not a fifth Nomos ontology kind**. No new rule, group, profile draft, export, or agent instruction is created by capturing an idea.
- Only store public-safe summaries. Never copy private conversation excerpts, venting, secrets, or unapproved nonpublic material into this public repository.

## Manage the queue

From the repository root:

```sh
node tools/profile_ideas.cjs list
node tools/profile_ideas.cjs add --title "Example profile idea" --summary "A short public-safe purpose"
node tools/validate_profile_ideas.cjs
```

The `add` command **only** creates one queued idea; it has no processing or profile-instantiation command. Omit `--summary` to record only a title. `--rules` and `--groups` accept optional comma-separated **tentative** IDs. The CLI never auto-selects a proposed ID and never edits `profiles/`.

To proceed later, explicitly name the queue ID and separately authorize reviewing its selection under [PROFILE_WORKFLOW.md](../../PROFILE_WORKFLOW.md). Reviewing is **not** authorization to instantiate a draft; confirmation to instantiate, then separate finalization and use remain independently required.

## Profile ideas instantiated as provisional drafts (2026-10-22)

| Original idea | Resulting editable draft | Rules |
| --- | --- | ---: |
| `PROFILE-IDEA-0001` | `PROFILE-0003` — Rust from scratch Lite | 35 |
| `PROFILE-IDEA-0002` | `PROFILE-0004` — Rust from scratch Full | 90 |
| `PROFILE-IDEA-0003` | `PROFILE-0005` — Tarium Lite | 29 |
| `PROFILE-IDEA-0004` | `PROFILE-0006` — Tarium Full | 61 |
| `PROFILE-IDEA-0005` | `PROFILE-0007` — Rust fork Lite | 34 |
| `PROFILE-IDEA-0006` | `PROFILE-0008` — Rust fork Full | 89 |

The six queue records are now `instantiated` and link to real `profiles/PROFILE-*.json` files. The original proposed hints remain historical intake metadata. In each new profile, `review.selection_confirmed=false` means the **user has not yet accepted the specific membership list**, despite authorizing the draft's creation. Browse the drafts in the [public catalog](https://sguzman.github.io/nomos/), filter Profiles only, and use Browse members to inspect canonical rule IDs. No draft is applied or finalized by viewing it.

See [PROFILE_WORKFLOW.md](../../PROFILE_WORKFLOW.md) and [selection review notes](../../profiles/REVIEW-2026-10-22.md).

## Additional strict-port profile drafts (2026-10-22)

`PROFILE-IDEA-0007`/`0008` link to the C++-to-Rust Lite/Full provisional drafts `PROFILE-0009`/`0010`. Newly requested Python-to-Rust `PROFILE-IDEA-0009`/`0010` link to drafts `PROFILE-0011`/`0012`. These four selections are unconfirmed and inert. The source-language-specific C-only rules were excluded; the remaining C++ and Python semantic coverage gaps are described in [the current review guide](../../profiles/REVIEW-2026-10-23.md).

# Profile idea queue — intake only

This directory stores **ideas for possible future rule profiles**, not profile records or instructions to process anything. It intentionally starts with **zero queued ideas**: no specific idea has been nominated yet.

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

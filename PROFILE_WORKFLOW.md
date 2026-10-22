# Rule-profile preset workflow (entirely optional)

This workflow describes how to create a **reusable preset of selected rules**, not an instruction to create or use one. Rule profiles are a fourth Nomos ontology kind, separate from predefined virtual groups. No profile exists before the user explicitly authorizes its instantiation.

## Optional intake before stage 1

A user may explicitly **queue an idea** in `queues/profiles/PROFILE-IDEA-*.json` without reviewing, selecting rules, processing it or creating a profile. That queue is operational intake, not an actual profile or a fifth ontology kind. Tentative rule/group IDs are hints and cannot be treated as a reviewed selection. The queue is never drained automatically. An explicit owner request may authorize creating one or more provisional draft selections for review. Such drafts have `selection_confirmed: false`; exact rule selection approval and finalization require later, separate decisions. See [queues/profiles/README.md](queues/profiles/README.md).

## User-controlled stages

1. **Discuss a use case.** The user describes the desired work, such as a strict feature-parity port. This is a conversation, not a stored profile. No rules are applied.
2. **Suggest relevant rules.** AI or a person may suggest existing published atomic rule IDs from the catalog and explain any missing coverage. The suggestion is **temporary**, revisable, and never by itself a record in `profiles/`. Nothing is selected by default.
3. **Review suggested rules or authorize a provisional draft.** A user may request actual draft files to inspect their proposed member lists without approving those members. This explicit authorization creates drafts with `review.selection_confirmed: false`. Alternatively, a separately reviewed and approved selection can be drafted with that flag `true`.
4. **Confirm selection after review.** The user may inspect, veto, add or remove canonical published rules and then explicitly approve the exact member list. `confirmSelection` changes only the selection confirmation flag; it does not finalize or activate.
5. **Edit the draft.** The user may add or remove published atomic rules. A draft may temporarily have zero rules. Check status, duplicate IDs, and conflicts before finalization. This is user-directed editing, not an automatic profile regeneration.
6. **Explicitly finalize.** Only with a separate user decision may `status: finalized` and `review.finalization_confirmed: true` be recorded. At least one valid published rule is required; conflicts must be surfaced and reviewed, not silently resolved.
7. **Choose to use or export it — or don't.** Even finalized profiles are **inert presets**. They do not modify repos, agent instructions, Custom Instructions, or conversations without an explicit later user selection/export action. Supported outputs include `AGENTS.md`, ChatGPT Custom Instructions and plain text. The user is under no obligation to use any profile.

## Data and boundaries

A profile record contains only stable ID, version, title, state, selected canonical rule IDs, available export targets, confirmation flags and governance dates. Do not require storing private original prompts, user conversations, lengthy rationales, or AI provenance narratives. Do not invent an initial profile or default profile. An AI-suggested rule that does not exist is a **candidate** for separately authorized specimen processing, never an implicit new catalog member.

Unlike a **virtual group** (a predefined rule collection, possibly nested), a **profile** is a reviewed preset for a use case, independently editable before finalization and only usable through another explicit opt-in. It has no normative force and no automatic nesting or expansion. A rule remains independently addressable and selectable.

Use [schema/profile.schema.json](schema/profile.schema.json), [tools/profiles.js](tools/profiles.js), and [tools/validate_profiles.cjs](tools/validate_profiles.cjs). The JavaScript functions distinguish explicit draft authorization (`draftAuthorized`), explicit selection approval (`selectionConfirmed`), separate finalization and later use. Provisional drafts must remain unconfirmed until the owner approves their member lists. A machine-readable confirmation records an authorized event; it must never be fabricated. Potential normative conflicts are reported using existing conservative analysis.

Profiles are **not** stored in specimen/task queues. Those four existing stores and all their authorization boundaries remain unchanged.

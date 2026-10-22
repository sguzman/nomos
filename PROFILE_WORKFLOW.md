# Rule-profile preset workflow (entirely optional)

This workflow describes how to create a **reusable preset of selected rules**, not an instruction to create or use one. Rule profiles are a fourth Nomos ontology kind, separate from predefined virtual groups. No profile exists before the user explicitly authorizes its instantiation.

## Optional intake before stage 1

A user may explicitly **queue an idea** in `queues/profiles/PROFILE-IDEA-*.json` without reviewing, selecting rules, processing it or creating a profile. That queue is operational intake, not an actual profile or a fifth ontology kind. Tentative rule/group IDs are hints and cannot be treated as a reviewed selection. The queue is never drained automatically. A separate request naming an idea is needed to begin discussion/review; still another explicit decision is needed before creating a `profiles/PROFILE-*.json` draft. See [queues/profiles/README.md](queues/profiles/README.md).

## User-controlled stages

1. **Discuss a use case.** The user describes the desired work, such as a strict feature-parity port. This is a conversation, not a stored profile. No rules are applied.
2. **Suggest relevant rules.** AI or a person may suggest existing published atomic rule IDs from the catalog and explain any missing coverage. The suggestion is **temporary**, revisable, and never by itself a record in `profiles/`. Nothing is selected by default.
3. **Review the proposed selection.** The user may ask why a rule was suggested, veto items, add others, or have missing rule ideas go through the **separate specimen queue**. Selection decisions are advisory until accepted; no authority is inferred from an AI recommendation.
4. **Explicitly instantiate a draft.** Only after the user authorizes creation with a reviewed set of published rule IDs may a `profiles/PROFILE-*.json` draft be created. `review.selection_confirmed: true` records this transition. This does not finalize or activate it.
5. **Edit the draft.** The user may add or remove published atomic rules. A draft may temporarily have zero rules. Check status, duplicate IDs, and conflicts before finalization. This is user-directed editing, not an automatic profile regeneration.
6. **Explicitly finalize.** Only with a separate user decision may `status: finalized` and `review.finalization_confirmed: true` be recorded. At least one valid published rule is required; conflicts must be surfaced and reviewed, not silently resolved.
7. **Choose to use or export it — or don't.** Even finalized profiles are **inert presets**. They do not modify repos, agent instructions, Custom Instructions, or conversations without an explicit later user selection/export action. Supported outputs include `AGENTS.md`, ChatGPT Custom Instructions and plain text. The user is under no obligation to use any profile.

## Data and boundaries

A profile record contains only stable ID, version, title, state, selected canonical rule IDs, available export targets, confirmation flags and governance dates. Do not require storing private original prompts, user conversations, lengthy rationales, or AI provenance narratives. Do not invent an initial profile or default profile. An AI-suggested rule that does not exist is a **candidate** for separately authorized specimen processing, never an implicit new catalog member.

Unlike a **virtual group** (a predefined rule collection, possibly nested), a **profile** is a reviewed preset for a use case, independently editable before finalization and only usable through another explicit opt-in. It has no normative force and no automatic nesting or expansion. A rule remains independently addressable and selectable.

Use [schema/profile.schema.json](schema/profile.schema.json), [tools/profiles.js](tools/profiles.js), and [tools/validate_profiles.cjs](tools/validate_profiles.cjs). The JavaScript functions require explicit confirmation flags for draft instantiation, finalization and later selection. A machine-readable confirmation records an authorized event; it must never be fabricated. Potential normative conflicts are reported using existing conservative analysis.

Profiles are **not** stored in specimen/task queues. Those four existing stores and all their authorization boundaries remain unchanged.

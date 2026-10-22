# Optional rule profiles

This directory is reserved for **user-approved** reusable rule-profile presets (stable `PROFILE-*` IDs). It contains two explicitly authorized C-to-Rust strict-port draft profiles; neither is a default.

A profile is **not a virtual group**, a new rule, a mandate, or an applied instruction. It records an editable, use-case-oriented set of published rule IDs with export options for `AGENTS.md`, ChatGPT Custom Instructions, or plain text. The user may ignore every profile. No profile is selected or exported automatically.

A conversational use-case discussion or AI-proposed list does **not** create a profile file. Only after the user confirms the selection may an editable `draft` be instantiated. The user can then add or remove rules and separately approve `finalized` status. Even a finalized preset requires a further explicit choice before use. Missing rules require normal specimen/catalog processing, not silent generation.

Contract: [profile.schema.json](../schema/profile.schema.json). Workflow: [PROFILE_WORKFLOW.md](../PROFILE_WORKFLOW.md).

Do not add a real profile here until the user authorizes its initial selection.

## Authorized draft selections

- [PROFILE-0001](PROFILE-0001.json) — Lite (41 unique published rules): port fidelity, Rust quality, Git hygiene, core verification, differential testing, unsafe/FFI containment, coverage inventory, and public-disclosure safeguards.
- [PROFILE-0002](PROFILE-0002.json) — Full (93 unique published rules): everything in Lite plus CI/CD, documentation, extended QA, safety/data integrity, MVP graduation and post-MVP practices, and stable emoji roadmaps with percent/progress bars.

Both contain `NOM-0111`, `NOM-0112`, `NOM-0113`, and the public-privacy rules `NOM-0001`, `NOM-0003`, `NOM-0004`, `NOM-0050`, `NOM-0051`. Both remain **drafts**, not finalized or selected for use. Profile selections are explicit canonical atom IDs; no group expands automatically at runtime.

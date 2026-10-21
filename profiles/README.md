# Optional rule profiles

This directory is reserved for **user-approved** reusable rule-profile presets (stable `PROFILE-*` IDs). It intentionally contains no example profile and no default profile.

A profile is **not a virtual group**, a new rule, a mandate, or an applied instruction. It records an editable, use-case-oriented set of published rule IDs with export options for `AGENTS.md`, ChatGPT Custom Instructions, or plain text. The user may ignore every profile. No profile is selected or exported automatically.

A conversational use-case discussion or AI-proposed list does **not** create a profile file. Only after the user confirms the selection may an editable `draft` be instantiated. The user can then add or remove rules and separately approve `finalized` status. Even a finalized preset requires a further explicit choice before use. Missing rules require normal specimen/catalog processing, not silent generation.

Contract: [profile.schema.json](../schema/profile.schema.json). Workflow: [PROFILE_WORKFLOW.md](../PROFILE_WORKFLOW.md).

Do not add a real profile here until the user authorizes its initial selection.

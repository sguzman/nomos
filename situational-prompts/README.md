# Situational prompts

This is a fifth, independent Nomos species: **situational prompts**. An entry is a reusable piece of instruction text invoked intentionally at a specific conversation moment, not an atomic obligation/prohibition/permission and not a profile of selected rules.

- \`SIT-0001.json\` etc. are individual entries governed by [the schema](../schema/situational-prompt.schema.json). Eight independently normalized, public-safe reviewed drafts exist; none has owner publication approval. Do not transcribe user conversations into this public repository.
- \`situation.code\` classifies the moment; \`situation.trigger\` explains the observable event; \`applicability.appropriate_when\`, \`not_appropriate_when\`, and \`preconditions\` delimit correct invocation.
- \`execution.mode\`, \`handoff\`, and \`progress_evidence\` describe expected behavior, while \`failure_modes.guards_against\` and \`tradeoffs\` record hazards and potential side effects.
- \`interaction.invocation\` denotes explicit-only use, and \`interaction.target\` denotes the intended consumer. Launcher shortcuts are separate user configuration, not prompt metadata.
- \`text\` is independently normalized public-safe instruction text, distinct from descriptive metadata; only an explicitly approved published version becomes copyable.
- \`provenance\` and \`governance\` record public-safe origin, lifecycle, and review. Only approved and published entries offer copy actions on the website.

The \`situational-prompts/\` registry, the existing \`rules/\`, \`groups/\`, and \`profiles/\` registries, and all workflow queues remain distinct. The website does not activate these texts or mix them into the rule composer. Users must explicitly choose to copy or invoke an entry.

The eight situations were processed from [intake records](../queues/situational-prompts/README.md) into reviewed canonical records `SIT-0001`–`SIT-0008`, with separate [processing traces](../processing/situational-prompts/). Canonical records have no manually maintained prompt name or keyboard assignment: the website derives headings from typed situation and execution metadata. These are **not approved for copying or use** until the owner reviews and authorizes publication. `progress_audit` and `scope_refocus` use `reinforcement_only` so a reminder alone never starts a new task.

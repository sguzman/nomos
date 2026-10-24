# Situational prompts

This is a fifth, independent Nomos species: **situational prompts**. An entry is a reusable piece of instruction text invoked intentionally at a specific conversation moment, not an atomic obligation/prohibition/permission and not a profile of selected rules.

- \`SIT-0001.json\` etc. are individual entries governed by [the schema](../schema/situational-prompt.schema.json). There are **no approved entries yet**. Do not fabricate or transcribe user conversations into this public repository.
- \`situation.code\` classifies the moment; \`situation.trigger\` explains the observable event; \`applicability.appropriate_when\`, \`not_appropriate_when\`, and \`preconditions\` delimit correct invocation.
- \`execution.mode\`, \`handoff\`, and \`progress_evidence\` describe expected behavior, while \`failure_modes.guards_against\` and \`tradeoffs\` record hazards and potential side effects.
- \`interaction.invocation\` denotes explicit-only use, and \`interaction.target\` denotes the intended consumer. Launcher shortcuts are separate user configuration, not prompt metadata.
- \`text\` preserves an explicitly approved reusable prompt **verbatim**; it is separate from commentary, rationale, or rule exports.
- \`provenance\` and \`governance\` record public-safe origin, lifecycle, and review. Only approved and published entries offer copy actions on the website.

The \`situational-prompts/\` registry, the existing \`rules/\`, \`groups/\`, and \`profiles/\` registries, and all workflow queues remain distinct. The website does not activate these texts or mix them into the rule composer. Users must explicitly choose to copy or invoke an entry.

The first eight proposed scenarios are captured as **metadata-only intake** in [queues/situational-prompts/](../queues/situational-prompts/README.md), with their identifying labels and situation metadata. No prompt text has been released. Review and separately approve public-safe wording before instantiating a canonical entry.

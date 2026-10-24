# Situational prompts

This is a fifth, independent Nomos species: **situational prompts**. An entry is a reusable piece of instruction text invoked intentionally at a specific conversation moment, not an atomic obligation/prohibition/permission and not a profile of selected rules.

- \`SIT-0001.json\` etc. are individual entries governed by [the schema](../schema/situational-prompt.schema.json). There are **no approved entries yet**. Do not fabricate or transcribe user conversations into this public repository.
- \`situation.code\` classifies the moment; \`situation.trigger\` explains the observable event; \`applicability.appropriate_when\`, \`not_appropriate_when\`, and \`preconditions\` delimit correct invocation.
- \`execution.mode\`, \`handoff\`, and \`progress_evidence\` describe expected behavior, while \`failure_modes.guards_against\` and \`tradeoffs\` record hazards and potential side effects.
- \`interaction.shortcut_key\` is a discoverability hint, never an automatic keybinding or execution trigger.
- \`text\` preserves an explicitly approved reusable prompt **verbatim**; it is separate from commentary, rationale, or rule exports.
- \`provenance\` and \`governance\` record public-safe origin, lifecycle, and review. Only approved and published entries offer copy actions on the website.

The \`situational-prompts/\` registry, the existing \`rules/\`, \`groups/\`, and \`profiles/\` registries, and all workflow queues remain distinct. The website does not activate these texts, bind shortcuts, or mix them into the rule composer. Users must explicitly choose to copy or invoke an entry.

Next step after this bootstrap: individually review and authorize actual entries and wording before publication. No entry is implied by the existence of a situation code.

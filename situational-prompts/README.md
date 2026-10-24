# Situational prompts

This is a fifth, independent Nomos species: **situational prompts**. An entry is a reusable piece of instruction text invoked intentionally at a specific conversation moment, not an atomic obligation/prohibition/permission and not a profile of selected rules.

- \`SIT-0001.json\` etc. are individual entries governed by [the schema](../schema/situational-prompt.schema.json). Eight independently normalized, public-safe canonical entries are approved and published. Do not transcribe user conversations into this public repository.
- \`situation.code\` classifies the moment; \`situation.trigger\` explains the observable event; \`applicability.appropriate_when\`, \`not_appropriate_when\`, and \`preconditions\` delimit correct invocation.
- \`execution.mode\`, \`handoff\`, and \`progress_evidence\` describe expected behavior, while \`failure_modes.guards_against\` and \`tradeoffs\` record hazards and potential side effects.
- \`interaction.invocation\` denotes explicit-only use, and \`interaction.target\` denotes the intended consumer. Launcher shortcuts are separate user configuration, not prompt metadata.
- \`text\` is independently normalized public-safe instruction text, distinct from descriptive metadata; only an explicitly approved published version becomes copyable.
- \`provenance\` and \`governance\` record public-safe origin, lifecycle, and review. Only approved and published entries offer copy actions on the website.

The \`situational-prompts/\` registry, the existing \`rules/\`, \`groups/\`, and \`profiles/\` registries, and all workflow queues remain distinct. The website does not activate these texts or mix them into the rule composer. Users must explicitly choose to copy or invoke an entry.

The eight situations were processed from [intake records](../queues/situational-prompts/README.md) into canonical records `SIT-0001`–`SIT-0008`, then published with owner approval recorded in the separate [processing traces](../processing/situational-prompts/). Canonical records have no manually maintained prompt name or keyboard assignment: the website derives headings from typed situation and execution metadata. All eight are **published and copyable** following owner approval, but none is invoked automatically. `progress_audit` and `scope_refocus` use `reinforcement_only` so a reminder alone never starts a new task.

## Immutable version families (2026-10-24)

For each `SIT-xxxx`, the original root-level `SIT-xxxx.json` is published **v1.0.0** and preserved without modification. `versions/SIT-xxxx-v2.0.0.json` and `versions/SIT-xxxx-v3.0.0.json` contain the independent later published generations, retaining the uploaded instruction text byte-for-byte as validated against the queued SHA-256 digest.

The separate `FAMILY-xxxx` entry in `ontology/families/` links the family's situations, version-specific intent mappings and all three available versions. Its default remains v1.0.0. On the [public browser](https://sguzman.github.io/nomos/situational-prompts.html), select a particular version before copying; no choice executes a prompt.

SIT-0006 and SIT-0007 remain **reinforcement_only** in v1 but have **sustained_execution** contracts in v2 and v3. SIT-0005 stays diagnostic-only in all three versions. These differences are version-specific, not silent mutations of the v1 ontology. Publication does not demonstrate real-world effectiveness.

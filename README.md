# Nomos

**Nomos** is a public registry of independent normative rules, controlled categories, opt-in groups, reusable rule-profile drafts, and explicitly invoked situational prompts.

Use the [interactive catalog](https://sguzman.github.io/nomos/) to explore applicability, inspect potential conflicts, compose selections and export to `AGENTS.md` or ChatGPT Custom Instructions. **Nothing is automatically selected or applied.**

Browse [situational prompts](https://sguzman.github.io/nomos/situational-prompts.html) separately from the rule composer. Eight situations are now [published as regular canonical entries](situational-prompts/README.md) with metadata-derived identities and independently written, public-safe text. Each can be copied directly from the website. Their original labels remain [intake provenance](queues/situational-prompts/README.md), not canonical names. [v2 and v3 revisions](queues/situational-prompts/revisions/README.md) are queued under those same eight canonical identities.

## Features

- **Atomic, typed rules:** independent entries with scope, predicates, provenance, version and authority metadata.
- **Browse and compose:** search rules, understand categories and inspect conservative conflict candidates.
- **Optional groups and profiles:** reusable selections for software development, strict C/C++/Python → Rust ports, public Tarium projects and Rust fork maintenance.
- **Situational prompts:** a separate text species with situation triggers, exclusions, intended execution and handoff, failure-mode metadata and explicit-only copying.
- **Ontology proposal intake:** [Six unprocessed proposals](queues/situational-ontology/README.md) for formal situations, intentions, compositions, prompt versions and evaluations.
- **Auditable stages:** separate queues, processing histories and published catalog entries.

## Documentation

- [Project constitution](CONSTITUTION.md) and [agent contribution guidance](AGENTS.md)
- [Rule ontology](ONTOLOGY.md), [specimen and task workflow](WORKFLOW.md) and [profile workflow](PROFILE_WORKFLOW.md)
- [Profile review and coverage notes](profiles/REVIEW-2026-10-23.md)
- [Rule schema](schema/rule.schema.json), [situational prompt schema](schema/situational-prompt.schema.json), [catalog site guide](docs/ABOUT.md) and [archived development notes](docs/HISTORY.md)

## Local checks

The repository's existing validation currently includes Python and Node.js tools:

```sh
python3 tools/validate.py
python3 -m unittest discover -s tests -v
node tools/validate_profiles.cjs
node tools/validate_profile_ideas.cjs
```

The conflict analysis is deliberately conservative and is not a proof of natural-language consistency.

## Governance

Nomos is an independent, explicitly enrolled public [Tarium](https://github.com/sguzman/tarium) project. Selection, profile finalization, export and application require separate user decisions. Public files must not contain private conversations, credentials or unpublished material.

[License](LICENSE)

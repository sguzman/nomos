# Nomos

**Nomos** is a public registry of independent normative rules, controlled categories, opt-in groups, reusable rule-profile drafts, and explicitly invoked situational prompts.

Use the [interactive catalog](https://sguzman.github.io/nomos/) to explore applicability, inspect potential conflicts, compose selections and export to `AGENTS.md` or ChatGPT Custom Instructions. **Nothing is automatically selected or applied.**

Browse [situational prompts](https://sguzman.github.io/nomos/situational-prompts.html) separately from the rule composer. Eight situations are now [published as regular canonical entries](situational-prompts/README.md) with metadata-derived identities and independently written, public-safe text. Each can be copied directly from the website. Their original labels remain [intake provenance](queues/situational-prompts/README.md), not canonical names. v2 and v3 are now separately published under those same eight identities, with v1 preserved as the default. Browse and copy [all generations](https://sguzman.github.io/nomos/situational-prompts.html) or explore the [formal situation/intent ontology](https://sguzman.github.io/nomos/situational-ontology.html).

## Features

- **Atomic, typed rules:** independent entries with scope, predicates, provenance, version and authority metadata.
- **Browse and compose:** search rules, understand categories and inspect conservative conflict candidates.
- **Guided agent builder (preview):** [answer project questions](https://sguzman.github.io/nomos/rule-builder.html) to inspect source-linked rule suggestions and export an **unapproved review draft**. No profile approval, agent deployment or Luna reliability is implied.
- **Derived companion profiles:** [browse situation/intent companions](https://sguzman.github.io/nomos/profile-companions.html) for every existing rule-profile selection, with reverse links to supporting rules and no automatic activation.
- **Optional groups and profiles:** reusable selections for software development, strict C/C++/Python → Rust ports, public Tarium projects and Rust fork maintenance.
- **Situational prompts:** a separate text species with situation triggers, exclusions, intended execution and handoff, failure-mode metadata and explicit-only copying.
- **Ontology proposal intake:** [Six processed proposals](queues/situational-ontology/README.md) for formal situations, intentions, compositions, prompt versions and evaluations.
- **Formal situational ontology:** 97 situations, 139 role-classified intent records, 8 compositions, 7 conditions, and 7 evaluation dimensions.
- **Immutable prompt generations:** 24 independently addressable prompts (v1/v2/v3 for eight families), each copyable by explicit selection; v1 remains the default.
- **Auditable stages:** separate queues, processing histories and published catalog entries.

## Documentation

- [Project constitution](CONSTITUTION.md) and [agent contribution guidance](AGENTS.md)
- [Rule ontology](ONTOLOGY.md), [specimen and task workflow](WORKFLOW.md) and [profile workflow](PROFILE_WORKFLOW.md)
- [Twelve revised profile versions](profiles/README.md) and [semantic-first review](audits/profile-vnext-situation-intent-review-2026-10-25.md)
- [Rule schema](schema/rule.schema.json), [situational prompt schema](schema/situational-prompt.schema.json), [catalog site guide](docs/ABOUT.md) and [archived development notes](docs/HISTORY.md)
- [Agent-consumption quickstart](docs/agent-consumption-quickstart.md), [target-loading contract](docs/agent-target-loading.md), [compatibility/rollback](docs/agent-package-compatibility.md) and [evidence-backed readiness status](docs/agent-consumption-release-evidence.md)

## Local checks

The repository's existing validation currently includes Python and Node.js tools:

```sh
python3 tools/validate.py
python3 -m unittest discover -s tests -v
node tools/validate_profiles.cjs
node tools/validate_profile_ideas.cjs
node tools/validate_profile_vnext_semantics.cjs
```

The conflict analysis is deliberately conservative and is not a proof of natural-language consistency.

## Governance

Nomos is an independent, explicitly enrolled public [Tarium](https://github.com/sguzman/tarium) project. Selection, profile finalization, export and application require separate user decisions. Public files must not contain private conversations, credentials or unpublished material.

[License](LICENSE)

## Studying rule situations and intentions

Explore [source-grounded rule/situation/intent links](https://sguzman.github.io/nomos/rule-concepts.html) for all 243 catalog rule records, one of which remains draft. The [twelve authorized provisional profile revisions](profiles/README.md) are still unconfirmed; no profile is activated merely by being present.

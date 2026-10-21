# Nomos

**Nomos** is a public, independent registry of atomic normative rules, controlled categories, opt-in virtual groups, and optional user-approved **rule-profile presets**. Its existing public website browses rules and groups, checks potential conflicts, and exports instructions for `AGENTS.md` and ChatGPT Custom Instructions. Profiles are separate reusable selections; they are never required or auto-applied.

A rule remains independent even when selected for a group or profile. Discussing a use case, suggesting rules, or making a temporary website selection does not create a profile. A reusable profile exists only after the user explicitly asks to instantiate one from reviewed rule selections; finalization and use are separate opt-in decisions.

## Project scope

- A deliberately narrow ontology: **rule**, **category**, **virtual rule group**, **optional rule profile**, and typed metadata.
- Rich, typed metadata for comparing applicability, normative effects, authority, provenance, and potential conflicts.
- A deliberately small, public-safe example catalog; this is not a collection of private conversations or personal writing.
- A sharp distinction between **specimen intake**, **specimen processing**, **task intake**, and **task execution**.
- A static rule browser/composer with identity colors, system/day/night themes, and scoped exports.

## Repository guide

- [CONSTITUTION.md](CONSTITUTION.md) — invariants and governance.
- [AGENTS.md](AGENTS.md) — operational guidance for agents contributing here.
- [ONTOLOGY.md](ONTOLOGY.md) — data model and conflict semantics.
- [WORKFLOW.md](WORKFLOW.md) — independent specimen/task lifecycles.
- [schema/rule.schema.json](schema/rule.schema.json) — machine-readable rule record contract.
- [schema/profile.schema.json](schema/profile.schema.json) — optional reusable rule-profile preset contract.
- [PROFILE_WORKFLOW.md](PROFILE_WORKFLOW.md) — discuss, review, instantiate, edit and finalize a profile, all opt-in.
- [profiles/](profiles/) — reserved for explicitly instantiated presets (currently none).
- [taxonomy/categories.json](taxonomy/categories.json) — controlled categorization vocabulary.
- [rules/](rules/) — independent catalog entries; inert until selected.
- [ROADMAP.md](ROADMAP.md) — future work; not a task-processing record.
- [docs/](docs/) — public rule browser and composer. [Site documentation](docs/ABOUT.md).

## Validate

```sh
python3 tools/validate.py
python3 -m unittest discover -s tests -v
```

The checker uses Python's standard library and validates core structure, vocabulary, references, and simple metadata-only conflict candidates. It is **not** a complete JSON Schema implementation or a proof of logical consistency. See [ONTOLOGY.md](ONTOLOGY.md).

## Relationship to Tarium

Nomos is an independent repository, separately authorized as a public [Tarium](https://github.com/sguzman/tarium) member. Its rules, ontology and website remain entirely within this repository; public listing does not automatically apply or select any rules.

## Completed specimen corpus

All twelve specimens (SPEC-0001 through SPEC-0012) have processing dispositions. The later batch normalized SPEC-0004 through SPEC-0012 to NOM-0005 through NOM-0013, while earlier candidates NOM-0003/0004 were reviewed and cataloged. All proposals remain traceable to archived processing records. Catalog publication never applies a rule automatically, and Tarium membership does not select or apply any rule.

## Development hygiene catalog

The 54 practices are now standalone opt-in rules, with independently addressable IDs NOM-0014 through NOM-0067. Eight first-class groups provide named, colored metadata collections, including a seven-subgroup umbrella. The website supports individual rule selection or one-click addition of the eligible unique rules of a group. Any group is inert until the user explicitly selects it in the composer.

## Project management and strict-port practices

Nine additional independent opt-in rules `NOM-0068` through `NOM-0076` cover progress reporting, single-announcement completion, README identity colors and strict-port replacement criteria. Five new groups `GROUP-0009` through `GROUP-0013` form a separately selectable project-management umbrella with four independent subgroups. New groups remain optional and do not activate any rules or authorize releases, publishing or unrelated work. The historical source records remain in separate intake, processing, and downstream-task stores.

## Optional rule-profile presets

Rule profiles are **voluntary presets**, not another category of mandatory instructions. You may discuss an intended use, ask for AI-suggested existing rules, review the proposed list, then authorize creating an editable draft. After adding or removing rules, you may separately finalize it and later choose to use or export it as an agent instruction file or ChatGPT Custom Instructions. Profiles are not automatically applied, and discussing an idea never creates one. The `profiles/` registry is intentionally empty until the first user-approved profile is requested. Schema and selection operations use JavaScript; no new Python tooling was introduced for this feature.

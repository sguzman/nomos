# Nomos

**Nomos** is a public, independent registry of rules and the categories in which they apply. It includes a public website for browsing rules, assembling compatible selections, identifying possible conflicts, and exporting instructions for different consumers (including `AGENTS.md` and ChatGPT Custom Instructions).

A rule is a first-class object even if nobody selects or applies it. A ruleset or use case can be saved later, or created temporarily in a website session without becoming an ontology object.

## Project scope

- A small ontology: **rule**, **category**, and structured rule metadata. Do not invent a large hierarchy of entities yet.
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

Nomos is an independent repository. It may be considered for Tarium membership in the future, but **has not been enrolled**; no association is implied without explicit authorization.

## Completed specimen corpus

All twelve specimens (SPEC-0001 through SPEC-0012) have processing dispositions. The later batch normalized SPEC-0004 through SPEC-0012 to NOM-0005 through NOM-0013, while earlier candidates NOM-0003/0004 were reviewed and cataloged. All proposals remain traceable to archived processing records. Catalog publication never applies a rule automatically, and Nomos is not enrolled in Tarium.

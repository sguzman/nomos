# Nomos

**Nomos** is a public, independent registry of rules and the categories in which they apply. Its long-term direction is a website for browsing rules, assembling compatible selections, identifying possible conflicts, and exporting instructions for different consumers (including `AGENTS.md` and ChatGPT Custom Instructions).

A rule is a first-class object even if nobody selects or applies it. A ruleset or use case can be saved later, or created temporarily in a website session without becoming an ontology object.

## Scope at bootstrap

- A small ontology: **rule**, **category**, and structured rule metadata. Do not invent a large hierarchy of entities yet.
- Rich, typed metadata for comparing applicability, normative effects, authority, provenance, and potential conflicts.
- A deliberately small, public-safe example catalog; this is not a collection of private conversations or personal writing.
- A sharp distinction between **specimen intake**, **specimen processing**, **task intake**, and **task execution**.
- An eventual site/composer. No website or export format is claimed to exist yet.

## Repository guide

- [CONSTITUTION.md](CONSTITUTION.md) — invariants and governance.
- [AGENTS.md](AGENTS.md) — operational guidance for agents contributing here.
- [ONTOLOGY.md](ONTOLOGY.md) — data model and conflict semantics.
- [WORKFLOW.md](WORKFLOW.md) — independent specimen/task lifecycles.
- [schema/rule.schema.json](schema/rule.schema.json) — machine-readable rule record contract.
- [taxonomy/categories.json](taxonomy/categories.json) — controlled categorization vocabulary.
- [rules/](rules/) — two public-safe initial rules (catalog entries, not automatically active instructions).
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

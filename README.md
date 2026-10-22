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
- [profiles/](profiles/) — explicitly authorized opt-in draft presets; none automatically applies.
- [queues/profiles/](queues/profiles/) — separate, public-safe queue of unprocessed profile ideas; not actual profiles.
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

Rule profiles are **voluntary presets**, not another category of mandatory instructions. You may discuss an intended use, ask for AI-suggested existing rules, review the proposed list, then authorize creating an editable draft. After adding or removing rules, you may separately finalize it and later choose to use or export it as an agent instruction file or ChatGPT Custom Instructions. Profiles are not automatically applied, and discussing an idea never creates one. The `profiles/` registry contains two explicitly authorized, independently editable draft C-to-Rust porting presets (Lite and Full), pending separate finalization and use authorization. Schema and selection operations use JavaScript; no new Python tooling was introduced for this feature.

## Browser-version and local-workflow guidance

The 10 new operational rules from SPEC-0077–SPEC-0086 cover restrictions on new naming suggestions, verifying local repository paths, avoiding substitute projects and inlined YAML-job programs, external script invocation, pulling before local work, and per-change version increments for Tampermonkey userscripts and browser extensions. The separate SPEC-0114 produces a prohibition on redundant `exit 1` guards in YAML jobs with built-in AND-linked failure propagation. All rules remain selectable guidance, not a mandate to execute jobs or modify a system.

## MVP inauguration experience

`GROUP-0014` is a fully opt-in, first-class **MVP Inauguration & Post-MVP Lifecycle** collection. It contains 50 distinct published atomic rules: existing general QA, testing, release and compatibility guidance plus new, specifically scoped rules from the 27 MVP specimens. Four incoming specimens reused equivalent existing published rules instead of duplicating their normative effects. Inauguration requires project-specific acceptance, relevant runtime checks, owner approval and separately authorized release actions; group publication never inaugurates a separate project or auto-selects the profile's rules.

## C-to-Rust strict-port rule coverage and profiles

Three independent published atoms extend port guidance: `NOM-0111` compares upstream C and Rust observable behavior under equivalent inputs, `NOM-0112` isolates and verifies necessary unsafe/FFI boundaries, and `NOM-0113` inventories verified upstream-to-Rust capability coverage. Inputs `SPEC-0115`–`SPEC-0117` have independent processing/disposition records.

Two **draft** profiles select existing rules by ID: [Lite (41)](profiles/PROFILE-0001.json) and [Full (93)](profiles/PROFILE-0002.json). Both select all three new port rules and five public-private-information safeguards. Full additionally includes `NOM-0010` and `NOM-0068`–`NOM-0072` for permanent phase/milestone/task/feature emoji identities, numeric completion percentages, progress bars, overall progress and restrained completion reporting. Draft creation neither finalizes nor applies a profile.

## Profile catalog browsing

The static website now displays opt-in profiles alongside rules and groups with their stable PROFILE IDs, individually distinguishable day/night colors, draft/finalized status, and exact member counts. The dedicated Profiles-only type filter, Profile members selector and Browse members actions show each profile's selected independent rules. Viewing drafts never finalizes, activates or bulk-selects them; individual rule selections stay separate.

## Queue future profile ideas without processing

Nomos now supports an optional, **separate profile-idea intake queue**. Record an idea as `PROFILE-IDEA-0001` etc. with a short public-safe title, optional summary and unreviewed rule/group hints. Creating an idea does **not** process it, construct a rule selection, create a `PROFILE-*` draft, alter the website's active profile registry, or apply any instructions. No example ideas are automatically enqueued.

Use `node tools/profile_ideas.cjs list` to inspect the queue or `node tools/profile_ideas.cjs add --title "Example name"` to add a new item. The command only adds ideas. Details: [queues/profiles/README.md](queues/profiles/README.md). The queue is validated separately with `node tools/validate_profile_ideas.cjs`.

## Scoped conversational-safety screening rule

`NOM-0114` is a separately published opt-in prohibition against reflexive or repeated formulaic suicide-risk screening prompted only by ordinary frustration or historic difficulty, without credible new present-risk information. Its explicit exception preserves proportionate safety responses to materially new risk indicators. The public catalog contains only generalized wording; no private conversation text, personal examples, or account details were included. This rule is not auto-applied, and the six queued profile ideas remain unprocessed.

## Project-specific Tarium atoms (2026-10-22)

Fourteen additional independently selectable rules, `NOM-0115`–`NOM-0128`, encode Tarium-specific public governance requirements: standalone repositories, owner-controlled membership, strict private/public separation, project constitutions, complete ontologies, dual galleries, public-only reproducibility and integrations, clean externalization, publication review, enrollment preflight, ontology evolution, gallery integrity, and manifest consistency. They intentionally coexist with overlapping general rules. Their reviewed inter-rule links are recorded in `relationships/reviewed.json`; heuristic candidates are identified separately. Each has an independent processing record and retained draft candidate. No profile draft or membership operation is authorized or performed by this publication.

## Reviewed Tarium relationship dispositions (2026-10-22)

Five heuristic candidate edges concerning private/public separation, clean externalization, publication inspection, public dependencies and membership state have been examined and classified as **complements**. The reasons, former candidate labels, and distinct authorization boundaries are documented in [relationships/REVIEW-2026-10-22.md](relationships/REVIEW-2026-10-22.md). The canonical review results remain machine-readable in [relationships/reviewed.json](relationships/reviewed.json). A reviewed edge suppresses the duplicate heuristic candidate for its pair without altering the rule text or authority. No profile or membership operation was performed.

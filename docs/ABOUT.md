# Nomos public catalog

Nomos is a static, zero-dependency browser for typed atomic rules, reusable virtual groups, optional rule profiles and conservative relationship explanations. Visit the [public website](https://sguzman.github.io/nomos/).

A dedicated [situational prompt browser](situational-prompts.html) is independent of the ruleset composer. Its compact cards show identifying metadata, summary, and an immediate copy action; full metadata and prompt text stay behind a keyboard-accessible, initially collapsed disclosure. Only one metadata disclosure can be open at a time. Its records are not permanent rules, nor rule-profile selections; each lists an explicit invocation trigger and applicable/nonapplicable scenarios, intended work mode and handoff, provenance and hazards. Eight independent families now offer **three published versions each**, individually selectable and copyable, defaulting to the preserved v1; the original intake labels stay only in [the queued provenance](../queues/situational-prompts/README.md), not canonical prompt identities. Shortcut mappings belong to the user's launcher, not the prompt catalog.

## Browser capabilities

- Search, sort and filter rules by identity, domain, project applicability and publication status.
- Browse group members and selected rules in profiles without changing or applying them.
- Combine independently published rules in session-only selections.
- Inspect structured predicate, scope, bounds, provenance and potential interaction metadata.
- Preview, copy or export selected instructions for `AGENTS.md` and ChatGPT Custom Instructions.
- Switch between system, day and night appearances. Rule and group colors derive from stable, perceptually separated OKLab palettes.

A draft profile is reviewable, not selectable for bulk activation. Finalization, export, and eventual application each require explicit choices. The browser does not store accounts or persistent selections.

## Current ontology and catalog

The independently authored catalog contains **136 rules**, including historical draft examples. Its **14 virtual groups** remain optional. The **12 profile records** comprise existing C-to-Rust drafts plus Lite/Full proposals for new Rust projects, independent Tarium projects, Rust fork maintenance, C++-to-Rust ports and Python-to-Rust ports. No profile is automatically activated.

Project applicability is a controlled, overlapping hierarchy. Rust forks, C/C++/Python ports and Tarium projects can share more general project rules without making source-language-specific requirements interchangeable. A relationship suggestion is not proof of conflict, an override or authorization to act.

Six newly published fork-maintenance rules (`NOM-0129`–`NOM-0134`) are available separately from existing fork-profile selections. Two additional rules address required-user-action reporting and README organization. All eight preserve independent intake and processing history.

## Local preview and verification

The existing build is Python-based, with browser interaction and profile checks in JavaScript.

```sh
python3 tools/build_site_catalog.py
python3 tools/validate.py
python3 -m unittest discover -s tests -v
node tools/validate_profiles.cjs
node tools/validate_profile_ideas.cjs
python3 -m http.server 8000 -d docs
```

Open `http://localhost:8000/`. Direct `file://` navigation may block catalog loading. The GitHub Pages workflow regenerates catalog JSON and fingerprints browser assets before deployment; a build passing does not establish visual browser QA.

## Architecture and boundaries

`index.html`, `styles.css` and the JavaScript modules are static presentation assets; `tools/build_site_catalog.py` constructs the public data snapshot. The client uses no service backend, third-party trackers or browser storage. Changes to a page require build-and-deploy verification to detect stale assets.

The metadata-based analyzer surfaces conservative relation candidates; it does not adjudicate the full meaning of natural-language obligations. Keep source privacy and applicability restrictions intact, and do not treat opt-in catalog rules as automatic instructions.

For detailed governance and lifecycle information, consult [ONTOLOGY.md](../ONTOLOGY.md), [WORKFLOW.md](../WORKFLOW.md) and the [profile review guide](../profiles/REVIEW-2026-10-23.md).

## Formal situational ontology

The [ontology explorer](situational-ontology.html) displays 142 independently published concepts: forty-eight situations, seventy-two role-classified intents, eight reusable compositions, seven execution conditions, and seven evaluation dimensions. The [prompt version browser](situational-prompts.html) keeps eight compact family cards, allowing explicit v1/v2/v3 selection and copying for each family. Published family mappings describe *intended behavior*, not observed effectiveness; the evaluation registry remains empty until evidence is supplied.

## Comparative progress reporting

[Rule NOM-0137](../rules/NOM-0137.json) adds the previous verified percentage, current verified percentage, and signed percentage-point change for each applicable visual completion bar. Values must use a comparable acceptance-criteria basis; unknown or revised denominators cannot become fabricated progress claims. This is a standalone opt-in catalog rule, not an automatic chat instruction.

## Rule situations and intentions (2026-10-24)

The [rule semantics browser](rule-concepts.html) connects 137 source rules to independently reusable situations and intended outcomes. All links cite the original source rule text and preserve the original source identity and status; the unapproved rule `NOM-0002` stays draft. Search, filter by situation and intent, and open original rule and condition evidence. The new relationships do not narrow applicability, add normative authority, select any rule or profile, or represent empirical success.

# Nomos public showcase

This folder is a zero-dependency static application (HTML, CSS, JavaScript and JSON).

## Features

- Search across rule titles, IDs, statements and category metadata.
- Filter by domain or editorial status; browse scope, authority, provenance and normative metadata.
- Select multiple rules in session-only state, with no accounts or stored selections.
- Identify metadata-based potential conflicts and overlaps, without asserting full logical consistency.
- Preview, copy or download selected rules as `AGENTS.md` or `custom-instructions.txt`.
- Catalog rules stay distinct from unapproved specimen-processing candidates.

## Local preview

From repository root:

```sh
python3 tools/build_site_catalog.py
python3 -m http.server 8000 -d docs
```

Visit `http://localhost:8000/`. Direct file:// loading may block catalog fetch.

## GitHub Pages

The workflow at `.github/workflows/pages.yml` regenerates the catalog, validates and deploys only `docs/`. It does not prove that Pages is already enabled.

One-time setup if needed: **Settings → Pages → Build and deployment → Source: GitHub Actions**. When successfully deployed, the expected project-site URL is `https://sguzman.github.io/nomos/`; do not claim it is live before verification.

Alternatively choose branch-based publishing from `main` and `/docs` after regenerating and committing the snapshot.

## Boundaries

- Metadata similarity is not logical contradiction; natural-language nuance and source authorization require human review.
- Direct opposing norms over the same structured predicate and overlapping scope are flagged, and exports are paused until selection is revised.
- Generated instructions preserve scope but do not override higher-priority rules.
- Website selections are ephemeral user actions, not new ontology entities.
- No trackers, third-party services, private specimen content, or browser storage are used.

## Stable rule colors

Each rule's swatch is derived solely from its identifier by `rule-colors.js`.
Consecutive numbered rules take golden-angle steps through perceptually uniform
OKLCH hues with a namespace-specific starting offset. The same ID always
gets the same hue, independent of filtering, selection, or catalog order.
Day and night adjust lightness for the respective background. This is a
human-distinction heuristic, not a guarantee of unique colors for every
possible string; each swatch is always accompanied by its readable rule ID.

## Appearance

The top-right Theme dropdown offers System (default), Day, and Night. It changes
the entire interface immediately. System mode follows OS preference changes.
Choice is intentionally not persisted, so reload starts in System mode.
Vanilla JavaScript is retained solely for this browser-native presentation and
interaction layer; there is no separate non-Rust application backend.

## Catalog state and comparison limits

The public snapshot contains 13 catalog rules: 12 published and one original illustrative draft. Retained `processing/specimens/candidates/` files document proposal history and are not shown twice. A new rule is not an instruction until intentionally selected and exported.

`docs/reasoning.js` compares exclusive Cargo edition values, conditional time-dependent latest editions, and strong versus weak permissions. Without a known toolchain/edition, dynamic edition constraints remain conditional. This is not a general logical proof engine. JavaScript is used only for the static website's browser-native presentation and comparisons; no application backend exists.

## First-class virtual group browser

The public site displays eight first-class groups from `groups/GROUP-*.json`: seven atomic practice areas and an umbrella collection. Each has its own card, description, stable ID-derived OKLCH color, exact distinct published member count, search, **Browse members** and **Add all** controls. Group references are not copies of rule records; atomic rules remain separately searchable and selectable.

One-click **Add all** recursively follows child groups and deduplicates canonical rule IDs. Existing selection is preserved, unapproved/draft members are not added, and no user selection is persisted or exported until the user acts. The UI's `groups.js` expansion is tested separately from the Python catalog's cycle, relationship and membership validation. The meaning of a rule is never changed by group membership.

## Unified catalog search and group identity

Groups and atomic rules appear together in a single, title-sorted result list. One search field and **All items / Groups only / Rules only** filter serve both entity types. Status and domain/label filters are shared. **Browse members** narrows this same list; **Add all** retains each independent rule ID.

Group color applies its stable ID-derived OKLCH hue on the actual swatch parent and on its card accent. The previous hardcoded green CSS fallback could no longer override that identity. The separate group search and gallery have been removed.

## Sorting catalog results

The shared catalog provides a Sort dropdown independent of search and type filters. **Groups first · ID** is the default, followed by **Rules first · ID**, alphabetical name in both directions, canonical ID in both directions, and group member count (largest or smallest first). Group-size sorts place groups ahead of atomic rules, then sort rules by ID. Equal group sizes use stable IDs as tie-breakers; member counts include deduplicated eligible published rules, including nested subgroups. Reset restores the group-first default. Group membership and selected instructions are never changed by sorting.

## Perceptually separated identity palette (v2)

Golden-angle hue-only assignment was insufficient: IDs separated by Fibonacci-sized gaps acquired almost identical purple swatches. Each ID now selects a frozen palette slot selected by a gamut-aware, two-appearance **OKLab maximum-minimum-distance** process. Existing GROUP-0001–GROUP-0008 occupy the eight most separated opening slots. NOM-0001–NOM-0067 retain their established assignments; newer groups and rules occupy distinct, reserved unused slots. The rule/group ID remains the sole lookup key; catalog ordering does not change its colors. Each slot stores gamut-mapped day/night colors and its OKLCH hue. The finite palette cannot ensure unlimited uniqueness; new ID ranges need a palette version extension. Readable IDs remain mandatory.

## Sorting interaction and caching

Changing Sort rerenders the unified catalog, announces the current order beside the result count, and brings the filter bar into view instead of leaving a stale scrolled card anchoring the viewport. An integration regression test exercises the actual sort dropdown change event. The Pages build fingerprints CSS and JavaScript in their HTML URLs so a browser cannot silently pair new HTML with an old cached sorting script.

## Project management and porting groups

Five more groups are published: **Project Management & Development** (GROUP-0009), **Progress Reporting** (0010), **Completion Reporting** (0011), **Project Identity** (0012) and **Porting & Compatibility** (0013). The umbrella contains nine distinct new rules through its four child groups. They appear in the existing combined catalog and work with the same search, type, sort, filter, Browse members and Add all actions as other groups. Completion-reporting rules are independent so that first-time 100% announcements are kept separate from their later suppression.

Identity colors preserve all earlier NOM-0001–NOM-0067 and GROUP-0001–GROUP-0008 assignments. The five new groups are allocated perceptually separated unused palette positions, with other distinct slots assigned to NOM-0068–NOM-0076. The remaining palette is finite, so unseen future IDs may require a documented extension.

## Normative quantification and bounds

Rule details now show structured quantity, logical interpretation, frequency, numeric limits, source cue and evidence status from `norm.bounds`. This is separate from the prohibition/permission/obligation kind and action predicate. Historical entries with no reviewed quantifier are marked `unresolved` instead of having “never”, “always”, “any”, or “all” guessed from vague language. Exported instructions include resolved quantification when meaningful. Tests cover internal consistency and conservatively detectable numeric interval conflicts. See [ONTOLOGY.md](../ONTOLOGY.md).

Reviewed quantifiers also appear as small **Bounds:** tags on rule cards and are indexed by catalog search. Unreviewed entries are not misleadingly given categorical badges; their detail metadata explicitly identifies unresolved semantics.

## Expanded reviewed catalog

The site lists 110 distinct rules and 14 independently selectable virtual groups, including the 50-rule `GROUP-0014` MVP graduation and maintenance collection. Named browser-version restrictions and local YAML-job rules are individually addressable. "Add all" expands only published group members when explicitly selected; no project is changed by viewing or exporting a catalog. Profile presets remain a separate, empty, optional registry. Browser visual QA has not been performed by these automated checks.

## Optional profile presets in the unified browser

Both user-approved C-to-Rust draft presets now appear in the same searchable catalog as groups and rules, with stable independent PROFILE IDs and day/night identity colors, member counts, status, and Browse members. The Item type supports Profiles only, and the Profile members selector filters the rule list to that preset's canonical published membership. No profile is auto-applied, exported or finalized by browsing; draft cards intentionally omit bulk Add all. A finalized profile can offer Add all after a deliberate click, while individual rules remain independently selectable. The website only contains public-safe profile metadata and source-approved rule IDs.

Two additional dedicated fixed color slots were added for PROFILE-0001 and PROFILE-0002 without altering existing group/rule identity assignments. Browser and build checks cover profile search, membership, color separation and draft selection boundaries.

## Project scope and reviewable relationships
Rules may carry a controlled `scope.project_types` facet independent of category. The Project applicability filter lists rules **explicitly** scoped to the selected project type; general-purpose rules remain discoverable through All project types. Each rule's View metadata dialog shows a navigable relationship graph: reviewed links and evidence-based heuristic suggestions are distinguished. An inferred edge is a candidate for human review, not an automatic equivalence, rule override, conflict resolution, or instruction selection. Composer analysis shows relationship suggestions without silently blocking exports.

## Retrospective classification

The first 114 rules were audited individually. The site now supports project-type inheritance: choosing Tarium shows explicit Tarium rules plus any rules classified for its `project` parent. Choosing a Rust fork includes explicit `rust_project`, `software_project`, and `project` requirements. Universal `any` rules remain browsable under All, rather than silently added to a selection. These overlapping project types do not imply a rule conflict by themselves.

## Domain directory

The catalog has a collapsed, browsable directory of controlled domains grouped into seven families. Each domain displays a live rule count and filters the existing rule registry when chosen. The family selector and project applicability selector are independent; neither acts on the rule composer or changes selection. Domain definitions live in `taxonomy/domains.json`. Generic projects may span several domain families and specific project contexts.

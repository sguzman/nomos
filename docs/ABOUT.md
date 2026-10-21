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

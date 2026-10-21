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

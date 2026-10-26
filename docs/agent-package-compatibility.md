# Nomos agent package compatibility and rollback

**Scope:** the derived projection and packaged-agent output. This describes the current `schema_version: 1` compatibility boundary; it does not approve or install a profile or guarantee Codex behavior.

## Independent version domains

| Artifact | Current versioning | Compatibility requirement |
| --- | --- | --- |
| Canonical rule | Stable `NOM-*` ID plus semantic `version` and SHA-256 canonical-source fingerprint | A changed source rule must not be smuggled into an existing projection; rebuild and obtain review |
| Rule profile | `PROFILE-*` identity, semantic `version`, separate selection/finalization approvals | Unconfirmed drafts remain preview-only |
| Project context | `kind: project_context`, `version: 1.0.0` | Reject unsupported versions and unknown typed input fields |
| Projection | `kind: rule_projection`, `schema_version: 1` and pinned `registry_revision_sha256` | Recompute decisions; reject unsupported versions, tampered evidence, and unapproved projections |
| Agent package manifest | `kind: nomos_agent_package`, `schema_version: 1`, `agent_target` | Reject unsupported major formats and missing path/hash/coverage data |
| Skills/agent adapter | `agent_target: codex` or `generic`; target capability tests remain independent | Never infer Skill discovery from a generated folder or a passed metadata test |

No implicit migration from a future projection or package schema. A new format needs an explicit converter with two-way test fixtures and an owner-reviewed export; until then, the old tool should refuse the new artifact.

## Identity, comparisons and change review

The projection pins its full catalog revision hash, its explicitly selected source rule IDs and a digest of their canonical fingerprints. The package manifest separately pins projection, registry and selection hashes, and per-file checksums. These hashes detect drift but **do not cryptographically authenticate owner consent**.

To compare two exports, independently verify each pinned package first, then use:

`node tools/agent_package_diff.cjs <previous-package-dir> <candidate-package-dir>`

The tool lists changes to rule membership/location, module files, phase routes and source identity without editing either directory. An unchanged source-rule list alone does not establish package identity: module rendering, routing, versions, and context can differ.

## Safe adoption, upgrades and rollback

1. Generate a proposed package into a fresh, explicitly chosen staging directory. The installer defaults to dry run and refuses collisions, symlink destinations and existing `AGENTS.md`. Use the confirmation flag only after the user authorizes the exact destination and proposed changes.
2. Verify it with the bundled `node .nomos/verify.cjs` in the installed project directory (or another local checksum implementation if Node is unavailable). This checks structure, source-linked fingerprints and file contents without using a network connection.
3. Review the difference from the last verified package. Do not automatically replace project-specific `AGENTS.md`, remove unselected instructions or mutate live user project data.
4. For an upgrade, preserve the previous complete, verified directory as a read-only rollback candidate; install the new package in a separate clean destination and switch consumption only with explicit authorization.
5. To roll back, verify the preserved previous package again, then explicitly switch the agent's entrypoint/destination back. If the previous bundle is missing, stale, invalid or incompatible with the project, stop instead of synthesizing a historical rule selection.
6. Record previous/new registry hashes, package hashes, target variant, approved decision, verifier output and any unsupported environment or behavior. No automatic background updates or self-upgrade.

These steps deliberately avoid in-place replacement today. Transactional upgrades, source signatures and a live Luna read/behavior audit remain future gates, not implicit capabilities of a standalone JSON or Markdown export.

## Evidence and refusal matrix

| Situation | Required response |
| --- | --- |
| Draft or selection-unconfirmed profile | Preview only, never approved agent export |
| Incomplete project context / material normative conflict | Block approval/export and explain the unresolved source IDs |
| Unknown schema, target or required field | Refuse; do not silently map to defaults |
| Altered module, projection or manifest checksum | Fail the package integrity check |
| Existing destination file, symbolic link or unsafe generated path | Refuse before mutation |
| Missing previous version during rollback | Stop; do not infer history from current catalog |
| CI green but no actual agent execution | Report mechanical verification only, not production readiness |

**Maintenance contract:** a release can only claim compatibility with tested agents, browsers, source formats and environments. Model-generated promises are not execution evidence. The unresolved production gate requires recorded real agent/module-read traces, successful target Rust behavior, independent review and explicit readiness classification.

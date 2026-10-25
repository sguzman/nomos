# Rust Fork Maintenance and Independent Tarium Project — coverage remediation

Authorized on 2026-10-25 for the two remaining Nomos profile families. This is **profile ontology remediation**, not a change to any individual fork, private project, public dataset, Tarium membership, or system state.

## Existing rules reused without duplication

**Rust Fork Maintenance** already had six published dedicated obligations `NOM-0129`–`NOM-0134` governing source baseline, upstream divergence, patch provenance, conflicts, verification and selective adoption. These were absent from both fork presets: five are now selected by Lite and all six by Full. No duplicates were published for those six concerns.

**Independent Tarium Project** already had fourteen dedicated governance, privacy, ontology and gallery obligations (`NOM-0115`–`NOM-0128`). These remain intact. Existing testing, round-trip integrity, compatibility, smoke-check and documentation rules were reused where applicable.

## Eight additional conditional atomic obligations

| Rule | Family | Verified coverage gap |
| --- | --- | --- |
| `NOM-0236` | Fork | advisory disposition |
| `NOM-0237` | Fork | reversible upstream sync |
| `NOM-0238` | Fork | release source traceability |
| `NOM-0239` | Fork | upstream notice continuity |
| `NOM-0240` | Tarium | asset redistribution rights |
| `NOM-0241` | Tarium | public checkout operability |
| `NOM-0242` | Tarium | derivation reproducibility |
| `NOM-0243` | Tarium | schema conformance validation |

Fork rules apply only to authorized upstream-maintenance actions and the stated security, release, migration or redistribution circumstances. Tarium rules apply only to explicitly authorized public resources and the declared workflow or schema. No public resource is acquired or published by adding a rule to Nomos.

Each new rule has its own review intake, closed processing trace, pinned canonical rule blob, rule-to-concept link and crosswalk. Eight situations (`SITU-0090`–`SITU-0097`) and eight intents (`INTENT-0132`–`INTENT-0139`) were added and reconciled with existing ontology concepts.

## Resulting descriptive profiles

| Profile | Rules before | Rules after | Situations | Intents | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Rust Fork Maintenance Lite (`PROFILE-0007`) | 34 | 43 | 20 | 29 | Draft; not confirmed |
| Rust Fork Maintenance Full (`PROFILE-0008`) | 89 | 102 | 34 | 48 | Draft; not confirmed |
| Independent Tarium Lite (`PROFILE-0005`) | 29 | 36 | 18 | 25 | Draft; not confirmed |
| Independent Tarium Full (`PROFILE-0006`) | 61 | 76 | 31 | 41 | Draft; not confirmed |

No other profile family has had its membership changed. Earlier rule analyses and the completed C, C++, Python and new-Rust-project audits remain intact.

## Evidence and limits

The [machine-readable coverage review](remaining-profile-coverage-2026-10-25.json) records rejected duplicates and accepted atoms; the [manifest](remaining-profile-remediation-manifest-2026-10-25.json) records exact rule selections. Structural coverage is not proof of behavior for any deployed fork or individual public Tarium project. All profiles remain opt-in; no finalization, activation, project enrollment or upstream synchronization occurred.

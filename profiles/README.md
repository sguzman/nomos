# Optional rule profiles

Nomos contains **12 explicitly authorized provisional rule-profile drafts** across six Lite/Full families. These are inert selections, not defaults, finalized instructions, or automatic exports. The exact previous rule-first versions remain under [historical baselines](history/2026-10-25-rule-first/), including prior approval flags for the two original C-to-Rust selections. All **revised** selections require fresh owner review and confirmation.

A profile is neither a virtual group nor a new rule. Permission to instantiate a provisional draft is not approval of its exact canonical rule IDs. Owner confirmation of the selection, explicit finalization, and later use/export are separate decisions. See [profile workflow](../PROFILE_WORKFLOW.md) and [schema](../schema/profile.schema.json).

## Current situation-first and intent-first revisions

| Profile | Focus | Version | Rules | Linked situations | Linked intents |
| --- | --- | --- | ---: | ---: | ---: |
| [PROFILE-0001](PROFILE-0001.json) | C → Rust · Lite | 1.2.0 | 64 | 30 | 45 |
| [PROFILE-0002](PROFILE-0002.json) | C → Rust · Full | 1.2.0 | 125 | 43 | 58 |
| [PROFILE-0003](PROFILE-0003.json) | New Rust project · Lite | 0.3.0 | 45 | 25 | 33 |
| [PROFILE-0004](PROFILE-0004.json) | New Rust project · Full | 0.3.0 | 106 | 39 | 55 |
| [PROFILE-0005](PROFILE-0005.json) | Independent Tarium project · Lite | 0.3.0 | 36 | 18 | 25 |
| [PROFILE-0006](PROFILE-0006.json) | Independent Tarium project · Full | 0.3.0 | 76 | 31 | 41 |
| [PROFILE-0007](PROFILE-0007.json) | Rust fork maintenance · Lite | 0.3.0 | 44 | 21 | 30 |
| [PROFILE-0008](PROFILE-0008.json) | Rust fork maintenance · Full | 0.3.0 | 103 | 35 | 49 |
| [PROFILE-0009](PROFILE-0009.json) | C++ → Rust · Lite | 0.3.0 | 61 | 33 | 46 |
| [PROFILE-0010](PROFILE-0010.json) | C++ → Rust · Full | 0.3.0 | 126 | 46 | 62 |
| [PROFILE-0011](PROFILE-0011.json) | Python → Rust · Lite | 0.3.0 | 59 | 28 | 39 |
| [PROFILE-0012](PROFILE-0012.json) | Python → Rust · Full | 0.3.0 | 132 | 42 | 58 |

Each profile has two [inert, source-linked companions](companions/README.md). Their selected-rule-derived members are descriptive: inclusion does not prove atomicity or authorize activation.

The [semantic-first review](../audits/profile-vnext-situation-intent-review-2026-10-25.md) and [machine-readable inventory](../audits/profile-vnext-semantic-inventory-2026-10-25.json) classify **all 97 situations and 139 intents against all twelve profiles**. An available but unselected rule does not imply its concept is applicable to that project. Seven situations and fifteen intents have no canonical source-rule link; they remain contextual concepts, not invented requirements. The revisions reuse published rules when justified and exclude the competing fixed-edition rule `NOM-0013` where `NOM-0012` is selected.

Run `node tools/validate_profile_vnext_semantics.cjs --matrix` to inspect exhaustive reverse classification and verify historical source hashes, exact rule-selection changes, companion provenance, and unconfirmed review status. CI runs these checks.

For chronological background, see [initial Rust/Tarium review](REVIEW-2026-10-22.md) and [port review](REVIEW-2026-10-23.md).

# Situation-first and intent-first revision of all twelve Nomos rule profiles

**Date:** 2026-10-25. All twelve existing profiles now have provisional revised versions with their prior exact file contents archived under `profiles/history/2026-10-25-rule-first/`.

## Why new rules are not automatically justified

Nomos contains **97 formal situations and 139 formal intents**, not 236 automatic rule requirements. Of these, 90 situations and 124 intents have source-to-rule mappings. Seven situations and fifteen intents are older conversation-workflow contexts and objectives without canonical rule-to-concept links. They are still in the ontology and are counted in the exhaustive reverse-coverage matrix; they are **not silently transformed into new normative rules**.

The semantic-first revision reused four independently published obligations without creating a new canonical rule: `NOM-0008` (Rust implementation preference), `NOM-0135` (actionable handoffs), `NOM-0136` (README usability), and `NOM-0137` (auditable comparative progress). Existing `NOM-0012` already requires the newest compatible Cargo edition. The competing fixed-2024 edition rule `NOM-0013` was explicitly rejected for these versions. Their selection is conditional on actual work context. The Tarium profiles received no newly selected rules because no additional independently justified general rule was established by this pass.

## Versions and approvals

| Profile | Previous rules | Revised rules | Situations | Intents |
| --- | ---: | ---: | ---: | ---: |
| PROFILE-0001 | 61 | 64 | 30 | 45 |
| PROFILE-0002 | 121 | 125 | 43 | 58 |
| PROFILE-0003 | 45 | 45 | 25 | 33 |
| PROFILE-0004 | 106 | 106 | 39 | 55 |
| PROFILE-0005 | 36 | 36 | 18 | 25 |
| PROFILE-0006 | 76 | 76 | 31 | 41 |
| PROFILE-0007 | 43 | 44 | 21 | 30 |
| PROFILE-0008 | 102 | 103 | 35 | 49 |
| PROFILE-0009 | 58 | 61 | 33 | 46 |
| PROFILE-0010 | 122 | 126 | 46 | 62 |
| PROFILE-0011 | 56 | 59 | 28 | 39 |
| PROFILE-0012 | 128 | 132 | 42 | 58 |

The older C profile selections had explicit confirmation; **only the archived selections retain that historical confirmation**. The two newly edited C drafts, like the ten others, remain unconfirmed and unfinalized. A rule profile does not apply or export instructions merely because it exists.

## Exhaustive concept inventory, not false blanket applicability

`node tools/validate_profile_vnext_semantics.cjs --matrix` traverses **all 97 situations and all 139 intents for each of the twelve profiles**, recording each concept as:

- `selected_rule_linked`: at least one source-reviewed canonical rule was selected and maps to the concept;
- `available_but_not_selected`: source rules exist, but are not selected; this is **not a determination that those rules should be selected**;
- `unlinked_workflow_context`: no canonical source rule links to the concept, so it remains descriptive conversation context rather than an implied obligation.

This avoids falsely equating "full set" with selecting every rule or attaching every situation to every profile. The validator also checks the retained historical source SHA for each archived revision, exact added-rule membership, original-rule retention, strict source-blob provenance in companions, and complete concept enumeration.

**Bounded conclusion:** The twelve profiles now have explicit, reviewable vNext versions and exhaustive **structural** situation/intent coverage accounting. Project-by-project semantic applicability and empirical acceptance remain separate from this catalog-wide review. No rule was invented, finalized, activated, or applied to an external project.

# End-consumer prompt profiles — initial roadmap

**Status:** V0 imported and verified; ten V1 semantic drafts ready for owner review. Evaluation and rewrite stages have not begun.  
**Scope:** New, explicitly authorized **public** Nomos feature. Separate from the completed 69/69 agent-consumption engineering roadmap.  
**Product:** The **prompt itself** is the end result. Meta-intent, atomic intents, situations, rules, conditions and evaluation evidence are the tools used to improve that prompt, not its substitute.

**First profile:** Project Stewardship, sourced from the owner's existing Trievium keyset with **10 independent prompt slots**: `J` Continue; `L` Chat broke; `S` Restore context; `H` What happened?; `D` Project init; `K` Status; `A` Project adopt; `F` Fix issue; `G` Gap audit; `U` Verify work. Keep stable prompt identities distinct from movable keyboard shortcuts.

## Measured progress (2026-10-27)

**Overall: 2/5 milestone gates verified = 40.0%** (previous 20.0%; **delta +20.0 percentage points**). Five milestones are equal-weight *acceptance gates*, not a count of lines of code. V0 and draft V1 semantic enrichment are complete; **none of the inferred meta-intents has been approved by the owner, no formal owner-approved satisfaction evaluation has started, and no V0 text has been changed**. Website browsing and keyset export are in progress, not complete.

**Evidence:** [exact owner-authorized source](../end-consumer-profiles/project-stewardship/v0/trievium.json), [stable V0 profile](../end-consumer-profiles/project-stewardship/profile.json), [schema](../schema/end-consumer-profile-v0.schema.json), [ten-slot checksum and byte-equality tests](../tests/test_end_consumer_profiles.cjs), [public website directory](end-consumer-profiles.html), [downloadable Trievium export](exports/project-stewardship-v0.json), and [successful initial V0 CI](https://github.com/sguzman/nomos/actions/runs/40611001145). Source and downloadable export have the identical Git blob SHA-1 `11c1545fa0ac05b9f49bce83ab0ad3f3f539051b`. The profile text was screened for obvious token, email and absolute-user-path patterns before publication. No semantics were inferred, no text was rewritten, and no prompt was invoked.

**V1 evidence:** [ten prompt-specific semantic reviews](../end-consumer-profiles/project-stewardship/v1/analysis.json) with 51 proposed local atomic objectives, links to 21 published intent concepts, 16 published situations, 23 published rules and six existing conditions. [Cross-reference integrity and public review tests](../tests/test_end_consumer_v1.cjs) reject missing IDs, inaccurate source links and unauthorized prompt selection. [Public browser](end-consumer-profiles.html) exposes each draft's meta-intent, objectives, concepts, coverage gaps, and unchanged V0 wording on demand. No catalog entries were newly created or silently selected.

**Preliminary text reviews complete as proposals:** All ten original prompts have independently source-linked, [text-only assessments](../end-consumer-profiles/project-stewardship/v1/evaluations/), recording atomic-intent coverage, prerequisites and failure conditions. `J` Continue, `L` Chat broke, `S` Restore context, `H` What happened?, `D` Project init, `K` Status, `A` Project adopt, `G` Gap audit and `U` Verify work provisionally satisfy their scoped proposed meta-intents (some only when inherited context is available). **`F` Fix issue has a preliminary 'no'** against the V1 objective requiring verified non-regression: its V0 wording asks for verification and preservation but does not explicitly require regression-path testing. F is a *proposed* targeted-refinement candidate, not an approved rewrite. **No owner-approved meta-intents, no formal satisfaction decisions, no observed behavioral effectiveness, no replacement versions, and no changes to any original V0 prompt.** Milestone gates remain **2/5 = 40.0%, delta +0.0 percentage points**. Next: owner review, decisions on any needed targeted revisions, and the versioned website/export workflow. Last successful [CI and deployment](https://github.com/sguzman/nomos/actions/runs/40615751074) covered the first seven preliminary records; await CI on the final three.

**Next real gate:** The owner examines each V1 meta-intent and asks for a satisfaction assessment of a specific V0 prompt. Do not preemptively mark every original prompt satisfactory or replace text; analyze gaps and generate revisions only when requested.

## 1. 📥 V0 — faithful public ingestion
- [x] Create a minimal **end-consumer profile** and ten prompt categories/slots with stable identities.
- [x] Import each source **key, name/label, and complete prompt text exactly as provided**. Preserve emoji, whitespace and wording; do not rewrite, normalize or silently merge prompts.
- [x] Validate ten unique keys, source-to-import fidelity and original version snapshots. Publish the approved prompt content only after screening the input for secrets or unrelated nonpublic material.

**Done when:** V0 can be reconstructed byte-for-byte (including the original Trievium fields) and every imported prompt can be inspected individually. No ontology analysis is required for V0.

## 2. 🧠 V1 — semantic enrichment, prompt by prompt
- [x] For each prompt identify its **meta-intent** (the user's high-level desired outcome) and decompose it into typed **atomic intents**, **situations**, **rules**, prerequisites, exceptions and stopping conditions.
- [x] Cross-reference existing Nomos objects before proposing missing concepts. Record traceable links, coverage, conflicts and gaps; do **not** silently publish or alter canonical rules/ontology to make a prompt look complete.
- [x] Preserve the V0 prompt unchanged while presenting the V1 semantic model for owner inspection and editing.

**Done when:** All ten prompts have individually reviewable semantic coverage and clearly identified uncertainties. Semantic enrichment alone does not require generating replacement wording.

## 3. ⚖️ Evaluate each prompt against its meta-intent
- [ ] Answer **yes/no** (or explicitly **insufficient evidence**) to: *Does the current prompt satisfactorily fulfill the agreed meta-intent?*
- [ ] Explain coverage, missing cases, contradictions and failure modes. Distinguish text-level semantic review from observed results in actual agent runs.
- [ ] A **yes** preserves the selected prompt version; a **no** identifies concrete gaps and starts targeted refinement. Never declare success merely because every ontology field is populated.

**Done when:** Each evaluated prompt has a recorded decision, rationale and any available test evidence. Unevaluated prompts remain clearly marked.

## 4. 🔁 Iterate and synthesize improved prompts
- [ ] Repair documented gaps by refining linked rules, situations and atomic intents (or proposing new independently reviewable concepts when truly missing).
- [ ] **Generate a new prompt version downstream from the revised semantic model**, keeping its meta-intent stable unless the owner explicitly changes it.
- [ ] Compare versions; test applicable scenarios, including failure and stop conditions; retain older versions and let the owner select the preferred revision.
- [ ] Repeat only while material gaps remain. **Stop when satisfactory**; never invent extra iterations or claim unobserved reliability.

**Done when:** The owner can keep any satisfactory current version or review a newly synthesized version with traceable reasons for every meaningful change.

## 5. 🌐 Public website and Trievium export
- [ ] Expose profile → categories/slots → prompt versions on the Nomos website, beginning with **V0 browsing** and expanding to V1 meta-intents, linked rules/situations/intents, gaps, evaluations and version comparison.
- [ ] Allow explicit selection, copy and download of the current prompt version. Public visibility **does not** automatically invoke a prompt, select a rule profile, or authorize repository changes.
- [ ] Export the selected slots to the **existing Trievium JSON structure**: `{"version":1,"entries":[{"label":"…","text":"…","key":"J"}]}`. Preserve key/label/text exactly, validate uniqueness and round-trip fidelity.
- [ ] Add automated schema/link checks, site/browser checks and exporter tests before marking the feature done.

**Done when:** A visitor can inspect each prompt and its reasoning on the public website, while the owner can download a valid Trievium keyset of explicitly selected versions without altering the canonical Nomos source objects.

## Workflow and boundaries

**Sequence:** V0 ingestion → V1 enrichment → prompt-specific satisfaction review → targeted revisions as needed → selected versions for public browsing and Trievium export. Website visibility begins at V0 rather than waiting for every prompt to pass review.

**Authorization:** Creating this roadmap authorizes **planning only**, not immediate import, ontology publication, profile activation or iterative rewriting. The owner has requested the intended profile and its prompts to be public, subject to the existing no-secrets/no-unrelated-private-content boundary. V0, V1 and later revisions are separately identifiable and never overwrite one another.

**Progress:** Start tracking this feature when implementation begins, with acceptance evidence for each milestone. Do **not** reopen, dilute or recalculate the earlier completed 69/69 agent-consumption roadmap.

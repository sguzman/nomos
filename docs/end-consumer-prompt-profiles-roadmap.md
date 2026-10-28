# End-consumer prompt profiles — initial roadmap

**Status:** Planned (roadmap only; no prompts imported yet).  
**Scope:** New, explicitly authorized **public** Nomos feature. Separate from the completed 69/69 agent-consumption engineering roadmap.  
**Product:** The **prompt itself** is the end result. Meta-intent, atomic intents, situations, rules, conditions and evaluation evidence are the tools used to improve that prompt, not its substitute.

**First profile:** Project Stewardship, sourced from the owner's existing Trievium keyset with **10 independent prompt slots**: `J` Continue; `L` Chat broke; `S` Restore context; `H` What happened?; `D` Project init; `K` Status; `A` Project adopt; `F` Fix issue; `G` Gap audit; `U` Verify work. Keep stable prompt identities distinct from movable keyboard shortcuts.

## 1. 📥 V0 — faithful public ingestion
- [ ] Create a minimal **end-consumer profile** and ten prompt categories/slots with stable identities.
- [ ] Import each source **key, name/label, and complete prompt text exactly as provided**. Preserve emoji, whitespace and wording; do not rewrite, normalize or silently merge prompts.
- [ ] Validate ten unique keys, source-to-import fidelity and original version snapshots. Publish the approved prompt content only after screening the input for secrets or unrelated nonpublic material.

**Done when:** V0 can be reconstructed byte-for-byte (including the original Trievium fields) and every imported prompt can be inspected individually. No ontology analysis is required for V0.

## 2. 🧠 V1 — semantic enrichment, prompt by prompt
- [ ] For each prompt identify its **meta-intent** (the user's high-level desired outcome) and decompose it into typed **atomic intents**, **situations**, **rules**, prerequisites, exceptions and stopping conditions.
- [ ] Cross-reference existing Nomos objects before proposing missing concepts. Record traceable links, coverage, conflicts and gaps; do **not** silently publish or alter canonical rules/ontology to make a prompt look complete.
- [ ] Preserve the V0 prompt unchanged while presenting the V1 semantic model for owner inspection and editing.

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

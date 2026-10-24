# Situational instruction ontology — intake only

**Six linked ontology proposals are queued. Nothing here is processed, published as a new ontology object, activated, or installed in a prompt.** This intake captures the design direction for separating a prompt's purpose from its particular wording.

| Proposal | Candidate content | Count |
| --- | --- | ---: |
| [SITO-IDEA-0001](SITO-IDEA-0001.json) | Situations and composite circumstances (S1–S8) | 8 |
| [SITO-IDEA-0002](SITO-IDEA-0002.json) | Atomic-intent hypotheses (I1–I19) | 19 |
| [SITO-IDEA-0003](SITO-IDEA-0003.json) | Eight situation/intent families mapped to existing SIT IDs | 8 |
| [SITO-IDEA-0004](SITO-IDEA-0004.json) | Prompt implementation and immutable version lineage for eight families | 8 |
| [SITO-IDEA-0005](SITO-IDEA-0005.json) | Execution conditions and handoff gates (C1–C7) | 7 |
| [SITO-IDEA-0006](SITO-IDEA-0006.json) | Evaluation facets (E1–E7), not results | 7 |

## Proposed formal object distinctions

The intended future formal kinds are **Situation**, **Atomic Intent**, **Intent Composition/Family**, **Prompt Version**, and **Outcome Evaluation**. Execution constraints/conditions are deliberately queued for classification review rather than asserted as a sixth kind.

A possible relation is *situation(s) + intended outcome(s) + applicable execution constraints → composition/family → one or more separately versioned prompt implementations → evidence-backed evaluation*. This is a **design proposal**, not yet part of the canonical Nomos ontology.

The eight original situations are initial classification **hypotheses**. S8 is a proposed composite of S3, S6, and S7; S5 may be better represented as a stopping condition rather than a distinct atomic situation. The 19 intents are likewise candidates; some may ultimately be methods, reporting obligations, or constraints, rather than genuinely atomic goals. These uncertainties must be resolved during separately authorized processing.

The eight composition proposals reference existing canonical `SIT-0001`–`SIT-0008` families and present an **aggregate** union of concerns across three generations. **Do not infer** that every listed intent occurs in every version. In particular, later wordings for `SIT-0006` and `SIT-0007` introduce execution requests absent from their reinforcement-only published v1 form.

## Version preservation

- Published `SIT-0001`–`SIT-0008` **v1.0.0** must stay independently accessible.
- Queued `SIT-REV-xxxx-02` and `SIT-REV-xxxx-03` remain separate **v2.0.0** and **v3.0.0** proposals. They are not processed, published, or promoted by this intake.
- A future family/version identity must not overwrite, delete, or silently replace a previous generation, and newer versions must not auto-select themselves.
- Rich ontology metadata must **not automatically append instructions** to short prompt texts.

## Evaluations are evidence, not invented outcomes

The evaluation proposal distinguishes *declared intents*, *observed behavior*, *supporting evidence*, *per-intent assessment*, *potential tradeoffs*, and *unknown outcomes*. Merely writing a prompt does not establish its effectiveness, and tool/runtime restrictions must not be misdiagnosed as wording failures. **No experiment or effectiveness result is asserted in these records.**

## Governance

This intake was explicitly requested on 2026-10-24. All six records have `status: queued`, `processing_authorized: false`, `publication_authorized: false`, and `auto_apply: false`. Their IDs are **intake IDs**, not final ontology IDs. Existing canonical prompts, original intake records, revision proposals, and the public website are intentionally unchanged.

Validation: `python3 tools/validate_situational_ontology_queue.py` plus the repository test suite. The schema is `schema/situational-ontology-idea.schema.json`.

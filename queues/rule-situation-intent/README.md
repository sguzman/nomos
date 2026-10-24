# Rule-to-situation and intent analysis queue

**Completed authorized study — 137/137 source rules processed.** This is a dedicated queue for the later study of Nomos's existing canonical rule catalog. It is distinct from the specimen, task, profile, situational-prompt, and ontology queues.

The intake snapshot is commit `ab9b06e947284dab83fe19519be21dc1b0ad5051` on 2026-10-24. It contains **136 published rules** and **one draft rule (`NOM-0002`)**. Every canonical `rules/NOM-xxxx.json` file has exactly one self-contained `RIA-xxxx.json` queue record, with the same four-digit suffix. Each records its rule ID, path, semantic version, editorial status at snapshot, source Git blob SHA, and snapshot commit. This pins the source used for future analysis without copying full rule wording into intake.

## Scope of the completed examination

When **separately authorized**, review each rule's statement, normative predicate, conditions, exceptions, applicability and existing metadata to propose:

1. **Situations** — circumstances in which the rule matters; distinguish explicit applicability from illustrative, inferred use cases. Never silently narrow a rule's scope.
2. **Intentions** — desired outcomes behind the rule; separate actual atomic goals from methods, constraints, stopping conditions and reporting obligations.
3. **Reusable concepts** — match proposed situations and intentions to existing formal objects before suggesting new ones. Represent composites and aliases explicitly instead of creating duplicates.
4. **Evidence-backed candidate links** — explain why a situation or intention is associated with a particular rule and retain uncertainty or negative findings.
5. **Review and publication decisions** — independently approve ontology additions and metadata relationships. Publication of a concept or relationship must not rewrite a rule, add a profile member, or apply an instruction automatically.

The authorized workflow produced 137 separate processing traces under `processing/rule-situation-intent/`, 137 source-evidenced records under `ontology/rule-links/`, and a reviewed crosswalk under `ontology/rule-analysis/`. Forty new situations and 53 new intents were normalized. No original rule text, rule status or profile selection was changed.

## Lifecycle and provenance

- `status: processed` records completion of the authorized study; the independent processing trace identifies the subsequent authorization.
- `processing_authorized`, `normalization_authorized`, `publication_authorized`, `canonical_rule_edit_authorized`, and `profile_edit_authorized` remain **false as historical intake-time permissions**; the separately attached processing traces document the later approval.
- The source Git blob is pinned to the specified snapshot. If a canonical rule changes later, the queue remains historically valid; authorized processing must detect and explicitly reconcile source drift, not silently replace the recorded snapshot.
- The draft record `NOM-0002` is included for completeness, but queueing does not approve publication of that rule or any concept extracted from it.
- Processing records and reviewed outputs were created after explicit owner authorization. The queue was not automatically drained or applied.

The [intake schema](../../schema/rule-situation-intent-intake.schema.json), [integrity validator](../../tools/validate_rule_situation_intent_queue.cjs), and [queue tests](../../tests/test_rule_situation_intent_queue.cjs) protect coverage, source identity, queue-only authorization and the absence of prefilled analysis. Run `node tools/validate_rule_situation_intent_queue.cjs` to check the snapshot and report any source drift.

## Published descriptive results

The [rule semantics browser](../../docs/rule-concepts.html) filters all 137 rule sources by relevant situations and intended outcomes. The 136 published source rules and one draft source (`NOM-0002`) preserve their original editorial statuses. Context links do not narrow normative scope, and intent links do not create additional commands. The new ontology contains 48 situations and 72 intent records. Validation: `python3 tools/validate_rule_situation_intent_links.py`.

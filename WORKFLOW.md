# Independent specimen and task workflows

A **specimen** is a small public-safe input proposed for rule/category extraction. A **task** is a proposed unit of work on the Nomos project. Neither is automatically an instruction to act.

## Four independent stores

| Store | Example states | Outputs | Forbidden assumption |
| --- | --- | --- | --- |
| `queues/specimens/` | proposed, eligible, deferred, rejected | Selected specimen pointer | Queued means being processed |
| `processing/specimens/` | analyzing, normalized, incomplete, closed | Candidate rule/category or rejection with trace | Processing means publish or create task |
| `queues/tasks/` | proposed, ready, deferred, cancelled | Approved, scoped work request | Queued means being executed |
| `processing/tasks/` | active, blocked, verifying, done, failed | Verified deliverable and evidence | Work is done because an answer says so |

Each store has independent item identifiers and audit history. Transitions should name the item, actor, reason, and date. Record links between stores as references rather than converting an existing item into another kind.

## Explicit boundaries

- `specimen queue -> specimen processing` requires a decision to examine that particular specimen.
- `specimen processing -> catalog rule` requires normalization and review; the candidate never becomes an applied instruction automatically.
- `specimen processing -> task queue` is optional and requires an explicit decision to create a work item.
- `task queue -> task processing` requires explicit assignment or authorization for the selected task.
- Finishing task processing does not automatically select another task or drain any specimen queue.

A future automation can enact a *specific, authorized* transition, but a background loop must not infer blanket authority from repository state.

## Privacy and specimen size

Prefer a citation, source pointer, or short synthetic phrase over bulk text. Never ingest or publish private language as a specimen in this public repository. Source references must themselves be safe for publication. A specimen can be closed without producing any rule.

## Reading the repository state

Inspect each store directly for its current entries; do not infer processing from queue contents. The original bootstrap catalog rules were authored examples, not products of a claimed specimen-processing run. No processing history should be fabricated or inferred.

## Completed specimen intake

After explicit authorization and completion, a queue entry may be marked `processed` and linked to an independent `processing/specimens/PROC-<specimen-id>.json` record. The `intake` object preserves original intake-time metadata; `processing` records the later authorization and outcome. This changes neither the authority of a proposed rule nor the task queue. A duplicate may be linked to a shared proposed candidate without losing its own processing record.

## Explicitly authorized full processing batch — 2026-10-21

Separate closed specimen analyses exist for SPEC-0004 through SPEC-0012. Their outputs were queued into downstream TASK-0004 (catalog review), TASK-0005 (normative edition semantics), and TASK-0006 (website and documentation). TASK-0001 and TASK-0002 were independently authorized for review in the same user request. Task execution has distinct processing records. Neither catalog publication nor task completion enrolls Nomos in Tarium or applies a rule to an unrelated project.

## Batch: development-hygiene rules and virtual groups (2026-10-21)

Specimens `SPEC-0013` through `SPEC-0066` were normalized individually to `NOM-0014` through `NOM-0067`. `SPEC-0067` normalized a third ontology kind, *virtual rule group*, without fabricating a normative rule. Eight proposed `GROUP-0001` through `GROUP-0008` definitions received independent processing records. Source candidate records remain in `processing/specimens/candidates/` and `processing/specimens/groups/candidates/` as historical proposals.

Downstream authorized work is separately recorded as `TASK-0007` (individual catalog publication), `TASK-0008` (group schema/catalog/validator), and `TASK-0009` (website group composition). Group membership never authorizes project work or changes the rules' applicability. Publishing the catalog does not apply its contents to unrelated projects.

## Batch: project-management and strict-port groups (2026-10-21)

SPEC-0068 through SPEC-0076 were separately processed as independent rule proposals, and proposed GROUP-0009 through GROUP-0013 received distinct group-processing records. The authorized downstream tasks are TASK-0010 (atomic rule publication), TASK-0011 (group publication and color identity), and TASK-0012 (public catalog, validation and deployment). The original queued inputs and draft candidates remain as provenance. Explicit authorization covered this batch only; its completion never applies the resulting rule selections to unrelated repositories.

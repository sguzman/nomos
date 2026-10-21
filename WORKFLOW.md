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

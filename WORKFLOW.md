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

## Optional profile preset lifecycle

Profile authoring is a separate **opt-in composition workflow**, not a fifth specimen or task processing queue. See [PROFILE_WORKFLOW.md](PROFILE_WORKFLOW.md): discuss use case → suggest catalog rules (transient) → review formal proposed selection (transient) → explicit authorization to instantiate draft → user may add or remove atomic rules → separate authorization to finalize → optional future explicit selection or export. No step obliges the user to use profiles, and a finalized profile never applies itself. New rule ideas still require separately authorized specimen/catalog work.

## Authorized batch: naming, YAML jobs, browser versions and MVP inauguration (2026-10-21)

Explicit user authorization processed SPEC-0077 through SPEC-0114 independently (38 records) and GROUP-0014 through its separate group-processing record. Each original queue record remains as historical intake with its original no-authorization field preserved. Exactly four of the 38 proposals resolve to prior canonical rules (SPEC-0090 → NOM-0075, SPEC-0103 → NOM-0056, SPEC-0104 → NOM-0047, SPEC-0107 → NOM-0060). The other 34 produce independently published catalog atoms NOM-0077–NOM-0110, with retained draft candidates and processing dispositions. GROUP-0014 contains 50 unique published member references, not 50 new rules.

Independent downstream work is tracked as TASK-0013 (rule publication), TASK-0014 (group publication and color), and TASK-0015 (website, validation, deployment and evidence). Group membership, status transitions and catalog publication never imply activation of rules or authorization to inaugurate an unrelated project.

## Authorized strict C-to-Rust specimen batch and optional profile drafts (2026-10-21)

The explicitly authorized public-safe specimens `SPEC-0115`–`SPEC-0117` were queued and independently normalized into published rules `NOM-0111`–`NOM-0113` with separate candidate and processing records. Downstream `TASK-0016` covers validation, documentation and the two approved draft profiles `PROFILE-0001` and `PROFILE-0002`. Profile finalization, export and application remain separately opt-in. No unrelated project or group is changed or activated.

## Independent optional profile-idea queue (2026-10-21)

`queues/profiles/` is an **intake-only operational backlog**, separate from all four specimen/task stores, the reviewed `profiles/` registry, and the four ontology kinds. Its `PROFILE-IDEA-*` IDs never reserve or become real `PROFILE-*` IDs.

Queuing an idea records a public-safe title and optional short summary and tentative rule/group references. A queued idea is **not reviewed, processed, approved, instantiated, finalized, selected, or applied**. Do not drain the queue automatically. Processing an individual idea requires a later explicit request naming it; reviewing a selection does not authorize draft instantiation. Only separate, explicit selection approval permits a real draft under [PROFILE_WORKFLOW.md](PROFILE_WORKFLOW.md), followed by separate finalization and opt-in use. Administrative status changes such as deferral/cancellation are not profile processing.

The queue intentionally starts with **zero ideas** until specifically nominated. The intake-only CLI and schema live in `tools/profile_ideas.cjs` and `schema/profile-idea.schema.json`.

## Authorized normalization of conversational check-in rule (2026-10-22)

At the user's explicit request, `SPEC-0118` was processed into one scoped, independently published prohibition, `NOM-0114`. The separate candidate and `processing/specimens/PROC-SPEC-0118.json` record preserve the process and the boundary allowing proportionate responses to newly credible present danger. Processing did not authorize selecting, activating, creating or changing profiles or processing any of the six queued `PROFILE-IDEA-*` items. Public artifacts contain no private conversational quotations.

## Historical intake: Rust-fork stewardship specimens (2026-10-22)

The optional Rust-fork profile review identified missing upstream and patch-management specialization. The six public-safe candidates were originally queued without processing authority. Their subsequent explicitly authorized publication is recorded below.

## Queued required-user-action summary footer (2026-10-22)

`SPEC-0139` records one independent and public-safe reporting convention for completed-work summaries: explicitly enumerate genuine required user inputs or state that nothing is required. It was originally a queued specimen; its later publication as `NOM-0135` is recorded below. No profile selection changed.

## New optional C++ port profiles and README rule intake (2026-10-22)

Two separate C++-to-Rust profile ideas, `PROFILE-IDEA-0007` and `0008`, are queued for Lite/Full drafting. Existing strict C-to-Rust draft profiles remain untouched; C++-specific semantic and test requirements need later review before creating concrete profile selections. The public-facing README-documentation rule idea is queued independently as `SPEC-0140`, with processing authorization initially absent. Later explicit authorization published `SPEC-0140` as `NOM-0136`; no profile was finalized or activated.

## Completed processing of eight remaining specimen proposals (2026-10-22)

With separately explicit authorization, `SPEC-0133`–`SPEC-0140` were individually normalized into published opt-in rules `NOM-0129`–`NOM-0136`. Each source has a distinct processing disposition and retained draft candidate. Six fork-specific atoms address baseline, divergence, patch lineage, integration conflict, post-sync tests and selective upstream adoption. Two general atoms address action-required report footers and visitor-focused README organization. `TASK-0017` records verification independently. No profiles were altered or activated and no external repository maintenance was authorized by the publication.

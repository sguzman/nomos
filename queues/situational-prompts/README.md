# Situational-prompt intake queue

This queue records **eight owner-nominated situations** from the original version-1 set, with labels and scenario metadata retained for identification. The prompt texts themselves are **not included**: Nomos is a public repository, and the intake authorization does not authorize public republication of private conversation wording.

The eight queued items are:

| Intake ID | Label | Situation | Behavior |
| --- | --- | --- | --- |
| `SIT-IDEA-0001` | ack work | `normal_continuation` | continuation |
| `SIT-IDEA-0002` | broke work | `interrupted_execution` | continuation |
| `SIT-IDEA-0003` | continue context | `conversation_limit_recovery` | continuation |
| `SIT-IDEA-0004` | broke work stop | `interrupted_execution_with_completion_gate` | continuation |
| `SIT-IDEA-0005` | broke what | `interruption_diagnosis` | diagnosis |
| `SIT-IDEA-0006` | ack deception | `progress_audit` | reinforcement |
| `SIT-IDEA-0007` | ack remind | `scope_refocus` | reinforcement |
| `SIT-IDEA-0008` | ack context remind | `context_recovery_and_audit` | continuation |

Each file follows [the intake schema](../../schema/situational-prompt-idea.schema.json) and includes an independently reviewed trigger description, appropriateness / exclusion tests, prerequisites, behavior category, failure modes, tradeoffs and governance. These annotations are **provisional interpretations for review**, not changes to the owner's exact prompt wording.

**Intake is not publication.** `SIT-IDEA-*` IDs are separate from future `SIT-*` prompt IDs. Processing all eight items was explicitly authorized on 2026-10-24. Each intake points to a published `SIT-*` item and an independent `processing/situational-prompts/` trace recording explicit owner publication approval. Items can be copied individually but are never automatically invoked.

Shortcut keys were part of one user's launcher setup, not intrinsic properties of these prompts. Key assignments are excluded from this registry. The original user-supplied messages remain outside this public repository. The owner separately authorized publication of all eight independently authored canonical texts. Publication does not imply automatic activation.

Local validation: `python3 tools/validate_situational_prompt_ideas.py`. The website's distinct situational-prompt browser intentionally reads the approved registry, **not** this intake queue.

## Subsequent versions queued (2026-10-24)

Sixteen revision proposals are queued under [revisions/](revisions/README.md). Each of the eight published situational prompts retains the same canonical SIT ID. Proposed version 2.0.0 follows published 1.0.0; proposed version 3.0.0 follows the queued 2.0.0. The uploaded files' version 1 is a source JSON format version, **not** a prompt version.

Each proposal retains the standalone, public-safe instruction wording exactly as supplied, with a SHA-256 content checksum. No source launcher keys or personal shortcut labels enter revision metadata. The queue neither processes nor publishes nor invokes revised prompts; existing website copy actions still return published v1. Prompt families SIT-0006 and SIT-0007 require explicit behavioral review because both later variants would change a reinforcement-only reminder into an instruction to resume implementation.

Validation: python3 tools/validate_situational_prompt_revisions.py.

## Separate situational ontology intake

The [six proposed ontology objects and their candidate concepts](../situational-ontology/README.md) are queued **independently** of these historical prompt ideas and version proposals. They do not alter any published prompt or authorize processing later wording generations.

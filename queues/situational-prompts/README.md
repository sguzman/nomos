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

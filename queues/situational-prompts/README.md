# Situational-prompt intake queue

This queue records **eight owner-nominated situations** from a version-1 keyboard-shortcut batch, with original labels and shortcut keys retained as identification metadata. The prompt texts themselves are **not included**: Nomos is a public repository, and the intake authorization does not authorize public republication of private conversation wording.

The eight queued items are:

| Intake ID | Label | Key | Situation | Behavior |
| --- | --- | --- | --- | --- |
| `SIT-IDEA-0001` | ack work | `F` | `normal_continuation` | continuation |
| `SIT-IDEA-0002` | broke work | `J` | `interrupted_execution` | continuation |
| `SIT-IDEA-0003` | continue context | `K` | `conversation_limit_recovery` | continuation |
| `SIT-IDEA-0004` | broke work stop | `L` | `interrupted_execution_with_completion_gate` | continuation |
| `SIT-IDEA-0005` | broke what | `I` | `interruption_diagnosis` | diagnosis |
| `SIT-IDEA-0006` | ack deception | `U` | `progress_audit` | reinforcement |
| `SIT-IDEA-0007` | ack remind | `E` | `scope_refocus` | reinforcement |
| `SIT-IDEA-0008` | ack context remind | `D` | `context_recovery_and_audit` | continuation |

Each file follows [the intake schema](../../schema/situational-prompt-idea.schema.json) and includes an independently reviewed trigger description, appropriateness / exclusion tests, prerequisites, behavior category, failure modes, tradeoffs and governance. These annotations are **provisional interpretations for review**, not changes to the owner's exact prompt wording.

**Intake is not publication or processing.** `SIT-IDEA-*` IDs are separate from future `SIT-*` prompt IDs. Capturing an idea does not create a draft or published prompt, approve its wording, activate an instruction, bind a hotkey or add it to rule-profile selection.

The original user-supplied messages remain outside this public repository. An owner-directed publication review may decide what **public-safe** text to author as a separate prompt entry later. No bulk promotion is implied.

Local validation: `python3 tools/validate_situational_prompt_ideas.py`. The website's distinct situational-prompt browser intentionally reads the approved registry, **not** this intake queue.

# Constitution of Nomos

## I. Purpose and autonomy

1. Nomos registers rules independently of any agent, project, prompt, compiled ruleset, or export target.
2. Its core ontology has **independent normative rules**, **controlled categories**, explicitly approved **virtual rule groups**, separately approved **optional rule-profile presets**, and independently reviewed **situational prompts** for explicit, context-specific invocation. Groups and profiles have identities but no normative effect; a profile is a user-chosen reusable selection, not a requirement.
3. The project may offer searching, selecting, comparing, and exporting rules. Temporary selections and AI-suggested selections are not automatically profiles; only an explicitly approved selection may be instantiated as an optional profile draft, and finalization requires a separate explicit decision.
4. Nomos is a standalone public repository. Membership in Tarium or any other registry requires explicit authorization and is never inferred from naming, links, or future intent.

## I-A. Situational-prompt independence

1. Situational prompts are separate, versioned normative-text artifacts. They describe what to ask an agent at a specific conversational moment; they are not atomic rules, rule groups, or profiles and have no automatic authority.
2. A situational prompt must document its trigger, purpose, appropriate and inappropriate situations, prerequisites, requested mode and handoff, guarded failure modes, tradeoffs, provenance, and review state.
3. Publication does not invoke a prompt, bind a key, select rules, or authorize work. The user explicitly selects and invokes a prompt; storing a hotkey hint has no runtime effect.
4. Only reviewed and approved public-safe prompt text may be offered for copying on the public website. Private discussions and wording must never be imported without separate explicit publication authorization.

## II. Rule independence and application

1. A cataloged rule is **not** an applied instruction merely because it appears in this repository. Neither a published virtual group nor a finalized rule-profile preset applies, exports, or selects any member rule automatically.
2. Distinguish rule text, normalized normative effect, applicability, authority, provenance, relations, and lifecycle status.
3. Rules can be selected individually or through a user-requested group expansion or optional rule profile. A compiler or exporter must not silently add unrelated rules, duplicate members, auto-select groups or profiles, or modify a reviewed selection.
4. Rule precedence and exceptions require explicit, scoped reasoning. A priority number alone must never silently erase a conflict.

## III. Categories and conflict analysis

1. Give every rule stable identity, version, normative polarity, machine-readable predicate, controlled categories, applicability facets, authority data, provenance, and relations.
2. Categories may overlap. Domain labels alone are not proof of applicability or incompatibility.
3. Compare normalized predicates and overlapping scopes before flagging conflict; distinguish **possible conflict**, **resolved exception**, **disjoint applicability**, and **unknown**.
4. Contradictory free-text conditions are not safely decidable from metadata alone. Mark uncertainty instead of pretending complete logical proof.
5. A strict permission opposed by a prohibition may conflict; a merely weak permission is not by itself an overriding exception. Explicit obligations opposed by prohibitions may conflict.
6. Preserve source and history for every substantive rule change. Never silently rewrite one rule to make a compilation succeed.

## IV. Publication and private material

1. **Never publish private language, private conversations, personal venting, secrets, identifying nonpublic information, private datasets, or excerpts of them to this public repository.**
2. This rule applies to all public surfaces: code, commits, issues, pull requests, documentation, fixtures, examples, metadata, website content, and historical artifacts.
3. Abstract references to content classes (for example `private_material`) are permitted; actual private content, close paraphrases, and copied personal context are not.
4. Use minimal synthetic specimens and public-safe citations. Review inputs and generated output before publication; exclude uncertain material.
5. A cataloged sample permission does not override this repository-wide publication restriction.

## V. Specimen discipline

1. A **specimen** is a small, public-safe source or proposed statement examined to extract or refine rules and categories. It is evidence/input, **not automatically a rule**.
2. Specimens are intentionally narrow and minimal, not indiscriminate corpus ingestion.
3. Accepting a specimen into the **specimen queue** is not permission to process it. Processing a specimen is not automatically permission to publish a rule, open a task, or execute development.
4. Record provenance and disposition of processed specimens without copying unsafe source material.

## VI. Four separate operations

**Specimen queue != specimen processing != task queue != task processing.**

1. **Specimen queue:** proposed input awaiting selection/authorization to examine.
2. **Specimen processing:** bounded analysis/normalization of an authorized specimen, producing a candidate rule, category proposal, or documented rejection.
3. **Task queue:** explicitly identified engineering, documentation, research, or QA work awaiting selection/authorization to do.
4. **Task processing:** execution of authorized, scoped work with verifiable results and an honest status.

Each operation has its own identity, state, provenance, and records. Never treat the existence of an item in one queue as an instruction to drain that queue. Never promote an item across these boundaries automatically. Follow [WORKFLOW.md](WORKFLOW.md).

## VII. Execution and evidence

1. Work only within the user's assigned scope; do not manufacture follow-on tasks and execute them as if authorized.
2. Direct work on the existing `main` branch is the default for this repository unless the user explicitly directs an exception. Avoid needless branches and pull requests.
3. Do not describe proposed or attempted work as completed. Distinguish authored, committed, validated, tested, and deployed.
4. Keep specimens, ontology records, task tracking, and their processing states distinct even if a future UI shows them together.

## VIII. Amendments

Changes to this constitution must be explicit, reviewable commits. New rules or schemas may evolve without automatically amending the constitution. If a conflict with higher-priority instructions is identified, do not conceal it or claim the repository can override those instructions.

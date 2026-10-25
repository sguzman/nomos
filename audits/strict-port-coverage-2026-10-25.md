# Python-to-Rust strict-port coverage study — 2026-10-25

> **Analytical review, not an approved rule selection or ontology publication.** No normative rule, profile, situation, intent or prompt is created or activated here.

## Baseline and precise result

Source: [PROFILE-0012](../profiles/PROFILE-0012.json), still a `draft` with **unconfirmed selection**. The source contains **90 rules**, generating **27 situations** and **37 intents**. All 90 have at least one situation mapping and at least one intent mapping. Those mappings describe *existing rule meaning*; they do **not** prove lifecycle or Python-language coverage.

**Result:** 25 individually scoped candidate requirements: **7 reusable software-port obligations** and **18 Python-specific concerns** (many conditional on the upstream program's actual behavior). Of these, 14 lack an explicit corresponding normative rule and 11 refine partially overlapping general rules. These are **review candidates, not 25 authorized new rules** and not an assertion that every feature is necessary for every project.

The prior [profile review](../profiles/REVIEW-2026-10-23.md) already documented Python-language gaps. This audit decomposes those concerns, compares them to existing catalog atoms, and records specific proposals in [machine-readable form](strict-port-coverage-2026-10-25.json).

## Language-neutral strict-port requirements

| Audit key | One bounded concern | Catalog overlap / analogue | Assessment |
| --- | --- | --- | --- |
| `PORT-01` | Freeze the upstream runtime and supported behavior baseline | NOM-0074, NOM-0075, NOM-0098 | partially covered by existing rules |
| `PORT-02` | Track every in-scope upstream capability | NOM-0074, NOM-0075, NOM-0064; C-only analogue: NOM-0113 | unrepresented as atomic rule |
| `PORT-03` | Compare upstream and Rust observable results | NOM-0029, NOM-0033, NOM-0074; C-only analogue: NOM-0111 | unrepresented as atomic rule |
| `PORT-04` | Register and approve deviations from upstream | NOM-0064, NOM-0074, NOM-0098; C-only analogue: NOM-0111, NOM-0113 | partially covered by existing rules |
| `PORT-05` | Establish executable replacement acceptance | NOM-0075, NOM-0090, NOM-0093, NOM-0098; C-only analogue: NOM-0113 | partially covered by existing rules |
| `PORT-06` | Contain and test necessary unsafe and cross-language interfaces | NOM-0033, NOM-0041; C-only analogue: NOM-0112 | partially covered by existing rules |
| `PORT-07` | Verify distribution and installation cutover | NOM-0040, NOM-0041, NOM-0053, NOM-0098 | partially covered by existing rules |

The three high-value precedents `NOM-0111`, `NOM-0112` and `NOM-0113` **are explicitly C-scoped**. Do not place them unchanged into Python/C++ profiles. Reusable software-port wording should be reviewed for whether a separately generalized atom is appropriate, preserving independent identities and scope.

## Python-specific atomic study candidates

Each candidate is scoped to **relevant in-scope behavior**, not an invented requirement to implement the entire Python interpreter.

| Audit key | Distinct verification concern | Existing rule support | Assessment |
| --- | --- | --- | --- |
| `PY-01` | Object identity, aliasing and mutation | NOM-0033, NOM-0074 | unrepresented as atomic rule |
| `PY-02` | Dynamic typing and reflection | NOM-0033, NOM-0054 | unrepresented as atomic rule |
| `PY-03` | Truthiness and implicit conversion | NOM-0033 | unrepresented as atomic rule |
| `PY-04` | Numeric range, precision and rounding | NOM-0029, NOM-0033 | unrepresented as atomic rule |
| `PY-05` | Unicode, text and bytes semantics | NOM-0033, NOM-0053 | unrepresented as atomic rule |
| `PY-06` | Equality, hashing and collection behavior | NOM-0033, NOM-0054 | unrepresented as atomic rule |
| `PY-07` | Exception, failure and cleanup contracts | NOM-0033, NOM-0054 | unrepresented as atomic rule |
| `PY-08` | Iterator and generator protocols | NOM-0033 | unrepresented as atomic rule |
| `PY-09` | Context manager and resource lifetime behavior | NOM-0033, NOM-0038 | unrepresented as atomic rule |
| `PY-10` | Imports, modules and dynamic discovery | NOM-0054, NOM-0093 | unrepresented as atomic rule |
| `PY-11` | Installed commands, package entry points and plugins | NOM-0054, NOM-0093, NOM-0098 | partially covered by existing rules |
| `PY-12` | Async task lifecycle and cancellation | NOM-0029, NOM-0033 | unrepresented as atomic rule |
| `PY-13` | Threads, processes and synchronization | NOM-0033, NOM-0034 | unrepresented as atomic rule |
| `PY-14` | Python API and extension compatibility | NOM-0054, NOM-0093 | partially covered by existing rules |
| `PY-15` | Serialization compatibility beyond round-trip preservation | NOM-0053, NOM-0054 | partially covered by existing rules |
| `PY-16` | Filesystem, environment and subprocess boundaries | NOM-0033, NOM-0054 | partially covered by existing rules |
| `PY-17` | Regression corpus for Python edge behavior | NOM-0029, NOM-0030, NOM-0034 | partially covered by existing rules |
| `PY-18` | Persisted state and legacy migration compatibility | NOM-0052, NOM-0053, NOM-0098 | partially covered by existing rules |

### Why these are separate from general code quality

Compiling a Rust target or passing implementation-level tests does not establish parity with Python semantics. Python's documented [data model](https://docs.python.org/3/reference/datamodel.html) distinguishes object identity, equality, truth testing and runtime protocols; its [execution model](https://docs.python.org/3/reference/executionmodel.html) describes exceptions and dynamic name resolution. The [asyncio cancellation contract](https://docs.python.org/3/library/asyncio-task.html), [packaging entry-point specification](https://packaging.python.org/en/latest/specifications/entry-points/), and [threading / optional free-threaded behavior](https://docs.python.org/3/howto/free-threading-python.html) matter **only if used or externally exposed by the source baseline**.

Important semantic distinctions:
- **Identity/aliasing** is different from **equality, hashing and order**.
- **Value conversion/truthiness** is different from **integer/float/decimal arithmetic**.
- **Iterator/generator behavior** is different from **resource cleanup via context managers**.
- **Import mechanics** is different from **installed command entry points and externally discovered plugins**.
- **Async cancellation** is different from **threads/processes and synchronization**.
- **Round-trip integrity** in `NOM-0053` is not automatically parity with externally visible serialization *shape* or bytes.

## Review of already published, unselected rules

The following are **possible selections**, not accepted additions:

- `NOM-0008`: Rust implementation-language discipline; overlaps approved architecture choices.
- `NOM-0135`: Explicit owner-action footer for handoffs.
- `NOM-0136`: Reader-focused README separate from detailed docs and changelog.
- `NOM-0137`: Previous/current/delta reporting; not needed unless per-round percent bars are used.

Other omitted rules mostly concern different project contexts or workflows, and omission must not be treated as a numerical deficiency. In particular, `NOM-0013` (fixed 2024 edition) must not be added casually alongside `NOM-0012` (latest compatible edition), since the policy choices can conflict when toolchains evolve.

## Applying the method to other profiles

1. **Reusable strict-port candidates** (`PORT-01`–`PORT-07`) may be reviewed for C-to-Rust Lite/Full (`PROFILE-0001/0002`), C++-to-Rust Lite/Full (`0009/0010`) and Python-to-Rust Lite/Full (`0011/0012`). Review semantic duplicates of the C-specific atoms before generalizing; do not silently rewrite their scope.
2. **Python-only candidates** (`PY-01`–`PY-18`) apply to `PROFILE-0011/0012` only after establishing the Python baseline and selected features. The C++ pair requires a separate C++ semantic study, not copying Python rules.
3. Other profile families (new Rust project, public Tarium project, Rust fork maintenance) require a **fresh target-specific audit**. A source-language replacement assumption should not be inherited merely because those projects use Rust.

## Acceptance gates and boundaries

This analytical round is finished when: (1) all 25 proposals have individually stated scope and overlap evidence, (2) original C-only rules are not mislabeled reusable, (3) the two Python profiles are not modified or silently confirmed, and (4) the audit has a deterministic schema/reference integrity check in CI.

No actual Python source repository or version has been specified for a particular port, so **project-specific behavior completeness cannot be established** by this generic profile study. Publication of any candidate normative rule, new canonical situation/intent or changes to an existing profile's approved membership needs its own review and authorization; none is implied by this study.

## Atomicity and duplication review — 2026-10-25

**Scope:** This is the requested second analytical pass over the original 25 entries. The counts below classify original **review candidates**, not new approved or published rules. The original audit dispositions (14 unrepresented / 11 partially covered) describe normative coverage; the review dispositions below independently describe *atomicity and duplication*.

- **7** focused single-contract candidates for possible later specimen review.
- **16** compound or overlapping candidates requiring narrower phrasing and deduplication.
- **2** candidates whose distinct normative content was not established beyond existing published rules.

A proposal is atomic only when its trigger, action and checkable contract are independently coherent. An enumerated set of example inputs is not necessarily multiple rules, but unrelated consumers, approvals or lifecycle events usually are. Conditional Python semantics must be included only when exercised or required by the agreed upstream baseline. Neither the recommendations below nor their suggested parts carry canonical IDs or publication authority.

| Original audit ID | Review | Reason and direct overlap |
| --- | --- | --- |
| `PORT-01` | decompose | NOM-0074 assumes a defined baseline but does not prescribe an auditable baseline record. Python interpreter specificity is misplaced in a language-neutral proposal. |
| `PORT-02` | single candidate | NOM-0075 is an acceptance goal, not per-feature coverage accounting. NOM-0113 is a direct C-only analogue; avoid publishing a duplicate scoped C rule. |
| `PORT-03` | single candidate | NOM-0029 covers bug regression, not running an upstream oracle; NOM-0111 supplies the C-only precedent. |
| `PORT-04` | decompose | NOM-0064 already requires deviations to be recorded, but an agreed deviation decision and its effect on parity claims are different checks. |
| `PORT-05` | reuse existing | The proposed readiness test combines NOM-0075 replacement-capability MVP, NOM-0090 validation, NOM-0093 consumer testing where applicable, and NOM-0098 accepted limitations. A new duplicate umbrella gate is not justified by this audit. |
| `PORT-06` | single candidate | Necessary unsafe/FFI boundary assurance is a coherent conditional concern, directly analogous to C-only NOM-0112. Previous citations to NOM-0033 and NOM-0041 are not substantive FFI-safety coverage. |
| `PORT-07` | decompose | Installation/invocation compatibility and recovery after replacement have independent applicability; general CI workflow rules are not evidence of safe cutover. |
| `PY-01` | single candidate | Python reference identity and alias-visible mutation form one coherent externally observable object-reference contract. Do not require preserving nonobservable internals. |
| `PY-02` | decompose | Dynamic attributes/reflection and callable signature/dispatch are separately observable contracts and need not both occur in a source project. |
| `PY-03` | decompose | Truth-testing and implicit conversion are independent Python protocols with different trigger conditions and test cases. |
| `PY-04` | decompose | Arbitrary-precision integer, binary floating-point and decimal-context semantics can fail independently; one blanket numeric rule obscures target contracts. |
| `PY-05` | decompose | Unicode/text operations and encoding/decoding of byte streams have different observables. Normalization is conditional; Python does not universally normalize strings. |
| `PY-06` | decompose | Equality/hash compatibility and collection order/iteration guarantees are distinguishable contracts. Do not imply all sets or mappings have the same ordering guarantees. |
| `PY-07` | decompose | Error categories/propagation and resource cleanup are separate. Cleanup belongs to context/resource behavior under PY-09, avoiding duplicate obligations. |
| `PY-08` | single candidate | Generator and iterator protocol fidelity can be expressed as one focused conditional protocol check. Resource cleanup is covered by PY-09. |
| `PY-09` | single candidate | Resource acquisition/release and exceptional exit form one context-manager lifecycle contract, including exception-suppression behavior when externally observable. |
| `PY-10` | decompose | Python module import resolution and independently discovered plugins are distinct. Consolidate plugin discovery with PY-11 rather than generating two similar rules. |
| `PY-11` | decompose | Installed console/script entry points and third-party plugin discovery are separately consumed contracts. The plugin concern is shared with PY-10 and should be represented once. |
| `PY-12` | decompose | Cancellation/timeouts and observable task ordering/backpressure are independently testable async contracts; implementation scheduler identity need not match. |
| `PY-13` | decompose | Shared-memory concurrency and cross-process coordination have different contracts. GIL behavior must be tied to a documented interpreter build, not assumed globally. |
| `PY-14` | decompose | Python-level calling contract and compiled extension/ABI compatibility have separate consumers. Neither is required if no Python-facing API is promised. |
| `PY-15` | single candidate | NOM-0053 tests data round trips but not external wire-format agreement. One serialized interchange contract can cover documented bytes/types/field shapes conditional on downstream consumers. |
| `PY-16` | decompose | Filesystem/environment conventions and child-process interaction are independently observable. The general feature-target rule NOM-0033 is not a replacement for OS parity. |
| `PY-17` | reuse existing | NOM-0027/0029/0030/0032 already cover unit, regression, edge-case and deterministic tests. Source-oracle comparison is PORT-03; a duplicate Python regression-corpus rule would not add an independent norm. |
| `PY-18` | decompose | Legacy data-read compatibility and upgrading persisted state are separate. General non-destructive and round-trip rules support them but do not establish a Python-era migration contract. |

### Candidate corrections and normalization boundaries

**PORT-01: Freeze the upstream runtime and supported behavior baseline**
1. Record the authoritative upstream revision and supported comparison environment for a strict port.
2. For Python source ports, identify interpreter version/build and relevant implementation features in the accepted source baseline.

**PORT-02: Track every in-scope upstream capability**
1. For each in-scope upstream capability, maintain its Rust replacement mapping and independently verified status, explicitly accounting for gaps.

**PORT-03: Compare upstream and Rust observable results**
1. Compare equivalent upstream and Rust observations for each reproducible in-scope behavior and record unresolved or unavailable comparisons.

**PORT-04: Register and approve deviations from upstream**
1. Link each intentional divergence to an explicit approval and affected consumer contract.
2. Classify unresolved divergences as unverified or incompatible rather than verified parity.

**PORT-06: Contain and test necessary unsafe and cross-language interfaces**
1. For each necessary unsafe or FFI boundary, establish and verify its safety, lifetime and ABI contract, isolating the boundary where feasible.

**PORT-07: Verify distribution and installation cutover**
1. Verify supported installation, runtime dependency and launch/invocation behavior when replacing a deployed upstream distribution.
2. When deployment replaces existing state, verify authorized upgrade, recovery and rollback procedures against representative state.

**PY-01: Object identity, aliasing and mutation**
1. Verify agreed identity and alias-visible mutation behavior for Python objects crossing supported interfaces.

**PY-02: Dynamic typing and reflection**
1. Verify externally consumed Python attribute, reflection and dynamic type behavior.
2. Verify callable signature and invocation/dispatch compatibility at supported Python-facing boundaries.

**PY-03: Truthiness and implicit conversion**
1. Verify Python truth-testing outcomes at in-scope decision boundaries.
2. Verify Python implicit and explicit conversion outcomes at in-scope interfaces.

**PY-04: Numeric range, precision and rounding**
1. Verify integer range, division and overflow-equivalent behavior where source integer semantics are exposed.
2. Verify floating-point special values, comparison and rounding where externally consequential.
3. Verify Decimal precision, context and rounding where the upstream uses decimal arithmetic.

**PY-05: Unicode, text and bytes semantics**
1. Verify in-scope Unicode string operations and code-point semantics.
2. Verify byte/text encoding, decoding and error-policy behavior at exposed interfaces.

**PY-06: Equality, hashing and collection behavior**
1. Verify in-scope equality, hashing and lookup-key behavior.
2. Verify exposed collection iteration and ordering guarantees supported by the agreed upstream baseline.

**PY-07: Exception, failure and cleanup contracts**
1. Verify externally observable exception categories, propagation, failure returns and contractually exposed messages.
2. Assign cleanup-on-failure verification to PY-09 rather than duplicating a second independent cleanup rule here.

**PY-08: Iterator and generator protocols**
1. Verify in-scope iterator/generator lazy yield, termination and exception propagation behavior.

**PY-09: Context manager and resource lifetime behavior**
1. Verify in-scope Python context-management resource lifecycle and exceptional-exit behavior.

**PY-10: Imports, modules and dynamic discovery**
1. Verify import/module name resolution and failure behavior where consumers rely on Python imports.
2. Move plugin discovery compatibility into PY-11 for de-duplication.

**PY-11: Installed commands, package entry points and plugins**
1. Verify distribution entry points, script commands and invocation contracts.
2. Verify declared plugin registration, discovery and loading contracts where supported.

**PY-12: Async task lifecycle and cancellation**
1. Verify in-scope asynchronous cancellation, timeout and failure-cleanup behavior.
2. Verify promised task ordering, concurrency-limit and backpressure outcomes under representative load.

**PY-13: Threads, processes and synchronization**
1. Verify in-scope shared-state synchronization, visibility and race-sensitive behavior.
2. Verify interprocess communication, isolation and process lifecycle where the Python baseline uses processes.

**PY-14: Python API and extension compatibility**
1. Verify supported Python-callable interface behavior using an independent consumer.
2. Verify binary extension/embedding ABI and lifetime invariants only where compiled interoperation is part of the accepted baseline.

**PY-15: Serialization compatibility beyond round-trip preservation**
1. Verify externally consumed serialized representations against the source contract, including exact bytes only when those bytes are contractual.

**PY-16: Filesystem, environment and subprocess boundaries**
1. Verify in-scope filesystem, path, permission and environment-variable contracts.
2. Verify subprocess arguments, streams, status codes and lifecycle contracts where invoked.

**PY-18: Persisted state and legacy migration compatibility**
1. Verify accepted historical Python-era persisted files/configurations are read compatibly.
2. Where migration occurs, verify transformation and available recovery/rollback against representative retained state.


### No new atom recommended for these original candidates

**PORT-05:** A collective readiness dashboard should reference existing replacement-capability, CI, consumer and compatibility-contract obligations rather than duplicating them as one broad rule. Existing applicability conditions remain mandatory.

**PY-17:** Existing unit, regression, edge-case and deterministic testing rules cover this testing discipline. Direct comparison to Python source is a separate shared PORT-03 candidate, not an extra language-specific regression rule.

### Specific corrections to the first pass

- **PORT-01:** The original language-neutral candidate in `strict-port-coverage-2026-10-25.json` wrongly mentioned the Python interpreter. The atomicity review separates general upstream baseline identity from Python interpreter/build semantics; analogous C++ compilation/runtime baselines require their own evidence.
- **PORT-06:** `NOM-0033` (feature/target combinations) and `NOM-0041` (CI outcome reporting) are not substantive FFI safety obligations. `NOM-0112` is the existing **C-only** substantive analogue, not an applicable Python rule.
- **PORT-07:** Workflow-config and CI outcome rules do not guarantee distribution compatibility or safe recovery; these require independent cutover checks **when deployment warrants them**.
- **PY-07 / PY-09:** Exception contracts and resource cleanup must not be published twice; preserve the resource-lifetime obligation under the context-manager concern.
- **PY-10 / PY-11:** Import name resolution and package/plugin discovery have distinct consumers; store plugin discovery once, with PY-11.
- **PY-12 / PY-13:** Do not assert a fixed GIL model or scheduler execution order across all Python versions and builds; test only the source's accepted observable concurrency contracts.

### Reuse boundaries

The three C-scoped canonical precedents `NOM-0111`, `NOM-0112`, and `NOM-0113` stay unchanged and C-scoped. The Python Full/Lite source profiles remain unchanged and unconfirmed. Any proposed generalized atom must be reviewed against those exact precedents before catalog publication. For C++ ports, only shared strict-port concerns transfer; Python language semantics do not. No new situation or intent is asserted merely because a candidate obligation exists.

**Review outcome:** All 25 original entries received a disposition and concrete overlap rationale. This completes this *atomicity and duplication review*, not a rule-publication batch or semantic proof of exhaustive Python-to-Rust parity.

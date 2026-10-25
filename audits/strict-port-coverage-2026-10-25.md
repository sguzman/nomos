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

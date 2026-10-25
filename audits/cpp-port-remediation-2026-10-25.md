# C++-to-Rust strict-port coverage remediation — 2026-10-25

The owner authorized examination and remediation of the C++-to-Rust Lite/Full profile coverage gaps after the Python strict-port precedent. This report records scoped completion of **profile coverage**, not tested compatibility for any particular C++ application.

## Coverage and deduplication

The source C++ Full profile had 90 selected rules, 27 situations and 37 intents. Lite had 38, 17 and 27 respectively. The existing 8 shared software-port rules NOM-0138 and NOM-0140–0146 are reused rather than cloned. The 3 C-only rules NOM-0111–0113 and Python-specific rules are not selected into the C++ profiles.

A review of the C++ concerns recorded in [the original review](../profiles/REVIEW-2026-10-23.md) yielded **24 individually scoped C++ obligations** (NOM-0176–0199). They cover C++ compiler/toolchain identity, object ownership, alias/lifetime and RAII cleanup, copy/move, exception boundaries, templates and overloads, polymorphism/RTTI, native ABI layout/linkage, container invalidation, atomics/threading/coroutines and explicit defined-behavior limits. Their applicability is *conditional on each project's accepted upstream contract*. No universal promise to emulate undefined or non-observable behavior is implied.

The 24 normalized rule records have 24 independent intake records, 24 separately closed processing traces and 24 source-verified crosswalk links, held separately from the original 137-rule analysis and Python's 38-rule remediation. Ten new formal situations (SITU-0061–0070) and 15 new formal intents (INTENT-0090–0104) accompany them.

## Updated descriptive companions

| Profile | Rules before | Rules now | Situations now | Intents now | State |
| --- | ---: | ---: | ---: | ---: | --- |
| C++ Lite (PROFILE-0009) | 38 | 58 | 31 | 43 | Draft; selection not confirmed |
| C++ Full (PROFILE-0010) | 90 | 122 | 43 | 58 | Draft; selection not confirmed |

The Full profile selects all 8 reusable and all 24 new C++ atoms; Lite selects 5 reusable and 15 C++ atoms. Neither has been activated, finalized, or exported. Other profiles remain unchanged.

[Machine-readable coverage analysis](cpp-port-coverage-2026-10-25.json) · [Remediation manifest](cpp-port-remediation-manifest-2026-10-25.json).

## Verification boundary

The catalog, crosswalk, draft companions and tests can establish structural and source-grounded coverage of the studied categories. They do not establish empirical behavioral equivalence of a specific port; that requires a pinned upstream repository, observable differential tests and consumer acceptance evidence.

The C++ Core Guidelines describe appropriate ownership, RAII, special-member-function and error-handling concerns: https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines. C++ lifetime: https://en.cppreference.com/w/cpp/language/lifetime. C++ memory order: https://en.cppreference.com/w/cpp/atomic/memory_order.

Checks: `node tools/validate_cpp_port_remediation.cjs`, `python3 tools/validate_rule_situation_intent_links.py`, `node tools/profile_companions.cjs --check`, and the full GitHub Actions validation suite.

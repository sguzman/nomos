# C-to-Rust strict-port coverage remediation — 2026-10-25

This report records the authorized, scope-limited remediation of C-to-Rust Lite and Full rule profiles. It does not claim behavioral parity for an unspecified C program.

## Original source and reuse

C Lite began with 41 selected rules, 17 situations and 27 intents. C Full began with 93 selected rules, 27 situations and 37 intents. Both profiles already contained the approved, C-scoped rules NOM-0111 (differential testing), NOM-0112 (unsafe/FFI boundaries), and NOM-0113 (capability coverage). Their prior selections were confirmed and remain confirmed; neither profile is finalized or activated.

The analysis reused **five** language-neutral strict-port rules already published for the Python/C++ studies (NOM-0138, NOM-0142, NOM-0143, NOM-0145 and NOM-0146). It did **not** duplicate the general differential-testing, FFI or coverage-tracking rules NOM-0140, NOM-0141 and NOM-0144, which substantially overlap the original C-specific requirements.

## Normalized C concerns

Twenty-three C-specific, conditional normative atoms (NOM-0200–0222) cover preprocessing/build variants, C integer and floating conversion, char/string/byte behavior, pointer arithmetic and one-past validity, effective types and restrict aliasing, storage lifetime, malloc/realloc ownership, struct/union/bitfield representation, flexible/variable-size arrays, variadic APIs, callbacks, public C linkage, errno, locale-dependent I/O, C11 atomics, volatile I/O, nonlocal jumps, signals, threads, defined-versus-undefined-behavior boundaries, and contractual binary object-byte interoperability.

Each rule is conditional on in-scope C behavior being part of the accepted source baseline. Undefined or irrelevant internal C behavior is not automatically a Rust compatibility requirement.

## Linked concepts and evidence

- 10 additional canonical situations: SITU-0071 through SITU-0080.
- 14 additional canonical intents: INTENT-0105 through INTENT-0118.
- 23 independently pinned C-source links (RLINK-0200–0222), 23 closed processing records, 23 intake records, and one separately verified crosswalk.
- The earlier 137-rule analysis, 38 Python-remediation sources, 24 C++-remediation sources, and their historical evidence remain separate and unchanged.

## Profile results

| Profile | Prior rules | Revised rules | Situations | Intents | Review |
| --- | ---: | ---: | ---: | ---: | --- |
| C-to-Rust Lite (PROFILE-0001) | 41 | 61 | 28 | 42 | Prior selection confirmation preserved; draft |
| C-to-Rust Full (PROFILE-0002) | 93 | 121 | 40 | 54 | Prior selection confirmation preserved; draft |

Lite adds 5 shared and 15 C-specific rules; Full adds 5 shared and 23 C-specific rules. This request authorizes remediation, but does not finalize profiles, invoke exported instruction sets, or certify a particular application port.

Review sources: [ISO C working draft](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf); [C object and effective types](https://en.cppreference.com/w/c/language/object). [Machine-readable study](c-port-coverage-2026-10-25.json) and [remediation manifest](c-port-remediation-manifest-2026-10-25.json).

Acceptance checks: `node tools/validate_c_port_remediation.cjs`, formal ontology source checks, `node tools/profile_companions.cjs --check`, and the complete GitHub Actions suite.

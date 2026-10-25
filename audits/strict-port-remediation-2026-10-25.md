# Python-to-Rust profile coverage remediation (2026-10-25)

This is the authorized completion of the reviewed 25-candidate gap audit, not a claim of verified parity for an unspecified real Python program.

## Published artifacts

- 38 independently addressable rules: NOM-0138 through NOM-0175.
- 8 rules apply to eligible strict software ports; 30 are Python-to-Rust specific and apply only when relevant upstream behavior is in scope.
- 12 first-class situations: SITU-0049 through SITU-0060.
- 17 first-class intents: INTENT-0073 through INTENT-0089.
- 38 new reviewed rule-to-concept links, individually sourced, with corresponding separate intake and processing traces.
- The original 137-rule analyzed batch, pinned crosswalk, C-specific rules and other profile families remain unchanged.

## Companion profiles

| Profile | Rules before | Rules now | Situations | Intents | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Python Lite (PROFILE-0011) | 39 | 56 | 26 | 36 | Draft, unconfirmed |
| Python Full (PROFILE-0012) | 90 | 128 | 39 | 54 | Draft, unconfirmed |

The previously identified redundant umbrella readiness and Python regression corpus candidates were not duplicated as new normative rules.

The historical coverage study and atomicity dispositions are retained in [the review](strict-port-coverage-2026-10-25.md), with a machine-readable [remediation manifest](strict-port-remediation-manifest-2026-10-25.json).

## Limits

This closes the requested reusable-profile coverage remediation against the examined gaps. It does not validate any particular Python application's behavior without a pinned upstream source, executable differential cases and real implementation evidence. Source-language behaviors are conditional, not a requirement to reproduce the entire Python interpreter. Neither profile is finalized or activated, and no C/C++ profile selection was changed.

Checks: node tools/validate_port_remediation.cjs, node tools/profile_companions.cjs --check, Python source-evidence and formal ontology validators, and the full CI suite.

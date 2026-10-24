# Derived rule-profile situation and intent companions

Each existing user-authorized rule-profile draft has two **descriptive, inert** inventories: `situations/SITUATION-PROFILE-NNNN.json` and `intents/INTENT-PROFILE-NNNN.json`. These are not independently selected normative profiles, virtual groups, or prompt generations. Their source rule-profile membership and original statuses remain untouched.

Each member concept is deduplicated but retains every contributing selected rule ID and the interpretation basis. Intent records preserve semantic role and atomicity; not all formal intent concepts are confirmed atomic goals. The source-profile Git blob ID, version, and selection confirmation are preserved. Provisional source profiles yield provisional descriptive companions, never approvals.

Use `node tools/profile_companions.cjs --check` for exact source-drift auditing and `--write` only for an explicitly intentional refresh. CI detects edits to rules, profile selections, concept identities, or relationship links that make companions stale. Publication never selects or applies anything.

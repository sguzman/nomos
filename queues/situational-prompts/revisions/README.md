# Queued subsequent versions

These are sixteen version proposals for the **same eight existing situational prompts**, not sixteen new canonical entries or an alternative ontology.

| Canonical family | Published | Queued v2 | Queued v3 |
| --- | --- | --- | --- |
| SIT-0001 | 1.0.0 | [2.0.0](SIT-REV-0001-02.json) | [3.0.0](SIT-REV-0001-03.json) |
| SIT-0002 | 1.0.0 | [2.0.0](SIT-REV-0002-02.json) | [3.0.0](SIT-REV-0002-03.json) |
| SIT-0003 | 1.0.0 | [2.0.0](SIT-REV-0003-02.json) | [3.0.0](SIT-REV-0003-03.json) |
| SIT-0004 | 1.0.0 | [2.0.0](SIT-REV-0004-02.json) | [3.0.0](SIT-REV-0004-03.json) |
| SIT-0005 | 1.0.0 | [2.0.0](SIT-REV-0005-02.json) | [3.0.0](SIT-REV-0005-03.json) |
| SIT-0006 | 1.0.0 | [2.0.0](SIT-REV-0006-02.json) | [3.0.0](SIT-REV-0006-03.json) |
| SIT-0007 | 1.0.0 | [2.0.0](SIT-REV-0007-02.json) | [3.0.0](SIT-REV-0007-03.json) |
| SIT-0008 | 1.0.0 | [2.0.0](SIT-REV-0008-02.json) | [3.0.0](SIT-REV-0008-03.json) |

Every proposed v2 entry points to the published v1.0.0 record as predecessor; every proposed v3 entry points to queued v2. Proposed versions are 2.0.0 and 3.0.0. The source JSON files themselves both declare format version 1; that number is not a semantic prompt revision.

The public-safe, standalone instruction wording is preserved **verbatim**, together with a SHA-256 digest for each entry. Original local keyboard keys and arbitrary labels are excluded. Canonical SIT IDs and situation codes establish identity.

**All sixteen remain queued, unprocessed and unpublished.** They neither replace the eight published v1 records nor alter the website. Reminders SIT-0006 and SIT-0007 change toward execution-seeking instructions in both later variants; the review flags preserve that material difference for explicit future evaluation. No processing or publishing is authorized by intake.

Run python3 tools/validate_situational_prompt_revisions.py to verify the queue's references and exact text.

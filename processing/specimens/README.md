# Specimen processing records

This directory holds **completed analyses** of explicitly authorized specimen inputs. It is not the specimen queue, a catalog of enacted rules, or a task-processing log.

| Processing record | Input | Disposition | Candidate |
| --- | --- | --- | --- |
| [PROC-SPEC-0001](PROC-SPEC-0001.json) | SPEC-0001 | Consolidated with SPEC-0003 | [NOM-0004](candidates/NOM-0004.json) |
| [PROC-SPEC-0002](PROC-SPEC-0002.json) | SPEC-0002 | Distinct candidate | [NOM-0003](candidates/NOM-0003.json) |
| [PROC-SPEC-0003](PROC-SPEC-0003.json) | SPEC-0003 | Canonical concept shared with SPEC-0001 | [NOM-0004](candidates/NOM-0004.json) |

The candidate JSON records are complete *draft rule proposals*. Their provisional IDs are not catalog entries: they are **not** in `rules/`, are not active instructions, and have not received publication approval.

Key distinction: `NOM-0003` protects **information confidentiality** regardless of phrasing; `NOM-0004` protects **nonpublic generation context**, even when no factual secret appears. Both partly overlap `NOM-0001`, which already governs public Git repository content. All three are prohibitions, so overlap is **not itself a logical conflict**.

The existing validator examines only `rules/` and cannot verify conceptual overlap based on synonyms or subclass relations. No catalog change or task creation was authorized by this specimen-processing request.

## Further completed batch

See independent `PROC-SPEC-0004.json` through `PROC-SPEC-0012.json` records. Each records its source specimen, authorized analysis, normalized rule candidate and explicitly queued downstream TASK-0004. Draft candidates in `candidates/` are retained as historical evidence after catalog review and must not be projected as duplicate rules in the website.

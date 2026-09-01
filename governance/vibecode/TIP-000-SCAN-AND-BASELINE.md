# TIP-000: Repository reconnaissance and evidence baseline

## Header

- TIP-ID: TIP-000
- Project: ExcelAI
- Module: Whole repository / governance
- Depends on: None
- Priority: P0
- Authorization: User requested deep reading, Refinery enrichment, SOT organization and Vibecode planning.

## Task

Clone the repository, scan architecture and health, reproduce existing quality claims, build a provenance-backed public benchmark, create a file-based SOT, and prepare a continuation Blueprint without changing product behavior.

## Acceptance criteria

- Given the repository URL, when cloned, then local `main` matches `origin/main`.
- Given a clean dependency state, when QA commands run, then their exact pass/fail state is recorded.
- Given public benchmark pages, when claims are extracted, then every claim resolves to a verbatim snapshot span and Refinery bites pass.
- Given internal project facts, when adapted into the SOT, then A3 guard, baseline, bites and publish status pass.
- Product code and architecture are unchanged before Blueprint approval.

## Constraints

- Preserve repository source behavior.
- Do not convert vendor self-claims into independently verified performance facts.
- Do not fix failures during reconnaissance.

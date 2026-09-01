# TIP-005: CI evidence and SOT-derived release status

## Header

- TIP-ID: TIP-005
- Project: ExcelAI
- Module: GitHub Actions/release governance
- Depends on: TIP-002, TIP-003 and TIP-004 VERIFIED
- Priority: P0
- Status: VERIFIED LOCALLY — remote first run pending push

## Context

- Release gates currently pass locally but are not enforced on every revision.
- README badges and feature counts were hand-maintained and contradicted reproduced evidence.
- The local SOT toolchain lives outside the repository and its mtime check is not portable to a clean CI clone.

## Task

Create a least-privilege CI pipeline that installs from lockfile, runs every verified P0 gate, retains revision-addressed evidence and derives release status from canonical SOT facts. Package a portable SOT check for source hashes, A3 provenance and gate-token freshness.

## Acceptance criteria

- Pushes and pull requests run locked install, lint, format, frontend/server builds, frontend/server tests, production dependency audit and critical Chromium E2E.
- CI uses explicit Node and current supported official action majors with read-only repository permission.
- Quality and browser evidence artifacts include run ID and commit SHA and are retained for 30 days, including on failure.
- `npm run sot:check` verifies canonical SHA-256 hashes, unique facts, A3 value exposure and publish-token registry digest with no external skill path.
- `npm run release:evidence` writes machine-readable and human-readable status from canonical SOT inputs and fails when README status drifts.
- README removes static passing-count badges, reports port 5174 and states the honest non-production classification.
- The workflow and both evidence scripts are locally executable/syntax-checked; all previous release gates stay green.

## Constraints

- Do not claim the workflow has run on GitHub until remote CI evidence exists.
- Do not introduce deploy credentials or write permissions.
- Do not convert scoped green stabilization gates into a production-ready claim.

## Report format

Return the standard Completion Report and independent Contractor QA, separating local workflow validation from remote GitHub execution.

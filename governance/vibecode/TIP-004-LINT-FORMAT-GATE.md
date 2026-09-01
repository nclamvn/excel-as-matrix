# TIP-004: Enforceable lint and format gate

## Header

- TIP-ID: TIP-004
- Project: ExcelAI
- Module: source quality gate
- Depends on: TIP-001 VERIFIED
- Priority: P0
- Status: VERIFIED

## Context

- The verified baseline contains 197 ESLint errors and 567 Prettier-drifted source files.
- A production gate cannot be based on aspirational scripts that currently fail.
- Formatting is mechanically broad and must remain distinguishable from behavioral fixes.

## Task

Bring the declared lint and formatting commands to a reproducible zero-error baseline without disabling safety rules, masking files, weakening TypeScript, or changing runtime behavior. Keep mechanical formatting isolated and prove the application remains healthy afterward.

## Acceptance criteria

- `npm run lint` exits 0 with zero ESLint errors.
- `npm run format:check` exits 0 with zero drifted source files.
- No blanket eslint disable, new broad ignore, rule downgrade or TypeScript strictness reduction is used to reach green.
- Any real defect exposed by lint receives a focused test when practical.
- `git diff --check` exits 0.
- Frontend/server builds, all unit/server tests and the critical Chromium release gate remain green.
- SOT records the new lint/format values only after independent Contractor verification.

## Constraints

- Preserve user-authored and unrelated files.
- Treat formatting as mechanical; do not mix opportunistic product redesign into this TIP.
- Do not upgrade the Vite major version here; the toolchain migration remains separately scoped.

## Report format

Return the standard Completion Report plus independent Contractor QA evidence with exact error, warning, drift and regression counts.

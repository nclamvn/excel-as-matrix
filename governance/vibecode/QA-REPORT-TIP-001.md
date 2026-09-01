# QA Report · ExcelAI TIP-001

Date: 2026-09-01  
Version: 1.0.0 working tree  
Environment: local, Node 24.14.1, npm 11.11.0

## Summary

| Tier | Passed | Failed | Skipped | Total | Status |
|---|---:|---:|---:|---:|---|
| Tier 1 — TIP acceptance | 6 | 0 | 0 | 6 | PASS |
| Tier 2 — compatibility smoke | 1 | 0 | 0 | 1 | PASS |
| Tier 3 — dependency security | 2 | 0 | 0 | 2 | PASS |

Requirement coverage: 2/2 scoped P0 requirements (`REQ-001`, `REQ-005`) = 100%.  
TIP acceptance pass rate: 6/6 = 100%.  
Overall status: **APPROVED — TIP-001 VERIFIED**.

## Acceptance matrix

| AC | Independent Contractor evidence | Result |
|---|---|---|
| Clean install with plain `npm ci` | Exit 0; 893 packages; no force or legacy-peer-deps | PASS |
| Direct tree valid | `npm ls --depth=0` exit 0; `xlsx@0.20.3`, ESLint 9 peers valid | PASS |
| Production audit has no high/critical | `npm audit --omit=dev --json`: 0 findings at all severities | PASS |
| Full audit has no critical | 0 critical; four development-toolchain findings documented as SOT facts with owner/exposure | PASS |
| Build and unit regression | `npm run build` exit 0; 35/35 files and 1,884/1,884 tests pass | PASS |
| Deterministic lock contract | A second clean `npm ci` accepted `package-lock.json` without mutation or resolution error | PASS |

## Robustness scenario

- SheetJS `0.20.3` created and parsed a BIFF8 workbook in memory; expected string and numeric cells survived the round trip. Result: PASS.

## Issues fixed during QA

- Production `tmp@0.2.6` gained a newer high advisory during implementation; the override was raised to patched `0.2.7` before verification.
- Remaining same-major dev transitive findings in SystemJS Babel transformer, `brace-expansion`, and `fast-uri` were patched before the final clean install.

## Deferred

- Vite 8 / `vite-plugin-pwa` 1 migration is a separate Level-2 change because it crosses approved major-version boundaries. Current exposure is restricted to the local development toolchain; production audit is empty.
- Chunk cycles, bundle budgets, server build, lint and browser journeys belong to later frozen TIPs and do not weaken this TIP's acceptance result.

## Sign-off checklist

- [x] Scoped Tier 1: 100% pass
- [x] Critical issues: 0
- [x] Scoped P0 requirement coverage: 100%
- [x] Production high/critical dependency findings: 0

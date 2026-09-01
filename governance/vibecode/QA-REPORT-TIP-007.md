# QA Report · ExcelAI TIP-007

Date: 2026-09-01  
Version: 1.0.0 working tree

## Summary

| Tier | Passed | Failed | Skipped | Status |
|---|---:|---:|---:|---|
| Transaction integration | 3 | 0 | 0 | PASS |
| Full unit regression | 1,894 | 0 | 0 | PASS |
| Server tests | 10 | 0 | 0 | PASS |
| Critical Chromium journeys | 5 | 0 | 0 | PASS |
| SOT adversarial bites | 4 | 0 | 0 | PASS |

Overall status: **APPROVED — TIP-007 VERIFIED**.

## Acceptance matrix

| Acceptance criterion | Evidence | Result |
|---|---|---|
| Exact preview | Unit and Chromium verify before `null`/`Before` and after `Trusted-AI`/`After` | PASS |
| Captured target | Unit switches active sheet before approval; only original sheet changes | PASS |
| Shape and payload guard | Mismatch, >10,000 cells and non-finite value fail before audit/mutation | PASS |
| Durable action audit | Proposal, decision, apply and rollback await logger flush | PASS |
| Real mutation | Chromium observes A1 become `Trusted-AI` after Approve | PASS |
| Exact rollback | Unit and Chromium restore prior value; second rollback rejected | PASS |
| No hidden keyboard side effect | Chat Enter no longer advances grid selection | PASS |
| Regression gates | TypeScript/build/lint/format/unit/server/Chromium all green | PASS |

## Residual risks

- 187 lint warnings remain as visible technical debt.
- Main CSS is 598.90 kB and ExcelJS is 931.15 kB minified; performance budgets remain TIP-010.
- Realtime and backend persistence/security are unverified production paths.

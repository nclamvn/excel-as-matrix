# QA Report · ExcelAI TIP-003

Date: 2026-09-01  
Version: 1.0.0 working tree  
Environment: local Chromium, Node 24.14.1, Vite 5.4.21

## Summary

| Tier | Passed | Failed | Skipped | Total | Status |
|---|---:|---:|---:|---:|---|
| Tier 1 — deterministic release journeys | 3 | 0 | 0 | 3 | PASS |
| Tier 2 — existing Chromium regression | 16 | 0 | 0 | 16 | PASS |
| Tier 3 — build and unit regression | 4 | 0 | 0 | 4 | PASS |

TIP acceptance pass rate: 8/8 = 100%.  
Overall status: **APPROVED — TIP-003 VERIFIED**.

## Acceptance matrix

| AC | Independent Contractor evidence | Result |
|---|---|---|
| One explicit app URL | Playwright `baseURL` and `webServer.url` both resolve to `http://127.0.0.1:5174` | PASS |
| Strict port binding | A second Vite process exited 1 with `Port 5174 is already in use` | PASS |
| Explicit reuse only | `reuseExistingServer` is true only when `PLAYWRIGHT_REUSE_SERVER=1` | PASS |
| Existing suite executes | 16/16 Chromium tests passed without startup timeout | PASS |
| Critical user journeys | 3/3 passed: persistent values, calculated formula, keyboard movement, file menu and backend unavailable | PASS |
| Browser error contract | Page and console errors fail tests except the documented local API 503 console line | PASS |
| Failure evidence | Observed failed run retained PNG, WebM, `trace.zip` and `error-context.md` under `test-results/` | PASS |
| Regression health | Frontend/server builds, 1,887 unit tests and 10 server tests all passed | PASS |

## Adversarial checks

- A broad `**/api/**` route matcher also intercepted frontend source modules; it was rejected and replaced with an origin-aware `/api` path regex.
- Clicking the canvas itself required force because it is intentionally non-interactive; the release suite now targets the actual scrollable grid viewport without force.
- The earlier `.cell-editor` assertion was a green false positive because the class did not exist. The editor now has a stable selector, and the test requires visibility before input.
- Enter-key bubbling was reproduced in Chromium, repaired at the component boundary and covered by three unit cases.

## Deferred

- The existing 16-test suite has conditional/no-op branches and is not sufficient evidence by itself.
- Firefox/WebKit, two-client collaboration and production backend integration remain separate TIPs.

## Sign-off checklist

- [x] Scoped Tier 1: 100% pass
- [x] Critical issues: 0
- [x] No local retries, forced grid clicks, arbitrary sleeps or conditional passes in the release gate
- [x] Failure artifacts retained
- [x] Build and unit regression green

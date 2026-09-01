# QA Report · ExcelAI TIP-006

Date: 2026-09-01  
Version: 1.0.0 working tree

## Summary

| Tier | Passed | Failed | Skipped | Total | Status |
|---|---:|---:|---:|---:|---|
| Tier 1 — availability state contract | 3 | 0 | 0 | 3 | PASS |
| Tier 2 — AI/component regression | 100 | 0 | 0 | 100 | PASS |
| Tier 3 — Chromium user journey | 4 | 0 | 0 | 4 | PASS |

Overall status: **APPROVED — TIP-006 VERIFIED**.

## Acceptance matrix

| AC | Independent Contractor evidence | Result |
|---|---|---|
| Default offline | Default config has `mockMode=false`; status false resolves offline | PASS |
| No silent simulation | Offline send throws `AIUnavailableError` and only the status request occurs | PASS |
| Explicit demo | User clicks Enable demo; badge changes Offline→Demo and input becomes enabled | PASS |
| Configured proxy | Status true selects `server-proxy`; controlled live response uses `/api/ai/chat` | PASS |
| Visible transport | Header identifies Offline, Demo, Live Server or Browser key | PASS |
| Regression | 1,891 unit, 10 server and 4 critical Chromium tests pass | PASS |

## Sign-off checklist

- [x] Clean install cannot masquerade as live AI
- [x] Mock requires an explicit state transition
- [x] Offline is fail-closed and actionable
- [x] Configured transport is observable
- [x] No real credential used in tests

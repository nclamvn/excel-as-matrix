# Completion Report · TIP-003

**Builder status:** DONE — submitted for independent Contractor verification

## Files changed

- Aligned Playwright `baseURL`, web server URL and Vite strict binding on `127.0.0.1:5174`.
- Made stale-server reuse explicitly opt-in through `PLAYWRIGHT_REUSE_SERVER=1`.
- Added deterministic line/HTML reporting and retained failure trace, screenshot and video artifacts.
- Added a three-scenario Chromium release gate for persisted edits, formula calculation, keyboard navigation, file menu and API-unavailable local operation.
- Added shared local-workbook initialization before page load and browser error monitoring with one documented 503 allowlist.
- Added stable grid/editor selectors and repaired Enter/Escape/Tab event propagation in the real cell editor.
- Added three component tests proving submit/cancel keys do not leak back to the grid.
- Repaired mobile E2E initialization to use the same deterministic local-workbook contract.

## Builder test results

- `npm run test:e2e:critical`: PASS; 3/3 Chromium scenarios.
- `npm run test:e2e:verify -- --project=chromium`: PASS; 16/16 scenarios.
- `npm run test:run`: PASS; 36/36 files, 1,887/1,887 tests.
- `npm run test:server`: PASS; 2/2 files, 10/10 tests.
- `npm run build`: PASS; 2,403 modules transformed in 28.83 seconds.
- `npm run build:server`: PASS; strict TypeScript exit 0.
- Targeted `CellEditor.test.tsx`: PASS; 3/3 tests.

## Defect found and repaired

The previous E2E typed against a non-interactive canvas and asserted that a nonexistent `.cell-editor` selector was not visible. A real F2/edit/Enter journey exposed that the Enter key submitted the current value and then bubbled into the grid keyboard handler, reopening a blank editor in the next cell. The editor now stops propagation for Enter, Escape and Tab, and both browser and component tests cover the boundary.

## Deviations and limits

- The older 16-test feature suite still contains conditional checks and is retained as regression coverage, not as the release gate. The new critical suite has no conditional pass branches, sleeps or forced clicks.
- Backend calls are fulfilled with explicit 503 responses in the offline/local critical scenarios. No collaboration, billing or AI readiness is inferred.
- Cross-browser coverage remains deferred until the Chromium contract is stable.

## Suggestions for Chủ thầu

- Independently rerun the critical and regression suites and verify a real port collision.
- Confirm failure artifacts exist from a deliberately observed failing run.
- Advance TIP-004 only after TIP-003 is marked VERIFIED.

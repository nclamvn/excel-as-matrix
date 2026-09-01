# Completion Report · TIP-006

**Builder status:** DONE — submitted for independent Contractor verification

## Files changed

- Added typed `checking`, `offline`, `mock` and `configured` AI availability plus explicit proxy/browser-key transport.
- Changed the clean default from mock to fail-closed offline and versioned persisted settings away from the old implicit mock default.
- Removed the hidden fallback that returned simulated answers when both proxy and key were absent.
- Added stable `AI_UNAVAILABLE` errors, availability refresh and store propagation.
- Added visible header badges and an offline chat panel with disabled input, retry and explicit demo opt-in.
- Added service/component tests plus a real Chromium offline→demo journey.

## Builder test results

- Focused AI/runtime/component tests: PASS; 100/100.
- Full `npm run test:run`: PASS; 37/37 files, 1,891/1,891 tests.
- `npm run test:e2e:critical`: PASS; 4/4 Chromium journeys.
- `npm run build`: PASS; 2,403 modules in 20.37 seconds.
- Server tests: PASS; 10/10.
- TypeScript, lint zero-error and format checks: PASS.

## Defect repaired

Before this TIP, both `mockMode=true` by default and the `(!apiKey && !useProxy)` condition generated simulated answers. A user could therefore see plausible AI output even after choosing non-mock config. The client now resolves availability first and throws `AIUnavailableError` offline; only the explicit demo action can enter mock mode.

## Limits

- The configured path is verified with a controlled proxy response, not a real paid model credential.
- Browser-key transport remains supported but is visibly labeled less safe; server proxy is preferred.
- Trusted action rollback/audit is TIP-007 and remains a release blocker.

# TIP-003: Deterministic Chromium E2E harness

## Header

- TIP-ID: TIP-003
- Project: ExcelAI
- Module: Playwright/Vite release harness
- Depends on: TIP-001 VERIFIED
- Priority: P0
- Status: VERIFIED

## Context

- Working directory: `/Users/os/Desktop/ExcelAI`
- Key files: `playwright.config.ts`, `vite.config.ts`, `e2e/**`, `package.json`.
- Reproduced baseline: Vite is fixed to port 5174 while Playwright waits on port 5173, so the prior verify run timed out before executing a test.
- Several tests contain conditional no-op branches; these cannot serve as evidence for a required feature.

## Task

Make the local and CI Chromium harness deterministic: one explicit host/port, strict port binding, no implicit reuse of stale servers, stable artifacts/reporting, and a critical suite whose assertions prove real workbook behavior rather than merely absence of a crash.

## Acceptance criteria

- Playwright's default `baseURL` and `webServer.url` are the same explicit Vite URL on port 5174.
- Vite starts with `--strictPort`; occupied ports fail loudly instead of silently shifting.
- Existing-server reuse happens only through an explicit opt-in environment flag.
- `npm run test:e2e:verify -- --project=chromium` starts the app and reaches test execution without web-server timeout.
- A critical Chromium command verifies app load, cell edit persistence, formula calculation, keyboard navigation, file menu and offline/local-mode operation with no conditional pass/no-op assertion.
- Browser console/page errors fail critical scenarios except for an explicit, documented allowlist.
- Failed runs retain trace/screenshot/video evidence; passing runs produce deterministic line/HTML reports.
- Frontend build and all unit tests remain green.

## Constraints

- Do not claim Supabase two-client collaboration is verified; that belongs to TIP-008.
- Do not hide failures with retries locally, arbitrary sleeps, forced clicks or `expect(true)`.
- Do not require external credentials or internet access for the critical release suite.
- Keep cross-browser expansion separate until Chromium is reliable.

## Report format

Return the standard Completion Report plus independent Contractor QA evidence including exact pass/fail/skip counts and artifact locations.

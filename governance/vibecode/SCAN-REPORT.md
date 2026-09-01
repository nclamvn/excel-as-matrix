# Scan Report · ExcelAI

Date: 2026-08-27  
Commit: `92a5fd8` on `main`

## Tech stack

- Language: TypeScript strict mode.
- Frontend: React 18, Vite 5, PWA/Workbox.
- Styling: Tailwind plus a large CSS layer and design tokens.
- State: Zustand; 41 top-level TypeScript store files.
- Grid: HTML Canvas with virtualized rendering.
- Data: IndexedDB/local persistence and optional Supabase.
- Realtime: two overlapping paths—Supabase Broadcast/Presence and Hono WebSocket/CRDT managers.
- Backend: Hono on Node.js; AI proxy, billing, SCIM, compliance and webhook routes.
- AI: Claude-oriented proxy/client, tool executor, context, grounding, confidence, sandbox, diff and approval modules.
- Testing: Vitest/Testing Library and Playwright.

## Existing modules

- Spreadsheet core: workbook/selection/history stores, CanvasGrid, formula parser/evaluator and 17 function-category files.
- AI runtime: context assembly, tools, grounding, trust, conversation state, sandbox and action approval.
- Collaboration: Supabase realtime plus a separate WebSocket/CRDT stack.
- Data workflows: import/export, data cleaner, Power Query connector, pivot, charts, macros and proactive insights.
- Enterprise shell: auth, admin, SCIM, compliance, audit, billing and permissions.
- Resilience: PWA, offline cache, IndexedDB, recovery journal and version history.

## Patterns detected

- Feature folders with `index.ts` exports and dedicated Zustand stores.
- Heavy use of lazy React imports in `App.tsx`, combined with static imports that weaken chunk separation.
- Graceful local-mode fallbacks when Supabase or AI credentials are absent.
- AI write operations designed around risk levels, approval, diff and sandbox concepts.
- Documentation and status files are manually maintained and can drift from executable truth.

## Reusable assets

- `src/ai/sandbox/*`: change preview, diff, merge and risk primitives.
- `src/ai/grounding/*`: source tracking and claim verification concepts.
- `src/audit/*`: AI usage and audit logging.
- `src/recovery/CrashRecoveryJournal.ts`: recovery foundation.
- `src/providers/RealtimeProvider.tsx`: Supabase realtime boundary.
- `src/collaboration/*`: WebSocket/CRDT implementation and tests.
- `src/test/*` and 35 unit-test files: strong regression base.

## Gaps detected

- Standard `npm ci` cannot resolve the declared peer dependency graph.
- Frontend build passes, but server build fails with seven TypeScript errors.
- ESLint reports 197 errors; Prettier reports 567 files.
- Playwright waits on port 5173 while Vite is configured for 5174; E2E times out before running.
- Current advisory data: 20 vulnerabilities, including 4 critical; several direct dependencies are affected.
- Billing webhook signature verification and subscription persistence are not implemented.
- AI falls back to mock output when no real key/proxy is available, creating a risk of demos being mistaken for verified AI behavior.
- Collaboration has two transports and no single production-proven path.
- Coverage is not an enforced release gate.
- Very large modules increase change risk: workbook store, CanvasGrid, formula libraries and workflow executor.
- Claims such as “Production Ready” and “22 E2E passing” are not reproducible from the current clean checkout.

## Code health

- Frontend type/build: PASS; 24.68 seconds.
- Server type/build: FAIL; 7 errors.
- Unit tests: 35 files, 1,884/1,884 passing.
- E2E: 3 spec files; current verify run does not start.
- Lint: FAIL; 197 errors.
- Format: FAIL; 567 files.
- Dependency audit: 20 total; 4 critical, 10 high, 5 moderate, 1 low.
- Debug/debt markers: one live TODO in billing subscription persistence; several server-side console calls.

## Estimated size

- Tracked files: 786.
- Files under `src`: 715.
- TypeScript/TSX/SQL LOC across app, server, E2E and migrations: about 189,449.
- Component files: 375.
- Store files: 41.
- Hook files: 23.
- Server route modules: 5.

## Builder assessment

The repository contains unusually broad feature coverage and a meaningful unit-test base, but it is a technical preview rather than a releasable production system under reproducible gates. The highest-leverage next step is to restore credibility of install/build/lint/E2E/security before adding another feature family.

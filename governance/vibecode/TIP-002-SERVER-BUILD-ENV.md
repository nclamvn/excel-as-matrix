# TIP-002: Server build and environment contract

## Header

- TIP-ID: TIP-002
- Project: ExcelAI
- Module: Hono server build/runtime foundation
- Depends on: TIP-001 VERIFIED
- Priority: P0
- Status: VERIFIED

## Context

- Working directory: `/Users/os/Desktop/ExcelAI`
- Key files: `server/**`, `server/tsconfig.json`, `.env.example`, `package.json`.
- Reproduced baseline: `npm run build:server` exits 2 with seven strict TypeScript errors: three optional WebSocket route params and four unvalidated upstream HTTP statuses.
- The current emitted ESM uses extensionless local imports and the production start script executes TypeScript through a loader instead of the compiled artifact.

## Task

Make the server build and boot as a compiled Node ESM service. Centralize and validate its environment contract, normalize untrusted upstream statuses before returning JSON, preserve explicit feature-disabled behavior when optional credentials are absent, and protect SCIM from fail-open authentication.

## Acceptance criteria

- `npm run build:server` exits 0 under strict TypeScript settings.
- `npm run start:server` runs the compiled `server/dist/index.js`, not TypeScript source or a development loader.
- With default development configuration, the server boots and `GET /api/health` returns HTTP 200 with `{ status: "ok" }`.
- Invalid `PORT`, wildcard credentialed CORS, or production mode without explicit `CORS_ORIGINS` fails loudly before listening.
- Missing optional AI/Stripe credentials returns service-unavailable behavior; missing SCIM bearer token cannot expose unauthenticated provisioning routes.
- Environment parsing and upstream-status normalization have executable unit tests.
- Frontend build and the existing 1,884 tests remain green.

## Constraints

- Do not claim the unsigned Stripe webhook, in-memory billing/SCIM state, or collaboration transport is production-ready; those remain later security/architecture TIPs.
- Do not add a framework or dotenv dependency.
- Do not weaken TypeScript strictness or suppress the Hono status types.
- Keep secrets server-only and document placeholders without real credentials.

## Report format

Return the standard Completion Report plus independent Contractor QA evidence for build, config failure modes, compiled boot and health response.

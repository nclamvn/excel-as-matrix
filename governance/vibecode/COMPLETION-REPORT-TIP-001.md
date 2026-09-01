# Completion Report · TIP-001

**Builder status:** DONE — awaiting independent Contractor verification

## Files changed

- Updated `package.json` and `package-lock.json` to restore a valid peer-dependency contract.
- Kept `.xls` import compatibility while replacing vulnerable npm `xlsx@0.18.5` with the official SheetJS `0.20.3` CDN tarball.
- Upgraded the Hono server stack and Vitest within their existing majors.
- Moved development-only `concurrently` out of production optional dependencies.
- Added narrowly scoped transitive overrides for patched `brace-expansion`, `tmp`, `uuid`, `ws`, `esbuild`, `fast-uri`, and Babel SystemJS transformer releases.
- Recorded current executable results in `governance/sot/source_canonical/qa_baseline.csv`, regenerated registry facts, accepted source fingerprints and issued a new publish token.

## Dependency delta

- ESLint / `@eslint/js`: `10.x` → `9.39.5`, matching the declared peer range of the React and accessibility plugins.
- SheetJS: npm `0.18.5` → official CDN `0.20.3`.
- Hono: `4.12.12` installed baseline → `4.13.5`.
- `@hono/node-server`: `1.19.13` → `1.19.17`.
- `@hono/node-ws`: `1.3.0` → `1.3.1`.
- Vitest / coverage: `4.0.17` → `4.1.11`.
- Concurrently: `9.2.1` production-optional → `9.2.4` development-only.
- TSX: `4.19.x` contract → `4.23.13`.

## Builder test results

- `npm ci`: PASS; 893 packages installed without force or legacy peer flags.
- `npm ls --depth=0`: PASS; exit 0, no invalid direct dependency.
- `npm audit --omit=dev --json`: PASS; 0 findings at every severity.
- `npm audit --json`: threshold PASS; 0 critical, 1 high, 2 moderate, 1 low.
- `npm run build`: PASS; TypeScript and Vite production build completed in 27.41 seconds.
- `npm run test:run`: PASS; 35/35 files and 1,884/1,884 tests.
- SOT check: PASS; A3 violations 0.
- SOT adversarial bites: PASS; 4/4 injected faults caught.
- SOT publish gate: PASS; digest `b7877eb8b8dfeba5`.

## Remaining development-only advisories

- `QA.DEP.DEV_HIGH`: Vite 5 local development server; the registry fix requires Vite 8, so this is a Level-2 major migration owned by the ExcelAI maintainer. It is absent from `npm audit --omit=dev`.
- `QA.DEP.DEV_MODERATE`: Vite/esbuild and `vite-plugin-pwa` chain; also requires the Vite/PWA major migration. It is absent from the production install.
- `QA.DEP.DEV_LOW`: Babel compiler processing of hostile local source-map input; no application runtime exposure. A patched Babel 7 core release is not present in the registry at verification time.

## Warnings retained as facts

- The production build still reports a circular chunk between `engine-functions` and `engine-core`.
- ExcelJS and CSS bundles remain large; performance budgets are assigned to a later TIP.
- Legacy transitive packages under ExcelJS emit deprecation warnings even though the audited production tree is clean.

## Deviations

- No major framework migration was performed.
- No product behavior or public API was removed; legacy `.xls` import remains supported.
- No audit force-fix, peer bypass, or disabled security rule was used.

## Suggestions for Chủ thầu

- Accept TIP-001 only after the Contractor reruns its acceptance matrix independently.
- Keep the Vite 8 / PWA migration isolated as a separate Level-2 TIP after release-foundation blockers are closed.
- Proceed next to TIP-002 server type/build repair; it remains a P0 release blocker.

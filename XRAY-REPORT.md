# ExcelAI X-Ray Report

**Generated:** 2026-04-07 13:22 (UTC+7)  
**Branch:** main  
**Latest Commit:** `7c4ccf2`  
**Analysis:** 12/12 checks completed (ESLint partial — not installed)

---

## Executive Summary

ExcelAI codebase is **functionally strong** (1,884 tests passing, 0 TypeScript errors, 0 TODO/FIXME markers) but has **significant infrastructure gaps**. Two critical findings: **ESLint is not installed** despite being referenced in package.json, and **99.6% of buttons lack type attributes** (1,053/1,057). Bundle code-splitting is partially done but the main app chunk remains at 377KB. There are 16 npm vulnerabilities, 7 unused dependencies, and 1 missing dependency (nanoid). Accessibility is at 2/5 with only 54 aria attributes across 311 TSX files.

---

## CRITICAL Issues

| # | Issue | Evidence | Impact |
|---|-------|----------|--------|
| CRIT-1 | **ESLint NOT installed** | `eslint` not in package.json dependencies. `npm run lint` fails with "command not found". No `.eslintrc` or `eslint.config.js` exists. | Zero static analysis. Code quality regressions undetected. |
| CRIT-2 | **99.6% buttons missing `type=`** | 1,053 of 1,057 `<button>` elements across 220 files lack `type` attribute. Default is `type="submit"`. | Form submission bugs + WCAG accessibility failure. |

---

## HIGH Priority Issues

| # | Issue | Evidence | Impact |
|---|-------|----------|--------|
| HIGH-1 | Main app chunk 377KB | `index-B5kf4bbk.js` (gzip: 94KB) loaded eagerly | Slow initial load, poor mobile FCP |
| HIGH-2 | 12 high-severity npm vulns | `happy-dom`, `brace-expansion`, `vite/esbuild` chain | Security risk in dev/test tooling |
| HIGH-3 | 7 unused prod dependencies | `lodash-es`, `file-saver`, `oidc-client-ts`, `papaparse`, `react-dropzone`, `xlsx`, `@types/lodash-es` | Bloated install, confusing dependency graph |
| HIGH-4 | Missing dependency: nanoid | Used in 3 stores but not in package.json | Clean `npm install` may break |
| HIGH-5 | vendor-exceljs 931KB | Single largest chunk (gzip: 256KB) | Heavy download for file I/O feature |

---

## MEDIUM Priority Issues

| # | Issue | Evidence | Impact |
|---|-------|----------|--------|
| MED-1 | Accessibility 2/5 | 54 aria, 15 roles, 12 tabIndex across 311 TSX files. 6 imgs without alt. | WCAG non-compliant |
| MED-2 | 14 major versions behind | React 18→19, Vite 5→8, Tailwind 3→4, Zustand 4→5, TS 5→6 | Growing migration debt |
| MED-3 | WS server not deployed | `server/` exists locally, no production deployment | Collab features broken in prod |
| MED-4 | 5 files >1500 LOC | FunctionLibrary (2541), statistical (2367), workbookStore (2018), CanvasGrid (1788), financial (1300) | Hard to maintain |
| MED-5 | Test coverage unknown | `@vitest/coverage-v8` installed but not configured | Cannot verify coverage gaps |

---

## Metrics Dashboard

### Build & Bundle

| Metric | Value | Status |
|--------|-------|--------|
| Build | SUCCESS in 17.01s | OK |
| Total dist size | 3.0MB | WARNING |
| JS total | 2.4MB | WARNING |
| CSS total | 568KB | OK |
| Largest chunk | vendor-exceljs 931KB | CRITICAL |
| Main app chunk | 377KB (gzip 94KB) | WARNING |
| Code-split chunks | 18 chunks | GOOD |
| PWA precache | 29 entries, 3031KB | OK |

### Code Quality

| Metric | Value | Status |
|--------|-------|--------|
| TypeScript strict | 0 errors | EXCELLENT |
| ESLint | NOT INSTALLED | CRITICAL |
| Console.log in prod code | 0 | EXCELLENT |
| Console.log in tests/utils | 51 (5 files) | OK |
| TODO/FIXME/HACK | 0 | EXCELLENT |

### Tests

| Metric | Value | Status |
|--------|-------|--------|
| Total tests | 1,884 | GOOD |
| Pass rate | 100% (1,884/1,884) | EXCELLENT |
| Test files | 35 | OK |
| Duration | 7.88s | FAST |
| Coverage | NOT CONFIGURED | WARNING |
| Slowest test | 50K rows stress: 5.3s | OK |

### Codebase Size

| Metric | Value |
|--------|-------|
| .tsx files (components) | 311 |
| .ts files (logic) | 337 |
| .css files | 38 |
| Test files | 35 |
| Total files | 648 |
| Total LOC | 183,220 |
| Zustand stores | 42 |
| Stores with persist | 20 |

### Dependencies

| Metric | Value | Status |
|--------|-------|--------|
| Vulnerabilities | 16 (0 critical, 12 high, 4 moderate) | WARNING |
| Unused deps | 7 production + 11 dev | WARNING |
| Missing deps | 1 (nanoid) | HIGH |
| Outdated packages | 29 total, 14 major behind | WARNING |

### Accessibility

| Metric | Value | Status |
|--------|-------|--------|
| aria-* attributes | 54 | LOW |
| role attributes | 15 | LOW |
| tabIndex usage | 12 | LOW |
| Buttons without type | 1,053 / 1,057 (99.6%) | CRITICAL |
| Images without alt | 6 | WARNING |
| WCAG estimate | 2/5 | POOR |

---

## Top 15 Largest Files (Refactor Candidates)

| # | File | LOC | Category |
|---|------|-----|----------|
| 1 | `src/nlformula/FunctionLibrary.ts` | 2,541 | NL Formula |
| 2 | `src/engine/functions/statistical.ts` | 2,367 | Formula Engine |
| 3 | `src/stores/workbookStore.ts` | 2,018 | State |
| 4 | `src/components/Grid/CanvasGrid.tsx` | 1,788 | UI Core |
| 5 | `src/engine/functions/financial.ts` | 1,300 | Formula Engine |
| 6 | `src/types/visualization.ts` | 1,275 | Types |
| 7 | `src/engine/functions/math_extra.ts` | 1,164 | Formula Engine |
| 8 | `src/macros/WorkflowExecutor.ts` | 1,149 | Macros |
| 9 | `src/stores/__tests__/workbookStore.test.ts` | 1,135 | Test |
| 10 | `src/components/FileMenu/FileMenu.tsx` | 1,002 | UI |
| 11 | `src/components/Admin/SecuritySettings.tsx` | 998 | Admin |
| 12 | `src/autoviz/ChartRecommender.ts` | 903 | AutoViz |
| 13 | `src/engine/functions/array.ts` | 859 | Formula Engine |
| 14 | `src/ai/AIRuntime.ts` | 826 | AI |
| 15 | `src/components/Admin/GDPRTools.tsx` | 796 | Admin |

---

## Bundle Breakdown (All Chunks)

| Chunk | Size | Gzip | Type | Loading |
|-------|------|------|------|---------|
| vendor-exceljs | 931KB | 256KB | Vendor | Lazy |
| vendor-charts (Recharts) | 395KB | 111KB | Vendor | Lazy |
| **index-main (app)** | **377KB** | **94KB** | **App** | **Eager** |
| ai-runtime | 302KB | 82KB | Feature | Lazy |
| vendor-react | 141KB | 45KB | Vendor | Eager |
| engine-functions | 121KB | 26KB | Feature | Lazy |
| index-secondary | 85KB | 20KB | App | Eager |
| vendor-icons (Lucide) | 31KB | 9KB | Vendor | Eager |
| index-tertiary | 24KB | 7KB | App | Eager |
| engine-core | 19KB | 5KB | Feature | Lazy |
| collab | 18KB | 5KB | Feature | Lazy |
| index-quaternary | 14KB | 4KB | App | Eager |
| CompetitiveLanding | 10KB | 3KB | Feature | Lazy |
| excel-io | 7KB | 3KB | Feature | Lazy |
| MobileGridOverlay | 7KB | 3KB | Feature | Lazy |
| vendor-zustand | 7KB | 3KB | Vendor | Eager |
| OnboardingTour | 6KB | 2KB | Feature | Lazy |
| CrashRecoveryBanner | 3KB | 1KB | Feature | Lazy |

**Eager total:** ~679KB (gzip ~173KB) — this is what users download on first load  
**Lazy total:** ~1,832KB (gzip ~501KB) — loaded on demand

---

## Collaboration/WebSocket Status

| Component | Status |
|-----------|--------|
| CRDTEngine | Implemented + tested (25 tests) |
| WebSocketClient | Implemented + tested |
| PresenceManager | Implemented + tested |
| CollaborationManager | Implemented |
| CommentManager | Implemented |
| useWebSocket hook | Implemented + tested |
| useCollaboration hook | Implemented |
| connectionStore | Implemented |
| Server (Hono) | Exists in `server/` — NOT deployed |
| WS endpoint | `server/ws/` directory exists |

**Verdict:** Client-side fully built. Server exists but needs deployment.

---

## Recommended Action Plan (Prioritized)

### Immediate (Before any new features)

1. **Install ESLint + configure** — Add `eslint` + `@typescript-eslint` to devDependencies, create `eslint.config.js` with flat config
2. **Fix button types** — Add `type="button"` to all 1,053 non-submit buttons (batch fix with codemod or find/replace)
3. **Run `npm audit fix`** — Address 16 vulnerabilities
4. **Fix dependencies** — Remove 7 unused, add missing `nanoid`

### Short-term (Next sprint)

5. **Further code-split main chunk** — Extract heavy components from 377KB main bundle
6. **Enable test coverage** — Configure `@vitest/coverage-v8` in vitest.config
7. **Lazy-load vendor-exceljs** — Only load 931KB ExcelJS when user triggers import/export

### Medium-term

8. **Accessibility pass** — Add aria labels, roles, keyboard navigation across all interactive components
9. **Refactor large files** — Split files >1500 LOC
10. **Plan major upgrades** — React 19, Vite 8, Tailwind 4 (breaking changes, needs dedicated sprint)

---

## Checks Summary

| # | Check | Status | Key Finding |
|---|-------|--------|-------------|
| 1 | Build Health | PASS | 17s, success, 1 size warning |
| 2 | Bundle Analysis | DONE | 2.4MB JS, 18 chunks, main still 377KB |
| 3 | TypeScript Strict | PASS | 0 errors |
| 4 | ESLint | FAIL | NOT INSTALLED |
| 5 | Console.log Audit | PASS | 0 in production code |
| 6 | TODO/FIXME | PASS | 0 markers |
| 7 | Tests | PASS | 1,884/1,884 (100%) |
| 8 | Dependency Audit | WARNING | 16 vulns, 7 unused, 1 missing |
| 9 | Codebase Metrics | DONE | 183K LOC, 648 files |
| 10 | Store Analysis | DONE | 42 stores, 20 with persist |
| 11 | Accessibility | FAIL | 99.6% buttons missing type, 2/5 WCAG |
| 12 | WebSocket/Collab | PARTIAL | Client done, server not deployed |

---

*X-Ray Analysis by Claude Code | ExcelAI v1.0 | 2026-04-07*

# ExcelAI

> AI-native spreadsheet — a Google Sheets alternative with real-time collaboration.

[![Production gates](https://github.com/nclamvn/excel-as-matrix/actions/workflows/ci.yml/badge.svg)](https://github.com/nclamvn/excel-as-matrix/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

<!-- release-status:start -->
## Verified release status

| Gate | Status | SOT value |
|---|---|---:|
| Standard install | PASS | PASS  |
| Production dependency audit | PASS | 0 findings |
| Frontend build | PASS | PASS  |
| Server build | PASS | PASS  |
| Lint errors | PASS | 0 errors |
| Format drift | PASS | 0 files |
| Critical Chromium tests | PASS | 5 tests passed |

Verified counts: 1,894 unit tests, 10 server tests, 5 critical Chromium journeys.

**Release classification: NOT PRODUCTION READY.** Scoped stabilization gates are green, but production approval remains blocked by configured-model validation, realtime and backend security/persistence work. The canonical evidence is [the QA SOT](governance/sot/source_canonical/qa_baseline.csv), not a hand-maintained badge.
<!-- release-status:end -->

## Implemented surfaces

These surfaces exist in the codebase; the list is not a production-readiness claim. Runtime status for AI, realtime and backend-dependent features remains subject to the verified release status above.

- **162 Formula Functions** — Excel-compatible (SUM, VLOOKUP, IF, INDEX/MATCH, etc.)
- **Real-time Collaboration** — Multi-cursor, presence avatars, cell locking
- **Version History** — Auto-save every 5 min, restore, diff view
- **Sharing** — Permission-based (View/Edit/Admin), link sharing
- **Import/Export** — Excel (.xlsx/.xls), CSV, PDF, Google Sheets URL
- **Filter Views** — Personal filters that don't affect other users
- **Protected Ranges** — Lock cells/ranges with owner/editor RBAC
- **Comments & @mentions** — Real-time notification bell
- **AI Copilot** — Natural language formulas, data insights
- **Mobile Responsive** — Touch-friendly with bottom toolbar
- **Canvas Grid** — High-performance rendering for large datasets

## Quick Start

```bash
npm ci
npm run dev
# Open http://127.0.0.1:5174
```

## Configuration

```bash
# .env.local (optional — enables real-time collaboration)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase, the verified critical local workflow supports workbook load, editing, formulas, keyboard navigation and the file menu. Other feature surfaces are not implied to be production-verified.

## Scripts

```bash
npm run dev              # Development server
npm run dev:server       # Backend server (WebSocket + AI proxy)
npm run dev:all          # Both concurrently
npm run build            # Production build
npm run build:server     # Compile the backend artifact
npm run test:run         # Unit tests (Vitest)
npm run test:server      # Backend config/status tests
npm run test:e2e         # E2E tests (Playwright)
npm run test:e2e:critical # Deterministic Chromium release gate
npm run test:e2e:verify  # Feature verification suite
npm run test:e2e:collab  # Collaboration tests
npm run sot:check        # Portable SOT integrity gate
npm run release:evidence # Derive release evidence from SOT
```

## Documentation

- [User Guide](docs/user-guide/README.md) — Features, shortcuts, FAQ
- [Admin Guide](docs/admin-guide/README.md) — Deploy, Supabase setup, troubleshooting
- [Developer Guide](docs/developer-guide/README.md) — Architecture, contributing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict) |
| State | Zustand (42+ stores) |
| Grid | HTML Canvas |
| Real-time | Supabase Realtime |
| Backend | Hono (Node.js) |
| Testing | Vitest + Playwright |

## Stats

| Metric | Value |
|--------|-------|
| Source files | 662+ |
| Lines of code | ~190,000 |
| Verified unit tests | See SOT-derived status above |
| Critical E2E journeys | See SOT-derived status above |
| Formula functions | 162 |
| Build time | ~19s |

## License

MIT

## Author

**nclamvn** — 2026

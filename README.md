# ExcelAI

> AI-native spreadsheet — a Google Sheets alternative with real-time collaboration.

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-1884%20passing-brightgreen)
![E2E](https://img.shields.io/badge/e2e-22%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

## Features

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
npm install
npm run dev
# Open http://localhost:5173
```

## Configuration

```bash
# .env.local (optional — enables real-time collaboration)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase, the app works in single-user local mode with all features except real-time sync.

## Scripts

```bash
npm run dev              # Development server
npm run dev:server       # Backend server (WebSocket + AI proxy)
npm run dev:all          # Both concurrently
npm run build            # Production build
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:e2e:verify  # Feature verification suite
npm run test:e2e:collab  # Collaboration tests
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
| Unit tests | 1,884 |
| E2E tests | 22 |
| Formula functions | 162 |
| Build time | ~19s |

## License

MIT

## Author

**nclamvn** — 2026

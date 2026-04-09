# ExcelAI Developer Guide

## Architecture Overview

```
excelai/
├── src/
│   ├── components/        # React UI components
│   │   ├── Grid/          # Canvas-based spreadsheet grid
│   │   ├── Modern/        # Header, toolbar, formula bar
│   │   ├── AI/            # AI Copilot components
│   │   ├── Mobile/        # Mobile-specific UI
│   │   ├── Collaboration/ # Presence, cursors, comments
│   │   ├── Filter/        # Filter view UI
│   │   ├── Protection/    # Protected range dialogs
│   │   ├── Version/       # Version history panel
│   │   └── FileIO/        # Import/export dialogs
│   ├── stores/            # Zustand state management (42+ stores)
│   ├── hooks/             # Custom React hooks
│   ├── services/          # External service clients
│   ├── engine/            # Formula engine (162 functions)
│   ├── collaboration/     # WebSocket + Supabase Realtime
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── lib/               # External library wrappers
│   └── styles/            # Global CSS (responsive, themes)
├── server/                # Hono backend (WebSocket, AI proxy)
├── e2e/                   # Playwright E2E tests
└── docs/                  # Documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict mode) |
| State | Zustand with persist middleware |
| Grid | HTML Canvas (high-performance rendering) |
| Styling | Tailwind CSS + CSS variables |
| Real-time | Supabase Realtime (Broadcast + Presence) |
| Backend | Hono (Node.js) |
| Unit tests | Vitest + happy-dom |
| E2E tests | Playwright |
| Build | Vite with code-splitting |

---

## Key Stores

| Store | File | Purpose |
|-------|------|---------|
| workbookStore | stores/workbookStore.ts | Sheets, cells, formulas, clipboard |
| selectionStore | stores/selectionStore.ts | Current cell/range selection |
| presenceStore | stores/presenceStore.ts | Online users, cursors, cell locks |
| versionStore | stores/versionStore.ts | Auto-save snapshots, restore |
| filterViewStore | stores/filterViewStore.ts | Personal filter views |
| protectionStore | stores/protectionStore.ts | Protected ranges, RBAC |
| notificationStore | stores/notificationStore.ts | @mention notifications |
| commentsStore | stores/commentsStore.ts | Cell comments and replies |
| uiStore | stores/uiStore.ts | Theme, toasts, mobile detection |
| aiStore | stores/aiStore.ts | AI panel state |

---

## Data Flow

```
User Input -> Component -> Store Action -> State Update -> React Re-render
                                |
                                ├-> Formula Engine (if formula)
                                ├-> Supabase Broadcast (if connected)
                                └-> Auto-save (every 5 min)
```

### Real-time sync flow
```
User A types in cell
  -> workbookStore.setCellValue()
  -> RealtimeProvider.broadcastCellChange()
  -> Supabase channel.send({ event: 'cell_update' })
  -> User B receives broadcast
  -> workbookStore.updateCell() on User B
```

---

## Adding a New Feature

### 1. Define types
```typescript
// src/types/myFeature.ts
export interface MyFeature {
  id: string;
  name: string;
}
```

### 2. Create store
```typescript
// src/stores/myFeatureStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyFeatureStore {
  items: MyFeature[];
  addItem: (item: MyFeature) => void;
}

export const useMyFeatureStore = create<MyFeatureStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }),
    { name: 'excelai-my-feature' }
  )
);
```

### 3. Create component
```typescript
// src/components/MyFeature/MyFeature.tsx
import { useMyFeatureStore } from '../../stores/myFeatureStore';

export function MyFeature() {
  const { items } = useMyFeatureStore();
  return <div data-testid="my-feature">{/* ... */}</div>;
}
```

### 4. Add E2E test
```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('my feature works', async ({ page }) => {
  await page.goto('/');
  // ... test steps
});
```

---

## Testing

```bash
# Unit tests (Vitest)
npm test                    # Watch mode
npm run test:run            # Single run
npm run test:coverage       # With coverage

# E2E tests (Playwright)
npm run test:e2e            # All E2E tests
npm run test:e2e:verify     # Feature verification suite
npm run test:e2e:collab     # Collaboration tests
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Headed browser mode
```

### Test structure
- `src/**/__tests__/*.test.ts` — Unit tests (Vitest)
- `e2e/spreadsheet.spec.ts` — Core grid E2E tests
- `e2e/verify-features.spec.ts` — Feature verification suite
- `e2e/collaboration.spec.ts` — Real-time collaboration tests

---

## Code Conventions

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Prefer `interface` over `type` for object shapes
- Use `CellValue` type for cell values: `string | number | boolean | null`

### React
- Functional components only
- Custom hooks for reusable logic
- Add `data-testid` attributes for E2E test targets
- Lazy load non-critical components with `React.lazy()`

### CSS
- Tailwind utilities for layout
- CSS variables for theming (`--surface-1`, `--text-1`, etc.)
- `responsive.css` for breakpoint-specific overrides
- BEM naming for component-specific CSS

### Commits
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `test:` — Tests
- `refactor:` — Code refactoring

---

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Implement changes following the conventions above
3. Add tests (unit and/or E2E)
4. Verify: `npm run test:run && npm run test:e2e:verify`
5. Commit with conventional message
6. Push and create a pull request

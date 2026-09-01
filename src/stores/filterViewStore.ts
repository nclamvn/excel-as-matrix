/**
 * Filter View Store — manages personal saved filter configurations.
 * Each user can create, switch, and delete filter views per sheet.
 * Persisted to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterView, FilterCondition, SortCondition } from '@/types/filterView';

function generateId(): string {
  return `fv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface FilterViewState {
  /** All filter views keyed by workbookId */
  views: Record<string, FilterView[]>;
  /** Active view per sheet: sheetId → viewId | null */
  activeViewId: Record<string, string | null>;
}

interface FilterViewActions {
  createView: (
    workbookId: string,
    sheetId: string,
    name: string,
    userId: string,
    userName: string
  ) => string;
  updateView: (workbookId: string, viewId: string, updates: Partial<FilterView>) => void;
  deleteView: (workbookId: string, viewId: string) => void;
  duplicateView: (workbookId: string, viewId: string, newName: string) => string | null;

  setActiveView: (sheetId: string, viewId: string | null) => void;
  getActiveView: (sheetId: string) => FilterView | null;

  addFilter: (workbookId: string, viewId: string, filter: FilterCondition) => void;
  removeFilter: (workbookId: string, viewId: string, column: number) => void;
  clearFilters: (workbookId: string, viewId: string) => void;

  setSort: (workbookId: string, viewId: string, sort: SortCondition) => void;
  clearSort: (workbookId: string, viewId: string) => void;

  toggleHideColumn: (workbookId: string, viewId: string, col: number) => void;
  toggleHideRow: (workbookId: string, viewId: string, row: number) => void;

  getViews: (workbookId: string, sheetId: string, userId: string) => FilterView[];
}

export const useFilterViewStore = create<FilterViewState & FilterViewActions>()(
  persist(
    (set, get) => ({
      views: {},
      activeViewId: {},

      createView: (workbookId, sheetId, name, userId, userName) => {
        const id = generateId();
        const view: FilterView = {
          id,
          name,
          sheetId,
          workbookId,
          createdBy: userId,
          createdByName: userName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          filters: [],
          sorts: [],
          hiddenColumns: [],
          hiddenRows: [],
          isPersonal: true,
        };
        set((state) => ({
          views: {
            ...state.views,
            [workbookId]: [...(state.views[workbookId] || []), view],
          },
        }));
        return id;
      },

      updateView: (workbookId, viewId, updates) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) =>
                v.id === viewId ? { ...v, ...updates, updatedAt: Date.now() } : v
              ),
            },
          };
        });
      },

      deleteView: (workbookId, viewId) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          // Clear active if deleted
          const newActive = { ...state.activeViewId };
          for (const [sheetId, activeId] of Object.entries(newActive)) {
            if (activeId === viewId) newActive[sheetId] = null;
          }
          return {
            views: { ...state.views, [workbookId]: list.filter((v) => v.id !== viewId) },
            activeViewId: newActive,
          };
        });
      },

      duplicateView: (workbookId, viewId, newName) => {
        const list = get().views[workbookId] || [];
        const original = list.find((v) => v.id === viewId);
        if (!original) return null;
        const id = generateId();
        const copy: FilterView = {
          ...original,
          id,
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          views: {
            ...state.views,
            [workbookId]: [...(state.views[workbookId] || []), copy],
          },
        }));
        return id;
      },

      setActiveView: (sheetId, viewId) => {
        set((state) => ({
          activeViewId: { ...state.activeViewId, [sheetId]: viewId },
        }));
      },

      getActiveView: (sheetId) => {
        const viewId = get().activeViewId[sheetId];
        if (!viewId) return null;
        for (const list of Object.values(get().views)) {
          const found = list.find((v) => v.id === viewId);
          if (found) return found;
        }
        return null;
      },

      addFilter: (workbookId, viewId, filter) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) => {
                if (v.id !== viewId) return v;
                // Replace existing filter on same column
                const filters = v.filters.filter((f) => f.column !== filter.column);
                return { ...v, filters: [...filters, filter], updatedAt: Date.now() };
              }),
            },
          };
        });
      },

      removeFilter: (workbookId, viewId, column) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) =>
                v.id === viewId
                  ? {
                      ...v,
                      filters: v.filters.filter((f) => f.column !== column),
                      updatedAt: Date.now(),
                    }
                  : v
              ),
            },
          };
        });
      },

      clearFilters: (workbookId, viewId) => {
        get().updateView(workbookId, viewId, { filters: [] });
      },

      setSort: (workbookId, viewId, sort) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) =>
                v.id === viewId ? { ...v, sorts: [sort], updatedAt: Date.now() } : v
              ),
            },
          };
        });
      },

      clearSort: (workbookId, viewId) => {
        get().updateView(workbookId, viewId, { sorts: [] });
      },

      toggleHideColumn: (workbookId, viewId, col) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) => {
                if (v.id !== viewId) return v;
                const hidden = v.hiddenColumns.includes(col)
                  ? v.hiddenColumns.filter((c) => c !== col)
                  : [...v.hiddenColumns, col];
                return { ...v, hiddenColumns: hidden, updatedAt: Date.now() };
              }),
            },
          };
        });
      },

      toggleHideRow: (workbookId, viewId, row) => {
        set((state) => {
          const list = state.views[workbookId] || [];
          return {
            views: {
              ...state.views,
              [workbookId]: list.map((v) => {
                if (v.id !== viewId) return v;
                const hidden = v.hiddenRows.includes(row)
                  ? v.hiddenRows.filter((r) => r !== row)
                  : [...v.hiddenRows, row];
                return { ...v, hiddenRows: hidden, updatedAt: Date.now() };
              }),
            },
          };
        });
      },

      getViews: (workbookId, sheetId, userId) => {
        const list = get().views[workbookId] || [];
        return list.filter(
          (v) => v.sheetId === sheetId && (!v.isPersonal || v.createdBy === userId)
        );
      },
    }),
    { name: 'excelai-filter-views' }
  )
);

/**
 * Apply filter conditions to determine if a row should be visible.
 */
export function matchesFilters(
  rowCells: Record<number, string | number | boolean | null>,
  filters: FilterCondition[]
): boolean {
  for (const filter of filters) {
    const cellValue = rowCells[filter.column];
    if (!matchesCondition(cellValue, filter)) return false;
  }
  return true;
}

function matchesCondition(
  cellValue: string | number | boolean | null | undefined,
  condition: FilterCondition
): boolean {
  const val = cellValue ?? '';
  const cmp = condition.value;

  switch (condition.operator) {
    case 'isEmpty':
      return val === '' || val === null || val === undefined;
    case 'isNotEmpty':
      return val !== '' && val !== null && val !== undefined;
    case 'equals':
      return String(val).toLowerCase() === String(cmp).toLowerCase();
    case 'notEquals':
      return String(val).toLowerCase() !== String(cmp).toLowerCase();
    case 'contains':
      return String(val).toLowerCase().includes(String(cmp).toLowerCase());
    case 'notContains':
      return !String(val).toLowerCase().includes(String(cmp).toLowerCase());
    case 'startsWith':
      return String(val).toLowerCase().startsWith(String(cmp).toLowerCase());
    case 'endsWith':
      return String(val).toLowerCase().endsWith(String(cmp).toLowerCase());
    case 'greaterThan':
      return Number(val) > Number(cmp);
    case 'lessThan':
      return Number(val) < Number(cmp);
    case 'greaterOrEqual':
      return Number(val) >= Number(cmp);
    case 'lessOrEqual':
      return Number(val) <= Number(cmp);
    case 'between':
      return Number(val) >= Number(cmp) && Number(val) <= Number(condition.value2);
    default:
      return true;
  }
}

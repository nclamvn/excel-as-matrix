import { create } from 'zustand';
import { NamedRange } from '../types/cell';
import { loggers } from '@/utils/logger';

interface NamedRangeState {
  // Named range registry
  ranges: Record<string, NamedRange>;
  workbookScoped: Record<string, string>; // name -> rangeId (workbook scope)
  sheetScoped: Record<string, Record<string, string>>; // sheetId -> { name -> rangeId }

  // Actions
  addRange: (range: NamedRange) => void;
  updateRange: (rangeId: string, updates: Partial<NamedRange>) => void;
  removeRange: (rangeId: string) => void;
  renameRange: (rangeId: string, newName: string) => void;

  // Getters
  getRange: (rangeId: string) => NamedRange | undefined;
  resolve: (name: string, fromSheetId?: string) => NamedRange | undefined;
  getVisibleFromSheet: (sheetId: string) => NamedRange[];
  getWorkbookScoped: () => NamedRange[];
  getSheetScoped: (sheetId: string) => NamedRange[];
  listAll: () => NamedRange[];
  listVisible: () => NamedRange[];

  // Reset
  reset: () => void;
}

const initialState = {
  ranges: {} as Record<string, NamedRange>,
  workbookScoped: {} as Record<string, string>,
  sheetScoped: {} as Record<string, Record<string, string>>,
};

export const useNamedRangeStore = create<NamedRangeState>()((set, get) => ({
  ...initialState,

  addRange: (range) => {
    set((state) => {
      // Check for name conflicts
      if (range.scope === 'workbook') {
        if (state.workbookScoped[range.name]) {
          loggers.store.warn('Named range already exists at workbook scope:', range.name);
          return state;
        }
      } else {
        const sheetId = range.scope.sheet;
        if (state.sheetScoped[sheetId]?.[range.name]) {
          loggers.store.warn('Named range already exists in sheet:', range.name);
          return state;
        }
      }

      const ranges = { ...state.ranges, [range.id]: range };
      let workbookScoped = { ...state.workbookScoped };
      let sheetScoped = { ...state.sheetScoped };

      if (range.scope === 'workbook') {
        workbookScoped = { ...workbookScoped, [range.name]: range.id };
      } else {
        const sheetId = range.scope.sheet;
        if (!sheetScoped[sheetId]) {
          sheetScoped[sheetId] = {};
        }
        sheetScoped = {
          ...sheetScoped,
          [sheetId]: { ...sheetScoped[sheetId], [range.name]: range.id },
        };
      }

      return { ranges, workbookScoped, sheetScoped };
    });
  },

  updateRange: (rangeId, updates) => {
    set((state) => {
      const existing = state.ranges[rangeId];
      if (!existing) return state;

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return { ranges: { ...state.ranges, [rangeId]: updated } };
    });
  },

  removeRange: (rangeId) => {
    set((state) => {
      const range = state.ranges[rangeId];
      if (!range) return state;

      const { [rangeId]: _, ...ranges } = state.ranges;
      let workbookScoped = { ...state.workbookScoped };
      let sheetScoped = { ...state.sheetScoped };

      if (range.scope === 'workbook') {
        const { [range.name]: __, ...rest } = workbookScoped;
        workbookScoped = rest;
      } else {
        const sheetId = range.scope.sheet;
        if (sheetScoped[sheetId]) {
          const { [range.name]: __, ...rest } = sheetScoped[sheetId];
          sheetScoped = { ...sheetScoped, [sheetId]: rest };
        }
      }

      return { ranges, workbookScoped, sheetScoped };
    });
  },

  renameRange: (rangeId, newName) => {
    const state = get();
    const range = state.ranges[rangeId];
    if (!range) return;

    // Check for conflicts with new name
    if (range.scope === 'workbook') {
      if (state.workbookScoped[newName] && state.workbookScoped[newName] !== rangeId) {
        loggers.store.warn('Named range already exists:', newName);
        return;
      }
    } else {
      const sheetId = range.scope.sheet;
      if (state.sheetScoped[sheetId]?.[newName] && state.sheetScoped[sheetId][newName] !== rangeId) {
        loggers.store.warn('Named range already exists in sheet:', newName);
        return;
      }
    }

    set((state) => {
      const range = state.ranges[rangeId];
      if (!range) return state;

      const oldName = range.name;
      const updated = { ...range, name: newName, updatedAt: new Date().toISOString() };
      const ranges = { ...state.ranges, [rangeId]: updated };

      let workbookScoped = { ...state.workbookScoped };
      let sheetScoped = { ...state.sheetScoped };

      if (range.scope === 'workbook') {
        const { [oldName]: _, ...rest } = workbookScoped;
        workbookScoped = { ...rest, [newName]: rangeId };
      } else {
        const sheetId = range.scope.sheet;
        if (sheetScoped[sheetId]) {
          const { [oldName]: _, ...rest } = sheetScoped[sheetId];
          sheetScoped = { ...sheetScoped, [sheetId]: { ...rest, [newName]: rangeId } };
        }
      }

      return { ranges, workbookScoped, sheetScoped };
    });
  },

  getRange: (rangeId) => {
    return get().ranges[rangeId];
  },

  resolve: (name, fromSheetId) => {
    const state = get();

    // Sheet-scoped names take precedence
    if (fromSheetId && state.sheetScoped[fromSheetId]?.[name]) {
      const rangeId = state.sheetScoped[fromSheetId][name];
      return state.ranges[rangeId];
    }

    // Fall back to workbook-scoped
    if (state.workbookScoped[name]) {
      const rangeId = state.workbookScoped[name];
      return state.ranges[rangeId];
    }

    return undefined;
  },

  getVisibleFromSheet: (sheetId) => {
    const state = get();
    const result: NamedRange[] = [];

    // Add workbook-scoped ranges
    for (const rangeId of Object.values(state.workbookScoped)) {
      const range = state.ranges[rangeId];
      if (range && !range.hidden) {
        result.push(range);
      }
    }

    // Add sheet-scoped ranges for this sheet
    if (state.sheetScoped[sheetId]) {
      for (const rangeId of Object.values(state.sheetScoped[sheetId])) {
        const range = state.ranges[rangeId];
        if (range && !range.hidden) {
          result.push(range);
        }
      }
    }

    return result;
  },

  getWorkbookScoped: () => {
    const state = get();
    return Object.values(state.workbookScoped)
      .map(id => state.ranges[id])
      .filter(Boolean);
  },

  getSheetScoped: (sheetId) => {
    const state = get();
    if (!state.sheetScoped[sheetId]) return [];
    return Object.values(state.sheetScoped[sheetId])
      .map(id => state.ranges[id])
      .filter(Boolean);
  },

  listAll: () => {
    return Object.values(get().ranges);
  },

  listVisible: () => {
    return Object.values(get().ranges).filter(r => !r.hidden);
  },

  reset: () => {
    set(initialState);
  },
}));

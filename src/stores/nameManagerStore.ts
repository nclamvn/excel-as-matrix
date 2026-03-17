// ============================================================
// NAME MANAGER STORE — Named Ranges, Formulas, and LAMBDAs
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loggers } from '@/utils/logger';

export type NameScope = 'workbook' | string; // 'workbook' or sheetId

export type NameType = 'range' | 'formula' | 'lambda' | 'constant';

export interface NamedItem {
  id: string;
  name: string;
  type: NameType;
  scope: NameScope;
  refersTo: string;  // The formula/range/value it refers to
  comment?: string;
  // For LAMBDA functions
  parameters?: string[];
  // Metadata
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

interface NameManagerState {
  names: Record<string, NamedItem>;  // id -> NamedItem

  // Actions
  createName: (name: string, type: NameType, refersTo: string, scope?: NameScope, comment?: string, parameters?: string[]) => NamedItem | null;
  updateName: (id: string, updates: Partial<NamedItem>) => void;
  deleteName: (id: string) => void;

  // Queries
  getNameByName: (name: string, scope?: NameScope) => NamedItem | undefined;
  getNameById: (id: string) => NamedItem | undefined;
  getNamesByType: (type: NameType) => NamedItem[];
  getNamesByScope: (scope: NameScope) => NamedItem[];
  getAllNames: () => NamedItem[];

  // Validation
  isValidName: (name: string) => boolean;
  isNameAvailable: (name: string, scope: NameScope, excludeId?: string) => boolean;

  // Lookup for formula evaluation
  resolveNamedValue: (name: string, currentSheetId?: string) => string | undefined;
}

// Excel-style naming rules
const NAME_PATTERN = /^[A-Za-z_\\][A-Za-z0-9_.]*$/;
const RESERVED_NAMES = new Set([
  'TRUE', 'FALSE', 'NULL', 'ERROR', 'NA', 'REF', 'VALUE', 'NAME', 'DIV', 'NUM',
  'PI', 'E', 'TODAY', 'NOW', 'ROW', 'COLUMN', 'SHEET', 'CELL',
]);

export const useNameManagerStore = create<NameManagerState>()(
  persist(
    (set, get) => ({
      names: {},

      createName: (name, type, refersTo, scope = 'workbook', comment, parameters) => {
        const state = get();

        // Validate name
        if (!state.isValidName(name)) {
          loggers.store.error('Invalid name:', name);
          return null;
        }

        // Check availability
        if (!state.isNameAvailable(name, scope)) {
          loggers.store.error('Name already exists:', name);
          return null;
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const namedItem: NamedItem = {
          id,
          name: name.toUpperCase(),
          type,
          scope,
          refersTo,
          comment,
          parameters,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          names: { ...state.names, [id]: namedItem },
        }));

        return namedItem;
      },

      updateName: (id, updates) => {
        set(state => {
          const existing = state.names[id];
          if (!existing) return state;

          // Validate new name if being updated
          if (updates.name && updates.name !== existing.name) {
            if (!get().isValidName(updates.name)) {
              loggers.store.error('Invalid name:', updates.name);
              return state;
            }
            if (!get().isNameAvailable(updates.name, updates.scope || existing.scope, id)) {
              loggers.store.error('Name already exists:', updates.name);
              return state;
            }
            updates.name = updates.name.toUpperCase();
          }

          return {
            names: {
              ...state.names,
              [id]: {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      deleteName: (id) => {
        set(state => {
          const { [id]: removed, ...rest } = state.names;
          return { names: rest };
        });
      },

      getNameByName: (name, scope) => {
        const upperName = name.toUpperCase();
        const allNames = Object.values(get().names);

        // First try exact scope match
        if (scope) {
          const scopeMatch = allNames.find(
            n => n.name === upperName && n.scope === scope
          );
          if (scopeMatch) return scopeMatch;
        }

        // Then try workbook scope
        return allNames.find(
          n => n.name === upperName && n.scope === 'workbook'
        );
      },

      getNameById: (id) => {
        return get().names[id];
      },

      getNamesByType: (type) => {
        return Object.values(get().names).filter(n => n.type === type);
      },

      getNamesByScope: (scope) => {
        return Object.values(get().names).filter(n => n.scope === scope);
      },

      getAllNames: () => {
        return Object.values(get().names).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      },

      isValidName: (name) => {
        // Check pattern
        if (!NAME_PATTERN.test(name)) return false;

        // Check length
        if (name.length < 1 || name.length > 255) return false;

        // Check reserved names
        if (RESERVED_NAMES.has(name.toUpperCase())) return false;

        // Check it's not a cell reference pattern (A1, B2, etc.)
        if (/^[A-Za-z]{1,3}\d+$/.test(name)) return false;

        // Check it's not an R1C1 reference
        if (/^R\d*C\d*$/i.test(name)) return false;

        return true;
      },

      isNameAvailable: (name, scope, excludeId) => {
        const upperName = name.toUpperCase();
        const allNames = Object.values(get().names);

        return !allNames.some(n =>
          n.name === upperName &&
          (n.scope === scope || n.scope === 'workbook' || scope === 'workbook') &&
          n.id !== excludeId
        );
      },

      resolveNamedValue: (name, currentSheetId) => {
        const namedItem = get().getNameByName(name, currentSheetId);
        if (!namedItem) return undefined;
        return namedItem.refersTo;
      },
    }),
    {
      name: 'excelai-name-manager',
    }
  )
);

export default useNameManagerStore;

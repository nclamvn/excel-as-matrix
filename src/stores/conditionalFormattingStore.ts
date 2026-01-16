// ============================================================
// CONDITIONAL FORMATTING STORE
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CFRule } from '../types/conditionalFormatting';

// Generate simple unique ID
const generateId = () => Math.random().toString(36).substring(2, 10);

interface CFStore {
  // Rules per sheet (keyed by sheetId)
  rules: Record<string, CFRule[]>;

  // Active sheet
  activeSheetId: string;

  // Actions
  addRule: (rule: Omit<CFRule, 'id' | 'priority'>, sheetId?: string) => string;
  updateRule: (ruleId: string, updates: Partial<CFRule>, sheetId?: string) => void;
  deleteRule: (ruleId: string, sheetId?: string) => void;

  // Bulk operations
  deleteRulesInRange: (range: string, sheetId?: string) => void;
  clearAllRules: (sheetId?: string) => void;

  // Priority management
  movePriority: (ruleId: string, direction: 'up' | 'down', sheetId?: string) => void;
  setPriority: (ruleId: string, newPriority: number, sheetId?: string) => void;

  // Enable/disable
  toggleRule: (ruleId: string, sheetId?: string) => void;

  // Getters
  getRulesForRange: (range: string, sheetId?: string) => CFRule[];
  getRulesForCell: (row: number, col: number, sheetId?: string) => CFRule[];
  getAllRules: (sheetId?: string) => CFRule[];
  getRuleById: (ruleId: string, sheetId?: string) => CFRule | undefined;

  // Sheet management
  setActiveSheet: (sheetId: string) => void;
  copyRulesToSheet: (fromSheetId: string, toSheetId: string) => void;
}

// Helper: check if cell is in range
const isCellInRange = (row: number, col: number, range: string): boolean => {
  const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (!match) return false;

  const [, startCol, startRow, endCol, endRow] = match;
  const colToNum = (c: string) => c.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;

  const startC = colToNum(startCol);
  const endC = colToNum(endCol);
  const startR = parseInt(startRow) - 1;
  const endR = parseInt(endRow) - 1;

  return row >= startR && row <= endR && col >= startC && col <= endC;
};

// Helper: check if ranges overlap
const rangesOverlap = (range1: string, range2: string): boolean => {
  const parse = (r: string) => {
    const m = r.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!m) return null;
    const colToNum = (c: string) => c.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
    return {
      startCol: colToNum(m[1]),
      startRow: parseInt(m[2]) - 1,
      endCol: colToNum(m[3]),
      endRow: parseInt(m[4]) - 1,
    };
  };

  const r1 = parse(range1);
  const r2 = parse(range2);
  if (!r1 || !r2) return false;

  return !(r1.endCol < r2.startCol || r1.startCol > r2.endCol ||
           r1.endRow < r2.startRow || r1.startRow > r2.endRow);
};

export const useConditionalFormattingStore = create<CFStore>()(
  persist(
    (set, get) => ({
      rules: {},
      activeSheetId: 'sheet1',

      // ========== Add Rule ==========
      addRule: (rule, sheetId) => {
        const id = sheetId || get().activeSheetId;
        const newId = generateId();
        const existingRules = get().rules[id] || [];
        const maxPriority = existingRules.reduce((max, r) => Math.max(max, r.priority), 0);

        const newRule: CFRule = {
          ...rule,
          id: newId,
          priority: maxPriority + 1,
        };

        set((state) => ({
          rules: {
            ...state.rules,
            [id]: [...(state.rules[id] || []), newRule],
          },
        }));

        return newId;
      },

      // ========== Update Rule ==========
      updateRule: (ruleId, updates, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: (state.rules[id] || []).map(rule =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            ),
          },
        }));
      },

      // ========== Delete Rule ==========
      deleteRule: (ruleId, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: (state.rules[id] || []).filter(rule => rule.id !== ruleId),
          },
        }));
      },

      // ========== Delete Rules in Range ==========
      deleteRulesInRange: (range, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: (state.rules[id] || []).filter(rule => !rangesOverlap(rule.range, range)),
          },
        }));
      },

      // ========== Clear All Rules ==========
      clearAllRules: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: [],
          },
        }));
      },

      // ========== Priority Management ==========
      movePriority: (ruleId, direction, sheetId) => {
        const id = sheetId || get().activeSheetId;
        const rules = [...(get().rules[id] || [])].sort((a, b) => a.priority - b.priority);
        const index = rules.findIndex(r => r.id === ruleId);

        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === rules.length - 1) return;

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const tempPriority = rules[index].priority;
        rules[index].priority = rules[swapIndex].priority;
        rules[swapIndex].priority = tempPriority;

        set((state) => ({
          rules: {
            ...state.rules,
            [id]: rules,
          },
        }));
      },

      setPriority: (ruleId, newPriority, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: (state.rules[id] || []).map(rule =>
              rule.id === ruleId ? { ...rule, priority: newPriority } : rule
            ),
          },
        }));
      },

      // ========== Toggle Rule ==========
      toggleRule: (ruleId, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          rules: {
            ...state.rules,
            [id]: (state.rules[id] || []).map(rule =>
              rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
            ),
          },
        }));
      },

      // ========== Getters ==========
      getRulesForRange: (range, sheetId) => {
        const id = sheetId || get().activeSheetId;
        return (get().rules[id] || [])
          .filter(rule => rangesOverlap(rule.range, range))
          .sort((a, b) => a.priority - b.priority);
      },

      getRulesForCell: (row, col, sheetId) => {
        const id = sheetId || get().activeSheetId;
        return (get().rules[id] || [])
          .filter(rule => rule.enabled && isCellInRange(row, col, rule.range))
          .sort((a, b) => a.priority - b.priority);
      },

      getAllRules: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        return (get().rules[id] || []).sort((a, b) => a.priority - b.priority);
      },

      getRuleById: (ruleId, sheetId) => {
        const id = sheetId || get().activeSheetId;
        return (get().rules[id] || []).find(rule => rule.id === ruleId);
      },

      // ========== Sheet Management ==========
      setActiveSheet: (sheetId) => {
        set({ activeSheetId: sheetId });
      },

      copyRulesToSheet: (fromSheetId, toSheetId) => {
        const fromRules = get().rules[fromSheetId] || [];
        const copiedRules = fromRules.map(rule => ({
          ...rule,
          id: generateId(),
        }));

        set((state) => ({
          rules: {
            ...state.rules,
            [toSheetId]: [...(state.rules[toSheetId] || []), ...copiedRules],
          },
        }));
      },
    }),
    {
      name: 'excelai-conditional-formatting',
    }
  )
);

// ============================================================
// PROTECTION STORE
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SheetProtection,
  WorkbookProtection,
  ProtectedRange,
  RangeProtectionCheck,
  DEFAULT_SHEET_PROTECTION,
} from '../types/protection';

interface ProtectionStore {
  sheetProtection: Record<string, SheetProtection>;
  workbookProtection: WorkbookProtection;
  protectedRanges: ProtectedRange[];

  // Sheet Protection
  protectSheet: (
    sheetId: string,
    password?: string,
    options?: Partial<SheetProtection['allowedActions']>
  ) => void;
  unprotectSheet: (sheetId: string, password?: string) => boolean;
  updateSheetProtection: (
    sheetId: string,
    options: Partial<SheetProtection['allowedActions']>
  ) => void;

  // Workbook Protection
  protectWorkbook: (
    password?: string,
    options?: { structure?: boolean; windows?: boolean }
  ) => void;
  unprotectWorkbook: (password?: string) => boolean;

  // Range Protection
  addProtectedRange: (range: Omit<ProtectedRange, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeProtectedRange: (rangeId: string) => void;
  updateProtectedRange: (rangeId: string, updates: Partial<ProtectedRange>) => void;
  addRangeEditor: (rangeId: string, userId: string) => void;
  removeRangeEditor: (rangeId: string, userId: string) => void;
  checkCellRangeProtection: (
    sheetId: string,
    row: number,
    col: number,
    userId: string
  ) => RangeProtectionCheck;
  getProtectedRanges: (sheetId: string) => ProtectedRange[];

  // Checks
  isSheetProtected: (sheetId: string) => boolean;
  isWorkbookProtected: () => boolean;
  canPerformAction: (sheetId: string, action: keyof SheetProtection['allowedActions']) => boolean;
}

// Simple hash function (for demo - use bcrypt in production)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

export const useProtectionStore = create<ProtectionStore>()(
  persist(
    (set, get) => ({
      sheetProtection: {},
      protectedRanges: [],
      workbookProtection: {
        enabled: false,
        protectStructure: true,
        protectWindows: false,
      },

      protectSheet: (sheetId, password, options) => {
        const passwordHash = password ? simpleHash(password) : undefined;

        set((state) => ({
          sheetProtection: {
            ...state.sheetProtection,
            [sheetId]: {
              enabled: true,
              passwordHash,
              allowedActions: { ...DEFAULT_SHEET_PROTECTION.allowedActions, ...options },
            },
          },
        }));
      },

      unprotectSheet: (sheetId, password) => {
        const protection = get().sheetProtection[sheetId];
        if (!protection?.enabled) return true;

        if (protection.passwordHash) {
          if (!password || simpleHash(password) !== protection.passwordHash) {
            return false;
          }
        }

        set((state) => ({
          sheetProtection: {
            ...state.sheetProtection,
            [sheetId]: { ...protection, enabled: false },
          },
        }));

        return true;
      },

      updateSheetProtection: (sheetId, options) => {
        set((state) => {
          const current = state.sheetProtection[sheetId];
          if (!current) return state;

          return {
            sheetProtection: {
              ...state.sheetProtection,
              [sheetId]: {
                ...current,
                allowedActions: { ...current.allowedActions, ...options },
              },
            },
          };
        });
      },

      protectWorkbook: (password, options) => {
        const passwordHash = password ? simpleHash(password) : undefined;

        set({
          workbookProtection: {
            enabled: true,
            passwordHash,
            protectStructure: options?.structure ?? true,
            protectWindows: options?.windows ?? false,
          },
        });
      },

      unprotectWorkbook: (password) => {
        const { workbookProtection } = get();
        if (!workbookProtection.enabled) return true;

        if (workbookProtection.passwordHash) {
          if (!password || simpleHash(password) !== workbookProtection.passwordHash) {
            return false;
          }
        }

        set({
          workbookProtection: { ...workbookProtection, enabled: false },
        });

        return true;
      },

      // Range Protection
      addProtectedRange: (rangeData) => {
        const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const range: ProtectedRange = {
          ...rangeData,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          protectedRanges: [...state.protectedRanges, range],
        }));
        return id;
      },

      removeProtectedRange: (rangeId) => {
        set((state) => ({
          protectedRanges: state.protectedRanges.filter((r) => r.id !== rangeId),
        }));
      },

      updateProtectedRange: (rangeId, updates) => {
        set((state) => ({
          protectedRanges: state.protectedRanges.map((r) =>
            r.id === rangeId ? { ...r, ...updates, updatedAt: Date.now() } : r
          ),
        }));
      },

      addRangeEditor: (rangeId, userId) => {
        set((state) => ({
          protectedRanges: state.protectedRanges.map((r) =>
            r.id === rangeId && !r.editors.includes(userId)
              ? { ...r, editors: [...r.editors, userId], updatedAt: Date.now() }
              : r
          ),
        }));
      },

      removeRangeEditor: (rangeId, userId) => {
        set((state) => ({
          protectedRanges: state.protectedRanges.map((r) =>
            r.id === rangeId
              ? { ...r, editors: r.editors.filter((e) => e !== userId), updatedAt: Date.now() }
              : r
          ),
        }));
      },

      checkCellRangeProtection: (sheetId, row, col, userId) => {
        const ranges = get().protectedRanges.filter((r) => r.sheetId === sheetId);
        for (const range of ranges) {
          if (
            row >= range.startRow &&
            row <= range.endRow &&
            col >= range.startCol &&
            col <= range.endCol
          ) {
            const canEdit = range.ownerId === userId || range.editors.includes(userId);
            return {
              isProtected: true,
              canEdit,
              range,
              message: canEdit ? undefined : `Protected by "${range.name}" (${range.ownerName})`,
            };
          }
        }
        return { isProtected: false, canEdit: true };
      },

      getProtectedRanges: (sheetId) => {
        return get().protectedRanges.filter((r) => r.sheetId === sheetId);
      },

      isSheetProtected: (sheetId) => {
        return get().sheetProtection[sheetId]?.enabled ?? false;
      },

      isWorkbookProtected: () => {
        return get().workbookProtection.enabled;
      },

      canPerformAction: (sheetId, action) => {
        const protection = get().sheetProtection[sheetId];
        if (!protection?.enabled) return true;
        return protection.allowedActions[action];
      },
    }),
    {
      name: 'excelai-protection',
    }
  )
);

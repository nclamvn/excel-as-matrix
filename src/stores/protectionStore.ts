// ============================================================
// PROTECTION STORE
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SheetProtection,
  WorkbookProtection,
  DEFAULT_SHEET_PROTECTION,
} from '../types/protection';

interface ProtectionStore {
  sheetProtection: Record<string, SheetProtection>;
  workbookProtection: WorkbookProtection;

  // Sheet Protection
  protectSheet: (sheetId: string, password?: string, options?: Partial<SheetProtection['allowedActions']>) => void;
  unprotectSheet: (sheetId: string, password?: string) => boolean;
  updateSheetProtection: (sheetId: string, options: Partial<SheetProtection['allowedActions']>) => void;

  // Workbook Protection
  protectWorkbook: (password?: string, options?: { structure?: boolean; windows?: boolean }) => void;
  unprotectWorkbook: (password?: string) => boolean;

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
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

export const useProtectionStore = create<ProtectionStore>()(
  persist(
    (set, get) => ({
      sheetProtection: {},
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

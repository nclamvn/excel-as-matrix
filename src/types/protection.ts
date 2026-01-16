// ============================================================
// PROTECTION TYPES
// ============================================================

export interface SheetProtection {
  enabled: boolean;
  passwordHash?: string;
  allowedActions: {
    selectLockedCells: boolean;
    selectUnlockedCells: boolean;
    formatCells: boolean;
    formatColumns: boolean;
    formatRows: boolean;
    insertColumns: boolean;
    insertRows: boolean;
    deleteColumns: boolean;
    deleteRows: boolean;
    sort: boolean;
    useAutoFilter: boolean;
  };
}

export interface WorkbookProtection {
  enabled: boolean;
  passwordHash?: string;
  protectStructure: boolean;
  protectWindows: boolean;
}

export const DEFAULT_SHEET_PROTECTION: SheetProtection = {
  enabled: false,
  allowedActions: {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    useAutoFilter: false,
  },
};

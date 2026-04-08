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

export interface ProtectedRange {
  id: string;
  sheetId: string;
  name: string;
  description?: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  ownerId: string;
  ownerName: string;
  editors: string[];
  warningOnly: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RangeProtectionCheck {
  isProtected: boolean;
  canEdit: boolean;
  range?: ProtectedRange;
  message?: string;
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

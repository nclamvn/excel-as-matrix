import { create } from 'zustand';
import { Table, TableColumn, TableStyle } from '../types/cell';

interface TableState {
  // Table registry
  tables: Record<string, Table>;
  tablesBySheet: Record<string, string[]>; // sheetId -> tableIds
  tablesByName: Record<string, string>; // tableName -> tableId

  // Actions
  addTable: (table: Table) => void;
  updateTable: (tableId: string, updates: Partial<Table>) => void;
  removeTable: (tableId: string) => void;
  addColumn: (tableId: string, column: TableColumn) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<TableColumn>) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  setRowCount: (tableId: string, count: number) => void;
  setStyle: (tableId: string, style: TableStyle) => void;
  toggleTotalRow: (tableId: string, enabled: boolean) => void;

  // Getters
  getTable: (tableId: string) => Table | undefined;
  getTableByName: (name: string) => Table | undefined;
  getTablesBySheet: (sheetId: string) => Table[];
  getTableAtCell: (sheetId: string, row: number, col: number) => Table | undefined;
  isInTable: (sheetId: string, row: number, col: number) => boolean;
  getColumnAtCell: (sheetId: string, row: number, col: number) => { table: Table; column: TableColumn } | undefined;

  // Reset
  reset: () => void;
}

const initialState = {
  tables: {} as Record<string, Table>,
  tablesBySheet: {} as Record<string, string[]>,
  tablesByName: {} as Record<string, string>,
};

export const useTableStore = create<TableState>()((set, get) => ({
  ...initialState,

  addTable: (table) => {
    set((state) => {
      const tables = { ...state.tables, [table.id]: table };
      const tablesBySheet = { ...state.tablesBySheet };
      if (!tablesBySheet[table.sheetId]) {
        tablesBySheet[table.sheetId] = [];
      }
      tablesBySheet[table.sheetId] = [...tablesBySheet[table.sheetId], table.id];
      const tablesByName = { ...state.tablesByName, [table.name]: table.id };

      return { tables, tablesBySheet, tablesByName };
    });
  },

  updateTable: (tableId, updates) => {
    set((state) => {
      const existing = state.tables[tableId];
      if (!existing) return state;

      const oldName = existing.name;
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

      const tablesByName = { ...state.tablesByName };
      if (updates.name && updates.name !== oldName) {
        delete tablesByName[oldName];
        tablesByName[updates.name] = tableId;
      }

      return {
        tables: { ...state.tables, [tableId]: updated },
        tablesByName,
      };
    });
  },

  removeTable: (tableId) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const { [tableId]: _, ...tables } = state.tables;
      const tablesBySheet = { ...state.tablesBySheet };
      if (tablesBySheet[table.sheetId]) {
        tablesBySheet[table.sheetId] = tablesBySheet[table.sheetId].filter(id => id !== tableId);
      }
      const { [table.name]: __, ...tablesByName } = state.tablesByName;

      return { tables, tablesBySheet, tablesByName };
    });
  },

  addColumn: (tableId, column) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const updated = {
        ...table,
        columns: [...table.columns, column],
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  updateColumn: (tableId, columnId, updates) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const columns = table.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      );

      const updated = {
        ...table,
        columns,
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  removeColumn: (tableId, columnId) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const columns = table.columns.filter(col => col.id !== columnId);
      columns.forEach((col, idx) => { col.index = idx; });

      const updated = {
        ...table,
        columns,
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  setRowCount: (tableId, count) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const updated = {
        ...table,
        rowCount: count,
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  setStyle: (tableId, style) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const updated = {
        ...table,
        style,
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  toggleTotalRow: (tableId, enabled) => {
    set((state) => {
      const table = state.tables[tableId];
      if (!table) return state;

      const updated = {
        ...table,
        hasTotalRow: enabled,
        updatedAt: new Date().toISOString(),
      };

      return { tables: { ...state.tables, [tableId]: updated } };
    });
  },

  getTable: (tableId) => {
    return get().tables[tableId];
  },

  getTableByName: (name) => {
    const tableId = get().tablesByName[name];
    return tableId ? get().tables[tableId] : undefined;
  },

  getTablesBySheet: (sheetId) => {
    const tableIds = get().tablesBySheet[sheetId] || [];
    return tableIds.map(id => get().tables[id]).filter(Boolean);
  },

  getTableAtCell: (sheetId, row, col) => {
    const tables = get().getTablesBySheet(sheetId);
    return tables.find(table => {
      const endRow = table.startRow + (table.hasHeaderRow ? 1 : 0) + table.rowCount + (table.hasTotalRow ? 1 : 0) - 1;
      const endCol = table.startCol + table.columns.length - 1;
      return row >= table.startRow && row <= endRow && col >= table.startCol && col <= endCol;
    });
  },

  isInTable: (sheetId, row, col) => {
    return get().getTableAtCell(sheetId, row, col) !== undefined;
  },

  getColumnAtCell: (sheetId, row, col) => {
    const table = get().getTableAtCell(sheetId, row, col);
    if (!table) return undefined;

    const colIndex = col - table.startCol;
    const column = table.columns.find(c => c.index === colIndex);
    if (!column) return undefined;

    return { table, column };
  },

  reset: () => {
    set(initialState);
  },
}));

// ============================================================
// PIVOT STORE — Zustand Store for Pivot Tables
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PivotTable,
  PivotField,
  PivotAreaField,
  PivotFilter,
  AggregateFunction,
  SortOrder,
  DateGrouping,
  CalculatedField,
  DEFAULT_PIVOT_OPTIONS,
} from '../types/pivot';

interface PivotStore {
  // All pivot tables
  pivotTables: Record<string, PivotTable>;

  // Active pivot for editing
  activePivotId: string | null;

  // CRUD Operations
  createPivotTable: (
    name: string,
    sourceSheetId: string,
    sourceRange: string,
    targetSheetId: string,
    targetCell: string,
    fields: PivotField[]
  ) => PivotTable;

  updatePivotTable: (id: string, updates: Partial<PivotTable>) => void;
  deletePivotTable: (id: string) => void;
  getPivotTable: (id: string) => PivotTable | null;
  getPivotTablesForSheet: (sheetId: string) => PivotTable[];

  // Field Management
  addFieldToArea: (
    pivotId: string,
    area: 'row' | 'column' | 'value' | 'filter',
    field: PivotAreaField
  ) => void;

  removeFieldFromArea: (
    pivotId: string,
    area: 'row' | 'column' | 'value' | 'filter',
    fieldId: string
  ) => void;

  moveField: (
    pivotId: string,
    fieldId: string,
    fromArea: 'row' | 'column' | 'value' | 'filter',
    toArea: 'row' | 'column' | 'value' | 'filter',
    toIndex: number
  ) => void;

  reorderFieldInArea: (
    pivotId: string,
    area: 'row' | 'column' | 'value' | 'filter',
    fromIndex: number,
    toIndex: number
  ) => void;

  // Field Settings
  setAggregateFunction: (
    pivotId: string,
    fieldId: string,
    func: AggregateFunction
  ) => void;

  setSortOrder: (
    pivotId: string,
    fieldId: string,
    area: 'row' | 'column',
    order: SortOrder
  ) => void;

  setDateGrouping: (
    pivotId: string,
    fieldId: string,
    grouping: DateGrouping | undefined
  ) => void;

  setNumberFormat: (
    pivotId: string,
    fieldId: string,
    format: string | undefined
  ) => void;

  setCustomName: (
    pivotId: string,
    fieldId: string,
    name: string | undefined
  ) => void;

  // Filters
  setFilter: (pivotId: string, filter: PivotFilter) => void;
  removeFilter: (pivotId: string, fieldId: string) => void;
  clearFilters: (pivotId: string) => void;

  // Options
  setShowGrandTotals: (
    pivotId: string,
    rows: boolean,
    cols: boolean
  ) => void;

  setShowSubtotals: (
    pivotId: string,
    rows: boolean,
    cols: boolean
  ) => void;

  setCompactForm: (pivotId: string, compact: boolean) => void;
  setRepeatLabels: (pivotId: string, repeat: boolean) => void;

  // Calculated Fields
  addCalculatedField: (pivotId: string, field: CalculatedField) => void;
  updateCalculatedField: (pivotId: string, fieldId: string, updates: Partial<CalculatedField>) => void;
  removeCalculatedField: (pivotId: string, fieldId: string) => void;

  // Expansion State
  toggleRowExpansion: (pivotId: string, rowKey: string) => void;
  expandAll: (pivotId: string) => void;
  collapseAll: (pivotId: string) => void;

  // Refresh
  markForRefresh: (pivotId: string) => void;

  // Active pivot
  setActivePivot: (pivotId: string | null) => void;
}

// Helper to parse cell reference
const parseCellRef = (ref: string): { row: number; col: number } => {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 0, col: 0 };

  const colStr = match[1].toUpperCase();
  const row = parseInt(match[2], 10) - 1;

  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col -= 1;

  return { row, col };
};

export const usePivotStore = create<PivotStore>()(
  persist(
    (set, get) => ({
      pivotTables: {},
      activePivotId: null,

      createPivotTable: (name, sourceSheetId, sourceRange, targetSheetId, targetCell, fields) => {
        const id = `pivot_${Date.now()}`;
        const { row, col } = parseCellRef(targetCell);

        const pivot: PivotTable = {
          id,
          name,
          sheetId: targetSheetId,
          sourceSheetId,
          sourceRange,
          targetCell,
          targetRow: row,
          targetCol: col,
          fields,
          rowFields: [],
          columnFields: [],
          valueFields: [],
          filterFields: [],
          filters: [],
          calculatedFields: [],
          lastRefreshed: Date.now(),
          isExpanded: {},
          ...DEFAULT_PIVOT_OPTIONS,
        };

        set(state => ({
          pivotTables: {
            ...state.pivotTables,
            [id]: pivot,
          },
          activePivotId: id,
        }));

        return pivot;
      },

      updatePivotTable: (id, updates) => {
        set(state => {
          const existing = state.pivotTables[id];
          if (!existing) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [id]: { ...existing, ...updates },
            },
          };
        });
      },

      deletePivotTable: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.pivotTables;
          return {
            pivotTables: rest,
            activePivotId: state.activePivotId === id ? null : state.activePivotId,
          };
        });
      },

      getPivotTable: (id) => {
        return get().pivotTables[id] || null;
      },

      getPivotTablesForSheet: (sheetId) => {
        return Object.values(get().pivotTables).filter(
          pivot => pivot.sheetId === sheetId
        );
      },

      addFieldToArea: (pivotId, area, field) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const areaKey = `${area}Fields` as keyof PivotTable;
          const currentFields = pivot[areaKey] as PivotAreaField[];

          // Don't add duplicate
          if (currentFields.some(f => f.fieldId === field.fieldId)) {
            return state;
          }

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                [areaKey]: [...currentFields, field],
              },
            },
          };
        });
      },

      removeFieldFromArea: (pivotId, area, fieldId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const areaKey = `${area}Fields` as keyof PivotTable;
          const currentFields = pivot[areaKey] as PivotAreaField[];

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                [areaKey]: currentFields.filter(f => f.fieldId !== fieldId),
              },
            },
          };
        });
      },

      moveField: (pivotId, fieldId, fromArea, toArea, toIndex) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const fromKey = `${fromArea}Fields` as keyof PivotTable;
          const toKey = `${toArea}Fields` as keyof PivotTable;

          const fromFields = [...(pivot[fromKey] as PivotAreaField[])];
          const toFields = fromArea === toArea
            ? fromFields
            : [...(pivot[toKey] as PivotAreaField[])];

          const fieldIndex = fromFields.findIndex(f => f.fieldId === fieldId);
          if (fieldIndex === -1) return state;

          const [field] = fromFields.splice(fieldIndex, 1);

          // Update aggregate function if moving to/from value area
          if (toArea === 'value' && !field.aggregateFunction) {
            field.aggregateFunction = 'sum';
          }

          if (fromArea === toArea) {
            fromFields.splice(toIndex, 0, field);
            return {
              pivotTables: {
                ...state.pivotTables,
                [pivotId]: {
                  ...pivot,
                  [fromKey]: fromFields,
                },
              },
            };
          }

          toFields.splice(toIndex, 0, field);
          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                [fromKey]: fromFields,
                [toKey]: toFields,
              },
            },
          };
        });
      },

      reorderFieldInArea: (pivotId, area, fromIndex, toIndex) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const areaKey = `${area}Fields` as keyof PivotTable;
          const fields = [...(pivot[areaKey] as PivotAreaField[])];

          const [field] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, field);

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                [areaKey]: fields,
              },
            },
          };
        });
      },

      setAggregateFunction: (pivotId, fieldId, func) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const valueFields = pivot.valueFields.map(f =>
            f.fieldId === fieldId ? { ...f, aggregateFunction: func } : f
          );

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, valueFields },
            },
          };
        });
      },

      setSortOrder: (pivotId, fieldId, area, order) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const areaKey = `${area}Fields` as keyof PivotTable;
          const fields = (pivot[areaKey] as PivotAreaField[]).map(f =>
            f.fieldId === fieldId ? { ...f, sortOrder: order } : f
          );

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, [areaKey]: fields },
            },
          };
        });
      },

      setDateGrouping: (pivotId, fieldId, grouping) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const updateFields = (fields: PivotAreaField[]) =>
            fields.map(f =>
              f.fieldId === fieldId ? { ...f, dateGrouping: grouping } : f
            );

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                rowFields: updateFields(pivot.rowFields),
                columnFields: updateFields(pivot.columnFields),
              },
            },
          };
        });
      },

      setNumberFormat: (pivotId, fieldId, format) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const valueFields = pivot.valueFields.map(f =>
            f.fieldId === fieldId ? { ...f, numberFormat: format } : f
          );

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, valueFields },
            },
          };
        });
      },

      setCustomName: (pivotId, fieldId, name) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const updateFields = (fields: PivotAreaField[]) =>
            fields.map(f =>
              f.fieldId === fieldId ? { ...f, customName: name } : f
            );

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                rowFields: updateFields(pivot.rowFields),
                columnFields: updateFields(pivot.columnFields),
                valueFields: updateFields(pivot.valueFields),
                filterFields: updateFields(pivot.filterFields),
              },
            },
          };
        });
      },

      setFilter: (pivotId, filter) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          const existing = pivot.filters.findIndex(f => f.fieldId === filter.fieldId);
          const filters = existing >= 0
            ? pivot.filters.map((f, i) => i === existing ? filter : f)
            : [...pivot.filters, filter];

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, filters },
            },
          };
        });
      },

      removeFilter: (pivotId, fieldId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                filters: pivot.filters.filter(f => f.fieldId !== fieldId),
              },
            },
          };
        });
      },

      clearFilters: (pivotId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, filters: [] },
            },
          };
        });
      },

      setShowGrandTotals: (pivotId, rows, cols) => {
        get().updatePivotTable(pivotId, {
          showRowGrandTotals: rows,
          showColGrandTotals: cols,
        });
      },

      setShowSubtotals: (pivotId, rows, cols) => {
        get().updatePivotTable(pivotId, {
          showRowSubtotals: rows,
          showColSubtotals: cols,
        });
      },

      setCompactForm: (pivotId, compact) => {
        get().updatePivotTable(pivotId, { compactForm: compact });
      },

      setRepeatLabels: (pivotId, repeat) => {
        get().updatePivotTable(pivotId, { repeatLabels: repeat });
      },

      addCalculatedField: (pivotId, field) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                calculatedFields: [...pivot.calculatedFields, field],
              },
            },
          };
        });
      },

      updateCalculatedField: (pivotId, fieldId, updates) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                calculatedFields: pivot.calculatedFields.map(f =>
                  f.id === fieldId ? { ...f, ...updates } : f
                ),
              },
            },
          };
        });
      },

      removeCalculatedField: (pivotId, fieldId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                calculatedFields: pivot.calculatedFields.filter(f => f.id !== fieldId),
              },
            },
          };
        });
      },

      toggleRowExpansion: (pivotId, rowKey) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: {
                ...pivot,
                isExpanded: {
                  ...pivot.isExpanded,
                  [rowKey]: !pivot.isExpanded[rowKey],
                },
              },
            },
          };
        });
      },

      expandAll: (pivotId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          // Set all existing keys to true
          const expanded: Record<string, boolean> = {};
          Object.keys(pivot.isExpanded).forEach(key => {
            expanded[key] = true;
          });

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, isExpanded: expanded },
            },
          };
        });
      },

      collapseAll: (pivotId) => {
        set(state => {
          const pivot = state.pivotTables[pivotId];
          if (!pivot) return state;

          return {
            pivotTables: {
              ...state.pivotTables,
              [pivotId]: { ...pivot, isExpanded: {} },
            },
          };
        });
      },

      markForRefresh: (pivotId) => {
        get().updatePivotTable(pivotId, { lastRefreshed: Date.now() });
      },

      setActivePivot: (pivotId) => {
        set({ activePivotId: pivotId });
      },
    }),
    {
      name: 'excelai-pivot',
      partialize: (state) => ({
        pivotTables: state.pivotTables,
      }),
    }
  )
);

// ============================================================
// AGGREGATION HELPER FUNCTIONS
// ============================================================

export function aggregate(values: number[], func: AggregateFunction): number {
  if (values.length === 0) return 0;

  switch (func) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'count':
      return values.length;
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'product':
      return values.reduce((a, b) => a * b, 1);
    case 'countNumbers':
      return values.filter(v => !isNaN(v)).length;
    case 'stdDev': {
      if (values.length < 2) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
      return Math.sqrt(variance);
    }
    case 'variance': {
      if (values.length < 2) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    }
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

export function formatPivotValue(value: number, func: AggregateFunction): string {
  if (isNaN(value)) return '';

  switch (func) {
    case 'count':
    case 'countNumbers':
      return Math.round(value).toString();
    case 'average':
    case 'stdDev':
    case 'variance':
      return value.toFixed(2);
    default:
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  }
}

export default usePivotStore;

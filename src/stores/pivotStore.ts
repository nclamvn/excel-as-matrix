// Phase 5: Pivot Table Store
// State management for pivot tables with aggregation

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  PivotTable,
  PivotField,
  ValueField,
  PivotFilter,
  PivotResult,
  Aggregation,
  CellRange,
} from '../types/visualization';

interface PivotState {
  pivotTables: Map<string, PivotTable>;
  pivotResults: Map<string, PivotResult>;
  selectedPivotId: string | null;
  editingPivotId: string | null;
  expandedGroups: Map<string, Set<string>>;
  isCreating: boolean;
  loading: boolean;
  error: string | null;
}

interface PivotActions {
  // Pivot CRUD
  createPivot: (
    workbookId: string,
    sheetId: string,
    name: string,
    sourceRange: CellRange
  ) => PivotTable;
  updatePivot: (pivotId: string, updates: Partial<PivotTable>) => void;
  deletePivot: (pivotId: string) => void;

  // Field management
  addRowField: (pivotId: string, field: PivotField) => void;
  addColumnField: (pivotId: string, field: PivotField) => void;
  addValueField: (pivotId: string, field: ValueField) => void;
  addFilterField: (pivotId: string, field: PivotField) => void;
  removeField: (pivotId: string, fieldId: string, area: 'row' | 'column' | 'value' | 'filter') => void;
  moveField: (
    pivotId: string,
    fieldId: string,
    fromArea: 'row' | 'column' | 'value' | 'filter',
    toArea: 'row' | 'column' | 'value' | 'filter',
    toIndex?: number
  ) => void;

  // Results
  setPivotResult: (pivotId: string, result: PivotResult) => void;

  // Expand/Collapse
  toggleGroup: (pivotId: string, groupKey: string) => void;
  expandAll: (pivotId: string) => void;
  collapseAll: (pivotId: string) => void;

  // Filters
  addFilter: (pivotId: string, filter: PivotFilter) => void;
  updateFilter: (pivotId: string, filterId: string, updates: Partial<PivotFilter>) => void;
  removeFilter: (pivotId: string, filterId: string) => void;

  // Selection & UI state
  selectPivot: (pivotId: string | null) => void;
  startEditing: (pivotId: string | null) => void;
  setCreating: (creating: boolean) => void;

  // Loading
  getPivotsBySheet: (sheetId: string) => PivotTable[];
  getPivotsByWorkbook: (workbookId: string) => PivotTable[];

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: PivotState = {
  pivotTables: new Map(),
  pivotResults: new Map(),
  selectedPivotId: null,
  editingPivotId: null,
  expandedGroups: new Map(),
  isCreating: false,
  loading: false,
  error: null,
};

export const usePivotStore = create<PivotState & PivotActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      createPivot: (workbookId, sheetId, name, sourceRange) => {
        const pivot: PivotTable = {
          id: crypto.randomUUID(),
          workbookId,
          sheetId,
          name,
          sourceRange,
          targetCell: [0, 0],
          rowFields: [],
          columnFields: [],
          valueFields: [],
          filterFields: [],
          filters: [],
          options: {
            showGrandTotalRow: true,
            showGrandTotalColumn: true,
            showSubtotalRows: true,
            showSubtotalColumns: true,
            repeatRowLabels: false,
            compactForm: true,
            showEmptyCells: true,
            emptyCellValue: '',
          },
          style: {
            headerBackground: '#4472C4',
            headerForeground: '#FFFFFF',
            rowBackground: '#FFFFFF',
            alternateRowBackground: '#F5F5F5',
            grandTotalBackground: '#E0E0E0',
            borderColor: '#D0D0D0',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          pivotTables.set(pivot.id, pivot);
          return { pivotTables };
        });

        return pivot;
      },

      updatePivot: (pivotId, updates) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              ...updates,
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      deletePivot: (pivotId) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivotResults = new Map(state.pivotResults);
          const expandedGroups = new Map(state.expandedGroups);
          pivotTables.delete(pivotId);
          pivotResults.delete(pivotId);
          expandedGroups.delete(pivotId);
          return {
            pivotTables,
            pivotResults,
            expandedGroups,
            selectedPivotId: state.selectedPivotId === pivotId ? null : state.selectedPivotId,
            editingPivotId: state.editingPivotId === pivotId ? null : state.editingPivotId,
          };
        });
      },

      addRowField: (pivotId, field) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              rowFields: [...pivot.rowFields, field],
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      addColumnField: (pivotId, field) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              columnFields: [...pivot.columnFields, field],
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      addValueField: (pivotId, field) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              valueFields: [...pivot.valueFields, field],
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      addFilterField: (pivotId, field) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              filterFields: [...pivot.filterFields, field],
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      removeField: (pivotId, fieldId, area) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            const updated = { ...pivot, updatedAt: new Date().toISOString() };
            switch (area) {
              case 'row':
                updated.rowFields = pivot.rowFields.filter((f) => f.id !== fieldId);
                break;
              case 'column':
                updated.columnFields = pivot.columnFields.filter((f) => f.id !== fieldId);
                break;
              case 'value':
                updated.valueFields = pivot.valueFields.filter((f) => f.id !== fieldId);
                break;
              case 'filter':
                updated.filterFields = pivot.filterFields.filter((f) => f.id !== fieldId);
                break;
            }
            pivotTables.set(pivotId, updated);
          }
          return { pivotTables };
        });
      },

      moveField: (pivotId, fieldId, fromArea, toArea, toIndex) => {
        const { pivotTables } = get();
        const pivot = pivotTables.get(pivotId);
        if (!pivot) return;

        // Find and remove from source
        let field: PivotField | ValueField | null = null;
        const updated = { ...pivot };

        switch (fromArea) {
          case 'row':
            field = pivot.rowFields.find((f) => f.id === fieldId) || null;
            updated.rowFields = pivot.rowFields.filter((f) => f.id !== fieldId);
            break;
          case 'column':
            field = pivot.columnFields.find((f) => f.id === fieldId) || null;
            updated.columnFields = pivot.columnFields.filter((f) => f.id !== fieldId);
            break;
          case 'value':
            field = pivot.valueFields.find((f) => f.id === fieldId) || null;
            updated.valueFields = pivot.valueFields.filter((f) => f.id !== fieldId);
            break;
          case 'filter':
            field = pivot.filterFields.find((f) => f.id === fieldId) || null;
            updated.filterFields = pivot.filterFields.filter((f) => f.id !== fieldId);
            break;
        }

        if (!field) return;

        // Add to destination
        const targetArray = (() => {
          switch (toArea) {
            case 'row': return updated.rowFields;
            case 'column': return updated.columnFields;
            case 'value': return updated.valueFields;
            case 'filter': return updated.filterFields;
          }
        })();

        if (toIndex !== undefined && toIndex >= 0) {
          targetArray.splice(toIndex, 0, field as any);
        } else {
          targetArray.push(field as any);
        }

        set((state) => {
          const newPivotTables = new Map(state.pivotTables);
          newPivotTables.set(pivotId, { ...updated, updatedAt: new Date().toISOString() });
          return { pivotTables: newPivotTables };
        });
      },

      setPivotResult: (pivotId, result) => {
        set((state) => {
          const pivotResults = new Map(state.pivotResults);
          pivotResults.set(pivotId, result);
          return { pivotResults };
        });
      },

      toggleGroup: (pivotId, groupKey) => {
        set((state) => {
          const expandedGroups = new Map(state.expandedGroups);
          const groups = expandedGroups.get(pivotId) || new Set();
          const newGroups = new Set(groups);

          if (newGroups.has(groupKey)) {
            newGroups.delete(groupKey);
          } else {
            newGroups.add(groupKey);
          }

          expandedGroups.set(pivotId, newGroups);
          return { expandedGroups };
        });
      },

      expandAll: (pivotId) => {
        const { pivotResults } = get();
        const result = pivotResults.get(pivotId);
        if (!result) return;

        const allGroups = new Set(
          result.rows
            .filter((r) => r.level > 0)
            .map((r) => r.groupKey)
        );

        set((state) => {
          const expandedGroups = new Map(state.expandedGroups);
          expandedGroups.set(pivotId, allGroups);
          return { expandedGroups };
        });
      },

      collapseAll: (pivotId) => {
        set((state) => {
          const expandedGroups = new Map(state.expandedGroups);
          expandedGroups.set(pivotId, new Set());
          return { expandedGroups };
        });
      },

      addFilter: (pivotId, filter) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              filters: [...pivot.filters, filter],
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      updateFilter: (pivotId, filterId, updates) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              filters: pivot.filters.map((f) =>
                f.fieldId === filterId ? { ...f, ...updates } : f
              ),
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      removeFilter: (pivotId, filterId) => {
        set((state) => {
          const pivotTables = new Map(state.pivotTables);
          const pivot = pivotTables.get(pivotId);
          if (pivot) {
            pivotTables.set(pivotId, {
              ...pivot,
              filters: pivot.filters.filter((f) => f.fieldId !== filterId),
              updatedAt: new Date().toISOString(),
            });
          }
          return { pivotTables };
        });
      },

      selectPivot: (pivotId) => {
        set({ selectedPivotId: pivotId });
      },

      startEditing: (pivotId) => {
        set({ editingPivotId: pivotId });
      },

      setCreating: (creating) => {
        set({ isCreating: creating });
      },

      getPivotsBySheet: (sheetId) => {
        const { pivotTables } = get();
        return Array.from(pivotTables.values()).filter((p) => p.sheetId === sheetId);
      },

      getPivotsByWorkbook: (workbookId) => {
        const { pivotTables } = get();
        return Array.from(pivotTables.values()).filter((p) => p.workbookId === workbookId);
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'pivot-store' }
  )
);

// Aggregation functions
export function aggregate(values: number[], aggregation: Aggregation): number {
  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'Sum':
      return values.reduce((a, b) => a + b, 0);
    case 'Count':
      return values.length;
    case 'Average':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'Min':
      return Math.min(...values);
    case 'Max':
      return Math.max(...values);
    case 'Product':
      return values.reduce((a, b) => a * b, 1);
    case 'CountNumbers':
      return values.filter((v) => !isNaN(v)).length;
    case 'StdDev':
    case 'StdDevP': {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) /
        (aggregation === 'StdDev' ? values.length - 1 : values.length);
      return Math.sqrt(variance);
    }
    case 'Var':
    case 'VarP': {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
      return squaredDiffs.reduce((a, b) => a + b, 0) /
        (aggregation === 'Var' ? values.length - 1 : values.length);
    }
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// Format number based on aggregation type
export function formatPivotValue(value: number, aggregation: Aggregation): string {
  if (isNaN(value)) return '';

  switch (aggregation) {
    case 'Count':
    case 'CountNumbers':
      return Math.round(value).toString();
    case 'Average':
    case 'StdDev':
    case 'StdDevP':
    case 'Var':
    case 'VarP':
      return value.toFixed(2);
    default:
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  }
}

// Create a pivot field
export function createPivotField(sourceColumn: number, name: string): PivotField {
  return {
    id: crypto.randomUUID(),
    sourceColumn,
    name,
    sortOrder: 'None',
    showSubtotals: true,
    collapsed: false,
  };
}

// Create a value field
export function createValueField(
  sourceColumn: number,
  name: string,
  aggregation: Aggregation = 'Sum'
): ValueField {
  return {
    id: crypto.randomUUID(),
    sourceColumn,
    name,
    aggregation,
  };
}

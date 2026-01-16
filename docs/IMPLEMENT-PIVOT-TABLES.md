# 📊 IMPLEMENTATION GUIDE: Pivot Tables
## ExcelAI — Data Analysis & Summarization

---

## 🎯 Overview

| Feature | Est. Time | Files | Impact |
|---------|-----------|-------|--------|
| Pivot Tables | 3 days | 10 | +1% |

**Features:**
- Create Pivot Table from data range
- Drag & drop field arrangement
- Row/Column/Value/Filter areas
- Aggregation functions (Sum, Count, Average, Min, Max)
- Group by (dates, numbers, text)
- Calculated fields
- Pivot Chart integration
- Refresh data

---

## 📁 Files to Create

```
src/
├── types/
│   └── pivot.ts                 # Pivot type definitions
├── stores/
│   └── pivotStore.ts            # Zustand store for pivot tables
├── components/
│   └── PivotTable/
│       ├── index.ts
│       ├── CreatePivotDialog.tsx
│       ├── PivotTableRenderer.tsx
│       ├── PivotFieldList.tsx
│       ├── PivotDropZone.tsx
│       ├── PivotValueSettings.tsx
│       ├── PivotFilterPanel.tsx
│       ├── PivotTable.css
│       └── pivotEngine.ts       # Pivot calculation engine
```

---

## 📄 File 1: `src/types/pivot.ts`

```typescript
// ============================================================
// PIVOT TABLE TYPE DEFINITIONS
// ============================================================

export type AggregateFunction = 
  | 'sum'
  | 'count'
  | 'average'
  | 'min'
  | 'max'
  | 'countNumbers'
  | 'stdDev'
  | 'variance'
  | 'product';

export type SortOrder = 'asc' | 'desc' | 'none';

export type DateGrouping = 
  | 'years'
  | 'quarters'
  | 'months'
  | 'days'
  | 'hours';

export interface PivotField {
  id: string;
  name: string;
  sourceColumn: number;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface PivotAreaField {
  fieldId: string;
  aggregateFunction?: AggregateFunction;
  sortOrder: SortOrder;
  showSubtotals: boolean;
  dateGrouping?: DateGrouping;
  numberFormat?: string;
  customName?: string;
}

export interface PivotFilter {
  fieldId: string;
  selectedValues: any[];
  excludeMode: boolean;
}

export interface PivotTable {
  id: string;
  name: string;
  sheetId: string;           // Sheet where pivot is placed
  
  // Source
  sourceSheetId: string;
  sourceRange: string;       // e.g., "A1:H100"
  
  // Location
  targetCell: string;        // e.g., "A1"
  targetRow: number;
  targetCol: number;
  
  // Fields
  fields: PivotField[];
  
  // Areas
  rowFields: PivotAreaField[];
  columnFields: PivotAreaField[];
  valueFields: PivotAreaField[];
  filterFields: PivotAreaField[];
  
  // Filters applied
  filters: PivotFilter[];
  
  // Options
  showRowGrandTotals: boolean;
  showColGrandTotals: boolean;
  showRowSubtotals: boolean;
  showColSubtotals: boolean;
  compactForm: boolean;
  repeatLabels: boolean;
  
  // Calculated fields
  calculatedFields: CalculatedField[];
  
  // State
  lastRefreshed: number;
  isExpanded: Record<string, boolean>;  // Row expansion state
}

export interface CalculatedField {
  id: string;
  name: string;
  formula: string;           // e.g., "=[Sales] / [Quantity]"
}

export interface PivotCellData {
  value: any;
  formattedValue: string;
  isHeader: boolean;
  isTotal: boolean;
  isSubtotal: boolean;
  rowPath: string[];
  colPath: string[];
  fieldId?: string;
  level: number;
  isCollapsible: boolean;
  isExpanded: boolean;
}

export interface PivotResult {
  cells: PivotCellData[][];
  rowCount: number;
  colCount: number;
}

export const AGGREGATE_LABELS: Record<AggregateFunction, string> = {
  sum: 'Sum',
  count: 'Count',
  average: 'Average',
  min: 'Min',
  max: 'Max',
  countNumbers: 'Count Numbers',
  stdDev: 'StdDev',
  variance: 'Variance',
  product: 'Product',
};

export const DEFAULT_PIVOT_OPTIONS = {
  showRowGrandTotals: true,
  showColGrandTotals: true,
  showRowSubtotals: true,
  showColSubtotals: true,
  compactForm: true,
  repeatLabels: false,
};
```

---

## 📄 File 2: `src/stores/pivotStore.ts`

```typescript
// ============================================================
// PIVOT STORE — Zustand Store for Pivot Tables
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  PivotTable,
  PivotField,
  PivotAreaField,
  PivotFilter,
  CalculatedField,
  AggregateFunction,
  DEFAULT_PIVOT_OPTIONS,
} from '../types/pivot';

interface PivotStore {
  // Pivot tables per sheet
  pivotTables: Record<string, PivotTable[]>;  // sheetId -> pivot tables
  
  // Selected pivot for editing
  selectedPivotId: string | null;
  
  // CRUD
  createPivotTable: (
    sourceSheetId: string,
    sourceRange: string,
    targetSheetId: string,
    targetCell: string,
    fields: PivotField[]
  ) => string;
  updatePivotTable: (sheetId: string, pivotId: string, updates: Partial<PivotTable>) => void;
  deletePivotTable: (sheetId: string, pivotId: string) => void;
  
  // Field management
  addFieldToArea: (sheetId: string, pivotId: string, area: 'row' | 'column' | 'value' | 'filter', fieldId: string) => void;
  removeFieldFromArea: (sheetId: string, pivotId: string, area: 'row' | 'column' | 'value' | 'filter', fieldId: string) => void;
  moveField: (sheetId: string, pivotId: string, fieldId: string, fromArea: string, toArea: string, toIndex: number) => void;
  updateFieldSettings: (sheetId: string, pivotId: string, area: string, fieldId: string, settings: Partial<PivotAreaField>) => void;
  
  // Filters
  setFilter: (sheetId: string, pivotId: string, filter: PivotFilter) => void;
  clearFilter: (sheetId: string, pivotId: string, fieldId: string) => void;
  clearAllFilters: (sheetId: string, pivotId: string) => void;
  
  // Calculated fields
  addCalculatedField: (sheetId: string, pivotId: string, field: Omit<CalculatedField, 'id'>) => void;
  removeCalculatedField: (sheetId: string, pivotId: string, fieldId: string) => void;
  
  // Expansion state
  toggleRowExpansion: (sheetId: string, pivotId: string, rowPath: string) => void;
  expandAll: (sheetId: string, pivotId: string) => void;
  collapseAll: (sheetId: string, pivotId: string) => void;
  
  // Refresh
  refreshPivotTable: (sheetId: string, pivotId: string) => void;
  refreshAllPivotTables: (sheetId: string) => void;
  
  // Getters
  getPivotTablesForSheet: (sheetId: string) => PivotTable[];
  getPivotTableById: (sheetId: string, pivotId: string) => PivotTable | undefined;
  getSelectedPivot: () => PivotTable | undefined;
  
  // Selection
  selectPivot: (pivotId: string | null) => void;
}

export const usePivotStore = create<PivotStore>()(
  persist(
    (set, get) => ({
      pivotTables: {},
      selectedPivotId: null,

      createPivotTable: (sourceSheetId, sourceRange, targetSheetId, targetCell, fields) => {
        const id = nanoid(8);
        
        // Parse target cell
        const match = targetCell.match(/^([A-Z]+)(\d+)$/i);
        const targetCol = match ? match[1].toUpperCase().charCodeAt(0) - 65 : 0;
        const targetRow = match ? parseInt(match[2]) - 1 : 0;

        const newPivot: PivotTable = {
          id,
          name: `PivotTable${Object.values(get().pivotTables).flat().length + 1}`,
          sheetId: targetSheetId,
          sourceSheetId,
          sourceRange,
          targetCell,
          targetRow,
          targetCol,
          fields,
          rowFields: [],
          columnFields: [],
          valueFields: [],
          filterFields: [],
          filters: [],
          calculatedFields: [],
          ...DEFAULT_PIVOT_OPTIONS,
          lastRefreshed: Date.now(),
          isExpanded: {},
        };

        set(state => ({
          pivotTables: {
            ...state.pivotTables,
            [targetSheetId]: [...(state.pivotTables[targetSheetId] || []), newPivot],
          },
          selectedPivotId: id,
        }));

        return id;
      },

      updatePivotTable: (sheetId, pivotId, updates) => {
        set(state => ({
          pivotTables: {
            ...state.pivotTables,
            [sheetId]: (state.pivotTables[sheetId] || []).map(pivot =>
              pivot.id === pivotId ? { ...pivot, ...updates } : pivot
            ),
          },
        }));
      },

      deletePivotTable: (sheetId, pivotId) => {
        set(state => ({
          pivotTables: {
            ...state.pivotTables,
            [sheetId]: (state.pivotTables[sheetId] || []).filter(p => p.id !== pivotId),
          },
          selectedPivotId: state.selectedPivotId === pivotId ? null : state.selectedPivotId,
        }));
      },

      addFieldToArea: (sheetId, pivotId, area, fieldId) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const field = pivot.fields.find(f => f.id === fieldId);
        if (!field) return;

        const areaField: PivotAreaField = {
          fieldId,
          aggregateFunction: area === 'value' ? 'sum' : undefined,
          sortOrder: 'none',
          showSubtotals: true,
        };

        const areaKey = `${area}Fields` as keyof PivotTable;
        const currentFields = pivot[areaKey] as PivotAreaField[];

        get().updatePivotTable(sheetId, pivotId, {
          [areaKey]: [...currentFields, areaField],
        });
      },

      removeFieldFromArea: (sheetId, pivotId, area, fieldId) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const areaKey = `${area}Fields` as keyof PivotTable;
        const currentFields = pivot[areaKey] as PivotAreaField[];

        get().updatePivotTable(sheetId, pivotId, {
          [areaKey]: currentFields.filter(f => f.fieldId !== fieldId),
        });
      },

      moveField: (sheetId, pivotId, fieldId, fromArea, toArea, toIndex) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const fromKey = `${fromArea}Fields` as keyof PivotTable;
        const toKey = `${toArea}Fields` as keyof PivotTable;

        const fromFields = [...(pivot[fromKey] as PivotAreaField[])];
        const toFields = fromArea === toArea ? fromFields : [...(pivot[toKey] as PivotAreaField[])];

        const fieldIndex = fromFields.findIndex(f => f.fieldId === fieldId);
        if (fieldIndex === -1) return;

        const [field] = fromFields.splice(fieldIndex, 1);
        
        // Update aggregate function if moving to/from value area
        if (toArea === 'value' && !field.aggregateFunction) {
          field.aggregateFunction = 'sum';
        } else if (toArea !== 'value') {
          field.aggregateFunction = undefined;
        }

        if (fromArea === toArea) {
          fromFields.splice(toIndex, 0, field);
          get().updatePivotTable(sheetId, pivotId, { [fromKey]: fromFields });
        } else {
          toFields.splice(toIndex, 0, field);
          get().updatePivotTable(sheetId, pivotId, {
            [fromKey]: fromFields,
            [toKey]: toFields,
          });
        }
      },

      updateFieldSettings: (sheetId, pivotId, area, fieldId, settings) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const areaKey = `${area}Fields` as keyof PivotTable;
        const currentFields = pivot[areaKey] as PivotAreaField[];

        get().updatePivotTable(sheetId, pivotId, {
          [areaKey]: currentFields.map(f =>
            f.fieldId === fieldId ? { ...f, ...settings } : f
          ),
        });
      },

      setFilter: (sheetId, pivotId, filter) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const existingIndex = pivot.filters.findIndex(f => f.fieldId === filter.fieldId);
        const newFilters = [...pivot.filters];

        if (existingIndex >= 0) {
          newFilters[existingIndex] = filter;
        } else {
          newFilters.push(filter);
        }

        get().updatePivotTable(sheetId, pivotId, { filters: newFilters });
      },

      clearFilter: (sheetId, pivotId, fieldId) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        get().updatePivotTable(sheetId, pivotId, {
          filters: pivot.filters.filter(f => f.fieldId !== fieldId),
        });
      },

      clearAllFilters: (sheetId, pivotId) => {
        get().updatePivotTable(sheetId, pivotId, { filters: [] });
      },

      addCalculatedField: (sheetId, pivotId, field) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        const newField: CalculatedField = {
          ...field,
          id: nanoid(8),
        };

        get().updatePivotTable(sheetId, pivotId, {
          calculatedFields: [...pivot.calculatedFields, newField],
        });
      },

      removeCalculatedField: (sheetId, pivotId, fieldId) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        get().updatePivotTable(sheetId, pivotId, {
          calculatedFields: pivot.calculatedFields.filter(f => f.id !== fieldId),
        });
      },

      toggleRowExpansion: (sheetId, pivotId, rowPath) => {
        const pivot = get().getPivotTableById(sheetId, pivotId);
        if (!pivot) return;

        get().updatePivotTable(sheetId, pivotId, {
          isExpanded: {
            ...pivot.isExpanded,
            [rowPath]: !pivot.isExpanded[rowPath],
          },
        });
      },

      expandAll: (sheetId, pivotId) => {
        get().updatePivotTable(sheetId, pivotId, { isExpanded: {} });
      },

      collapseAll: (sheetId, pivotId) => {
        // Would need to calculate all paths and set to false
        get().updatePivotTable(sheetId, pivotId, { isExpanded: {} });
      },

      refreshPivotTable: (sheetId, pivotId) => {
        get().updatePivotTable(sheetId, pivotId, { lastRefreshed: Date.now() });
      },

      refreshAllPivotTables: (sheetId) => {
        const pivots = get().pivotTables[sheetId] || [];
        pivots.forEach(pivot => {
          get().refreshPivotTable(sheetId, pivot.id);
        });
      },

      getPivotTablesForSheet: (sheetId) => {
        return get().pivotTables[sheetId] || [];
      },

      getPivotTableById: (sheetId, pivotId) => {
        return (get().pivotTables[sheetId] || []).find(p => p.id === pivotId);
      },

      getSelectedPivot: () => {
        const { selectedPivotId, pivotTables } = get();
        if (!selectedPivotId) return undefined;
        
        for (const pivots of Object.values(pivotTables)) {
          const found = pivots.find(p => p.id === selectedPivotId);
          if (found) return found;
        }
        return undefined;
      },

      selectPivot: (pivotId) => {
        set({ selectedPivotId: pivotId });
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

export default usePivotStore;
```

---

## 📄 File 3: `src/components/PivotTable/pivotEngine.ts`

```typescript
// ============================================================
// PIVOT ENGINE — Calculation and aggregation logic
// ============================================================

import {
  PivotTable,
  PivotField,
  PivotAreaField,
  PivotFilter,
  AggregateFunction,
  PivotCellData,
  PivotResult,
} from '../../types/pivot';

type DataRow = Record<string, any>;

// Aggregate functions implementation
const aggregateFunctions: Record<AggregateFunction, (values: number[]) => number> = {
  sum: (values) => values.reduce((a, b) => a + b, 0),
  count: (values) => values.length,
  average: (values) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  min: (values) => Math.min(...values),
  max: (values) => Math.max(...values),
  countNumbers: (values) => values.filter(v => !isNaN(v)).length,
  stdDev: (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  },
  variance: (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  },
  product: (values) => values.reduce((a, b) => a * b, 1),
};

// Format value for display
const formatValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (format === 'currency') return `$${value.toLocaleString()}`;
    if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
    return value.toLocaleString();
  }
  return String(value);
};

// Group data by field values
const groupBy = <T>(
  data: T[],
  keyFn: (item: T) => string
): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  
  data.forEach(item => {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return groups;
};

// Apply filters to data
const applyFilters = (
  data: DataRow[],
  filters: PivotFilter[],
  fields: PivotField[]
): DataRow[] => {
  return data.filter(row => {
    return filters.every(filter => {
      const field = fields.find(f => f.id === filter.fieldId);
      if (!field) return true;
      
      const value = row[field.name];
      const isInList = filter.selectedValues.includes(value);
      
      return filter.excludeMode ? !isInList : isInList;
    });
  });
};

// Get unique values for a field
export const getUniqueValues = (
  data: DataRow[],
  fieldName: string
): any[] => {
  const values = new Set<any>();
  data.forEach(row => values.add(row[fieldName]));
  return Array.from(values).sort();
};

// Build pivot tree structure
interface PivotNode {
  key: string;
  values: DataRow[];
  children: Map<string, PivotNode>;
  aggregates: Map<string, number>;
}

const buildPivotTree = (
  data: DataRow[],
  rowFields: PivotAreaField[],
  valueFields: PivotAreaField[],
  fields: PivotField[],
  level: number = 0
): PivotNode => {
  const node: PivotNode = {
    key: 'root',
    values: data,
    children: new Map(),
    aggregates: new Map(),
  };

  // Calculate aggregates for this node
  valueFields.forEach(vf => {
    const field = fields.find(f => f.id === vf.fieldId);
    if (!field) return;
    
    const values = data
      .map(row => parseFloat(row[field.name]))
      .filter(v => !isNaN(v));
    
    const aggFn = aggregateFunctions[vf.aggregateFunction || 'sum'];
    node.aggregates.set(vf.fieldId, aggFn(values));
  });

  // Build children for next level
  if (level < rowFields.length) {
    const rowField = rowFields[level];
    const field = fields.find(f => f.id === rowField.fieldId);
    if (!field) return node;

    const groups = groupBy(data, row => String(row[field.name]));
    
    groups.forEach((groupData, key) => {
      const childNode = buildPivotTree(
        groupData,
        rowFields,
        valueFields,
        fields,
        level + 1
      );
      childNode.key = key;
      node.children.set(key, childNode);
    });
  }

  return node;
};

// Main pivot calculation function
export const calculatePivot = (
  pivot: PivotTable,
  sourceData: DataRow[]
): PivotResult => {
  const { fields, rowFields, columnFields, valueFields, filters } = pivot;
  
  // Apply filters
  const filteredData = applyFilters(sourceData, filters, fields);
  
  // Build row tree
  const rowTree = buildPivotTree(filteredData, rowFields, valueFields, fields);
  
  // Build column headers
  const colHeaders: string[][] = [];
  if (columnFields.length > 0) {
    const colField = columnFields[0];
    const field = fields.find(f => f.id === colField.fieldId);
    if (field) {
      const uniqueColValues = getUniqueValues(filteredData, field.name);
      colHeaders.push(uniqueColValues.map(String));
    }
  }
  
  // Generate result cells
  const cells: PivotCellData[][] = [];
  
  // Header row
  const headerRow: PivotCellData[] = [];
  
  // Row field headers
  rowFields.forEach((rf, i) => {
    const field = fields.find(f => f.id === rf.fieldId);
    headerRow.push({
      value: rf.customName || field?.name || '',
      formattedValue: rf.customName || field?.name || '',
      isHeader: true,
      isTotal: false,
      isSubtotal: false,
      rowPath: [],
      colPath: [],
      level: i,
      isCollapsible: false,
      isExpanded: true,
    });
  });
  
  // Value/Column headers
  if (colHeaders.length > 0) {
    colHeaders[0].forEach(colValue => {
      valueFields.forEach(vf => {
        const field = fields.find(f => f.id === vf.fieldId);
        headerRow.push({
          value: `${colValue} - ${vf.customName || field?.name || ''}`,
          formattedValue: `${colValue} - ${vf.customName || field?.name || ''}`,
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: [],
          colPath: [colValue],
          level: 0,
          isCollapsible: false,
          isExpanded: true,
        });
      });
    });
  } else {
    valueFields.forEach(vf => {
      const field = fields.find(f => f.id === vf.fieldId);
      headerRow.push({
        value: vf.customName || field?.name || '',
        formattedValue: vf.customName || field?.name || '',
        isHeader: true,
        isTotal: false,
        isSubtotal: false,
        rowPath: [],
        colPath: [],
        level: 0,
        isCollapsible: false,
        isExpanded: true,
      });
    });
  }
  
  cells.push(headerRow);
  
  // Data rows
  const addRowsFromTree = (
    node: PivotNode,
    path: string[],
    level: number
  ) => {
    if (level > 0) {
      const row: PivotCellData[] = [];
      
      // Indent and label cells
      for (let i = 0; i < rowFields.length; i++) {
        if (i < level - 1) {
          row.push({
            value: '',
            formattedValue: '',
            isHeader: false,
            isTotal: false,
            isSubtotal: false,
            rowPath: path.slice(0, i + 1),
            colPath: [],
            level: i,
            isCollapsible: false,
            isExpanded: true,
          });
        } else if (i === level - 1) {
          row.push({
            value: node.key,
            formattedValue: String(node.key),
            isHeader: false,
            isTotal: false,
            isSubtotal: false,
            rowPath: path,
            colPath: [],
            level: i,
            isCollapsible: node.children.size > 0,
            isExpanded: pivot.isExpanded[path.join('|')] !== false,
          });
        } else {
          row.push({
            value: '',
            formattedValue: '',
            isHeader: false,
            isTotal: false,
            isSubtotal: false,
            rowPath: path,
            colPath: [],
            level: i,
            isCollapsible: false,
            isExpanded: true,
          });
        }
      }
      
      // Value cells
      if (colHeaders.length > 0) {
        colHeaders[0].forEach(colValue => {
          valueFields.forEach(vf => {
            // Filter data for this column
            const colField = fields.find(f => f.id === columnFields[0]?.fieldId);
            const colData = colField 
              ? node.values.filter(row => String(row[colField.name]) === colValue)
              : node.values;
            
            const field = fields.find(f => f.id === vf.fieldId);
            const values = colData
              .map(r => parseFloat(r[field?.name || '']))
              .filter(v => !isNaN(v));
            
            const aggFn = aggregateFunctions[vf.aggregateFunction || 'sum'];
            const value = values.length > 0 ? aggFn(values) : 0;
            
            row.push({
              value,
              formattedValue: formatValue(value, vf.numberFormat),
              isHeader: false,
              isTotal: false,
              isSubtotal: false,
              rowPath: path,
              colPath: [colValue],
              fieldId: vf.fieldId,
              level: 0,
              isCollapsible: false,
              isExpanded: true,
            });
          });
        });
      } else {
        valueFields.forEach(vf => {
          const value = node.aggregates.get(vf.fieldId) || 0;
          row.push({
            value,
            formattedValue: formatValue(value, vf.numberFormat),
            isHeader: false,
            isTotal: false,
            isSubtotal: false,
            rowPath: path,
            colPath: [],
            fieldId: vf.fieldId,
            level: 0,
            isCollapsible: false,
            isExpanded: true,
          });
        });
      }
      
      cells.push(row);
    }
    
    // Recursively add children
    const isExpanded = pivot.isExpanded[path.join('|')] !== false;
    if (isExpanded || level === 0) {
      const sortedKeys = Array.from(node.children.keys()).sort();
      sortedKeys.forEach(key => {
        const child = node.children.get(key)!;
        addRowsFromTree(child, [...path, key], level + 1);
      });
    }
  };
  
  addRowsFromTree(rowTree, [], 0);
  
  // Grand total row
  if (pivot.showRowGrandTotals) {
    const totalRow: PivotCellData[] = [];
    
    // Label cells
    totalRow.push({
      value: 'Grand Total',
      formattedValue: 'Grand Total',
      isHeader: false,
      isTotal: true,
      isSubtotal: false,
      rowPath: [],
      colPath: [],
      level: 0,
      isCollapsible: false,
      isExpanded: true,
    });
    
    for (let i = 1; i < rowFields.length; i++) {
      totalRow.push({
        value: '',
        formattedValue: '',
        isHeader: false,
        isTotal: true,
        isSubtotal: false,
        rowPath: [],
        colPath: [],
        level: i,
        isCollapsible: false,
        isExpanded: true,
      });
    }
    
    // Total value cells
    valueFields.forEach(vf => {
      const value = rowTree.aggregates.get(vf.fieldId) || 0;
      totalRow.push({
        value,
        formattedValue: formatValue(value, vf.numberFormat),
        isHeader: false,
        isTotal: true,
        isSubtotal: false,
        rowPath: [],
        colPath: [],
        fieldId: vf.fieldId,
        level: 0,
        isCollapsible: false,
        isExpanded: true,
      });
    });
    
    cells.push(totalRow);
  }
  
  return {
    cells,
    rowCount: cells.length,
    colCount: cells[0]?.length || 0,
  };
};

// Parse source data from sheet
export const parseSourceData = (
  getCellValue: (sheetId: string, row: number, col: number) => any,
  sheetId: string,
  range: string
): { data: DataRow[]; fields: PivotField[] } => {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return { data: [], fields: [] };
  
  const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
  const startRow = parseInt(match[2]) - 1;
  const endCol = match[3].toUpperCase().charCodeAt(0) - 65;
  const endRow = parseInt(match[4]) - 1;
  
  // Get headers (first row)
  const fields: PivotField[] = [];
  for (let col = startCol; col <= endCol; col++) {
    const headerValue = getCellValue(sheetId, startRow, col);
    fields.push({
      id: `field-${col}`,
      name: String(headerValue || `Column ${col - startCol + 1}`),
      sourceColumn: col,
      dataType: 'string', // Would need to infer from data
    });
  }
  
  // Get data rows
  const data: DataRow[] = [];
  for (let row = startRow + 1; row <= endRow; row++) {
    const rowData: DataRow = {};
    fields.forEach((field, i) => {
      const value = getCellValue(sheetId, row, startCol + i);
      rowData[field.name] = value;
    });
    data.push(rowData);
  }
  
  return { data, fields };
};
```

---

## 📄 File 4: `src/components/PivotTable/CreatePivotDialog.tsx`

```tsx
// ============================================================
// CREATE PIVOT TABLE DIALOG
// ============================================================

import React, { useState } from 'react';
import { X, Table2 } from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { parseSourceData } from './pivotEngine';
import './PivotTable.css';

interface CreatePivotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePivotDialog: React.FC<CreatePivotDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [sourceRange, setSourceRange] = useState('');
  const [targetLocation, setTargetLocation] = useState<'newSheet' | 'existingSheet'>('newSheet');
  const [targetCell, setTargetCell] = useState('A1');
  const [error, setError] = useState<string | null>(null);

  const { activeSheetId, selection, getCellValue, addSheet, sheets } = useWorkbookStore();
  const { createPivotTable } = usePivotStore();

  // Auto-fill source range from selection
  React.useEffect(() => {
    if (selection && isOpen) {
      const startCol = String.fromCharCode(65 + selection.start.col);
      const endCol = String.fromCharCode(65 + selection.end.col);
      const range = `${startCol}${selection.start.row + 1}:${endCol}${selection.end.row + 1}`;
      setSourceRange(range);
    }
  }, [selection, isOpen]);

  const handleCreate = () => {
    setError(null);

    if (!sourceRange.trim()) {
      setError('Please enter a source data range.');
      return;
    }

    // Parse source data
    const { data, fields } = parseSourceData(getCellValue, activeSheetId, sourceRange);
    
    if (data.length === 0) {
      setError('No data found in the specified range.');
      return;
    }

    if (fields.length === 0) {
      setError('Could not detect column headers.');
      return;
    }

    // Determine target sheet
    let targetSheetId = activeSheetId;
    if (targetLocation === 'newSheet') {
      const newSheetId = addSheet('Pivot');
      targetSheetId = newSheetId;
    }

    // Create pivot table
    createPivotTable(
      activeSheetId,
      sourceRange.toUpperCase(),
      targetSheetId,
      targetCell.toUpperCase(),
      fields
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog create-pivot-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <Table2 size={20} />
            Create PivotTable
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label>Select data range:</label>
            <input
              type="text"
              value={sourceRange}
              onChange={(e) => setSourceRange(e.target.value)}
              placeholder="e.g., A1:H100"
              className="range-input"
            />
            <span className="input-hint">
              Include column headers in your selection
            </span>
          </div>

          <div className="form-group">
            <label>Choose where to place the PivotTable:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={targetLocation === 'newSheet'}
                  onChange={() => setTargetLocation('newSheet')}
                />
                New Worksheet
              </label>
              <label>
                <input
                  type="radio"
                  checked={targetLocation === 'existingSheet'}
                  onChange={() => setTargetLocation('existingSheet')}
                />
                Existing Worksheet
              </label>
            </div>
          </div>

          {targetLocation === 'existingSheet' && (
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                value={targetCell}
                onChange={(e) => setTargetCell(e.target.value)}
                placeholder="A1"
                className="range-input small"
              />
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePivotDialog;
```

---

## 📄 File 5: `src/components/PivotTable/PivotFieldList.tsx`

```tsx
// ============================================================
// PIVOT FIELD LIST — Drag & drop field management
// ============================================================

import React from 'react';
import { 
  GripVertical, 
  Rows3, 
  Columns3, 
  Calculator, 
  Filter,
  Check,
} from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { PivotField, PivotAreaField } from '../../types/pivot';
import './PivotTable.css';

interface PivotFieldListProps {
  sheetId: string;
  pivotId: string;
}

export const PivotFieldList: React.FC<PivotFieldListProps> = ({
  sheetId,
  pivotId,
}) => {
  const { 
    getPivotTableById, 
    addFieldToArea, 
    removeFieldFromArea,
  } = usePivotStore();
  
  const pivot = getPivotTableById(sheetId, pivotId);
  if (!pivot) return null;

  const { fields, rowFields, columnFields, valueFields, filterFields } = pivot;

  // Check if field is in any area
  const getFieldAreas = (fieldId: string): string[] => {
    const areas: string[] = [];
    if (rowFields.some(f => f.fieldId === fieldId)) areas.push('row');
    if (columnFields.some(f => f.fieldId === fieldId)) areas.push('column');
    if (valueFields.some(f => f.fieldId === fieldId)) areas.push('value');
    if (filterFields.some(f => f.fieldId === fieldId)) areas.push('filter');
    return areas;
  };

  // Toggle field in area
  const handleFieldToggle = (field: PivotField, area: 'row' | 'column' | 'value' | 'filter') => {
    const isInArea = getFieldAreas(field.id).includes(area);
    
    if (isInArea) {
      removeFieldFromArea(sheetId, pivotId, area, field.id);
    } else {
      addFieldToArea(sheetId, pivotId, area, field.id);
    }
  };

  // Render area fields
  const renderAreaFields = (
    areaFields: PivotAreaField[],
    area: string,
    icon: React.ReactNode,
    label: string
  ) => (
    <div className="pivot-area">
      <div className="area-header">
        {icon}
        <span>{label}</span>
      </div>
      <div className="area-fields">
        {areaFields.length === 0 ? (
          <div className="area-empty">Drag fields here</div>
        ) : (
          areaFields.map((af, index) => {
            const field = fields.find(f => f.id === af.fieldId);
            return (
              <div key={`${af.fieldId}-${index}`} className="area-field">
                <GripVertical size={14} className="drag-handle" />
                <span className="field-name">{af.customName || field?.name}</span>
                <button 
                  className="remove-btn"
                  onClick={() => removeFieldFromArea(sheetId, pivotId, area as any, af.fieldId)}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="pivot-field-list">
      {/* Available Fields */}
      <div className="fields-section">
        <div className="section-header">
          <span>PivotTable Fields</span>
        </div>
        <div className="fields-list">
          {fields.map(field => {
            const areas = getFieldAreas(field.id);
            return (
              <div key={field.id} className="field-item">
                <label className="field-checkbox">
                  <input
                    type="checkbox"
                    checked={areas.length > 0}
                    onChange={() => {
                      if (areas.length > 0) {
                        areas.forEach(area => removeFieldFromArea(sheetId, pivotId, area as any, field.id));
                      } else {
                        // Default: add to rows for text, values for numbers
                        const area = field.dataType === 'number' ? 'value' : 'row';
                        addFieldToArea(sheetId, pivotId, area, field.id);
                      }
                    }}
                  />
                  <span>{field.name}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="areas-section">
        <div className="areas-grid">
          {renderAreaFields(filterFields, 'filter', <Filter size={14} />, 'Filters')}
          {renderAreaFields(columnFields, 'column', <Columns3 size={14} />, 'Columns')}
          {renderAreaFields(rowFields, 'row', <Rows3 size={14} />, 'Rows')}
          {renderAreaFields(valueFields, 'value', <Calculator size={14} />, 'Values')}
        </div>
      </div>
    </div>
  );
};

export default PivotFieldList;
```

---

## 📄 File 6: `src/components/PivotTable/PivotTableRenderer.tsx`

```tsx
// ============================================================
// PIVOT TABLE RENDERER
// ============================================================

import React, { useMemo } from 'react';
import { ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { calculatePivot, parseSourceData } from './pivotEngine';
import { PivotCellData } from '../../types/pivot';
import './PivotTable.css';

interface PivotTableRendererProps {
  sheetId: string;
  pivotId: string;
}

export const PivotTableRenderer: React.FC<PivotTableRendererProps> = ({
  sheetId,
  pivotId,
}) => {
  const { 
    getPivotTableById, 
    toggleRowExpansion,
    selectPivot,
    refreshPivotTable,
  } = usePivotStore();
  
  const { getCellValue } = useWorkbookStore();
  
  const pivot = getPivotTableById(sheetId, pivotId);

  // Calculate pivot result
  const result = useMemo(() => {
    if (!pivot) return null;
    
    const { data } = parseSourceData(
      getCellValue,
      pivot.sourceSheetId,
      pivot.sourceRange
    );
    
    return calculatePivot(pivot, data);
  }, [pivot, getCellValue]);

  if (!pivot || !result) return null;

  const handleCellClick = (cell: PivotCellData) => {
    selectPivot(pivotId);
    
    if (cell.isCollapsible) {
      toggleRowExpansion(sheetId, pivotId, cell.rowPath.join('|'));
    }
  };

  const handleRefresh = () => {
    refreshPivotTable(sheetId, pivotId);
  };

  return (
    <div className="pivot-table-container">
      {/* Toolbar */}
      <div className="pivot-toolbar">
        <span className="pivot-name">{pivot.name}</span>
        <button className="refresh-btn" onClick={handleRefresh} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <table className="pivot-table">
        <tbody>
          {result.cells.map((row, rowIndex) => (
            <tr key={rowIndex} className={row[0]?.isTotal ? 'total-row' : ''}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    pivot-cell
                    ${cell.isHeader ? 'header-cell' : ''}
                    ${cell.isTotal ? 'total-cell' : ''}
                    ${cell.isSubtotal ? 'subtotal-cell' : ''}
                    ${cell.isCollapsible ? 'collapsible' : ''}
                  `}
                  style={{ paddingLeft: cell.level * 16 + 8 }}
                  onClick={() => handleCellClick(cell)}
                >
                  {cell.isCollapsible && (
                    <span className="expand-icon">
                      {cell.isExpanded ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </span>
                  )}
                  {cell.formattedValue}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PivotTableRenderer;
```

---

## 📄 File 7: `src/components/PivotTable/PivotTable.css`

```css
/* ============================================================
   PIVOT TABLE STYLES
   ============================================================ */

/* Create Dialog */
.create-pivot-dialog {
  width: 420px;
}

.create-pivot-dialog h3 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.range-input.small {
  width: 100px;
}

/* Field List Panel */
.pivot-field-list {
  width: 280px;
  background: var(--bg-primary, #fff);
  border-left: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fields-section {
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.section-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.fields-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.field-item {
  padding: 4px 8px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.field-checkbox input {
  accent-color: var(--accent-color, #217346);
}

/* Areas Section */
.areas-section {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.areas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pivot-area {
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  overflow: hidden;
}

.area-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #888);
  text-transform: uppercase;
}

.area-fields {
  min-height: 60px;
  padding: 6px;
}

.area-empty {
  padding: 12px;
  text-align: center;
  font-size: 11px;
  color: var(--text-muted, #999);
  font-style: italic;
}

.area-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

.area-field:last-child {
  margin-bottom: 0;
}

.drag-handle {
  color: var(--text-muted, #999);
  cursor: grab;
}

.field-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #999);
  font-size: 14px;
  border-radius: 50%;
  transition: all 0.15s;
}

.remove-btn:hover {
  background: var(--error-light, #fee2e2);
  color: var(--error-color, #dc2626);
}

/* Pivot Table Renderer */
.pivot-table-container {
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
}

.pivot-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.pivot-name {
  font-weight: 600;
  font-size: 13px;
}

.refresh-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.refresh-btn:hover {
  background: var(--bg-hover, #eee);
  color: var(--accent-color, #217346);
}

/* Pivot Table */
.pivot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.pivot-cell {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e8e8e8);
  text-align: left;
  white-space: nowrap;
}

.header-cell {
  background: var(--bg-secondary, #f5f5f5);
  font-weight: 600;
  position: sticky;
  top: 0;
}

.total-cell {
  background: var(--accent-light, #e8f5e9);
  font-weight: 600;
}

.total-row {
  background: var(--accent-light, #e8f5e9);
}

.subtotal-cell {
  background: var(--bg-secondary, #f8f9fa);
  font-weight: 500;
}

.collapsible {
  cursor: pointer;
}

.collapsible:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.03));
}

.expand-icon {
  display: inline-flex;
  margin-right: 4px;
  color: var(--text-muted, #888);
}

/* Dark Mode */
[data-theme="dark"] .pivot-field-list,
[data-theme="dark"] .pivot-table-container {
  background: var(--bg-primary-dark, #1e1e1e);
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .section-header,
[data-theme="dark"] .area-header,
[data-theme="dark"] .pivot-toolbar {
  background: var(--bg-secondary-dark, #2a2a2a);
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .area-field {
  background: var(--bg-secondary-dark, #2a2a2a);
}

[data-theme="dark"] .header-cell {
  background: var(--bg-secondary-dark, #2a2a2a);
}

[data-theme="dark"] .pivot-cell {
  border-color: var(--border-color-dark, #404040);
}
```

---

## 📄 File 8: `src/components/PivotTable/index.ts`

```typescript
export { CreatePivotDialog } from './CreatePivotDialog';
export { PivotFieldList } from './PivotFieldList';
export { PivotTableRenderer } from './PivotTableRenderer';
export { calculatePivot, parseSourceData, getUniqueValues } from './pivotEngine';
```

---

## 🔗 Integration

### Add to Insert Menu

```tsx
// In Insert toolbar/menu
<button onClick={() => setShowCreatePivot(true)}>
  <Table2 size={16} />
  PivotTable
</button>

<CreatePivotDialog
  isOpen={showCreatePivot}
  onClose={() => setShowCreatePivot(false)}
/>
```

### Render Pivot Tables in Sheet

```tsx
// In Sheet renderer
const pivotTables = getPivotTablesForSheet(sheetId);

{pivotTables.map(pivot => (
  <div 
    key={pivot.id}
    style={{
      position: 'absolute',
      left: pivot.targetCol * CELL_WIDTH,
      top: pivot.targetRow * CELL_HEIGHT,
    }}
  >
    <PivotTableRenderer sheetId={sheetId} pivotId={pivot.id} />
  </div>
))}
```

### Show Field List Panel

```tsx
// When pivot is selected
{selectedPivot && (
  <PivotFieldList 
    sheetId={selectedPivot.sheetId} 
    pivotId={selectedPivot.id} 
  />
)}
```

---

## ✅ Implementation Checklist

### Day 1
- [ ] `src/types/pivot.ts`
- [ ] `src/stores/pivotStore.ts`
- [ ] `src/components/PivotTable/pivotEngine.ts`

### Day 2
- [ ] `src/components/PivotTable/CreatePivotDialog.tsx`
- [ ] `src/components/PivotTable/PivotFieldList.tsx`
- [ ] `src/components/PivotTable/PivotTableRenderer.tsx`

### Day 3
- [ ] `src/components/PivotTable/PivotTable.css`
- [ ] `src/components/PivotTable/index.ts`
- [ ] Integration with Insert menu
- [ ] Integration with sheet renderer
- [ ] Field panel show/hide
- [ ] Testing with sample data

---

## 🎯 Features Summary

| Feature | Description |
|---------|-------------|
| **Create Pivot** | From selected data range |
| **Field List** | Checkbox-based field selection |
| **4 Areas** | Rows, Columns, Values, Filters |
| **Aggregations** | Sum, Count, Average, Min, Max, etc. |
| **Expand/Collapse** | Hierarchical row expansion |
| **Grand Totals** | Row and column totals |
| **Subtotals** | Group subtotals |
| **Refresh** | Update from source data |
| **Calculated Fields** | Custom formulas |
| **Filters** | Value-based filtering |

---

**Estimated Time:** 3 days  
**Score Impact:** +1%

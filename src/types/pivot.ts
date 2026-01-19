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

// Pivot cell value can be string, number, boolean, Date, or null
export type PivotCellValue = string | number | boolean | Date | null;

export interface PivotFilter {
  fieldId: string;
  selectedValues: PivotCellValue[];
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
  value: PivotCellValue;
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

// ============================================================
// SLICER TYPES
// ============================================================

export interface Slicer {
  id: string;
  pivotId: string;
  fieldId: string;
  name: string;

  // Position and size
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Selection state
  selectedValues: PivotCellValue[];
  multiSelect: boolean;

  // Display options
  columns: number;        // Number of columns in the slicer
  showHeader: boolean;
  sortOrder: SortOrder;

  // Style
  style: SlicerStyle;
}

export interface SlicerStyle {
  headerColor: string;
  headerTextColor: string;
  selectedColor: string;
  selectedTextColor: string;
  unselectedColor: string;
  unselectedTextColor: string;
  borderColor: string;
  borderRadius: number;
}

export const DEFAULT_SLICER_STYLE: SlicerStyle = {
  headerColor: '#217346',
  headerTextColor: '#ffffff',
  selectedColor: '#217346',
  selectedTextColor: '#ffffff',
  unselectedColor: '#f5f5f5',
  unselectedTextColor: '#333333',
  borderColor: '#e0e0e0',
  borderRadius: 4,
};

// ============================================================
// TIMELINE TYPES
// ============================================================

export type TimelineLevel = 'years' | 'quarters' | 'months' | 'days';

export interface Timeline {
  id: string;
  pivotId: string;
  fieldId: string;
  name: string;

  // Position and size
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Time range selection
  level: TimelineLevel;
  startDate: Date | null;
  endDate: Date | null;

  // Display options
  showHeader: boolean;
  showScrollbar: boolean;

  // Style
  style: TimelineStyle;
}

export interface TimelineStyle {
  headerColor: string;
  headerTextColor: string;
  selectedColor: string;
  unselectedColor: string;
  borderColor: string;
}

export const DEFAULT_TIMELINE_STYLE: TimelineStyle = {
  headerColor: '#217346',
  headerTextColor: '#ffffff',
  selectedColor: '#217346',
  unselectedColor: '#f0f0f0',
  borderColor: '#e0e0e0',
};

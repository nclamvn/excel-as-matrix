// Cell value types
export type CellValue = string | number | boolean | null;

// Cell formatting
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  numberFormat?: string;
  textRotation?: number;
  verticalText?: boolean;
}

export interface CellComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  resolved?: boolean;
}

export interface CellData {
  value: CellValue;
  formula: string | null;
  displayValue: string;
  format?: CellFormat;
  comment?: CellComment;
  /** If this cell is a spill cell, points to the origin formula cell (row:col) */
  spillOrigin?: string;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SheetProtection {
  password?: string; // Hashed password
  selectLockedCells?: boolean;
  selectUnlockedCells?: boolean;
  formatCells?: boolean;
  formatColumns?: boolean;
  formatRows?: boolean;
  insertColumns?: boolean;
  insertRows?: boolean;
  insertHyperlinks?: boolean;
  deleteColumns?: boolean;
  deleteRows?: boolean;
  sort?: boolean;
  useAutoFilter?: boolean;
  usePivotTableReports?: boolean;
  editObjects?: boolean;
  editScenarios?: boolean;
}

export interface Sheet {
  id: string;
  name: string;
  index: number;
  cells: Record<string, CellData>; // key: "row:col"
  tabColor?: string;
  hidden?: boolean;
  protected?: boolean;
  protection?: SheetProtection;
  hiddenRows?: Set<number>;
  hiddenColumns?: Set<number>;
  rowHeights?: Record<number, number>;
  columnWidths?: Record<number, number>;
  freezePane?: { row: number; col: number };
}

export interface Workbook {
  id: string;
  name: string;
  sheets: Sheet[];
}

// Helper functions
export const getCellKey = (row: number, col: number): string => `${row}:${col}`;

export const parseCellKey = (key: string): CellPosition => {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
};

export const colToLetter = (col: number): string => {
  let result = '';
  let n = col + 1;
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
};

export const letterToCol = (s: string): number => {
  let result = 0;
  for (const c of s.toUpperCase()) {
    result = result * 26 + (c.charCodeAt(0) - 64);
  }
  return result - 1;
};

export const toCellRef = (row: number, col: number): string => {
  return `${colToLetter(col)}${row + 1}`;
};

export const parseCellRef = (ref: string): CellPosition | null => {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const col = letterToCol(match[1]);
  const row = parseInt(match[2], 10) - 1;

  if (row < 0 || col < 0) return null;
  return { row, col };
};

// ============ Phase 2: Tables ============

export interface TableColumn {
  id: string;
  name: string;
  index: number;
  semanticTypeId?: string;
  formula?: string;
  width?: number;
  hidden: boolean;
}

export interface TableStyle {
  name: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  alternateRowColor?: string;
}

export interface Table {
  id: string;
  name: string;
  sheetId: string;
  startRow: number;
  startCol: number;
  columns: TableColumn[];
  rowCount: number;
  hasHeaderRow: boolean;
  hasTotalRow: boolean;
  style: TableStyle;
  createdAt: string;
  updatedAt: string;
}

// ============ Phase 2: Modules ============

export interface ModuleExport {
  name: string;
  cellRef: string;
  description?: string;
  isPublic: boolean;
}

export interface ModuleImport {
  name: string;
  fromModule: string;
  exportName: string;
  alias?: string;
}

export interface Module {
  id: string;
  name: string;
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  exports: ModuleExport[];
  imports: ModuleImport[];
  description?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Phase 2: Named Ranges ============

export type RangeScope = 'workbook' | { sheet: string };

export interface NamedRange {
  id: string;
  name: string;
  refersTo: string;
  scope: RangeScope;
  comment?: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Phase 2: Data Validation ============

export type ComparisonOperator =
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export type ListSource =
  | { type: 'values'; values: string[] }
  | { type: 'range'; range: string }
  | { type: 'namedRange'; name: string };

export type ValidationType =
  | { type: 'any' }
  | { type: 'wholeNumber'; operator: ComparisonOperator; value1: number; value2?: number }
  | { type: 'decimal'; operator: ComparisonOperator; value1: number; value2?: number }
  | { type: 'list'; source: ListSource; dropdown: boolean }
  | { type: 'date'; operator: ComparisonOperator; value1: string; value2?: string }
  | { type: 'textLength'; operator: ComparisonOperator; value1: number; value2?: number }
  | { type: 'custom'; formula: string };

export type ErrorStyle = 'stop' | 'warning' | 'information';

export interface InputMessage {
  title: string;
  message: string;
  show: boolean;
}

export interface ErrorAlert {
  style: ErrorStyle;
  title: string;
  message: string;
  show: boolean;
}

export interface ValidationRule {
  id: string;
  validationType: ValidationType;
  inputMessage?: InputMessage;
  errorAlert?: ErrorAlert;
  allowBlank: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CellValidation {
  sheetId: string;
  row: number;
  col: number;
  ruleId: string;
}

// ============ Phase 2: Semantic Types ============

export type BaseType =
  | 'text'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'dateTime'
  | 'time'
  | 'currency'
  | 'percentage'
  | { custom: string };

export type TypeConstraint =
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'pattern'; pattern: string }
  | { type: 'maxLength'; length: number }
  | { type: 'minLength'; length: number }
  | { type: 'oneOf'; options: string[] };

export interface FormatSpec {
  pattern: string;
  locale?: string;
  decimalPlaces?: number;
  thousandSeparator?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface SemanticType {
  id: string;
  name: string;
  baseType: BaseType;
  constraints: TypeConstraint[];
  format?: FormatSpec;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

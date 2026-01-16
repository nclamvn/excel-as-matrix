// =============================================================================
// DATA CLEANER — Type Definitions
// =============================================================================

// =============================================================================
// QUALITY TYPES
// =============================================================================

export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityScore {
  overall: number; // 0-100
  grade: QualityGrade;
  categories: QualityCategories;
  issues: QualityIssue[];
  summary: QualitySummary;
}

export interface QualityCategories {
  duplicates: CategoryScore;
  completeness: CategoryScore;
  validity: CategoryScore;
  consistency: CategoryScore;
  accuracy: CategoryScore;
}

export interface CategoryScore {
  score: number; // 0-100
  grade: QualityGrade;
  issueCount: number;
  description: string;
}

export interface QualitySummary {
  totalRows: number;
  totalCells: number;
  totalIssues: number;
  autoFixable: number;
  manualReview: number;
}

// =============================================================================
// ISSUE TYPES
// =============================================================================

export type IssueType =
  | 'duplicate'
  | 'missing'
  | 'invalid_format'
  | 'inconsistent'
  | 'outlier'
  | 'whitespace'
  | 'invalid_value';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface QualityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  category: keyof QualityCategories;
  title: string;
  description: string;
  affectedCells: CellReference[];
  affectedRows: number[];
  count: number;
  autoFixable: boolean;
  suggestedFix?: SuggestedFix;
  examples: IssueExample[];
}

export interface CellReference {
  row: number;
  col: number;
  ref: string; // e.g., "A1"
  value: unknown;
}

export interface IssueExample {
  cell: string;
  currentValue: unknown;
  suggestedValue?: unknown;
  reason: string;
}

export interface SuggestedFix {
  type: FixType;
  description: string;
  preview?: FixPreview;
}

export type FixType =
  | 'remove_duplicates'
  | 'fill_missing'
  | 'standardize_format'
  | 'fix_inconsistency'
  | 'trim_whitespace'
  | 'remove_outlier'
  | 'correct_value';

export interface FixPreview {
  before: unknown;
  after: unknown;
  cellCount: number;
}

// =============================================================================
// DUPLICATE TYPES
// =============================================================================

export interface DuplicateGroup {
  id: string;
  type: 'exact' | 'fuzzy';
  similarity: number; // 0-1 for fuzzy matches
  rows: DuplicateRow[];
  columns: number[];
  keepRow?: number; // Which row to keep
}

export interface DuplicateRow {
  rowIndex: number;
  values: unknown[];
  isOriginal: boolean;
}

export interface DuplicateConfig {
  checkColumns: number[] | 'all';
  fuzzyThreshold: number; // 0-1, default 0.9
  caseSensitive: boolean;
  ignoreWhitespace: boolean;
}

// =============================================================================
// FORMAT TYPES
// =============================================================================

export type FormatType = 'date' | 'phone' | 'email' | 'name' | 'currency' | 'number' | 'text';

export interface FormatIssue {
  column: number;
  columnName: string;
  detectedType: FormatType;
  inconsistentCells: FormatCell[];
  suggestedFormat: string;
}

export interface FormatCell {
  row: number;
  col: number;
  ref: string;
  currentValue: string;
  standardizedValue: string;
  formatPattern: string;
}

export interface FormatConfig {
  dateFormat: string; // e.g., "YYYY-MM-DD"
  phoneFormat: string; // e.g., "+1 (XXX) XXX-XXXX"
  nameFormat: 'title' | 'upper' | 'lower' | 'sentence';
  currencyFormat: string;
  numberFormat: string;
}

// =============================================================================
// MISSING VALUE TYPES
// =============================================================================

export type FillStrategy =
  | 'mean'
  | 'median'
  | 'mode'
  | 'forward_fill'
  | 'backward_fill'
  | 'interpolate'
  | 'constant'
  | 'delete_row';

export interface MissingValueInfo {
  column: number;
  columnName: string;
  missingCount: number;
  missingPercent: number;
  rows: number[];
  suggestedStrategy: FillStrategy;
  suggestedValue?: unknown;
}

export interface MissingValueConfig {
  strategies: Record<number, FillStrategy>;
  defaultStrategy: FillStrategy;
  constantValues: Record<number, unknown>;
  deleteThreshold: number; // Delete row if > X% missing
}

// =============================================================================
// INCONSISTENCY TYPES
// =============================================================================

export interface InconsistencyGroup {
  id: string;
  column: number;
  columnName: string;
  canonicalValue: string;
  variants: InconsistentValue[];
  totalCount: number;
}

export interface InconsistentValue {
  value: string;
  count: number;
  rows: number[];
  similarity: number;
}

export interface InconsistencyConfig {
  similarityThreshold: number; // 0-1
  caseSensitive: boolean;
  ignoreWhitespace: boolean;
  customMappings: Record<string, string>;
}

// =============================================================================
// OUTLIER TYPES
// =============================================================================

export type OutlierMethod = 'zscore' | 'iqr' | 'mad' | 'isolation_forest';

export interface OutlierInfo {
  column: number;
  columnName: string;
  outliers: OutlierCell[];
  stats: ColumnStats;
  method: OutlierMethod;
}

export interface OutlierCell {
  row: number;
  col: number;
  ref: string;
  value: number;
  score: number; // z-score or distance
  direction: 'high' | 'low';
}

export interface ColumnStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface OutlierConfig {
  method: OutlierMethod;
  zScoreThreshold: number; // default 3
  iqrMultiplier: number; // default 1.5
  columnsToCheck: number[] | 'numeric';
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationRule {
  id: string;
  name: string;
  column: number | 'all';
  type: ValidationType;
  params: ValidationParams;
  errorMessage: string;
}

export type ValidationType =
  | 'required'
  | 'unique'
  | 'range'
  | 'regex'
  | 'enum'
  | 'type'
  | 'custom';

export interface ValidationParams {
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: unknown[];
  expectedType?: string;
  customValidator?: (value: unknown) => boolean;
}

export interface ValidationResult {
  rule: ValidationRule;
  passed: boolean;
  violations: ValidationViolation[];
}

export interface ValidationViolation {
  row: number;
  col: number;
  ref: string;
  value: unknown;
  message: string;
}

// =============================================================================
// CLEANING PIPELINE TYPES
// =============================================================================

export type CleaningStepType =
  | 'remove_duplicates'
  | 'fill_missing'
  | 'standardize_format'
  | 'fix_inconsistencies'
  | 'trim_whitespace'
  | 'handle_outliers'
  | 'validate';

export interface CleaningStep {
  id: string;
  type: CleaningStepType;
  name: string;
  config: CleaningStepConfig;
  enabled: boolean;
  order: number;
}

export type CleaningStepConfig =
  | DuplicateConfig
  | MissingValueConfig
  | FormatConfig
  | InconsistencyConfig
  | OutlierConfig
  | { trimAll?: boolean }
  | { rules?: ValidationRule[] };

export interface CleaningPipelineConfig {
  steps: CleaningStep[];
  previewMode: boolean;
  batchSize: number;
  stopOnError: boolean;
}

export interface CleaningResult {
  success: boolean;
  stepResults: StepResult[];
  summary: CleaningSummary;
  duration: number;
}

export interface StepResult {
  stepId: string;
  stepType: CleaningStepType;
  success: boolean;
  changes: CellChange[];
  error?: string;
  duration: number;
}

export interface CellChange {
  row: number;
  col: number;
  ref: string;
  before: unknown;
  after: unknown;
  changeType: ChangeType;
}

export type ChangeType =
  | 'modified'
  | 'deleted'
  | 'filled'
  | 'trimmed'
  | 'standardized';

export interface CleaningSummary {
  totalChanges: number;
  byType: Record<ChangeType, number>;
  rowsAffected: number;
  cellsAffected: number;
  rowsDeleted: number;
}

// =============================================================================
// HISTORY TYPES
// =============================================================================

export interface CleaningSession {
  id: string;
  timestamp: number;
  sheetId: string;
  sheetName: string;
  qualityBefore: number;
  qualityAfter: number;
  changes: CellChange[];
  canUndo: boolean;
}

// =============================================================================
// DATA TYPES
// =============================================================================

export interface CleanerSheetData {
  sheetId: string;
  sheetName: string;
  cells: CleanerCellData[][];
  rowCount: number;
  colCount: number;
  headers: string[];
  columnTypes: FormatType[];
}

export interface CleanerCellData {
  row: number;
  col: number;
  ref: string;
  value: unknown;
  displayValue: string;
  formula?: string;
  isEmpty: boolean;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export type CleanerEvent =
  | { type: 'analysis_started'; timestamp: number }
  | { type: 'analysis_completed'; score: QualityScore }
  | { type: 'cleaning_started'; steps: CleaningStep[] }
  | { type: 'step_completed'; result: StepResult }
  | { type: 'cleaning_completed'; result: CleaningResult }
  | { type: 'cleaning_undone'; sessionId: string }
  | { type: 'error'; message: string };

export type CleanerEventHandler = (event: CleanerEvent) => void;

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_DUPLICATE_CONFIG: DuplicateConfig = {
  checkColumns: 'all',
  fuzzyThreshold: 0.9,
  caseSensitive: false,
  ignoreWhitespace: true,
};

export const DEFAULT_FORMAT_CONFIG: FormatConfig = {
  dateFormat: 'YYYY-MM-DD',
  phoneFormat: '+1 (XXX) XXX-XXXX',
  nameFormat: 'title',
  currencyFormat: '$#,##0.00',
  numberFormat: '#,##0.00',
};

export const DEFAULT_MISSING_CONFIG: MissingValueConfig = {
  strategies: {},
  defaultStrategy: 'mean',
  constantValues: {},
  deleteThreshold: 0.5,
};

export const DEFAULT_INCONSISTENCY_CONFIG: InconsistencyConfig = {
  similarityThreshold: 0.85,
  caseSensitive: false,
  ignoreWhitespace: true,
  customMappings: {},
};

export const DEFAULT_OUTLIER_CONFIG: OutlierConfig = {
  method: 'zscore',
  zScoreThreshold: 3,
  iqrMultiplier: 1.5,
  columnsToCheck: 'numeric',
};

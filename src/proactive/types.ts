// =============================================================================
// PROACTIVE AI — Type Definitions
// =============================================================================

// =============================================================================
// SUGGESTION TYPES
// =============================================================================

export type SuggestionType = 'issue' | 'insight' | 'optimization' | 'pattern';
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
export type SuggestionStatus = 'pending' | 'dismissed' | 'applied' | 'snoozed';

export interface ProactiveSuggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  status: SuggestionStatus;

  // Content
  title: string;
  description: string;
  details?: string;

  // Location
  sheetId: string;
  affectedCells: string[];
  affectedRange?: string;

  // Confidence & impact
  confidence: number;
  impact: SuggestionImpact;

  // Actions
  actions: SuggestionAction[];

  // Timestamps
  detectedAt: number;
  expiresAt?: number;

  // Metadata
  category: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface SuggestionImpact {
  cellCount: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface SuggestionAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: ActionType;
  params?: Record<string, unknown>;
}

export type ActionType =
  | 'apply_fix'
  | 'remove_duplicates'
  | 'fill_missing'
  | 'fix_format'
  | 'optimize_formula'
  | 'create_chart'
  | 'deep_analysis'
  | 'automate'
  | 'learn_more'
  | 'dismiss'
  | 'snooze';

// =============================================================================
// DATA ISSUES
// =============================================================================

export type IssueType =
  | 'duplicates'
  | 'missing_values'
  | 'invalid_format'
  | 'outliers'
  | 'inconsistent_data'
  | 'trailing_spaces'
  | 'mixed_types'
  | 'invalid_dates'
  | 'negative_values'
  | 'empty_rows';

export interface DataIssue extends ProactiveSuggestion {
  type: 'issue';
  issueType: IssueType;
  examples: IssueExample[];
  autoFixAvailable: boolean;
}

export interface IssueExample {
  cellRef: string;
  value: unknown;
  expected?: unknown;
  reason: string;
}

export interface DuplicateInfo {
  rowIndices: number[];
  values: unknown[];
  firstOccurrence: number;
}

export interface OutlierInfo {
  cellRef: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
}

// =============================================================================
// INSIGHTS
// =============================================================================

export type InsightType =
  | 'trend'
  | 'correlation'
  | 'anomaly'
  | 'milestone'
  | 'distribution'
  | 'seasonality'
  | 'comparison'
  | 'summary';

export interface DataInsight extends ProactiveSuggestion {
  type: 'insight';
  insightType: InsightType;
  metric?: InsightMetric;
  visualization?: VisualizationSuggestion;
}

export interface InsightMetric {
  name: string;
  value: number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
  period?: string;
}

export interface VisualizationSuggestion {
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  dataRange: string;
  title: string;
}

export interface TrendInfo {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  r2: number;
  prediction?: number;
}

export interface CorrelationInfo {
  column1: string;
  column2: string;
  coefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  type: 'positive' | 'negative';
}

// =============================================================================
// FORMULA OPTIMIZATIONS
// =============================================================================

export type OptimizationType =
  | 'performance'
  | 'simplification'
  | 'error_prevention'
  | 'best_practice'
  | 'modernization';

export interface FormulaOptimization extends ProactiveSuggestion {
  type: 'optimization';
  optimizationType: OptimizationType;
  originalFormula: string;
  optimizedFormula: string;
  improvement: OptimizationImprovement;
}

export interface OptimizationImprovement {
  type: 'speed' | 'readability' | 'reliability' | 'compatibility';
  factor?: number;
  description: string;
}

export interface FormulaAnalysis {
  formula: string;
  cellRef: string;
  complexity: number;
  volatileFunctions: string[];
  arrayFormula: boolean;
  nestedDepth: number;
  referencedRanges: string[];
}

// =============================================================================
// PATTERNS
// =============================================================================

export type PatternType =
  | 'repetitive_action'
  | 'copy_paste'
  | 'manual_calculation'
  | 'data_entry'
  | 'formatting';

export interface UserPattern extends ProactiveSuggestion {
  type: 'pattern';
  patternType: PatternType;
  frequency: number;
  lastOccurrence: number;
  automationSuggestion: AutomationSuggestion;
}

export interface AutomationSuggestion {
  description: string;
  steps: string[];
  macroCode?: string;
  estimatedTimeSaved: string;
}

export interface ActionRecord {
  type: string;
  timestamp: number;
  cellRef?: string;
  value?: unknown;
  formula?: string;
}

// =============================================================================
// SCAN CONFIGURATION
// =============================================================================

export interface ScanConfig {
  enabled: boolean;
  interval: number;

  // Feature toggles
  scanIssues: boolean;
  scanInsights: boolean;
  scanOptimizations: boolean;
  scanPatterns: boolean;

  // Thresholds
  duplicateThreshold: number;
  outlierZScore: number;
  correlationThreshold: number;
  patternMinFrequency: number;

  // Limits
  maxSuggestions: number;
  maxCellsToScan: number;
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  enabled: true,
  interval: 30000, // 30 seconds

  scanIssues: true,
  scanInsights: true,
  scanOptimizations: true,
  scanPatterns: true,

  duplicateThreshold: 2,
  outlierZScore: 3,
  correlationThreshold: 0.7,
  patternMinFrequency: 3,

  maxSuggestions: 50,
  maxCellsToScan: 10000,
};

// =============================================================================
// SCAN RESULTS
// =============================================================================

export interface ScanResult {
  timestamp: number;
  duration: number;
  cellsScanned: number;

  issues: DataIssue[];
  insights: DataInsight[];
  optimizations: FormulaOptimization[];
  patterns: UserPattern[];

  summary: ScanSummary;
}

export interface ScanSummary {
  totalSuggestions: number;
  byType: Record<SuggestionType, number>;
  byPriority: Record<SuggestionPriority, number>;
  topIssues: string[];
}

// =============================================================================
// SHEET DATA FOR SCANNING
// =============================================================================

export interface SheetData {
  sheetId: string;
  sheetName: string;
  cells: CellData[][];
  rowCount: number;
  colCount: number;
  headers: ColumnInfo[];
}

export interface CellData {
  ref: string;
  row: number;
  col: number;
  value: unknown;
  formula?: string;
  displayValue?: string;
  type: CellType;
  format?: string;
}

export type CellType = 'number' | 'text' | 'date' | 'boolean' | 'error' | 'empty';

export interface ColumnInfo {
  index: number;
  letter: string;
  name: string;
  type: CellType;
  hasFormulas: boolean;
  uniqueValues: number;
  emptyCount: number;
}

// =============================================================================
// EVENTS
// =============================================================================

export type ProactiveEvent =
  | { type: 'scan_started'; timestamp: number }
  | { type: 'scan_completed'; result: ScanResult }
  | { type: 'suggestion_added'; suggestion: ProactiveSuggestion }
  | { type: 'suggestion_dismissed'; suggestionId: string }
  | { type: 'action_executed'; actionId: string; success: boolean }
  | { type: 'settings_changed'; config: Partial<ScanConfig> };

export type ProactiveEventHandler = (event: ProactiveEvent) => void;

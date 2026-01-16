// =============================================================================
// NATURAL LANGUAGE FORMULAS — Type Definitions
// =============================================================================

// =============================================================================
// NATURAL LANGUAGE INPUT
// =============================================================================

export interface NLInput {
  text: string;
  language: 'en' | 'vi' | 'auto';
  context: CellContext;
}

export interface CellContext {
  cellRef: string;
  sheetId: string;
  sheetName: string;
  headers: ColumnHeader[];
  dataRange: DataRange;
  selectedRange?: SelectionRange;
  leftCell?: CellInfo;
  rightCell?: CellInfo;
  aboveCell?: CellInfo;
  belowCell?: CellInfo;
}

export interface ColumnHeader {
  col: number;
  colLetter: string;
  name: string;
  dataType: 'number' | 'text' | 'date' | 'currency' | 'mixed';
  sampleValues: unknown[];
}

export interface DataRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  hasHeaders: boolean;
  rowCount: number;
  colCount: number;
}

export interface SelectionRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface CellInfo {
  ref: string;
  value: unknown;
  formula?: string;
  type: string;
}

// =============================================================================
// INTERPRETATION RESULT
// =============================================================================

export interface InterpretationResult {
  success: boolean;
  formula?: string;
  formulaTokens?: FormulaToken[];
  previewValue?: unknown;
  previewError?: string;
  confidence: number;
  alternatives?: AlternativeFormula[];
  explanation: string;
  steps?: string[];
  warnings?: FormulaWarning[];
  error?: string;
  suggestions?: string[];
}

export interface AlternativeFormula {
  formula: string;
  explanation: string;
  confidence: number;
}

export interface FormulaToken {
  type: 'function' | 'reference' | 'operator' | 'literal' | 'separator';
  value: string;
  start: number;
  end: number;
}

export interface FormulaWarning {
  type: 'performance' | 'accuracy' | 'compatibility' | 'style';
  message: string;
  suggestion?: string;
}

// =============================================================================
// FORMULA EXPLANATION
// =============================================================================

export interface FormulaExplanation {
  formula: string;
  summary: string;
  detailed: string;
  steps: ExplanationStep[];
  diagram?: string;
  functions: FunctionInfo[];
  relatedFormulas?: string[];
}

export interface ExplanationStep {
  order: number;
  part: string;
  explanation: string;
  result?: unknown;
}

export interface FunctionInfo {
  name: string;
  description: string;
  descriptionVi?: string;
  syntax: string;
  examples: string[];
  category: string;
}

// =============================================================================
// FORMULA DEBUGGING
// =============================================================================

export interface DebugResult {
  formula: string;
  hasError: boolean;
  errorType?: FormulaErrorType;
  errorMessage?: string;
  errorLocation?: { start: number; end: number };
  rootCause?: string;
  suggestedFixes: FormulaSuggestion[];
  evaluationSteps?: EvaluationStep[];
}

export type FormulaErrorType =
  | 'SYNTAX'
  | 'REFERENCE'
  | 'VALUE'
  | 'NAME'
  | 'DIV_ZERO'
  | 'NULL'
  | 'NUM'
  | 'NA'
  | 'CIRCULAR'
  | 'UNKNOWN';

export interface FormulaSuggestion {
  fix: string;
  explanation: string;
  confidence: number;
  changeHighlight: { start: number; end: number }[];
}

export interface EvaluationStep {
  order: number;
  expression: string;
  result: unknown;
  error?: string;
}

// =============================================================================
// SUGGESTIONS
// =============================================================================

export interface FormulaSuggestionContext {
  partialInput: string;
  cursorPosition: number;
  context: CellContext;
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  category: 'function' | 'reference' | 'completion' | 'nl';
}

export interface Suggestion {
  type: 'function' | 'reference' | 'template' | 'recent' | 'nl_formula';
  display: string;
  insert: string;
  description?: string;
  icon?: string;
  score: number;
}

// =============================================================================
// FUNCTION LIBRARY
// =============================================================================

export interface ExcelFunction {
  name: string;
  category: FunctionCategory;
  description: string;
  descriptionVi?: string;
  syntax: string;
  parameters: FunctionParameter[];
  returnType: string;
  examples: FunctionExample[];
  nlPatterns: NLPattern[];
  excelVersion: string;
  googleSheets: boolean;
}

export type FunctionCategory =
  | 'math'
  | 'statistical'
  | 'lookup'
  | 'text'
  | 'date'
  | 'logical'
  | 'financial'
  | 'info'
  | 'engineering'
  | 'database';

export interface FunctionParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
}

export interface FunctionExample {
  formula: string;
  description: string;
  result: unknown;
}

export interface NLPattern {
  pattern: string;
  language: 'en' | 'vi' | 'both';
  priority: number;
  transform: string;
}

// =============================================================================
// PARSED NL STRUCTURE
// =============================================================================

export interface ParsedNL {
  intent: string;
  entities: Record<string, unknown>;
  modifiers: Record<string, unknown>;
}

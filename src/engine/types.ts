// Formula Engine Types

// Token types for lexer
export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'CELL_REF'
  | 'RANGE_REF'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'COLON'
  | 'ERROR'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// AST Node types
export type ASTNodeType =
  | 'Number'
  | 'String'
  | 'Boolean'
  | 'Error'
  | 'CellRef'
  | 'RangeRef'
  | 'FunctionCall'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'Array';

export interface ASTNode {
  type: ASTNodeType;
}

export interface NumberNode extends ASTNode {
  type: 'Number';
  value: number;
}

export interface StringNode extends ASTNode {
  type: 'String';
  value: string;
}

export interface BooleanNode extends ASTNode {
  type: 'Boolean';
  value: boolean;
}

export interface ErrorNode extends ASTNode {
  type: 'Error';
  errorType: FormulaErrorType;
}

export interface CellRefNode extends ASTNode {
  type: 'CellRef';
  ref: CellReference;
}

export interface RangeRefNode extends ASTNode {
  type: 'RangeRef';
  start: CellReference;
  end: CellReference;
}

export interface FunctionCallNode extends ASTNode {
  type: 'FunctionCall';
  name: string;
  args: ASTNode[];
}

export interface BinaryOpNode extends ASTNode {
  type: 'BinaryOp';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode extends ASTNode {
  type: 'UnaryOp';
  operator: string;
  operand: ASTNode;
}

export interface ArrayNode extends ASTNode {
  type: 'Array';
  elements: ASTNode[][];
}

// Cell reference
export interface CellReference {
  col: number;
  row: number;
  colAbsolute: boolean;
  rowAbsolute: boolean;
  sheetName?: string;
  isColumnRef?: boolean; // True if this is a column-only reference (e.g., A:A)
  isRowRef?: boolean;    // True if this is a row-only reference (e.g., 1:1)
}

// Range reference
export interface RangeReference {
  start: CellReference;
  end: CellReference;
}

// LAMBDA function runtime representation
export interface LambdaFunction {
  parameters: string[];
  body: FormulaValue | (() => FormulaValue);
  evaluate: (args: FormulaValue[], context: EvalContext) => FormulaValue;
  __isLambda: true;
}

// Formula values
export type FormulaValue = number | string | boolean | null | FormulaError | FormulaValue[][] | LambdaFunction;

// Formula errors
export type FormulaErrorType =
  | '#VALUE!'
  | '#REF!'
  | '#NAME?'
  | '#DIV/0!'
  | '#NULL!'
  | '#N/A'
  | '#NUM!'
  | '#ERROR!';

export class FormulaError extends Error {
  type: FormulaErrorType;

  constructor(type: FormulaErrorType, message?: string) {
    super(message || type);
    this.type = type;
    this.name = 'FormulaError';
  }

  toString(): string {
    return this.type;
  }
}

// Function definition
export interface FunctionDef {
  name: string;
  minArgs: number;
  maxArgs: number;
  fn: (args: FormulaValue[], context: EvalContext) => FormulaValue;
}

// Evaluation context - provides cell data access
export interface EvalContext {
  getCellValue: (ref: CellReference) => FormulaValue;
  getRangeValues: (start: CellReference, end: CellReference) => FormulaValue[][];
  currentCell?: CellReference;
  sheetId: string;
}

// Dependency tracking
export interface CellDependency {
  sheetId: string;
  row: number;
  col: number;
}

export interface FormulaResult {
  value: FormulaValue;
  displayValue: string;
  error?: FormulaErrorType;
  dependencies: CellDependency[];
}

// Helper type for cell key
export type CellKey = `${string}:${number}:${number}`; // sheetId:row:col

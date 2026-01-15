// Formula Engine - Main exports

export { FormulaEngine, formulaEngine } from './FormulaEngine';
export type { CellDataProvider } from './FormulaEngine';
export { parseFormula, numberToColLetter, colLetterToNumber, Parser, Tokenizer, parseCellRef } from './FormulaParser';
export { FormulaEvaluator, formulaEvaluator } from './FormulaEvaluator';

// Types
export type {
  Token,
  TokenType,
  ASTNode,
  ASTNodeType,
  NumberNode,
  StringNode,
  BooleanNode,
  CellRefNode,
  RangeRefNode,
  FunctionCallNode,
  BinaryOpNode,
  UnaryOpNode,
  ArrayNode,
  CellReference,
  RangeReference,
  FormulaValue,
  FormulaErrorType,
  FunctionDef,
  EvalContext,
  CellDependency,
  FormulaResult,
  CellKey,
} from './types';

export { FormulaError } from './types';

// Functions
export {
  getAllFunctionNames,
  hasFunction,
  getFunction,
  functionRegistry,
  mathFunctions,
  textFunctions,
  logicalFunctions,
  dateFunctions,
  statisticalFunctions,
  lookupFunctions,
} from './functions';

// Utils
export {
  flattenValues,
  toNumber,
  toString,
  toBoolean,
  isError,
  isBlank,
  isNumber,
  isText,
  getNumbers,
  compareValues,
  formatNumber,
  parseDate,
  dateToSerial,
} from './functions/utils';

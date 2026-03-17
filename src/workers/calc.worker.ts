/**
 * Calculation Web Worker
 *
 * Offloads heavy spreadsheet calculations to a background thread to keep
 * the main UI thread responsive. Handles:
 * - Formula evaluation
 * - Bulk calculations
 * - Data aggregation
 * - Statistical functions
 */

import { loggers } from '@/utils/logger';

// Message types
export type CalcWorkerMessage =
  | { type: 'EVALUATE_FORMULA'; id: string; formula: string; context: FormulaContext }
  | { type: 'BULK_CALCULATE'; id: string; formulas: BulkFormulaRequest[] }
  | { type: 'AGGREGATE'; id: string; operation: AggregateOperation; values: number[] }
  | { type: 'RECALCULATE_RANGE'; id: string; range: CellRange; cells: CellMap }
  | { type: 'BUILD_DEPENDENCY_GRAPH'; id: string; formulas: FormulaMap }
  | { type: 'CANCEL'; id: string };

export type CalcWorkerResponse =
  | { type: 'RESULT'; id: string; result: CalculationResult }
  | { type: 'BULK_RESULT'; id: string; results: CalculationResult[] }
  | { type: 'AGGREGATE_RESULT'; id: string; result: number }
  | { type: 'RANGE_RESULT'; id: string; results: CellMap }
  | { type: 'DEPENDENCY_GRAPH'; id: string; graph: DependencyGraph }
  | { type: 'ERROR'; id: string; error: string }
  | { type: 'PROGRESS'; id: string; progress: number; total: number }
  | { type: 'CANCELLED'; id: string };

// Types
export interface FormulaContext {
  cells: CellMap;
  namedRanges?: Record<string, CellRange>;
  sheetId?: string;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface CellMap {
  [key: string]: CellValue;
}

export interface FormulaMap {
  [key: string]: string;
}

export type CellValue = string | number | boolean | null;

export interface BulkFormulaRequest {
  cellKey: string;
  formula: string;
}

export interface CalculationResult {
  cellKey: string;
  value: CellValue;
  displayValue: string;
  error?: string;
}

export type AggregateOperation =
  | 'SUM'
  | 'AVERAGE'
  | 'COUNT'
  | 'COUNTA'
  | 'MAX'
  | 'MIN'
  | 'MEDIAN'
  | 'MODE'
  | 'STDEV'
  | 'VAR';

export interface DependencyGraph {
  dependencies: Record<string, string[]>; // cell -> cells it depends on
  dependents: Record<string, string[]>; // cell -> cells that depend on it
  order: string[]; // topological order for calculation
}

// Active tasks for cancellation
const activeTasks = new Map<string, { cancelled: boolean }>();

// Cell key utilities
function getCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function parseColumnLabel(label: string): number {
  let result = 0;
  for (let i = 0; i < label.length; i++) {
    result = result * 26 + (label.charCodeAt(i) - 64);
  }
  return result - 1;
}

// Parse cell reference (e.g., "A1" -> { row: 0, col: 0 })
function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  const col = parseColumnLabel(match[1].toUpperCase());
  const row = parseInt(match[2], 10) - 1;

  return { row, col };
}

// Parse range (e.g., "A1:B5")
function parseRange(range: string): CellRange | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);

  if (!start || !end) return null;

  return {
    startRow: Math.min(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    endCol: Math.max(start.col, end.col),
  };
}

// Get cells in range
function getCellsInRange(range: CellRange, cells: CellMap): CellValue[] {
  const values: CellValue[] = [];

  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      const key = getCellKey(row, col);
      if (key in cells) {
        values.push(cells[key]);
      }
    }
  }

  return values;
}

// Convert values to numbers (filtering non-numeric)
function toNumbers(values: CellValue[]): number[] {
  return values
    .map((v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const num = parseFloat(v);
        return isNaN(num) ? null : num;
      }
      if (typeof v === 'boolean') return v ? 1 : 0;
      return null;
    })
    .filter((v): v is number => v !== null);
}

// Aggregate functions
const aggregateFunctions: Record<AggregateOperation, (values: number[]) => number> = {
  SUM: (values) => values.reduce((a, b) => a + b, 0),
  AVERAGE: (values) => (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0),
  COUNT: (values) => values.length,
  COUNTA: (values) => values.filter((v) => v !== null && v !== undefined).length,
  MAX: (values) => (values.length > 0 ? Math.max(...values) : 0),
  MIN: (values) => (values.length > 0 ? Math.min(...values) : 0),
  MEDIAN: (values) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  MODE: (values) => {
    if (values.length === 0) return 0;
    const counts = new Map<number, number>();
    let maxCount = 0;
    let mode = values[0];
    for (const v of values) {
      const count = (counts.get(v) || 0) + 1;
      counts.set(v, count);
      if (count > maxCount) {
        maxCount = count;
        mode = v;
      }
    }
    return mode;
  },
  STDEV: (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    return Math.sqrt(avgSquareDiff);
  },
  VAR: (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  },
};

// Simple formula evaluator
function evaluateFormula(formula: string, context: FormulaContext): CalculationResult {
  const cellKey = '';

  try {
    if (!formula.startsWith('=')) {
      return { cellKey, value: formula, displayValue: formula };
    }

    const expr = formula.slice(1).trim();

    // Handle function calls
    const funcMatch = expr.match(/^(\w+)\((.+)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const args = funcMatch[2];

      // Range-based functions
      if (funcName in aggregateFunctions) {
        const range = parseRange(args);
        if (range) {
          const values = getCellsInRange(range, context.cells);
          const numbers = toNumbers(values);
          const result = aggregateFunctions[funcName as AggregateOperation](numbers);
          return { cellKey, value: result, displayValue: formatNumber(result) };
        }

        // Multiple arguments (e.g., SUM(1, 2, 3))
        const argValues = args.split(',').map((a) => {
          const trimmed = a.trim();
          const num = parseFloat(trimmed);
          if (!isNaN(num)) return num;

          const cellRef = parseCellRef(trimmed);
          if (cellRef) {
            const val = context.cells[getCellKey(cellRef.row, cellRef.col)];
            return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
          }
          return 0;
        });

        const result = aggregateFunctions[funcName as AggregateOperation](argValues);
        return { cellKey, value: result, displayValue: formatNumber(result) };
      }

      // Other functions
      switch (funcName) {
        case 'IF': {
          const [condition, trueVal, falseVal] = parseIfArgs(args);
          const result = evaluateCondition(condition, context) ? trueVal : falseVal;
          return { cellKey, value: result, displayValue: String(result) };
        }
        case 'CONCAT':
        case 'CONCATENATE': {
          const parts = args.split(',').map((a) => resolveValue(a.trim(), context));
          const result = parts.join('');
          return { cellKey, value: result, displayValue: result };
        }
        case 'LEN': {
          const val = resolveValue(args.trim(), context);
          const result = String(val).length;
          return { cellKey, value: result, displayValue: String(result) };
        }
        case 'UPPER': {
          const val = resolveValue(args.trim(), context);
          const result = String(val).toUpperCase();
          return { cellKey, value: result, displayValue: result };
        }
        case 'LOWER': {
          const val = resolveValue(args.trim(), context);
          const result = String(val).toLowerCase();
          return { cellKey, value: result, displayValue: result };
        }
        case 'ROUND': {
          const [numArg, digitsArg] = args.split(',');
          const num = Number(resolveValue(numArg.trim(), context));
          const digits = Number(resolveValue(digitsArg?.trim() || '0', context));
          const result = Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
          return { cellKey, value: result, displayValue: formatNumber(result) };
        }
        case 'ABS': {
          const num = Number(resolveValue(args.trim(), context));
          const result = Math.abs(num);
          return { cellKey, value: result, displayValue: formatNumber(result) };
        }
        case 'SQRT': {
          const num = Number(resolveValue(args.trim(), context));
          const result = Math.sqrt(num);
          return { cellKey, value: result, displayValue: formatNumber(result) };
        }
        case 'POWER':
        case 'POW': {
          const [base, exp] = args.split(',').map((a) => Number(resolveValue(a.trim(), context)));
          const result = Math.pow(base, exp);
          return { cellKey, value: result, displayValue: formatNumber(result) };
        }
        case 'NOW': {
          const now = new Date();
          return { cellKey, value: now.getTime(), displayValue: now.toLocaleString() };
        }
        case 'TODAY': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return { cellKey, value: today.getTime(), displayValue: today.toLocaleDateString() };
        }
        default:
          return { cellKey, value: null, displayValue: '#NAME?', error: `Unknown function: ${funcName}` };
      }
    }

    // Simple arithmetic expression
    const result = evaluateArithmetic(expr, context);
    return { cellKey, value: result, displayValue: formatNumber(result) };
  } catch (error) {
    return {
      cellKey,
      value: null,
      displayValue: '#ERROR!',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Resolve a value (cell reference or literal)
function resolveValue(expr: string, context: FormulaContext): CellValue {
  // Check if it's a cell reference
  const cellRef = parseCellRef(expr);
  if (cellRef) {
    const key = getCellKey(cellRef.row, cellRef.col);
    return context.cells[key] ?? null;
  }

  // Check if it's a number
  const num = parseFloat(expr);
  if (!isNaN(num)) return num;

  // Check if it's a quoted string
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }

  // Check for boolean
  if (expr.toUpperCase() === 'TRUE') return true;
  if (expr.toUpperCase() === 'FALSE') return false;

  return expr;
}

// Parse IF function arguments (handling nested commas)
function parseIfArgs(args: string): [string, CellValue, CellValue] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of args) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());

  return [parts[0] || 'FALSE', resolveValue(parts[1] || '', { cells: {} }), resolveValue(parts[2] || '', { cells: {} })];
}

// Evaluate a condition
function evaluateCondition(condition: string, context: FormulaContext): boolean {
  // Handle comparison operators
  const operators = ['>=', '<=', '<>', '!=', '>', '<', '='];
  for (const op of operators) {
    const idx = condition.indexOf(op);
    if (idx !== -1) {
      const left = resolveValue(condition.slice(0, idx).trim(), context);
      const right = resolveValue(condition.slice(idx + op.length).trim(), context);

      switch (op) {
        case '>=':
          return Number(left) >= Number(right);
        case '<=':
          return Number(left) <= Number(right);
        case '<>':
        case '!=':
          return left !== right;
        case '>':
          return Number(left) > Number(right);
        case '<':
          return Number(left) < Number(right);
        case '=':
          return left === right;
      }
    }
  }

  // Boolean value
  const val = resolveValue(condition, context);
  return Boolean(val);
}

// Simple arithmetic evaluator (handles +, -, *, /, cell references)
function evaluateArithmetic(expr: string, context: FormulaContext): number {
  // Replace cell references with their values
  const processed = expr.replace(/[A-Z]+\d+/gi, (match) => {
    const cellRef = parseCellRef(match);
    if (!cellRef) return '0';
    const key = getCellKey(cellRef.row, cellRef.col);
    const val = context.cells[key];
    return typeof val === 'number' ? String(val) : String(parseFloat(String(val)) || 0);
  });

  // Safe evaluation using Function constructor
  try {
    // Only allow numbers and basic operators
    const sanitized = processed.replace(/[^0-9+\-*/.() ]/g, '');
    const fn = new Function(`return ${sanitized}`);
    const result = fn();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

// Format number for display
function formatNumber(num: number): string {
  if (!isFinite(num)) return '#NUM!';

  // Use locale formatting for reasonable numbers
  if (Math.abs(num) < 1e15 && Math.abs(num) >= 0.000001) {
    return num.toLocaleString(undefined, { maximumFractionDigits: 10 });
  }

  // Scientific notation for very large/small numbers
  return num.toExponential(6);
}

// Build dependency graph
function buildDependencyGraph(formulas: FormulaMap): DependencyGraph {
  const dependencies: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};

  // Find all cell references in each formula
  for (const [cellKey, formula] of Object.entries(formulas)) {
    if (!formula.startsWith('=')) continue;

    const refs: string[] = [];
    const refMatches = formula.matchAll(/[A-Z]+\d+/gi);

    for (const match of refMatches) {
      const cellRef = parseCellRef(match[0]);
      if (cellRef) {
        refs.push(getCellKey(cellRef.row, cellRef.col));
      }
    }

    // Also find ranges
    const rangeMatches = formula.matchAll(/([A-Z]+\d+):([A-Z]+\d+)/gi);
    for (const match of rangeMatches) {
      const range = parseRange(match[0]);
      if (range) {
        for (let row = range.startRow; row <= range.endRow; row++) {
          for (let col = range.startCol; col <= range.endCol; col++) {
            refs.push(getCellKey(row, col));
          }
        }
      }
    }

    dependencies[cellKey] = [...new Set(refs)];

    // Build reverse mapping (dependents)
    for (const ref of refs) {
      if (!dependents[ref]) {
        dependents[ref] = [];
      }
      dependents[ref].push(cellKey);
    }
  }

  // Topological sort for calculation order
  const order = topologicalSort(dependencies);

  return { dependencies, dependents, order };
}

// Topological sort using Kahn's algorithm
function topologicalSort(dependencies: Record<string, string[]>): string[] {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  // Initialize
  for (const [cell, deps] of Object.entries(dependencies)) {
    if (!inDegree.has(cell)) inDegree.set(cell, 0);
    if (!graph.has(cell)) graph.set(cell, []);

    for (const dep of deps) {
      if (!inDegree.has(dep)) inDegree.set(dep, 0);
      if (!graph.has(dep)) graph.set(dep, []);
    }
  }

  // Count in-degrees
  for (const [cell, deps] of Object.entries(dependencies)) {
    for (const dep of deps) {
      const current = graph.get(dep) || [];
      current.push(cell);
      graph.set(dep, current);
    }
    inDegree.set(cell, deps.length);
  }

  // Process nodes with no dependencies first
  const queue: string[] = [];
  for (const [cell, degree] of inDegree) {
    if (degree === 0) queue.push(cell);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    result.push(cell);

    for (const dependent of graph.get(cell) || []) {
      const newDegree = (inDegree.get(dependent) || 0) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }

  // Check for cycles
  if (result.length !== inDegree.size) {
    loggers.worker.warn('Circular reference detected in formulas');
  }

  return result;
}

// Message handler
self.onmessage = (event: MessageEvent<CalcWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'EVALUATE_FORMULA': {
      const task = { cancelled: false };
      activeTasks.set(message.id, task);

      try {
        const result = evaluateFormula(message.formula, message.context);
        result.cellKey = message.id;

        if (task.cancelled) {
          self.postMessage({ type: 'CANCELLED', id: message.id });
        } else {
          self.postMessage({ type: 'RESULT', id: message.id, result });
        }
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          id: message.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        activeTasks.delete(message.id);
      }
      break;
    }

    case 'BULK_CALCULATE': {
      const task = { cancelled: false };
      activeTasks.set(message.id, task);

      try {
        const results: CalculationResult[] = [];
        const total = message.formulas.length;

        for (let i = 0; i < total; i++) {
          if (task.cancelled) {
            self.postMessage({ type: 'CANCELLED', id: message.id });
            return;
          }

          const { cellKey, formula } = message.formulas[i];
          const result = evaluateFormula(formula, { cells: {} });
          result.cellKey = cellKey;
          results.push(result);

          // Report progress every 100 cells
          if (i % 100 === 0) {
            self.postMessage({ type: 'PROGRESS', id: message.id, progress: i, total });
          }
        }

        self.postMessage({ type: 'BULK_RESULT', id: message.id, results });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          id: message.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        activeTasks.delete(message.id);
      }
      break;
    }

    case 'AGGREGATE': {
      try {
        const fn = aggregateFunctions[message.operation];
        if (!fn) {
          throw new Error(`Unknown aggregate operation: ${message.operation}`);
        }

        const result = fn(message.values);
        self.postMessage({ type: 'AGGREGATE_RESULT', id: message.id, result });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          id: message.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      break;
    }

    case 'BUILD_DEPENDENCY_GRAPH': {
      try {
        const graph = buildDependencyGraph(message.formulas);
        self.postMessage({ type: 'DEPENDENCY_GRAPH', id: message.id, graph });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          id: message.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      break;
    }

    case 'CANCEL': {
      const task = activeTasks.get(message.id);
      if (task) {
        task.cancelled = true;
      }
      break;
    }
  }
};

// Export types for use in main thread
export {};

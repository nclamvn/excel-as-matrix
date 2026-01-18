import {
  FormulaValue,
  FormulaError,
  FormulaResult,
  EvalContext,
  CellDependency,
  CellReference,
  CellKey,
} from './types';
import { parseFormula, numberToColLetter } from './FormulaParser';
import { FormulaEvaluator } from './FormulaEvaluator';
import { toString } from './functions/utils';
import { LRUCache } from '../utils/LRUCache';

// Type for cell data provider
export interface CellDataProvider {
  getCellValue(sheetId: string, row: number, col: number): FormulaValue;
  getCellFormula(sheetId: string, row: number, col: number): string | undefined;
}

// Main Formula Engine
export class FormulaEngine {
  private evaluator = new FormulaEvaluator();
  // LRU cache with 50,000 cell limit to prevent memory bloat in large spreadsheets
  private cache = new LRUCache<CellKey, FormulaResult>(50000);
  private dependencyGraph = new Map<CellKey, Set<CellKey>>();
  private reverseDependencyGraph = new Map<CellKey, Set<CellKey>>();

  // Calculate a formula
  calculate(
    formula: string,
    sheetId: string,
    row: number,
    col: number,
    dataProvider: CellDataProvider
  ): FormulaResult {
    // Check if formula starts with =
    if (!formula.startsWith('=')) {
      // Not a formula, return as-is
      return {
        value: formula,
        displayValue: formula,
        dependencies: [],
      };
    }

    const cellKey = this.getCellKey(sheetId, row, col);

    // Create evaluation context
    const context: EvalContext = {
      getCellValue: (ref: CellReference) => {
        const refSheetId = ref.sheetName || sheetId;
        const value = dataProvider.getCellValue(refSheetId, ref.row, ref.col);

        // If the referenced cell has a formula, we need its computed value
        const refFormula = dataProvider.getCellFormula(refSheetId, ref.row, ref.col);
        if (refFormula && refFormula.startsWith('=')) {
          const refKey = this.getCellKey(refSheetId, ref.row, ref.col);
          const cached = this.cache.get(refKey);
          if (cached) {
            return cached.value;
          }
          // Calculate referenced cell
          const result = this.calculate(refFormula, refSheetId, ref.row, ref.col, dataProvider);
          return result.value;
        }

        return value;
      },
      getRangeValues: (start: CellReference, end: CellReference) => {
        const refSheetId = start.sheetName || sheetId;
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        const values: FormulaValue[][] = [];

        for (let r = minRow; r <= maxRow; r++) {
          const rowValues: FormulaValue[] = [];
          for (let c = minCol; c <= maxCol; c++) {
            const refFormula = dataProvider.getCellFormula(refSheetId, r, c);
            if (refFormula && refFormula.startsWith('=')) {
              const result = this.calculate(refFormula, refSheetId, r, c, dataProvider);
              rowValues.push(result.value);
            } else {
              rowValues.push(dataProvider.getCellValue(refSheetId, r, c));
            }
          }
          values.push(rowValues);
        }

        return values;
      },
      currentCell: { row, col, colAbsolute: false, rowAbsolute: false },
      sheetId,
    };

    try {
      // Parse formula
      const ast = parseFormula(formula);

      // Evaluate
      const value = this.evaluator.evaluate(ast, context);
      const dependencies = this.evaluator.getDependencies();

      // Update dependency graph
      this.updateDependencies(cellKey, dependencies);

      // Create result
      const result: FormulaResult = {
        value,
        displayValue: this.formatDisplayValue(value),
        error: value instanceof FormulaError ? value.type : undefined,
        dependencies,
      };

      // Cache result
      this.cache.set(cellKey, result);

      return result;
    } catch (err) {
      const error = err instanceof FormulaError ? err : new FormulaError('#ERROR!', String(err));
      const result: FormulaResult = {
        value: error,
        displayValue: error.type,
        error: error.type,
        dependencies: [],
      };
      this.cache.set(cellKey, result);
      return result;
    }
  }

  // Get cells that need recalculation when a cell changes
  getDependentCells(sheetId: string, row: number, col: number): CellKey[] {
    const cellKey = this.getCellKey(sheetId, row, col);
    const dependents = this.reverseDependencyGraph.get(cellKey);

    if (!dependents) {
      return [];
    }

    // Topological sort to get correct recalculation order
    const visited = new Set<CellKey>();
    const result: CellKey[] = [];

    const visit = (key: CellKey) => {
      if (visited.has(key)) return;
      visited.add(key);

      const deps = this.reverseDependencyGraph.get(key);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }

      result.push(key);
    };

    for (const dep of dependents) {
      visit(dep);
    }

    return result;
  }

  // Invalidate cache for a cell and its dependents
  invalidateCell(sheetId: string, row: number, col: number): CellKey[] {
    const cellKey = this.getCellKey(sheetId, row, col);
    this.cache.delete(cellKey);

    const dependents = this.getDependentCells(sheetId, row, col);
    for (const dep of dependents) {
      this.cache.delete(dep);
    }

    return dependents;
  }

  // Clear all caches
  clearCache(): void {
    this.cache.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
  }

  // Get cached result
  getCachedResult(sheetId: string, row: number, col: number): FormulaResult | undefined {
    return this.cache.get(this.getCellKey(sheetId, row, col));
  }

  // Helper to create cell key
  private getCellKey(sheetId: string, row: number, col: number): CellKey {
    return `${sheetId}:${row}:${col}`;
  }

  // Update dependency graph
  private updateDependencies(cellKey: CellKey, dependencies: CellDependency[]): void {
    // Remove old dependencies
    const oldDeps = this.dependencyGraph.get(cellKey);
    if (oldDeps) {
      for (const depKey of oldDeps) {
        const reverseDeps = this.reverseDependencyGraph.get(depKey);
        if (reverseDeps) {
          reverseDeps.delete(cellKey);
        }
      }
    }

    // Add new dependencies
    const newDeps = new Set<CellKey>();
    for (const dep of dependencies) {
      const depKey = this.getCellKey(dep.sheetId, dep.row, dep.col);
      newDeps.add(depKey);

      // Update reverse graph
      let reverseDeps = this.reverseDependencyGraph.get(depKey);
      if (!reverseDeps) {
        reverseDeps = new Set();
        this.reverseDependencyGraph.set(depKey, reverseDeps);
      }
      reverseDeps.add(cellKey);
    }

    this.dependencyGraph.set(cellKey, newDeps);
  }

  // Format value for display
  private formatDisplayValue(value: FormulaValue): string {
    if (value instanceof FormulaError) {
      return value.type;
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (typeof value === 'number') {
      // Format number for display
      if (Number.isInteger(value)) {
        return String(value);
      }
      // Limit decimal places for display
      const str = value.toPrecision(15);
      return parseFloat(str).toString();
    }

    if (Array.isArray(value)) {
      // Display first value of array for single cell
      if (Array.isArray(value[0])) {
        return toString(value[0][0]);
      }
      return toString(value[0]);
    }

    return toString(value);
  }

  // Get A1-style reference for a cell
  getCellReference(row: number, col: number): string {
    return `${numberToColLetter(col)}${row + 1}`;
  }

  // Parse cell key - public method
  parseCellKey(key: CellKey): { sheetId: string; row: number; col: number } {
    const parts = key.split(':');
    return {
      sheetId: parts[0],
      row: parseInt(parts[1], 10),
      col: parseInt(parts[2], 10),
    };
  }

  // Get cache statistics for performance monitoring
  getCacheStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const formulaEngine = new FormulaEngine();

// Export helper functions
export { parseFormula, numberToColLetter, colLetterToNumber } from './FormulaParser';
export { getAllFunctionNames, hasFunction } from './functions';

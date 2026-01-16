// =============================================================================
// FORMULA OPTIMIZER — Suggest formula improvements
// =============================================================================

import type {
  SheetData,
  FormulaOptimization,
  OptimizationType,
  OptimizationImprovement,
  FormulaAnalysis,
  ScanConfig,
} from './types';

/**
 * Analyzes and suggests optimizations for formulas
 */
export class FormulaOptimizer {
  // Common optimization patterns
  private readonly optimizations: OptimizationRule[] = [
    // VLOOKUP → INDEX/MATCH
    {
      pattern: /VLOOKUP\s*\(\s*([^,]+),\s*([^,]+),\s*(\d+),\s*(FALSE|0)\s*\)/gi,
      name: 'VLOOKUP to INDEX/MATCH',
      type: 'performance',
      transform: (_match, lookupValue, tableArray, colIndex) => {
        const colLetter = this.getColumnFromRange(tableArray, parseInt(colIndex) - 1);
        const lookupCol = this.getColumnFromRange(tableArray, 0);
        return `INDEX(${colLetter},MATCH(${lookupValue},${lookupCol},0))`;
      },
      improvement: {
        type: 'speed',
        factor: 10,
        description: 'INDEX/MATCH is 10x faster than VLOOKUP on large datasets',
      },
    },
    // Nested IF → IFS
    {
      pattern: /IF\s*\([^,]+,[^,]+,\s*IF\s*\([^,]+,[^,]+,\s*IF/gi,
      name: 'Nested IF to IFS',
      type: 'simplification',
      transform: null, // Complex transformation
      improvement: {
        type: 'readability',
        description: 'IFS function is more readable than nested IFs',
      },
    },
    // SUM(IF()) → SUMIF
    {
      pattern: /SUM\s*\(\s*IF\s*\(\s*([^=<>]+)\s*=\s*([^,]+),\s*([^,]+),\s*0\s*\)\s*\)/gi,
      name: 'SUM(IF()) to SUMIF',
      type: 'simplification',
      transform: (_match, range, criteria, sumRange) =>
        `SUMIF(${range.trim()},${criteria.trim()},${sumRange.trim()})`,
      improvement: {
        type: 'readability',
        description: 'SUMIF is simpler and more efficient',
      },
    },
    // COUNT(IF()) → COUNTIF
    {
      pattern: /COUNT\s*\(\s*IF\s*\(\s*([^=<>]+)\s*=\s*([^,]+),\s*1\s*,\s*0\s*\)\s*\)/gi,
      name: 'COUNT(IF()) to COUNTIF',
      type: 'simplification',
      transform: (_match, range, criteria) =>
        `COUNTIF(${range.trim()},${criteria.trim()})`,
      improvement: {
        type: 'readability',
        description: 'COUNTIF is simpler and more efficient',
      },
    },
    // Volatile functions warning
    {
      pattern: /\b(NOW|TODAY|RAND|RANDBETWEEN|INDIRECT|OFFSET)\s*\(/gi,
      name: 'Volatile function detected',
      type: 'performance',
      transform: null,
      improvement: {
        type: 'speed',
        description: 'Volatile functions recalculate on every change, slowing down the workbook',
      },
    },
    // Entire column references
    {
      pattern: /\b([A-Z]+):([A-Z]+)\b(?!\d)/g,
      name: 'Entire column reference',
      type: 'performance',
      transform: null,
      improvement: {
        type: 'speed',
        description: 'Using entire column references (A:A) is slower than specific ranges',
      },
    },
    // CONCATENATE → CONCAT or &
    {
      pattern: /CONCATENATE\s*\(/gi,
      name: 'CONCATENATE to CONCAT',
      type: 'modernization',
      transform: (match) => match.replace(/CONCATENATE/i, 'CONCAT'),
      improvement: {
        type: 'compatibility',
        description: 'CONCAT is the modern replacement for CONCATENATE',
      },
    },
    // Error handling suggestion
    {
      pattern: /\b(VLOOKUP|INDEX|MATCH)\s*\([^)]+\)(?!\s*\))/gi,
      name: 'Add error handling',
      type: 'error_prevention',
      transform: null,
      improvement: {
        type: 'reliability',
        description: 'Wrap lookup functions in IFERROR for better error handling',
      },
    },
  ];

  constructor(_config: ScanConfig) {
    // Config reserved for future use
  }

  /**
   * Analyze all formulas and suggest optimizations
   */
  async optimize(data: SheetData): Promise<FormulaOptimization[]> {
    const optimizations: FormulaOptimization[] = [];

    // Find all cells with formulas
    for (let row = 0; row < data.rowCount; row++) {
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (cell?.formula) {
          const cellOptimizations = this.analyzeFormula(cell.formula, cell.ref, data);
          optimizations.push(...cellOptimizations);
        }
      }
    }

    // Deduplicate similar optimizations
    return this.deduplicateOptimizations(optimizations, data);
  }

  /**
   * Analyze a single formula
   */
  private analyzeFormula(
    formula: string,
    cellRef: string,
    data: SheetData
  ): FormulaOptimization[] {
    const results: FormulaOptimization[] = [];
    const analysis = this.getFormulaAnalysis(formula, cellRef);

    for (const rule of this.optimizations) {
      const match = formula.match(rule.pattern);
      if (match) {
        let optimizedFormula = formula;
        if (rule.transform) {
          try {
            optimizedFormula = formula.replace(rule.pattern, rule.transform);
          } catch {
            continue;
          }
        }

        results.push({
          id: `opt-${cellRef}-${rule.name.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'optimization',
          optimizationType: rule.type,
          priority: rule.type === 'performance' ? 'high' : 'medium',
          status: 'pending',

          title: rule.name,
          description: rule.improvement.description,

          sheetId: data.sheetId,
          affectedCells: [cellRef],

          confidence: 0.9,
          impact: {
            cellCount: 1,
            severity: rule.type === 'performance' ? 'high' : 'medium',
            description: rule.improvement.description,
          },

          actions: rule.transform ? [
            {
              id: 'apply-opt',
              label: 'Apply fix',
              type: 'primary',
              action: 'optimize_formula',
              params: { formula: optimizedFormula, cellRef },
            },
            {
              id: 'learn-more',
              label: 'Learn more',
              type: 'secondary',
              action: 'learn_more',
            },
          ] : [
            {
              id: 'learn-more',
              label: 'Learn more',
              type: 'primary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'formula_optimization',
          tags: [rule.type, rule.name.toLowerCase()],

          originalFormula: formula,
          optimizedFormula: rule.transform ? optimizedFormula : formula,
          improvement: rule.improvement,
        });
      }
    }

    // Check formula complexity
    if (analysis.nestedDepth > 3) {
      results.push({
        id: `opt-${cellRef}-complexity`,
        type: 'optimization',
        optimizationType: 'simplification',
        priority: 'medium',
        status: 'pending',

        title: 'Complex formula detected',
        description: `Formula has ${analysis.nestedDepth} levels of nesting. Consider breaking it into helper columns.`,

        sheetId: data.sheetId,
        affectedCells: [cellRef],

        confidence: 0.7,
        impact: {
          cellCount: 1,
          severity: 'medium',
          description: 'Complex formulas are harder to maintain and debug',
        },

        actions: [
          {
            id: 'simplify',
            label: 'View suggestions',
            type: 'primary',
            action: 'learn_more',
          },
        ],

        detectedAt: Date.now(),
        category: 'formula_optimization',
        tags: ['complexity', 'maintainability'],

        originalFormula: formula,
        optimizedFormula: formula,
        improvement: {
          type: 'readability',
          description: 'Breaking complex formulas into steps improves maintainability',
        },
      });
    }

    return results;
  }

  /**
   * Get detailed analysis of a formula
   */
  private getFormulaAnalysis(formula: string, cellRef: string): FormulaAnalysis {
    const volatileFunctions = ['NOW', 'TODAY', 'RAND', 'RANDBETWEEN', 'INDIRECT', 'OFFSET'];
    const foundVolatile: string[] = [];

    for (const func of volatileFunctions) {
      if (new RegExp(`\\b${func}\\s*\\(`, 'i').test(formula)) {
        foundVolatile.push(func);
      }
    }

    // Count nesting depth
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of formula) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }

    // Find referenced ranges
    const rangePattern = /\$?[A-Z]+\$?\d*:\$?[A-Z]+\$?\d*/gi;
    const ranges = formula.match(rangePattern) || [];

    return {
      formula,
      cellRef,
      complexity: maxDepth + foundVolatile.length * 2,
      volatileFunctions: foundVolatile,
      arrayFormula: formula.includes('{') || formula.startsWith('=LET('),
      nestedDepth: maxDepth,
      referencedRanges: ranges,
    };
  }

  /**
   * Deduplicate similar optimizations across cells
   */
  private deduplicateOptimizations(
    optimizations: FormulaOptimization[],
    _data: SheetData
  ): FormulaOptimization[] {
    const grouped = new Map<string, FormulaOptimization[]>();

    for (const opt of optimizations) {
      const key = `${opt.optimizationType}-${opt.title}`;
      const existing = grouped.get(key) || [];
      existing.push(opt);
      grouped.set(key, existing);
    }

    const results: FormulaOptimization[] = [];

    for (const [key, group] of grouped) {
      if (group.length === 1) {
        results.push(group[0]);
      } else {
        // Merge into single optimization
        const merged = { ...group[0] };
        merged.id = `opt-${key}-merged`;
        merged.affectedCells = group.flatMap(o => o.affectedCells);
        merged.title = `${group[0].title} (${group.length} cells)`;
        merged.impact = {
          ...merged.impact,
          cellCount: group.length,
        };
        results.push(merged);
      }
    }

    return results;
  }

  /**
   * Get column letter from range at specific index
   */
  private getColumnFromRange(range: string, index: number): string {
    // Simple extraction - in production would need more robust parsing
    const match = range.match(/([A-Z]+)/gi);
    if (match && match.length > index) {
      return `${match[index]}:${match[index]}`;
    }
    return range;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface OptimizationRule {
  pattern: RegExp;
  name: string;
  type: OptimizationType;
  transform: ((...args: string[]) => string) | null;
  improvement: OptimizationImprovement;
}

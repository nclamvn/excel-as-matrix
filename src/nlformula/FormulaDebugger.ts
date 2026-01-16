// =============================================================================
// FORMULA DEBUGGER — Debug and fix formula errors
// =============================================================================

import type {
  DebugResult,
  FormulaErrorType,
  FormulaSuggestion,
  EvaluationStep,
  CellContext,
} from './types';

/**
 * Debug and fix formula errors
 */
export class FormulaDebugger {
  /**
   * Debug a formula
   */
  async debug(
    formula: string,
    error: string,
    context?: CellContext
  ): Promise<DebugResult> {
    const cleanFormula = formula.startsWith('=') ? formula.slice(1) : formula;

    // Detect error type
    const errorType = this.detectErrorType(error);

    // Find root cause
    const rootCause = this.findRootCause(cleanFormula, errorType, context);

    // Generate fixes
    const suggestedFixes = this.generateFixes(
      cleanFormula,
      errorType,
      rootCause,
      context
    );

    // Evaluation steps (if possible)
    const evaluationSteps = this.tryEvaluate(cleanFormula);

    return {
      formula,
      hasError: true,
      errorType,
      errorMessage: error,
      rootCause,
      suggestedFixes,
      evaluationSteps,
    };
  }

  /**
   * Detect error type from error message
   */
  private detectErrorType(error: string): FormulaErrorType {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('#ref')) return 'REFERENCE';
    if (errorLower.includes('#value')) return 'VALUE';
    if (errorLower.includes('#name')) return 'NAME';
    if (errorLower.includes('#div/0') || errorLower.includes('divide by zero'))
      return 'DIV_ZERO';
    if (errorLower.includes('#null')) return 'NULL';
    if (errorLower.includes('#num')) return 'NUM';
    if (errorLower.includes('#n/a')) return 'NA';
    if (errorLower.includes('circular')) return 'CIRCULAR';
    if (errorLower.includes('syntax') || errorLower.includes('parse'))
      return 'SYNTAX';

    return 'UNKNOWN';
  }

  /**
   * Find root cause of error
   */
  private findRootCause(
    formula: string,
    errorType: FormulaErrorType,
    _context?: CellContext
  ): string {
    switch (errorType) {
      case 'SYNTAX':
        return this.findSyntaxError(formula);

      case 'REFERENCE':
        return this.findReferenceError(formula);

      case 'VALUE':
        return 'A value used in the formula is the wrong type (e.g., text instead of number)';

      case 'NAME':
        return this.findNameError(formula);

      case 'DIV_ZERO':
        return 'The formula is trying to divide by zero or an empty cell';

      case 'NA':
        return 'A lookup function could not find the requested value';

      case 'CIRCULAR':
        return 'The formula refers to itself, creating an infinite loop';

      default:
        return 'Unable to determine the exact cause';
    }
  }

  /**
   * Find syntax errors
   */
  private findSyntaxError(formula: string): string {
    // Check parentheses balance
    let depth = 0;
    for (let i = 0; i < formula.length; i++) {
      if (formula[i] === '(') depth++;
      if (formula[i] === ')') depth--;
      if (depth < 0) {
        return `Extra closing parenthesis at position ${i + 1}`;
      }
    }
    if (depth > 0) {
      return `Missing ${depth} closing parenthesis`;
    }

    // Check for double operators
    if (/[+\-*\/]{2,}/.test(formula)) {
      return 'Double operators detected (e.g., ++ or */)';
    }

    // Check for empty function call
    if (/\(\s*\)/.test(formula)) {
      return 'Empty function arguments';
    }

    // Check for missing comma
    if (/[A-Z]\d+[A-Z]\d+/i.test(formula)) {
      return 'Missing separator between cell references';
    }

    return 'Syntax error in formula structure';
  }

  /**
   * Find reference errors
   */
  private findReferenceError(formula: string): string {
    // Extract references
    const refs = formula.match(/\$?[A-Z]+\$?\d+/gi) || [];

    for (const ref of refs) {
      const col = ref.match(/[A-Z]+/i)?.[0];
      const row = parseInt(ref.match(/\d+/)?.[0] || '0');

      // Check if row/col is reasonable
      if (row > 1048576) {
        return `Row number ${row} exceeds Excel limit (1,048,576)`;
      }

      if (col && col.length > 3) {
        return `Column ${col} is invalid`;
      }
    }

    return 'A cell reference points to a deleted or invalid location';
  }

  /**
   * Find name errors
   */
  private findNameError(formula: string): string {
    // Extract function names
    const funcs = formula.match(/[A-Z_][A-Z0-9_]*(?=\s*\()/gi) || [];

    const knownFunctions = [
      'SUM',
      'AVERAGE',
      'COUNT',
      'COUNTA',
      'MAX',
      'MIN',
      'IF',
      'IFERROR',
      'VLOOKUP',
      'HLOOKUP',
      'INDEX',
      'MATCH',
      'SUMIF',
      'COUNTIF',
      'AVERAGEIF',
      'SUMIFS',
      'COUNTIFS',
      'LEFT',
      'RIGHT',
      'MID',
      'LEN',
      'TRIM',
      'UPPER',
      'LOWER',
      'DATE',
      'YEAR',
      'MONTH',
      'DAY',
      'TODAY',
      'NOW',
      'ROUND',
      'ROUNDUP',
      'ROUNDDOWN',
      'ABS',
      'SQRT',
      'AND',
      'OR',
      'NOT',
      'TRUE',
      'FALSE',
      'CONCATENATE',
      'CONCAT',
      'TEXTJOIN',
    ];

    for (const func of funcs) {
      if (!knownFunctions.includes(func.toUpperCase())) {
        return `Unknown function: ${func}. Did you mean ${this.suggestFunction(func)}?`;
      }
    }

    // Check for unquoted text
    if (/\b[a-z]{3,}\b/i.test(formula.replace(/"[^"]*"/g, ''))) {
      return 'Unquoted text found. Text strings should be in double quotes.';
    }

    return 'An unknown function or name is used';
  }

  /**
   * Generate fix suggestions
   */
  private generateFixes(
    formula: string,
    errorType: FormulaErrorType,
    _rootCause: string,
    _context?: CellContext
  ): FormulaSuggestion[] {
    const fixes: FormulaSuggestion[] = [];

    switch (errorType) {
      case 'SYNTAX':
        fixes.push(...this.fixSyntaxErrors(formula));
        break;

      case 'DIV_ZERO':
        fixes.push({
          fix: `=IFERROR(${formula},0)`,
          explanation: 'Wrap in IFERROR to return 0 instead of error',
          confidence: 0.9,
          changeHighlight: [],
        });
        fixes.push({
          fix: `=IF(${this.findDivisor(formula)}=0,0,${formula})`,
          explanation: 'Check if divisor is zero before dividing',
          confidence: 0.8,
          changeHighlight: [],
        });
        break;

      case 'NA':
        fixes.push({
          fix: `=IFERROR(${formula},"Not Found")`,
          explanation: 'Return "Not Found" if lookup fails',
          confidence: 0.9,
          changeHighlight: [],
        });
        fixes.push({
          fix: `=IFNA(${formula},"")`,
          explanation: 'Return empty string if lookup fails',
          confidence: 0.85,
          changeHighlight: [],
        });
        break;

      case 'NAME':
        const correctedFormula = this.correctFunctionNames(formula);
        if (correctedFormula !== formula) {
          fixes.push({
            fix: '=' + correctedFormula,
            explanation: 'Corrected function name',
            confidence: 0.9,
            changeHighlight: [],
          });
        }
        break;

      case 'VALUE':
        fixes.push({
          fix: `=IFERROR(${formula},0)`,
          explanation: 'Handle value errors gracefully',
          confidence: 0.7,
          changeHighlight: [],
        });
        break;
    }

    return fixes;
  }

  /**
   * Fix syntax errors
   */
  private fixSyntaxErrors(formula: string): FormulaSuggestion[] {
    const fixes: FormulaSuggestion[] = [];

    // Fix unbalanced parentheses
    let depth = 0;

    for (const char of formula) {
      if (char === '(') depth++;
      if (char === ')') depth--;
    }

    if (depth > 0) {
      const fixed = formula + ')'.repeat(depth);
      fixes.push({
        fix: '=' + fixed,
        explanation: `Added ${depth} missing closing parenthesis`,
        confidence: 0.85,
        changeHighlight: [],
      });
    } else if (depth < 0) {
      // Remove extra closing parens
      let toRemove = Math.abs(depth);
      const fixed = formula
        .split('')
        .reverse()
        .filter((c) => {
          if (c === ')' && toRemove > 0) {
            toRemove--;
            return false;
          }
          return true;
        })
        .reverse()
        .join('');

      fixes.push({
        fix: '=' + fixed,
        explanation: 'Removed extra closing parenthesis',
        confidence: 0.85,
        changeHighlight: [],
      });
    }

    // Fix double operators
    const doubleOpFixed = formula.replace(/([+\-*\/])\1+/g, '$1');
    if (doubleOpFixed !== formula) {
      fixes.push({
        fix: '=' + doubleOpFixed,
        explanation: 'Removed duplicate operators',
        confidence: 0.8,
        changeHighlight: [],
      });
    }

    return fixes;
  }

  /**
   * Suggest correct function name
   */
  private suggestFunction(input: string): string {
    const functions = [
      'SUM',
      'AVERAGE',
      'COUNT',
      'MAX',
      'MIN',
      'IF',
      'VLOOKUP',
      'SUMIF',
      'COUNTIF',
      'INDEX',
      'MATCH',
      'IFERROR',
    ];

    const inputLower = input.toLowerCase();

    // Find closest match using simple similarity
    let bestMatch = functions[0];
    let bestScore = 0;

    for (const func of functions) {
      const funcLower = func.toLowerCase();
      let score = 0;

      // Check prefix match
      if (funcLower.startsWith(inputLower.slice(0, 2))) {
        score += 2;
      }

      // Check character overlap
      for (const char of inputLower) {
        if (funcLower.includes(char)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = func;
      }
    }

    return bestMatch;
  }

  /**
   * Correct function names in formula
   */
  private correctFunctionNames(formula: string): string {
    const funcs = formula.match(/[A-Z_][A-Z0-9_]*(?=\s*\()/gi) || [];
    let corrected = formula;

    for (const func of funcs) {
      const suggestion = this.suggestFunction(func);
      if (suggestion.toLowerCase() !== func.toLowerCase()) {
        corrected = corrected.replace(
          new RegExp(func + '\\s*\\(', 'gi'),
          suggestion + '('
        );
      }
    }

    return corrected;
  }

  /**
   * Find divisor in division formula
   */
  private findDivisor(formula: string): string {
    const divMatch = formula.match(/\/\s*([A-Z]+\d+|\d+)/i);
    return divMatch?.[1] || 'B1';
  }

  /**
   * Try to evaluate formula step by step
   */
  private tryEvaluate(_formula: string): EvaluationStep[] {
    // This would require actual formula evaluation
    // For now, return empty array
    return [];
  }
}

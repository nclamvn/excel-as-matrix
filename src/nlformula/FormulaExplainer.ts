// =============================================================================
// FORMULA EXPLAINER — Explain formulas in natural language
// =============================================================================

import { FunctionLibrary } from './FunctionLibrary';
import type {
  FormulaExplanation,
  ExplanationStep,
  FunctionInfo,
  CellContext,
} from './types';

interface Token {
  type: 'function' | 'reference' | 'operator' | 'literal' | 'separator';
  value: string;
  start: number;
}

/**
 * Explain formulas in natural language
 */
export class FormulaExplainer {
  private functionLib: FunctionLibrary;

  constructor() {
    this.functionLib = new FunctionLibrary();
  }

  /**
   * Explain a formula
   */
  async explain(
    formula: string,
    context?: CellContext,
    language: 'en' | 'vi' = 'en'
  ): Promise<FormulaExplanation> {
    // Remove leading =
    const cleanFormula = formula.startsWith('=') ? formula.slice(1) : formula;

    // Tokenize
    const tokens = this.tokenize(cleanFormula);

    // Build explanation
    const steps = this.buildSteps(tokens, context, language);
    const functions = this.extractFunctions(tokens);
    const summary = this.buildSummary(tokens, context, language);
    const detailed = this.buildDetailed(steps);

    return {
      formula,
      summary,
      detailed,
      steps,
      functions,
    };
  }

  /**
   * Build step-by-step explanation
   */
  private buildSteps(
    tokens: Token[],
    context?: CellContext,
    language: string = 'en'
  ): ExplanationStep[] {
    const steps: ExplanationStep[] = [];
    let order = 1;

    // Find outermost function
    const mainFunc = tokens.find((t) => t.type === 'function');
    if (!mainFunc) {
      // Simple expression
      steps.push({
        order: 1,
        part: tokens.map((t) => t.value).join(''),
        explanation: this.explainSimpleExpression(tokens, language),
      });
      return steps;
    }

    // Explain from inside out
    const funcInfo = this.functionLib.getFunction(mainFunc.value);

    // Step 1: Identify function
    steps.push({
      order: order++,
      part: mainFunc.value,
      explanation:
        language === 'vi'
          ? `Sử dụng hàm ${mainFunc.value}: ${funcInfo?.descriptionVi || funcInfo?.description || ''}`
          : `Using ${mainFunc.value} function: ${funcInfo?.description || ''}`,
    });

    // Step 2: Explain arguments
    const args = this.extractArguments(tokens);
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      steps.push({
        order: order++,
        part: arg,
        explanation: this.explainArgument(arg, context, language),
      });
    }

    // Step 3: Result
    steps.push({
      order: order++,
      part: 'Result',
      explanation:
        language === 'vi'
          ? `Trả về ${funcInfo?.category || 'giá trị'}`
          : `Returns ${funcInfo?.category || 'a value'}`,
    });

    return steps;
  }

  /**
   * Build one-line summary
   */
  private buildSummary(
    tokens: Token[],
    context?: CellContext,
    language: string = 'en'
  ): string {
    const mainFunc = tokens.find((t) => t.type === 'function');
    const args = this.extractArguments(tokens);

    const templates: Record<string, Record<string, string>> = {
      SUM: {
        en: `Add up all values in ${this.describeRange(args[0], context)}`,
        vi: `Tính tổng tất cả giá trị trong ${this.describeRange(args[0], context)}`,
      },
      AVERAGE: {
        en: `Calculate the average of ${this.describeRange(args[0], context)}`,
        vi: `Tính trung bình của ${this.describeRange(args[0], context)}`,
      },
      COUNT: {
        en: `Count numbers in ${this.describeRange(args[0], context)}`,
        vi: `Đếm số trong ${this.describeRange(args[0], context)}`,
      },
      COUNTA: {
        en: `Count non-empty cells in ${this.describeRange(args[0], context)}`,
        vi: `Đếm ô không trống trong ${this.describeRange(args[0], context)}`,
      },
      MAX: {
        en: `Find the largest value in ${this.describeRange(args[0], context)}`,
        vi: `Tìm giá trị lớn nhất trong ${this.describeRange(args[0], context)}`,
      },
      MIN: {
        en: `Find the smallest value in ${this.describeRange(args[0], context)}`,
        vi: `Tìm giá trị nhỏ nhất trong ${this.describeRange(args[0], context)}`,
      },
      IF: {
        en: `If ${args[0]} is true, return ${args[1]}, otherwise return ${args[2] || 'FALSE'}`,
        vi: `Nếu ${args[0]} đúng, trả về ${args[1]}, ngược lại trả về ${args[2] || 'FALSE'}`,
      },
      VLOOKUP: {
        en: `Look up ${args[0]} in ${this.describeRange(args[1], context)} and return column ${args[2]}`,
        vi: `Tìm ${args[0]} trong ${this.describeRange(args[1], context)} và trả về cột ${args[2]}`,
      },
      SUMIF: {
        en: `Sum ${this.describeRange(args[2], context)} where ${this.describeRange(args[0], context)} equals ${args[1]}`,
        vi: `Tính tổng ${this.describeRange(args[2], context)} khi ${this.describeRange(args[0], context)} bằng ${args[1]}`,
      },
      COUNTIF: {
        en: `Count cells in ${this.describeRange(args[0], context)} that equal ${args[1]}`,
        vi: `Đếm ô trong ${this.describeRange(args[0], context)} bằng ${args[1]}`,
      },
    };

    if (mainFunc && templates[mainFunc.value.toUpperCase()]) {
      return (
        templates[mainFunc.value.toUpperCase()][language] ||
        templates[mainFunc.value.toUpperCase()]['en']
      );
    }

    return language === 'vi'
      ? `Công thức tính toán với ${mainFunc?.value || 'biểu thức'}`
      : `Formula calculating with ${mainFunc?.value || 'expression'}`;
  }

  /**
   * Build detailed explanation
   */
  private buildDetailed(steps: ExplanationStep[]): string {
    return steps.map((s) => `${s.order}. ${s.explanation}`).join('\n');
  }

  /**
   * Tokenize formula
   */
  private tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
      // Skip whitespace
      if (/\s/.test(formula[i])) {
        i++;
        continue;
      }

      // Function name
      const funcMatch = formula.slice(i).match(/^([A-Z_][A-Z0-9_]*)\s*\(/i);
      if (funcMatch) {
        tokens.push({
          type: 'function',
          value: funcMatch[1].toUpperCase(),
          start: i,
        });
        i += funcMatch[1].length;
        continue;
      }

      // Cell reference or range
      const refMatch = formula
        .slice(i)
        .match(/^(\$?[A-Z]+\$?\d*(?::\$?[A-Z]+\$?\d*)?)/i);
      if (refMatch) {
        tokens.push({ type: 'reference', value: refMatch[1], start: i });
        i += refMatch[1].length;
        continue;
      }

      // Number
      const numMatch = formula.slice(i).match(/^(-?\d+\.?\d*)/);
      if (numMatch) {
        tokens.push({ type: 'literal', value: numMatch[1], start: i });
        i += numMatch[1].length;
        continue;
      }

      // String literal
      if (formula[i] === '"') {
        const endQuote = formula.indexOf('"', i + 1);
        const str = formula.slice(i, endQuote + 1);
        tokens.push({ type: 'literal', value: str, start: i });
        i = endQuote + 1;
        continue;
      }

      // Operator
      if (/[+\-*\/^=<>]/.test(formula[i])) {
        tokens.push({ type: 'operator', value: formula[i], start: i });
        i++;
        continue;
      }

      // Separator
      if (/[(),]/.test(formula[i])) {
        tokens.push({ type: 'separator', value: formula[i], start: i });
        i++;
        continue;
      }

      // Unknown - skip
      i++;
    }

    return tokens;
  }

  /**
   * Extract function arguments
   */
  private extractArguments(tokens: Token[]): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';
    let inArgs = false;

    for (const token of tokens) {
      if (token.value === '(') {
        if (depth === 0) {
          inArgs = true;
        } else {
          current += token.value;
        }
        depth++;
      } else if (token.value === ')') {
        depth--;
        if (depth === 0) {
          if (current) args.push(current.trim());
          break;
        } else {
          current += token.value;
        }
      } else if (token.value === ',' && depth === 1) {
        args.push(current.trim());
        current = '';
      } else if (inArgs) {
        current += token.value;
      }
    }

    return args;
  }

  /**
   * Extract functions from tokens
   */
  private extractFunctions(tokens: Token[]): FunctionInfo[] {
    const funcNames = tokens
      .filter((t) => t.type === 'function')
      .map((t) => t.value);

    return funcNames
      .map((name) => this.functionLib.getFunction(name))
      .filter((f): f is FunctionInfo => f !== null);
  }

  /**
   * Describe range
   */
  private describeRange(range: string, context?: CellContext): string {
    if (!range) return 'selected cells';

    // Check if it's a column reference
    if (/^[A-Z]:[A-Z]$/i.test(range)) {
      const col = range[0].toUpperCase();
      const header = context?.headers.find((h) => h.colLetter === col);
      if (header) {
        return `"${header.name}" column`;
      }
      return `column ${col}`;
    }

    return range;
  }

  /**
   * Explain simple expression
   */
  private explainSimpleExpression(tokens: Token[], language: string): string {
    const hasOperator = tokens.some((t) => t.type === 'operator');

    if (hasOperator) {
      const ops = tokens
        .filter((t) => t.type === 'operator')
        .map((t) => t.value);
      if (ops.includes('+'))
        return language === 'vi' ? 'Phép cộng' : 'Addition';
      if (ops.includes('-'))
        return language === 'vi' ? 'Phép trừ' : 'Subtraction';
      if (ops.includes('*'))
        return language === 'vi' ? 'Phép nhân' : 'Multiplication';
      if (ops.includes('/'))
        return language === 'vi' ? 'Phép chia' : 'Division';
    }

    return language === 'vi' ? 'Biểu thức đơn giản' : 'Simple expression';
  }

  /**
   * Explain argument
   */
  private explainArgument(
    arg: string,
    context?: CellContext,
    _language: string = 'en'
  ): string {
    const described = this.describeRange(arg, context);
    return described;
  }
}

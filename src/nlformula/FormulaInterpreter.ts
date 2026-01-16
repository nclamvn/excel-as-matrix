// =============================================================================
// FORMULA INTERPRETER — Natural language to Excel formula
// =============================================================================

import { NLParser } from './NLParser';
import type {
  NLInput,
  InterpretationResult,
  AlternativeFormula,
  CellContext,
  FormulaWarning,
  ParsedNL,
} from './types';

/**
 * Interpret natural language into Excel formulas
 */
export class FormulaInterpreter {
  private parser: NLParser;

  constructor() {
    this.parser = new NLParser();
  }

  /**
   * Main interpretation method
   */
  async interpret(input: NLInput): Promise<InterpretationResult> {
    const { text, context } = input;
    const language =
      input.language === 'auto' ? this.detectLanguage(text) : input.language;

    // Parse natural language
    const parsed = this.parser.parse(text, language);

    if (!parsed.intent) {
      return {
        success: false,
        confidence: 0,
        explanation: '',
        error: 'Could not understand the request',
        suggestions: this.getSuggestions(text, context),
      };
    }

    // Map intent to formula
    return this.mapToFormula(parsed, context);
  }

  /**
   * Map parsed intent to formula
   */
  private mapToFormula(
    parsed: ParsedNL,
    context: CellContext
  ): InterpretationResult {
    const { intent, entities, modifiers } = parsed;

    let formula: string;
    let explanation: string;
    let confidence: number;
    const warnings: FormulaWarning[] = [];
    const alternatives: AlternativeFormula[] = [];

    switch (intent) {
      // =========================================================================
      // AGGREGATION INTENTS
      // =========================================================================
      case 'sum':
        formula = this.buildAggregation('SUM', entities, context);
        explanation = `Sum of ${this.describeRange(entities, context)}`;
        confidence = 0.9;
        break;

      case 'average':
        formula = this.buildAggregation('AVERAGE', entities, context);
        explanation = `Average of ${this.describeRange(entities, context)}`;
        confidence = 0.9;
        break;

      case 'count':
        if (modifiers.countType === 'numbers') {
          formula = this.buildAggregation('COUNT', entities, context);
        } else {
          formula = this.buildAggregation('COUNTA', entities, context);
        }
        explanation = `Count of ${this.describeRange(entities, context)}`;
        confidence = 0.85;
        break;

      case 'max':
        formula = this.buildAggregation('MAX', entities, context);
        explanation = `Maximum value in ${this.describeRange(entities, context)}`;
        confidence = 0.9;
        break;

      case 'min':
        formula = this.buildAggregation('MIN', entities, context);
        explanation = `Minimum value in ${this.describeRange(entities, context)}`;
        confidence = 0.9;
        break;

      // =========================================================================
      // CONDITIONAL AGGREGATION
      // =========================================================================
      case 'sumif':
        formula = this.buildConditionalAggregation(
          'SUMIF',
          entities,
          modifiers,
          context
        );
        explanation = `Sum of ${entities.sumRange} where ${entities.criteriaRange} equals ${entities.criteria}`;
        confidence = 0.85;
        break;

      case 'countif':
        formula = this.buildConditionalAggregation(
          'COUNTIF',
          entities,
          modifiers,
          context
        );
        explanation = `Count where ${entities.criteriaRange} equals ${entities.criteria}`;
        confidence = 0.85;
        break;

      case 'averageif':
        formula = this.buildConditionalAggregation(
          'AVERAGEIF',
          entities,
          modifiers,
          context
        );
        explanation = `Average of ${entities.sumRange} where ${entities.criteriaRange} equals ${entities.criteria}`;
        confidence = 0.85;
        break;

      // =========================================================================
      // LOOKUP INTENTS
      // =========================================================================
      case 'lookup':
      case 'find':
        formula = this.buildLookup(entities, modifiers, context);
        explanation = `Look up ${entities.lookupValue} and return ${entities.returnColumn}`;
        confidence = 0.8;

        // Add INDEX/MATCH alternative
        alternatives.push({
          formula: this.buildIndexMatch(entities, context),
          explanation: 'Using INDEX/MATCH (more flexible)',
          confidence: 0.75,
        });
        break;

      // =========================================================================
      // LOGICAL INTENTS
      // =========================================================================
      case 'if':
        formula = this.buildIf(entities, context);
        explanation = `If ${entities.condition}, then ${entities.trueValue}, else ${entities.falseValue || 'FALSE'}`;
        confidence = 0.85;
        break;

      // =========================================================================
      // TEXT INTENTS
      // =========================================================================
      case 'concat':
        formula = this.buildConcat(entities, context);
        explanation = `Combine ${(entities.ranges as string[]).join(' and ')}`;
        confidence = 0.85;
        break;

      // =========================================================================
      // DATE INTENTS
      // =========================================================================
      case 'today':
        formula = '=TODAY()';
        explanation = 'Current date';
        confidence = 1.0;
        break;

      case 'now':
        formula = '=NOW()';
        explanation = 'Current date and time';
        confidence = 1.0;
        break;

      case 'datediff':
        formula = this.buildDateDiff(entities, modifiers, context);
        explanation = `${modifiers.unit} between ${entities.startDate} and ${entities.endDate}`;
        confidence = 0.85;
        break;

      // =========================================================================
      // MATH INTENTS
      // =========================================================================
      case 'percentage':
        formula = this.buildPercentage(entities, context);
        explanation = `Percentage: ${entities.part} of ${entities.total}`;
        confidence = 0.85;
        break;

      case 'round':
        formula = this.buildRound(entities, modifiers, context);
        explanation = `Round ${entities.value} to ${modifiers.decimals || 0} decimal places`;
        confidence = 0.9;
        break;

      default:
        return {
          success: false,
          confidence: 0,
          explanation: '',
          error: `Unknown intent: ${intent}`,
          suggestions: this.getIntentSuggestions(),
        };
    }

    // Add = prefix if not present
    if (!formula.startsWith('=')) {
      formula = '=' + formula;
    }

    // Validate formula
    const validation = this.validateFormula(formula);
    if (!validation.valid) {
      warnings.push({
        type: 'accuracy',
        message: validation.message,
        suggestion: validation.suggestion,
      });
    }

    return {
      success: true,
      formula,
      confidence,
      explanation,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ===========================================================================
  // FORMULA BUILDERS
  // ===========================================================================

  private buildAggregation(
    func: string,
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const range = this.resolveRange(
      (entities.range || entities.column) as string,
      context
    );
    return `${func}(${range})`;
  }

  private buildConditionalAggregation(
    func: string,
    entities: Record<string, unknown>,
    modifiers: Record<string, unknown>,
    context: CellContext
  ): string {
    const criteriaRange = this.resolveRange(
      (entities.criteriaRange || entities.criteriaColumn) as string,
      context
    );
    const criteria = this.formatCriteria(
      entities.criteria as string,
      modifiers.operator as string
    );

    if (func === 'COUNTIF') {
      return `${func}(${criteriaRange},${criteria})`;
    }

    const sumRange = this.resolveRange(
      (entities.sumRange || entities.sumColumn) as string,
      context
    );
    return `${func}(${criteriaRange},${criteria},${sumRange})`;
  }

  private buildLookup(
    entities: Record<string, unknown>,
    modifiers: Record<string, unknown>,
    context: CellContext
  ): string {
    const lookupValue = this.resolveValue(entities.lookupValue as string, context);
    const tableRange = this.resolveRange(entities.tableRange as string, context);
    const colIndex = this.resolveColumnIndex(
      entities.returnColumn as string,
      context
    );
    const exactMatch = modifiers.exactMatch !== false ? 'FALSE' : 'TRUE';

    return `VLOOKUP(${lookupValue},${tableRange},${colIndex},${exactMatch})`;
  }

  private buildIndexMatch(
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const lookupValue = this.resolveValue(entities.lookupValue as string, context);
    const returnRange = this.resolveRange(entities.returnColumn as string, context);
    const lookupRange = this.resolveRange(entities.lookupColumn as string, context);

    return `=INDEX(${returnRange},MATCH(${lookupValue},${lookupRange},0))`;
  }

  private buildIf(
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const condition = this.buildCondition(entities.condition, context);
    const trueValue = this.resolveValue(entities.trueValue as string, context);
    const falseValue = this.resolveValue(
      (entities.falseValue as string) || '""',
      context
    );

    return `IF(${condition},${trueValue},${falseValue})`;
  }

  private buildConcat(
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const ranges = entities.ranges as string[];
    const parts = ranges.map((r: string) => this.resolveValue(r, context));
    const separator = entities.separator
      ? `"${entities.separator}"`
      : '';

    if (separator) {
      return `TEXTJOIN(${separator},TRUE,${parts.join(',')})`;
    }
    return `CONCAT(${parts.join(',')})`;
  }

  private buildDateDiff(
    entities: Record<string, unknown>,
    modifiers: Record<string, unknown>,
    context: CellContext
  ): string {
    const startDate = this.resolveValue(entities.startDate as string, context);
    const endDate = this.resolveValue(entities.endDate as string, context);

    switch (modifiers.unit) {
      case 'days':
        return `DATEDIF(${startDate},${endDate},"D")`;
      case 'months':
        return `DATEDIF(${startDate},${endDate},"M")`;
      case 'years':
        return `DATEDIF(${startDate},${endDate},"Y")`;
      default:
        return `${endDate}-${startDate}`;
    }
  }

  private buildPercentage(
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const part = this.resolveValue(entities.part as string, context);
    const total = this.resolveValue(entities.total as string, context);

    return `${part}/${total}*100`;
  }

  private buildRound(
    entities: Record<string, unknown>,
    modifiers: Record<string, unknown>,
    context: CellContext
  ): string {
    const value = this.resolveValue(entities.value as string, context);
    const decimals = (modifiers.decimals as number) || 0;

    return `ROUND(${value},${decimals})`;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private resolveRange(input: string, context: CellContext): string {
    if (!input) return 'A:A';

    // If already a range (e.g., "A:A", "B2:B100")
    if (/^[A-Z]+\d*:[A-Z]+\d*$/i.test(input)) {
      return input;
    }

    // If column letter
    if (/^[A-Z]$/i.test(input)) {
      return `${input}:${input}`;
    }

    // If column name, find matching header
    const header = context.headers.find(
      (h) => h.name.toLowerCase() === input.toLowerCase()
    );

    if (header) {
      return `${header.colLetter}:${header.colLetter}`;
    }

    // Return as-is
    return input;
  }

  private resolveValue(input: string, context: CellContext): string {
    if (!input) return '""';

    // If cell reference
    if (/^[A-Z]+\d+$/i.test(input)) {
      return input;
    }

    // If number
    if (!isNaN(Number(input))) {
      return input;
    }

    // If column name, assume current row
    const header = context.headers.find(
      (h) => h.name.toLowerCase() === input.toLowerCase()
    );

    if (header) {
      const row = context.cellRef.match(/\d+/)?.[0] || '1';
      return `${header.colLetter}${row}`;
    }

    // String literal
    if (!input.startsWith('"')) {
      return `"${input}"`;
    }

    return input;
  }

  private resolveColumnIndex(input: string, context: CellContext): number {
    // If number
    if (!isNaN(Number(input))) {
      return Number(input);
    }

    // If column name
    const header = context.headers.find(
      (h) => h.name.toLowerCase() === input.toLowerCase()
    );

    if (header) {
      return header.col + 1; // 1-indexed for VLOOKUP
    }

    return 2; // Default
  }

  private formatCriteria(value: string, operator?: string): string {
    const ops: Record<string, string> = {
      equals: '',
      greater: '>',
      less: '<',
      greaterEqual: '>=',
      lessEqual: '<=',
      notEqual: '<>',
    };

    const op = operator ? ops[operator] || '' : '';

    // Numeric
    if (!isNaN(Number(value))) {
      return op ? `"${op}${value}"` : value;
    }

    // String
    return `"${op}${value}"`;
  }

  private buildCondition(condition: unknown, context: CellContext): string {
    if (typeof condition === 'string') {
      return condition;
    }

    const cond = condition as {
      left: string;
      operator: string;
      right: string;
    };
    const leftVal = this.resolveValue(cond.left, context);
    const rightVal = this.resolveValue(cond.right, context);

    const ops: Record<string, string> = {
      equals: '=',
      greater: '>',
      less: '<',
      greaterEqual: '>=',
      lessEqual: '<=',
      notEqual: '<>',
      contains: '',
    };

    if (cond.operator === 'contains') {
      return `ISNUMBER(SEARCH(${rightVal},${leftVal}))`;
    }

    return `${leftVal}${ops[cond.operator] || '='}${rightVal}`;
  }

  private validateFormula(
    formula: string
  ): { valid: boolean; message: string; suggestion?: string } {
    // Check balanced parentheses
    let depth = 0;
    for (const char of formula) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        return {
          valid: false,
          message: 'Unbalanced parentheses',
          suggestion: 'Check for missing opening parenthesis',
        };
      }
    }

    if (depth !== 0) {
      return {
        valid: false,
        message: 'Unbalanced parentheses',
        suggestion: 'Check for missing closing parenthesis',
      };
    }

    return { valid: true, message: 'OK' };
  }

  private describeRange(
    entities: Record<string, unknown>,
    context: CellContext
  ): string {
    const range = (entities.range || entities.column) as string;
    const header = context.headers.find(
      (h) =>
        h.colLetter === range || h.name.toLowerCase() === range?.toLowerCase()
    );

    return header ? `"${header.name}" column` : range || 'selected range';
  }

  private detectLanguage(text: string): 'en' | 'vi' {
    const viPatterns =
      /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    return viPatterns.test(text) ? 'vi' : 'en';
  }

  private getSuggestions(_text: string, context: CellContext): string[] {
    return [
      `Try: "sum of ${context.headers[0]?.name || 'column A'}"`,
      `Try: "average of ${context.headers[1]?.name || 'column B'}"`,
      `Try: "count where ${context.headers[0]?.name || 'column A'} equals X"`,
    ];
  }

  private getIntentSuggestions(): string[] {
    return [
      'sum, average, count, max, min',
      'sumif, countif, averageif',
      'lookup, find, vlookup',
      'if, iferror',
      'concat, combine',
    ];
  }
}

// =============================================================================
// NL FORMULA ENGINE — Main orchestrator
// =============================================================================

import { FormulaInterpreter } from './FormulaInterpreter';
import { FormulaExplainer } from './FormulaExplainer';
import { FormulaDebugger } from './FormulaDebugger';
import { FormulaSuggester } from './FormulaSuggester';
import { ContextAnalyzer } from './ContextAnalyzer';
import type {
  NLInput,
  InterpretationResult,
  FormulaExplanation,
  DebugResult,
  SuggestionResult,
  CellContext,
} from './types';

/**
 * Natural Language Formula Engine
 * Converts natural language to Excel formulas and vice versa
 */
export class NLFormulaEngine {
  private interpreter: FormulaInterpreter;
  private explainer: FormulaExplainer;
  private debugger: FormulaDebugger;
  private suggester: FormulaSuggester;
  private contextAnalyzer: ContextAnalyzer;

  // Cache for performance
  private interpretCache: Map<string, InterpretationResult> = new Map();
  private explainCache: Map<string, FormulaExplanation> = new Map();

  constructor() {
    this.interpreter = new FormulaInterpreter();
    this.explainer = new FormulaExplainer();
    this.debugger = new FormulaDebugger();
    this.suggester = new FormulaSuggester();
    this.contextAnalyzer = new ContextAnalyzer();
  }

  // ===========================================================================
  // MAIN API
  // ===========================================================================

  /**
   * Interpret natural language to formula
   * Main entry point for NL → Formula conversion
   */
  async interpret(input: NLInput): Promise<InterpretationResult> {
    const cacheKey = this.getCacheKey(input);

    if (this.interpretCache.has(cacheKey)) {
      return this.interpretCache.get(cacheKey)!;
    }

    try {
      // Analyze context
      const enrichedContext = await this.contextAnalyzer.analyze(input.context);

      // Interpret
      const result = await this.interpreter.interpret({
        ...input,
        context: enrichedContext,
      });

      // Cache successful results
      if (result.success) {
        this.interpretCache.set(cacheKey, result);

        // Add to recent formulas
        if (result.formula) {
          this.suggester.addRecent(result.formula);
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        explanation: '',
        error: `Interpretation failed: ${error}`,
        suggestions: [
          'Try being more specific',
          'Use column names from your data',
          'Example: "sum of Sales column"',
        ],
      };
    }
  }

  /**
   * Explain an existing formula
   */
  async explain(
    formula: string,
    context?: CellContext,
    language: 'en' | 'vi' = 'en'
  ): Promise<FormulaExplanation> {
    const cacheKey = `explain:${formula}:${language}`;

    if (this.explainCache.has(cacheKey)) {
      return this.explainCache.get(cacheKey)!;
    }

    const result = await this.explainer.explain(formula, context, language);
    this.explainCache.set(cacheKey, result);

    return result;
  }

  /**
   * Debug a formula with errors
   */
  async debug(
    formula: string,
    error: string,
    context?: CellContext
  ): Promise<DebugResult> {
    return this.debugger.debug(formula, error, context);
  }

  /**
   * Get suggestions while typing
   */
  async suggest(
    partialInput: string,
    cursorPosition: number,
    context: CellContext
  ): Promise<SuggestionResult> {
    return this.suggester.suggest({
      partialInput,
      cursorPosition,
      context,
    });
  }

  /**
   * Quick check if input looks like natural language
   */
  isNaturalLanguage(input: string): boolean {
    // Formulas start with =
    if (input.startsWith('=')) return false;

    // Contains spaces and common words
    const hasSpaces = input.includes(' ');
    const hasNLWords =
      /\b(sum|average|count|if|total|calculate|find|get|show|của|tổng|trung bình|đếm|nếu|tìm)\b/i.test(
        input
      );

    return hasSpaces || hasNLWords;
  }

  /**
   * Detect input language
   */
  detectLanguage(input: string): 'en' | 'vi' {
    const viPatterns =
      /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    const viWords =
      /\b(của|và|hoặc|nếu|thì|là|trong|với|từ|đến|tổng|đếm|trung bình)\b/i;

    if (viPatterns.test(input) || viWords.test(input)) {
      return 'vi';
    }
    return 'en';
  }

  /**
   * Process input - auto-detect if NL or formula
   */
  async processInput(
    input: string,
    context: CellContext
  ): Promise<InterpretationResult | null> {
    if (!input || input.trim().length === 0) {
      return null;
    }

    // If it's a formula, don't process
    if (input.startsWith('=')) {
      return null;
    }

    // If it looks like natural language, interpret it
    if (this.isNaturalLanguage(input)) {
      return this.interpret({
        text: input,
        language: 'auto',
        context,
      });
    }

    return null;
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private getCacheKey(input: NLInput): string {
    return `${input.text}:${input.context.sheetId}:${input.context.cellRef}`;
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.interpretCache.clear();
    this.explainCache.clear();
  }

  /**
   * Get recent formulas
   */
  getRecentFormulas(): string[] {
    return this.suggester.getRecent();
  }

  /**
   * Clear recent formulas
   */
  clearRecentFormulas(): void {
    this.suggester.clearRecent();
  }
}

// Export singleton
export const nlFormulaEngine = new NLFormulaEngine();

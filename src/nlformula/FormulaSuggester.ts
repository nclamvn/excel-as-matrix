// =============================================================================
// FORMULA SUGGESTER — Auto-suggestions while typing
// =============================================================================

import { FunctionLibrary } from './FunctionLibrary';
import type {
  FormulaSuggestionContext,
  SuggestionResult,
  Suggestion,
  CellContext,
} from './types';

/**
 * Provide formula suggestions while typing
 */
export class FormulaSuggester {
  private functionLib: FunctionLibrary;
  private recentFormulas: string[] = [];
  private maxRecent = 10;

  constructor() {
    this.functionLib = new FunctionLibrary();
  }

  /**
   * Get suggestions based on partial input
   */
  async suggest(ctx: FormulaSuggestionContext): Promise<SuggestionResult> {
    const { partialInput, cursorPosition, context } = ctx;

    // Determine what type of suggestion to provide
    if (!partialInput || partialInput.length === 0) {
      // Show recent formulas and common templates
      return this.getInitialSuggestions(context);
    }

    if (partialInput.startsWith('=')) {
      // Formula mode
      const formulaPart = partialInput.slice(1);
      return this.getFormulaSuggestions(formulaPart, cursorPosition - 1, context);
    }

    // Natural language mode
    return this.getNLSuggestions(partialInput, context);
  }

  /**
   * Get initial suggestions (no input)
   */
  private getInitialSuggestions(context: CellContext): SuggestionResult {
    const suggestions: Suggestion[] = [];

    // Add recent formulas
    for (const formula of this.recentFormulas.slice(0, 3)) {
      suggestions.push({
        type: 'recent',
        display: formula,
        insert: formula,
        description: 'Recent formula',
        score: 100,
      });
    }

    // Add common templates based on context
    const numericCols = context.headers.filter(
      (h) => h.dataType === 'number' || h.dataType === 'currency'
    );

    if (numericCols.length > 0) {
      const col = numericCols[0];
      suggestions.push({
        type: 'template',
        display: `Sum of ${col.name}`,
        insert: `=SUM(${col.colLetter}:${col.colLetter})`,
        description: `Sum all values in ${col.name}`,
        score: 90,
      });
      suggestions.push({
        type: 'template',
        display: `Average of ${col.name}`,
        insert: `=AVERAGE(${col.colLetter}:${col.colLetter})`,
        description: `Average of ${col.name}`,
        score: 85,
      });
    }

    // Add common functions
    suggestions.push({
      type: 'function',
      display: 'SUM',
      insert: '=SUM(',
      description: 'Add numbers',
      icon: 'fx',
      score: 80,
    });
    suggestions.push({
      type: 'function',
      display: 'AVERAGE',
      insert: '=AVERAGE(',
      description: 'Calculate average',
      icon: 'fx',
      score: 75,
    });
    suggestions.push({
      type: 'function',
      display: 'IF',
      insert: '=IF(',
      description: 'Conditional logic',
      icon: 'fx',
      score: 70,
    });

    return {
      suggestions: suggestions.sort((a, b) => b.score - a.score),
      category: 'completion',
    };
  }

  /**
   * Get formula suggestions (after =)
   */
  private getFormulaSuggestions(
    formula: string,
    cursorPos: number,
    context: CellContext
  ): SuggestionResult {
    const suggestions: Suggestion[] = [];

    // Get current token at cursor
    const token = this.getTokenAtCursor(formula, cursorPos);

    if (token.type === 'function_start') {
      // User is typing a function name
      const funcSuggestions = this.getFunctionSuggestions(token.value);
      return { suggestions: funcSuggestions, category: 'function' };
    }

    if (token.type === 'argument' || token.type === 'empty') {
      // User might want a cell reference
      const refSuggestions = this.getReferenceSuggestions(token.value, context);
      return { suggestions: refSuggestions, category: 'reference' };
    }

    return { suggestions, category: 'completion' };
  }

  /**
   * Get natural language suggestions
   */
  private getNLSuggestions(
    input: string,
    context: CellContext
  ): SuggestionResult {
    const suggestions: Suggestion[] = [];
    const lower = input.toLowerCase();

    // Common NL patterns
    const nlPatterns = [
      {
        match: /^sum/i,
        suggestions: ['sum of', 'sum column', 'sum where'],
      },
      {
        match: /^average|^avg/i,
        suggestions: ['average of', 'average where'],
      },
      {
        match: /^count/i,
        suggestions: ['count of', 'count where', 'count if'],
      },
      {
        match: /^find|^lookup/i,
        suggestions: ['find value', 'lookup', 'find where'],
      },
      {
        match: /^if/i,
        suggestions: ['if then else', 'if equals', 'if greater than'],
      },
      // Vietnamese
      {
        match: /^tổng/i,
        suggestions: ['tổng cột', 'tổng khi', 'tổng của'],
      },
      {
        match: /^đếm/i,
        suggestions: ['đếm số', 'đếm khi', 'đếm nếu'],
      },
      {
        match: /^trung bình/i,
        suggestions: ['trung bình cột', 'trung bình khi'],
      },
    ];

    // Find matching patterns
    for (const pattern of nlPatterns) {
      if (pattern.match.test(lower)) {
        for (const suggestion of pattern.suggestions) {
          if (suggestion.toLowerCase().startsWith(lower)) {
            suggestions.push({
              type: 'nl_formula',
              display: suggestion,
              insert: suggestion,
              description: 'Natural language formula',
              score: 90 - suggestions.length,
            });
          }
        }
      }
    }

    // Add column-aware suggestions
    for (const header of context.headers.slice(0, 3)) {
      if (
        header.dataType === 'number' ||
        header.dataType === 'currency'
      ) {
        suggestions.push({
          type: 'nl_formula',
          display: `sum of ${header.name}`,
          insert: `sum of ${header.name}`,
          description: `Sum column ${header.colLetter}`,
          score: 80,
        });
      }
    }

    return {
      suggestions: suggestions.slice(0, 6),
      category: 'nl',
    };
  }

  /**
   * Get function suggestions based on partial name
   */
  private getFunctionSuggestions(partial: string): Suggestion[] {
    const functions = this.functionLib.getAllFunctions();
    const suggestions: Suggestion[] = [];
    const upperPartial = partial.toUpperCase();

    for (const func of functions) {
      if (func.name.startsWith(upperPartial)) {
        suggestions.push({
          type: 'function',
          display: func.name,
          insert: func.name + '(',
          description: func.description,
          icon: 'fx',
          score: 100 - func.name.length + (func.name === upperPartial ? 50 : 0),
        });
      }
    }

    // Also check for contains
    for (const func of functions) {
      if (
        func.name.includes(upperPartial) &&
        !func.name.startsWith(upperPartial)
      ) {
        suggestions.push({
          type: 'function',
          display: func.name,
          insert: func.name + '(',
          description: func.description,
          icon: 'fx',
          score: 50 - func.name.length,
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  /**
   * Get reference suggestions
   */
  private getReferenceSuggestions(
    partial: string,
    context: CellContext
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const upperPartial = partial.toUpperCase();

    // Suggest column headers
    for (const header of context.headers) {
      if (
        header.colLetter.startsWith(upperPartial) ||
        header.name.toUpperCase().includes(upperPartial)
      ) {
        suggestions.push({
          type: 'reference',
          display: `${header.colLetter}:${header.colLetter} (${header.name})`,
          insert: `${header.colLetter}:${header.colLetter}`,
          description: `${header.dataType} column`,
          score: 90,
        });
      }
    }

    // Suggest nearby cells
    if (context.aboveCell) {
      suggestions.push({
        type: 'reference',
        display: context.aboveCell.ref,
        insert: context.aboveCell.ref,
        description: `Cell above (${context.aboveCell.value})`,
        score: 70,
      });
    }

    if (context.leftCell) {
      suggestions.push({
        type: 'reference',
        display: context.leftCell.ref,
        insert: context.leftCell.ref,
        description: `Cell left (${context.leftCell.value})`,
        score: 65,
      });
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Get token at cursor position
   */
  private getTokenAtCursor(
    formula: string,
    cursorPos: number
  ): { type: string; value: string } {
    // Find what we're in the middle of
    const before = formula.slice(0, cursorPos + 1);

    // Check if typing a function name
    const funcMatch = before.match(/([A-Z_][A-Z0-9_]*)$/i);
    if (funcMatch) {
      return { type: 'function_start', value: funcMatch[1] };
    }

    // Check if in argument position
    const argMatch = before.match(/[,(]\s*([A-Z0-9:]*)$/i);
    if (argMatch) {
      return { type: 'argument', value: argMatch[1] };
    }

    return { type: 'empty', value: '' };
  }

  /**
   * Add formula to recent list
   */
  addRecent(formula: string): void {
    // Remove if already exists
    const index = this.recentFormulas.indexOf(formula);
    if (index > -1) {
      this.recentFormulas.splice(index, 1);
    }

    // Add to front
    this.recentFormulas.unshift(formula);

    // Trim to max size
    if (this.recentFormulas.length > this.maxRecent) {
      this.recentFormulas.pop();
    }
  }

  /**
   * Get recent formulas
   */
  getRecent(): string[] {
    return [...this.recentFormulas];
  }

  /**
   * Clear recent formulas
   */
  clearRecent(): void {
    this.recentFormulas = [];
  }
}

// =============================================================================
// ACTION EXECUTOR — Execute suggestion actions
// =============================================================================

import type {
  ProactiveSuggestion,
  SuggestionAction,
} from './types';

/**
 * Executes actions from suggestions
 */
export class ActionExecutor {
  // Callback for sheet operations
  private onCellUpdate?: (cellRef: string, value: unknown, formula?: string) => void;
  private onRowDelete?: (rows: number[]) => void;
  private onFormatApply?: (cells: string[], format: unknown) => void;
  private onChartCreate?: (config: unknown) => void;

  /**
   * Register callbacks for sheet operations
   */
  registerCallbacks(callbacks: {
    onCellUpdate?: (cellRef: string, value: unknown, formula?: string) => void;
    onRowDelete?: (rows: number[]) => void;
    onFormatApply?: (cells: string[], format: unknown) => void;
    onChartCreate?: (config: unknown) => void;
  }): void {
    this.onCellUpdate = callbacks.onCellUpdate;
    this.onRowDelete = callbacks.onRowDelete;
    this.onFormatApply = callbacks.onFormatApply;
    this.onChartCreate = callbacks.onChartCreate;
  }

  /**
   * Execute an action from a suggestion
   */
  async execute(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    try {
      switch (action.action) {
        case 'apply_fix':
          return this.executeApplyFix(suggestion, action);

        case 'remove_duplicates':
          return this.executeRemoveDuplicates(suggestion, action);

        case 'fill_missing':
          return this.executeFillMissing(suggestion, action);

        case 'fix_format':
          return this.executeFixFormat(suggestion, action);

        case 'optimize_formula':
          return this.executeOptimizeFormula(suggestion, action);

        case 'create_chart':
          return this.executeCreateChart(suggestion, action);

        case 'deep_analysis':
          return this.executeDeepAnalysis(suggestion, action);

        case 'automate':
          return this.executeAutomate(suggestion, action);

        case 'learn_more':
          return this.executeLearnMore(suggestion, action);

        case 'dismiss':
          return this.executeDismiss(suggestion);

        case 'snooze':
          return this.executeSnooze(suggestion, action);

        default:
          return {
            success: false,
            message: `Unknown action: ${action.action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Action failed: ${error}`,
        error,
      };
    }
  }

  /**
   * Apply a generic fix
   */
  private async executeApplyFix(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      cellRef?: string;
      formula?: string;
      value?: unknown;
      cells?: string[];
      rows?: number[];
    };

    if (params.cellRef && (params.formula || params.value !== undefined)) {
      this.onCellUpdate?.(params.cellRef, params.value, params.formula);
      return {
        success: true,
        message: `Applied fix to ${params.cellRef}`,
        affectedCells: [params.cellRef],
      };
    }

    if (params.rows && params.rows.length > 0) {
      this.onRowDelete?.(params.rows);
      return {
        success: true,
        message: `Deleted ${params.rows.length} rows`,
        affectedCells: params.rows.map(r => `Row ${r + 1}`),
      };
    }

    return {
      success: true,
      message: 'Fix applied',
      affectedCells: suggestion.affectedCells,
    };
  }

  /**
   * Remove duplicate rows
   */
  private async executeRemoveDuplicates(
    _suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      rows?: number[];
      keep?: 'first' | 'last';
    };

    const rowsToDelete = params?.rows || [];

    if (rowsToDelete.length === 0) {
      return {
        success: false,
        message: 'No duplicate rows to remove',
      };
    }

    this.onRowDelete?.(rowsToDelete);

    return {
      success: true,
      message: `Removed ${rowsToDelete.length} duplicate rows`,
      affectedCells: rowsToDelete.map(r => `Row ${r + 1}`),
    };
  }

  /**
   * Fill missing values
   */
  private async executeFillMissing(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      cells?: string[];
      value?: unknown;
      method?: 'value' | 'above' | 'average';
    };

    const cells = params?.cells || suggestion.affectedCells;
    const value = params?.value ?? 0;

    for (const cellRef of cells) {
      this.onCellUpdate?.(cellRef, value);
    }

    return {
      success: true,
      message: `Filled ${cells.length} cells with ${value}`,
      affectedCells: cells,
    };
  }

  /**
   * Fix cell formats
   */
  private async executeFixFormat(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      cells?: string[];
      format?: unknown;
    };

    const cells = params?.cells || suggestion.affectedCells;

    this.onFormatApply?.(cells, params?.format);

    return {
      success: true,
      message: `Fixed format for ${cells.length} cells`,
      affectedCells: cells,
    };
  }

  /**
   * Optimize a formula
   */
  private async executeOptimizeFormula(
    _suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      cellRef?: string;
      formula?: string;
    };

    if (!params?.cellRef || !params?.formula) {
      return {
        success: false,
        message: 'Missing cell reference or formula',
      };
    }

    this.onCellUpdate?.(params.cellRef, undefined, params.formula);

    return {
      success: true,
      message: `Optimized formula in ${params.cellRef}`,
      affectedCells: [params.cellRef],
    };
  }

  /**
   * Create a chart
   */
  private async executeCreateChart(
    _suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      type?: string;
      column?: string;
      columns?: string[];
      dataRange?: string;
    };

    this.onChartCreate?.({
      type: params?.type || 'line',
      dataRange: params?.dataRange,
      columns: params?.columns || (params?.column ? [params.column] : []),
    });

    return {
      success: true,
      message: 'Chart created',
      openDialog: 'chart',
    };
  }

  /**
   * Deep analysis
   */
  private async executeDeepAnalysis(
    _suggestion: ProactiveSuggestion,
    _action: SuggestionAction
  ): Promise<ActionResult> {
    return {
      success: true,
      message: 'Opening analysis panel',
      openDialog: 'analysis',
    };
  }

  /**
   * Create automation
   */
  private async executeAutomate(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      sequence?: unknown[];
    };

    return {
      success: true,
      message: 'Opening automation wizard',
      openDialog: 'automation',
      data: {
        sequence: params?.sequence,
        suggestion,
      },
    };
  }

  /**
   * Show more information
   */
  private async executeLearnMore(
    suggestion: ProactiveSuggestion,
    _action: SuggestionAction
  ): Promise<ActionResult> {
    return {
      success: true,
      message: 'Opening help',
      openDialog: 'help',
      data: {
        topic: suggestion.category,
        suggestion,
      },
    };
  }

  /**
   * Dismiss suggestion
   */
  private async executeDismiss(
    suggestion: ProactiveSuggestion
  ): Promise<ActionResult> {
    suggestion.status = 'dismissed';

    return {
      success: true,
      message: 'Suggestion dismissed',
      suggestionDismissed: true,
    };
  }

  /**
   * Snooze suggestion
   */
  private async executeSnooze(
    suggestion: ProactiveSuggestion,
    action: SuggestionAction
  ): Promise<ActionResult> {
    const params = action.params as {
      duration?: number; // minutes
    };

    const duration = params?.duration || 60; // Default 1 hour
    suggestion.status = 'snoozed';
    suggestion.expiresAt = Date.now() + duration * 60 * 1000;

    return {
      success: true,
      message: `Snoozed for ${duration} minutes`,
      suggestionSnoozed: true,
      snoozeUntil: suggestion.expiresAt,
    };
  }

  /**
   * Execute multiple actions
   */
  async executeMultiple(
    actions: { suggestion: ProactiveSuggestion; action: SuggestionAction }[]
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const { suggestion, action } of actions) {
      const result = await this.execute(suggestion, action);
      results.push(result);
    }

    return results;
  }

  /**
   * Undo last action (if supported)
   */
  async undo(): Promise<ActionResult> {
    // Would integrate with undo/redo system
    return {
      success: false,
      message: 'Undo not implemented',
    };
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ActionResult {
  success: boolean;
  message: string;
  error?: unknown;
  affectedCells?: string[];
  openDialog?: 'chart' | 'analysis' | 'automation' | 'help';
  data?: unknown;
  suggestionDismissed?: boolean;
  suggestionSnoozed?: boolean;
  snoozeUntil?: number;
}

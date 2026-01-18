// ============================================================
// AI CONTEXT TRIGGERS — Smart Context Detection for AI Suggestions
// ============================================================
//
// Monitors user actions and context to provide intelligent AI suggestions:
// - Selection changes → suggest formulas, formatting
// - Formula errors → suggest fixes
// - Data patterns → suggest Flash Fill, charts
// - Large ranges → suggest summarization, pivot tables
// - Repeated actions → suggest automation
// ============================================================

import { useWorkbookStore } from '../../stores/workbookStore';

// Trigger types that can invoke AI suggestions
export type AITriggerType =
  | 'selection_change'
  | 'formula_error'
  | 'data_pattern'
  | 'large_range'
  | 'repeated_action'
  | 'empty_cells'
  | 'mixed_data'
  | 'date_column'
  | 'number_column'
  | 'text_column'
  | 'formula_input'
  | 'format_request'
  | 'chart_opportunity'
  | 'pivot_opportunity';

// Suggestion categories
export type AISuggestionCategory =
  | 'formula'
  | 'formatting'
  | 'analysis'
  | 'cleanup'
  | 'automation'
  | 'visualization'
  | 'error_fix';

// AI Suggestion interface
export interface AISuggestion {
  id: string;
  trigger: AITriggerType;
  category: AISuggestionCategory;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  context?: Record<string, unknown>;
}

// Context analysis result
export interface ContextAnalysis {
  hasData: boolean;
  hasFormulas: boolean;
  hasErrors: boolean;
  hasNumbers: boolean;
  hasDates: boolean;
  hasText: boolean;
  hasMixedTypes: boolean;
  hasEmptyCells: boolean;
  rowCount: number;
  colCount: number;
  cellCount: number;
  dataPattern?: string;
  dominantType?: 'number' | 'text' | 'date' | 'formula' | 'mixed';
}

// Analyze selection context
export function analyzeSelectionContext(
  selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null,
  sheetId: string | null
): ContextAnalysis | null {
  if (!selection || !sheetId) return null;

  const sheets = useWorkbookStore.getState().sheets;
  const sheet = sheets[sheetId];
  if (!sheet) return null;

  const { startRow, startCol, endRow, endCol } = selection;
  const rowCount = endRow - startRow + 1;
  const colCount = endCol - startCol + 1;
  const cellCount = rowCount * colCount;

  let hasData = false;
  let hasFormulas = false;
  let hasErrors = false;
  let hasNumbers = false;
  let hasDates = false;
  let hasText = false;
  let hasEmptyCells = false;
  let numberCount = 0;
  let textCount = 0;
  let dateCount = 0;
  let formulaCount = 0;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const key = `${row}:${col}`;
      const cell = sheet.cells[key];

      if (!cell || cell.value === null || cell.value === undefined || cell.value === '') {
        hasEmptyCells = true;
        continue;
      }

      hasData = true;

      if (cell.formula) {
        hasFormulas = true;
        formulaCount++;
        if (String(cell.value).startsWith('#')) {
          hasErrors = true;
        }
      }

      const value = cell.value;
      if (typeof value === 'number') {
        hasNumbers = true;
        numberCount++;
      } else if (typeof value === 'string') {
        // Check if it's a date
        if (isDateString(value)) {
          hasDates = true;
          dateCount++;
        } else {
          hasText = true;
          textCount++;
        }
      }
    }
  }

  // Determine dominant type
  const total = numberCount + textCount + dateCount + formulaCount;
  let dominantType: ContextAnalysis['dominantType'] = 'mixed';
  if (total > 0) {
    if (numberCount / total > 0.7) dominantType = 'number';
    else if (textCount / total > 0.7) dominantType = 'text';
    else if (dateCount / total > 0.7) dominantType = 'date';
    else if (formulaCount / total > 0.7) dominantType = 'formula';
  }

  return {
    hasData,
    hasFormulas,
    hasErrors,
    hasNumbers,
    hasDates,
    hasText,
    hasMixedTypes: (hasNumbers && hasText) || (hasDates && hasText),
    hasEmptyCells,
    rowCount,
    colCount,
    cellCount,
    dominantType,
  };
}

// Check if string is a date
function isDateString(value: string): boolean {
  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,  // DD-MM-YYYY
    /^\w+ \d{1,2}, \d{4}$/, // Month DD, YYYY
  ];
  return datePatterns.some(p => p.test(value));
}

// Generate suggestions based on context
export function generateContextualSuggestions(
  context: ContextAnalysis,
  selection: { startRow: number; startCol: number; endRow: number; endCol: number }
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { startRow, startCol, endRow, endCol } = selection;
  const rangeStr = `${colToLetter(startCol)}${startRow + 1}:${colToLetter(endCol)}${endRow + 1}`;

  // Error fixing suggestions (highest priority)
  if (context.hasErrors) {
    suggestions.push({
      id: 'fix-errors',
      trigger: 'formula_error',
      category: 'error_fix',
      title: 'Fix Formula Errors',
      description: 'AI can analyze and fix formula errors in your selection',
      prompt: `Analyze the formula errors in range ${rangeStr} and suggest fixes. Explain what's wrong and how to correct it.`,
      icon: 'AlertTriangle',
      priority: 'high',
      confidence: 0.9,
    });
  }

  // Large data range suggestions
  if (context.cellCount > 50 && context.hasData) {
    suggestions.push({
      id: 'summarize-data',
      trigger: 'large_range',
      category: 'analysis',
      title: 'Summarize Data',
      description: `Summarize ${context.cellCount} cells with key statistics`,
      prompt: `Analyze the data in range ${rangeStr} and provide a summary including: count, sum (if numeric), average, min, max, and any patterns you notice.`,
      icon: 'BarChart3',
      priority: 'medium',
      confidence: 0.85,
    });

    if (context.hasNumbers && context.rowCount > 5) {
      suggestions.push({
        id: 'create-pivot',
        trigger: 'pivot_opportunity',
        category: 'visualization',
        title: 'Create Pivot Table',
        description: 'Generate a pivot table to analyze this data',
        prompt: `Help me create a pivot table from the data in ${rangeStr}. Suggest appropriate row, column, and value fields based on the data structure.`,
        icon: 'Table2',
        priority: 'medium',
        confidence: 0.8,
      });
    }
  }

  // Number column suggestions
  if (context.dominantType === 'number' && context.rowCount > 3) {
    suggestions.push({
      id: 'add-formula',
      trigger: 'number_column',
      category: 'formula',
      title: 'Add Calculations',
      description: 'Add SUM, AVERAGE, or other formulas',
      prompt: `I have numeric data in ${rangeStr}. Suggest appropriate formulas to analyze this data (SUM, AVERAGE, COUNT, etc.) and where to place them.`,
      icon: 'Calculator',
      priority: 'medium',
      confidence: 0.85,
    });

    suggestions.push({
      id: 'create-chart',
      trigger: 'chart_opportunity',
      category: 'visualization',
      title: 'Create Chart',
      description: 'Visualize this data with a chart',
      prompt: `Recommend the best chart type to visualize the data in ${rangeStr} and explain why it's suitable.`,
      icon: 'LineChart',
      priority: 'low',
      confidence: 0.75,
    });
  }

  // Date column suggestions
  if (context.hasDates && context.rowCount > 3) {
    suggestions.push({
      id: 'date-analysis',
      trigger: 'date_column',
      category: 'analysis',
      title: 'Date Analysis',
      description: 'Analyze trends and patterns over time',
      prompt: `Analyze the date data in ${rangeStr}. Identify any patterns, calculate date ranges, and suggest useful date-based formulas.`,
      icon: 'Calendar',
      priority: 'medium',
      confidence: 0.8,
    });
  }

  // Text column suggestions
  if (context.dominantType === 'text' && context.rowCount > 5) {
    suggestions.push({
      id: 'text-cleanup',
      trigger: 'text_column',
      category: 'cleanup',
      title: 'Clean Up Text',
      description: 'Standardize and clean text data',
      prompt: `Review the text data in ${rangeStr} and suggest cleanup operations: trim whitespace, fix casing, remove duplicates, or standardize formats.`,
      icon: 'Type',
      priority: 'low',
      confidence: 0.7,
    });

    suggestions.push({
      id: 'categorize-text',
      trigger: 'text_column',
      category: 'analysis',
      title: 'Categorize Data',
      description: 'AI can help categorize and organize text',
      prompt: `Analyze the text in ${rangeStr} and suggest a categorization scheme. Create categories and show how to classify each item.`,
      icon: 'Tags',
      priority: 'low',
      confidence: 0.65,
    });
  }

  // Mixed data suggestions
  if (context.hasMixedTypes) {
    suggestions.push({
      id: 'validate-data',
      trigger: 'mixed_data',
      category: 'cleanup',
      title: 'Validate Data',
      description: 'Check for data consistency issues',
      prompt: `Analyze the data in ${rangeStr} for consistency issues. The data appears to have mixed types. Identify any data quality problems and suggest fixes.`,
      icon: 'CheckCircle',
      priority: 'medium',
      confidence: 0.75,
    });
  }

  // Empty cells suggestions
  if (context.hasEmptyCells && context.hasData) {
    suggestions.push({
      id: 'fill-empty',
      trigger: 'empty_cells',
      category: 'cleanup',
      title: 'Handle Empty Cells',
      description: 'Suggest how to handle missing data',
      prompt: `The range ${rangeStr} contains empty cells mixed with data. Suggest the best approach: fill with defaults, interpolate values, or remove rows?`,
      icon: 'Grid3X3',
      priority: 'low',
      confidence: 0.6,
    });
  }

  // Formula suggestions for empty selection adjacent to data
  if (!context.hasData && context.cellCount === 1) {
    suggestions.push({
      id: 'suggest-formula',
      trigger: 'formula_input',
      category: 'formula',
      title: 'Suggest Formula',
      description: 'Get AI help writing a formula',
      prompt: `I'm in an empty cell. Look at the surrounding data and suggest an appropriate formula I might want to enter here.`,
      icon: 'Sparkles',
      priority: 'low',
      confidence: 0.5,
    });
  }

  // Sort by priority and confidence
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

// Helper: column number to letter
function colToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

// Quick action definitions for common operations
export const QUICK_AI_ACTIONS = [
  {
    id: 'explain-formula',
    label: 'Explain Formula',
    icon: 'HelpCircle',
    prompt: 'Explain what this formula does step by step:',
    requiresFormula: true,
  },
  {
    id: 'fix-formula',
    label: 'Fix Formula',
    icon: 'Wrench',
    prompt: 'Fix this formula error and explain the issue:',
    requiresError: true,
  },
  {
    id: 'suggest-formula',
    label: 'Suggest Formula',
    icon: 'Lightbulb',
    prompt: 'Based on the selected data, suggest appropriate formulas:',
    requiresData: true,
  },
  {
    id: 'summarize-data',
    label: 'Summarize',
    icon: 'FileText',
    prompt: 'Provide a summary analysis of this data:',
    requiresData: true,
  },
  {
    id: 'format-data',
    label: 'Format Data',
    icon: 'Palette',
    prompt: 'Suggest the best formatting for this data:',
    requiresData: true,
  },
  {
    id: 'create-chart',
    label: 'Create Chart',
    icon: 'BarChart2',
    prompt: 'Recommend the best chart type for this data:',
    requiresData: true,
    minCells: 4,
  },
  {
    id: 'find-patterns',
    label: 'Find Patterns',
    icon: 'Search',
    prompt: 'Analyze this data and identify any patterns or anomalies:',
    requiresData: true,
    minCells: 10,
  },
  {
    id: 'clean-data',
    label: 'Clean Data',
    icon: 'Eraser',
    prompt: 'Identify data quality issues and suggest cleanup steps:',
    requiresData: true,
  },
];

// Get applicable quick actions based on context
export function getApplicableQuickActions(context: ContextAnalysis | null) {
  if (!context) return QUICK_AI_ACTIONS.slice(0, 3); // Default actions

  return QUICK_AI_ACTIONS.filter(action => {
    if (action.requiresFormula && !context.hasFormulas) return false;
    if (action.requiresError && !context.hasErrors) return false;
    if (action.requiresData && !context.hasData) return false;
    if (action.minCells && context.cellCount < action.minCells) return false;
    return true;
  });
}

// ============================================================
// INLINE AI SUGGESTIONS — Smart Hints in Formula Bar & Cells
// ============================================================
//
// Provides inline AI suggestions:
// - Formula error detection with fix suggestions
// - Formula completion suggestions
// - Data validation hints
// - Smart formatting recommendations
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  X,
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useAIStore } from '../../stores/aiStore';

// Suggestion types
export type InlineSuggestionType =
  | 'error_fix'
  | 'formula_completion'
  | 'format_hint'
  | 'validation_warning'
  | 'optimization';

export interface InlineSuggestion {
  id: string;
  type: InlineSuggestionType;
  message: string;
  action?: string;
  prompt?: string;
  autoFix?: () => void;
}

interface InlineAISuggestionsProps {
  formula: string;
  cellRow?: number;
  cellCol?: number;
}

// Common formula error patterns and fixes
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  errorType: string;
  message: string;
  fixPrompt: string;
}> = [
  {
    pattern: /^#REF!/,
    errorType: '#REF!',
    message: 'Reference error - cell or range was deleted',
    fixPrompt: 'This formula has a #REF! error because a referenced cell was deleted. Suggest how to fix it.',
  },
  {
    pattern: /^#VALUE!/,
    errorType: '#VALUE!',
    message: 'Value error - wrong data type in formula',
    fixPrompt: 'This formula has a #VALUE! error. Analyze the formula and suggest a fix.',
  },
  {
    pattern: /^#NAME\?/,
    errorType: '#NAME?',
    message: 'Unknown function or name',
    fixPrompt: 'This formula has a #NAME? error - likely a typo in function name. Suggest the correct function.',
  },
  {
    pattern: /^#DIV\/0!/,
    errorType: '#DIV/0!',
    message: 'Division by zero',
    fixPrompt: 'This formula divides by zero. Suggest how to handle this with IFERROR or IF.',
  },
  {
    pattern: /^#N\/A/,
    errorType: '#N/A',
    message: 'Value not found in lookup',
    fixPrompt: 'This lookup formula returned #N/A. Suggest how to handle missing values.',
  },
  {
    pattern: /^#NUM!/,
    errorType: '#NUM!',
    message: 'Invalid numeric value',
    fixPrompt: 'This formula has a #NUM! error - invalid number. Analyze and suggest a fix.',
  },
];

// Formula completion patterns
const COMPLETION_PATTERNS: Array<{
  pattern: RegExp;
  suggestion: string;
  completion: string;
}> = [
  {
    pattern: /^=SUM\($/i,
    suggestion: 'Select a range to sum',
    completion: '=SUM(A1:A10)',
  },
  {
    pattern: /^=IF\($/i,
    suggestion: 'Add condition, true value, false value',
    completion: '=IF(condition, true_value, false_value)',
  },
  {
    pattern: /^=VLOOKUP\($/i,
    suggestion: 'lookup_value, table, col_index, [exact_match]',
    completion: '=VLOOKUP(value, A:D, 2, FALSE)',
  },
  {
    pattern: /^=SUMIF\($/i,
    suggestion: 'range, criteria, [sum_range]',
    completion: '=SUMIF(A:A, ">0", B:B)',
  },
  {
    pattern: /^=INDEX\($/i,
    suggestion: 'array, row_num, [col_num]',
    completion: '=INDEX(A1:C10, MATCH(...), 1)',
  },
  {
    pattern: /^=IFERROR\($/i,
    suggestion: 'value, value_if_error',
    completion: '=IFERROR(formula, "Error")',
  },
];

export const InlineAISuggestions: React.FC<InlineAISuggestionsProps> = ({
  formula,
  cellRow,
  cellCol,
}) => {
  const [suggestions, setSuggestions] = useState<InlineSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { openPanel, setCurrentInput } = useAIStore();
  const { activeSheetId, sheets } = useWorkbookStore();

  // Analyze formula and generate suggestions
  useEffect(() => {
    if (!formula) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: InlineSuggestion[] = [];

    // Check for errors in cell value
    if (activeSheetId && cellRow !== undefined && cellCol !== undefined) {
      const sheet = sheets[activeSheetId];
      const cell = sheet?.cells[`${cellRow}:${cellCol}`];
      const cellValue = cell?.value;

      if (typeof cellValue === 'string' && cellValue.startsWith('#')) {
        const errorMatch = ERROR_PATTERNS.find(p => p.pattern.test(cellValue));
        if (errorMatch) {
          newSuggestions.push({
            id: `error-${errorMatch.errorType}`,
            type: 'error_fix',
            message: errorMatch.message,
            action: 'Ask AI to fix',
            prompt: `${errorMatch.fixPrompt}\n\nFormula: ${formula}\nError: ${cellValue}`,
          });
        }
      }
    }

    // Check for formula completion hints
    if (formula.startsWith('=')) {
      const completionMatch = COMPLETION_PATTERNS.find(p => p.pattern.test(formula));
      if (completionMatch) {
        newSuggestions.push({
          id: `completion-${formula}`,
          type: 'formula_completion',
          message: completionMatch.suggestion,
        });
      }

      // Check for common issues
      const openParens = (formula.match(/\(/g) || []).length;
      const closeParens = (formula.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        newSuggestions.push({
          id: 'missing-paren',
          type: 'validation_warning',
          message: `Missing ${openParens - closeParens} closing parenthesis`,
        });
      }

      // Check for potential optimizations
      if (formula.includes('VLOOKUP') && !formula.includes('IFERROR') && !formula.includes('IFNA')) {
        newSuggestions.push({
          id: 'vlookup-error-handling',
          type: 'optimization',
          message: 'Consider wrapping VLOOKUP with IFERROR to handle missing values',
          action: 'Show me how',
          prompt: `How do I wrap this VLOOKUP formula with IFERROR to handle #N/A errors?\n\nFormula: ${formula}`,
        });
      }

      // Nested IF suggestion
      const ifCount = (formula.toUpperCase().match(/IF\(/g) || []).length;
      if (ifCount > 2) {
        newSuggestions.push({
          id: 'nested-if-warning',
          type: 'optimization',
          message: 'Consider using IFS or SWITCH instead of nested IFs',
          action: 'Convert formula',
          prompt: `This formula has ${ifCount} nested IFs. Show me how to simplify it using IFS or SWITCH:\n\nFormula: ${formula}`,
        });
      }
    }

    // Filter dismissed suggestions
    setSuggestions(newSuggestions.filter(s => !dismissed.has(s.id)));
  }, [formula, activeSheetId, sheets, cellRow, cellCol, dismissed]);

  // Handle suggestion action
  const handleAction = useCallback((suggestion: InlineSuggestion) => {
    if (suggestion.prompt) {
      openPanel();
      setCurrentInput(suggestion.prompt);
    }
    if (suggestion.autoFix) {
      suggestion.autoFix();
    }
  }, [openPanel, setCurrentInput]);

  // Dismiss suggestion
  const handleDismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <div className="inline-ai-suggestions">
      {suggestions.map(suggestion => (
        <div
          key={suggestion.id}
          className={`inline-suggestion ${suggestion.type}`}
        >
          <div className="inline-suggestion-icon">
            {suggestion.type === 'error_fix' && <AlertTriangle size={12} />}
            {suggestion.type === 'formula_completion' && <Lightbulb size={12} />}
            {suggestion.type === 'validation_warning' && <AlertTriangle size={12} />}
            {suggestion.type === 'optimization' && <Sparkles size={12} />}
          </div>
          <span className="inline-suggestion-message">{suggestion.message}</span>
          {suggestion.action && (
            <button
              className="inline-suggestion-action"
              onClick={() => handleAction(suggestion)}
            >
              {suggestion.action}
              <ArrowRight size={10} />
            </button>
          )}
          <button
            className="inline-suggestion-dismiss"
            onClick={() => handleDismiss(suggestion.id)}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
};

// Proactive AI hint that shows below formula bar
export const FormulaBarAIHint: React.FC<{ formula: string }> = ({ formula }) => {
  const [hint, setHint] = useState<string | null>(null);
  const { openPanel, setCurrentInput } = useAIStore();

  useEffect(() => {
    if (!formula || !formula.startsWith('=')) {
      setHint(null);
      return;
    }

    // Show hint for common patterns
    const upperFormula = formula.toUpperCase();

    if (upperFormula === '=') {
      setHint('Start typing a function name or press Ctrl+Shift+A for AI help');
    } else if (upperFormula.match(/^=[A-Z]+$/)) {
      setHint('Press Tab to autocomplete or ( to start entering arguments');
    } else if (formula.includes('#')) {
      setHint('Formula has an error - press Ctrl+Shift+A to ask AI for help');
    } else {
      setHint(null);
    }
  }, [formula]);

  if (!hint) return null;

  return (
    <div className="formula-bar-ai-hint">
      <Sparkles size={12} />
      <span>{hint}</span>
      <button onClick={() => { openPanel(); setCurrentInput('Help me with this formula: ' + formula); }}>
        Ask AI
      </button>
    </div>
  );
};

export default InlineAISuggestions;

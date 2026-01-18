import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { FormulaAutocomplete } from '../FormulaAutocomplete';
import type { AutocompleteSuggestion } from '../FormulaAutocomplete';
import { nlFormulaEngine } from '../../nlformula';
import type { InterpretationResult } from '../../nlformula/types';
import { FormulaPreview } from '../NLFormula/FormulaPreview';
import { useNLFormulaContext } from '../../hooks/useNLFormulaContext';

export interface VirtualCellEditorProps {
  row: number;
  col: number;
  initialValue: string;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const VirtualCellEditor = memo<VirtualCellEditorProps>(({
  row,
  col,
  initialValue,
  position,
  onSubmit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);
  const [isMultiline, setIsMultiline] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // NL Formula state
  const [nlInterpretation, setNlInterpretation] = useState<InterpretationResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const nlContext = useNLFormulaContext(row, col);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Check if input is natural language
  const isNaturalLanguage = nlFormulaEngine.isNaturalLanguage(value);
  const isFormula = value.startsWith('=');

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Let autocomplete handle arrow keys and tab/enter when visible
      if (showAutocomplete && value.startsWith('=')) {
        if (['ArrowDown', 'ArrowUp', 'Tab', 'Enter'].includes(e.key)) {
          // Let the FormulaAutocomplete handle these
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowAutocomplete(false);
          return;
        }
      }

      // Handle NL interpretation
      if (nlInterpretation?.success && nlInterpretation.formula) {
        if (e.key === 'Enter') {
          e.preventDefault();
          // Accept the interpreted formula
          onSubmit(nlInterpretation.formula);
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          // Insert the formula into the input (user can edit before submitting)
          setValue(nlInterpretation.formula);
          setNlInterpretation(null);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          // Dismiss the interpretation
          setNlInterpretation(null);
          return;
        }
      }

      switch (e.key) {
        case 'Enter':
          if (e.shiftKey) {
            // Allow newline with Shift+Enter
            setIsMultiline(true);
            return;
          }
          e.preventDefault();
          onSubmit(value);
          break;
        case 'Tab':
          e.preventDefault();
          onSubmit(value);
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
        default:
          break;
      }
    },
    [value, onSubmit, onCancel, showAutocomplete, nlInterpretation]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCursorPosition(e.target.selectionStart || 0);

    // Show autocomplete for formula input
    if (newValue.startsWith('=')) {
      setShowAutocomplete(true);
      setNlInterpretation(null);
    } else {
      setShowAutocomplete(false);

      // Clear previous debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Check for natural language and interpret
      if (nlFormulaEngine.isNaturalLanguage(newValue) && nlContext) {
        setIsInterpreting(true);
        debounceTimer.current = setTimeout(async () => {
          try {
            const result = await nlFormulaEngine.interpret({
              text: newValue,
              language: 'auto',
              context: nlContext,
            });
            setNlInterpretation(result);
          } catch {
            setNlInterpretation(null);
          } finally {
            setIsInterpreting(false);
          }
        }, 300);
      } else {
        setNlInterpretation(null);
        setIsInterpreting(false);
      }
    }

    // Auto-expand if content has newlines
    if (newValue.includes('\n')) {
      setIsMultiline(true);
    }
  }, [nlContext]);

  // Handle cursor position updates
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  }, []);

  // Handle autocomplete selection
  const handleAutocompleteSelect = useCallback((_suggestion: AutocompleteSuggestion, insertText: string) => {
    // Find the word being typed and replace it
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);

    // Find start of current word
    const match = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const wordStart = match ? cursorPosition - match[1].length : cursorPosition;

    // Build new value
    const newValue = value.slice(0, wordStart) + insertText + afterCursor;
    setValue(newValue);
    setShowAutocomplete(false);

    // Move cursor after inserted text
    const newCursorPos = wordStart + insertText.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, cursorPosition]);

  // Handle blur (submit)
  const handleBlur = useCallback(() => {
    // Don't submit if user is interacting with the formula preview
    if (nlInterpretation) {
      return;
    }
    onSubmit(value);
  }, [value, onSubmit, nlInterpretation]);

  // Handle accept NL interpretation
  const handleAcceptInterpretation = useCallback(() => {
    if (nlInterpretation?.formula) {
      onSubmit(nlInterpretation.formula);
      setNlInterpretation(null);
    }
  }, [nlInterpretation, onSubmit]);

  // Handle dismiss NL interpretation
  const handleDismissInterpretation = useCallback(() => {
    setNlInterpretation(null);
    inputRef.current?.focus();
  }, []);

  // Calculate expanded height for multiline
  const expandedHeight = isMultiline ? Math.max(position.height, 72) : position.height;

  return (
    <div
      className="virtual-cell-editor absolute z-30"
      style={{
        left: position.left,
        top: position.top,
        width: position.width, // Use exact cell width, no minimum
        minHeight: expandedHeight,
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onSelect={handleSelect}
        onClick={handleSelect}
        className="w-full border-2 border-blue-500 outline-none resize-none bg-white dark:bg-neutral-800 dark:text-white dark:border-blue-400"
        style={{
          minHeight: expandedHeight,
          padding: '2px 4px',
          fontSize: '13px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '18px',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        data-row={row}
        data-col={col}
        spellCheck={false}
        autoComplete="off"
      />

      {/* NL Mode Indicator */}
      {isNaturalLanguage && !isFormula && (
        <div
          className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium rounded-t"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
          }}
        >
          {isInterpreting ? 'Interpreting...' : 'NL Mode'}
        </div>
      )}

      {/* Formula Autocomplete */}
      {showAutocomplete && value.startsWith('=') && (
        <FormulaAutocomplete
          formula={value}
          cursorPosition={cursorPosition}
          onSelect={handleAutocompleteSelect}
          onClose={() => setShowAutocomplete(false)}
          position={{
            left: 0,
            top: expandedHeight + 4,
          }}
        />
      )}

      {/* NL Formula Preview */}
      {nlInterpretation && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: expandedHeight + 4,
            minWidth: 320,
            maxWidth: 400,
            zIndex: 50,
          }}
        >
          <FormulaPreview
            interpretation={nlInterpretation}
            onAccept={handleAcceptInterpretation}
            onDismiss={handleDismissInterpretation}
            originalInput={value}
          />
        </div>
      )}
    </div>
  );
});

VirtualCellEditor.displayName = 'VirtualCellEditor';

// Formula autocomplete suggestions (for future enhancement)
export interface FormulaSuggestion {
  name: string;
  description: string;
  syntax: string;
  category: string;
}

export const FORMULA_SUGGESTIONS: FormulaSuggestion[] = [
  { name: 'SUM', description: 'Adds all numbers in a range', syntax: '=SUM(range)', category: 'Math' },
  { name: 'AVERAGE', description: 'Returns the average of numbers', syntax: '=AVERAGE(range)', category: 'Math' },
  { name: 'COUNT', description: 'Counts cells with numbers', syntax: '=COUNT(range)', category: 'Math' },
  { name: 'MAX', description: 'Returns the largest value', syntax: '=MAX(range)', category: 'Math' },
  { name: 'MIN', description: 'Returns the smallest value', syntax: '=MIN(range)', category: 'Math' },
  { name: 'IF', description: 'Performs conditional logic', syntax: '=IF(condition, true_value, false_value)', category: 'Logic' },
  { name: 'AND', description: 'Returns TRUE if all conditions are true', syntax: '=AND(condition1, condition2, ...)', category: 'Logic' },
  { name: 'OR', description: 'Returns TRUE if any condition is true', syntax: '=OR(condition1, condition2, ...)', category: 'Logic' },
  { name: 'VLOOKUP', description: 'Looks up value in first column', syntax: '=VLOOKUP(value, range, col, exact)', category: 'Lookup' },
  { name: 'HLOOKUP', description: 'Looks up value in first row', syntax: '=HLOOKUP(value, range, row, exact)', category: 'Lookup' },
  { name: 'INDEX', description: 'Returns value at row/col intersection', syntax: '=INDEX(range, row, col)', category: 'Lookup' },
  { name: 'MATCH', description: 'Returns position of value in range', syntax: '=MATCH(value, range, match_type)', category: 'Lookup' },
  { name: 'CONCATENATE', description: 'Joins text strings', syntax: '=CONCATENATE(text1, text2, ...)', category: 'Text' },
  { name: 'LEFT', description: 'Returns leftmost characters', syntax: '=LEFT(text, num_chars)', category: 'Text' },
  { name: 'RIGHT', description: 'Returns rightmost characters', syntax: '=RIGHT(text, num_chars)', category: 'Text' },
  { name: 'LEN', description: 'Returns length of text', syntax: '=LEN(text)', category: 'Text' },
  { name: 'NOW', description: 'Returns current date and time', syntax: '=NOW()', category: 'Date' },
  { name: 'TODAY', description: 'Returns current date', syntax: '=TODAY()', category: 'Date' },
  { name: 'ROUND', description: 'Rounds to specified digits', syntax: '=ROUND(number, digits)', category: 'Math' },
  { name: 'ABS', description: 'Returns absolute value', syntax: '=ABS(number)', category: 'Math' },
];

// Filter suggestions based on input
export function filterFormulaSuggestions(input: string): FormulaSuggestion[] {
  if (!input.startsWith('=')) return [];

  const query = input.slice(1).toUpperCase();
  if (!query) return FORMULA_SUGGESTIONS.slice(0, 10);

  return FORMULA_SUGGESTIONS.filter((s) =>
    s.name.startsWith(query) || s.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
}

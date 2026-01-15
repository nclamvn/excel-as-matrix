import React, { useEffect, useRef, useState, useCallback, memo } from 'react';

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
    [value, onSubmit, onCancel]
  );

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Auto-expand if content has newlines
    if (newValue.includes('\n')) {
      setIsMultiline(true);
    }
  }, []);

  // Handle blur (submit)
  const handleBlur = useCallback(() => {
    onSubmit(value);
  }, [value, onSubmit]);

  // Calculate expanded height for multiline
  const expandedHeight = isMultiline ? Math.max(position.height, 72) : position.height;

  return (
    <div
      className="virtual-cell-editor absolute z-30"
      style={{
        left: position.left,
        top: position.top,
        width: Math.max(position.width, 150), // Minimum width for editing
        minHeight: expandedHeight,
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full border-2 border-blue-500 outline-none resize-none bg-white"
        style={{
          minHeight: expandedHeight,
          padding: '2px 4px',
          fontSize: '13px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '18px',
          boxSizing: 'border-box',
        }}
        data-row={row}
        data-col={col}
        spellCheck={false}
        autoComplete="off"
      />

      {/* Formula hint */}
      {value.startsWith('=') && (
        <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs">
          <span className="text-yellow-300">Formula: </span>
          {value.slice(1) || 'Enter formula...'}
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

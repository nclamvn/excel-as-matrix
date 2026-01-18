// ============================================================
// FORMULA AUTOCOMPLETE — Intelligent Formula Suggestions
// ============================================================
//
// Features:
// - Function suggestions with fuzzy matching
// - Named ranges and constants from Name Manager
// - Function syntax and parameter hints
// - Keyboard navigation
// - Recently used functions
// - Category grouping
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Calculator,
  Type,
  ToggleLeft,
  Calendar,
  TrendingUp,
  Search,
  Hash,
  Code,
  Grid3X3,
  BookOpen,
  Clock,
} from 'lucide-react';
import { getAllFunctionNames } from '../../engine/functions';
import { useNameManagerStore } from '../../stores/nameManagerStore';

// Types
export interface AutocompleteSuggestion {
  type: 'function' | 'name' | 'range' | 'constant' | 'lambda';
  name: string;
  description: string;
  syntax?: string;
  category?: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

interface FormulaAutocompleteProps {
  formula: string;
  cursorPosition: number;
  onSelect: (suggestion: AutocompleteSuggestion, insertText: string) => void;
  onClose: () => void;
  position: { left: number; top: number };
}

// Function categories with icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Math: <Calculator size={14} />,
  Text: <Type size={14} />,
  Logical: <ToggleLeft size={14} />,
  Date: <Calendar size={14} />,
  Statistical: <TrendingUp size={14} />,
  Lookup: <Search size={14} />,
  Financial: <Hash size={14} />,
  Array: <Grid3X3 size={14} />,
  Lambda: <Code size={14} />,
  Named: <BookOpen size={14} />,
};

// Function metadata for better descriptions
const FUNCTION_METADATA: Record<string, { description: string; category: string; syntax: string }> = {
  // Math
  SUM: { description: 'Adds all numbers in a range', category: 'Math', syntax: 'SUM(number1, [number2], ...)' },
  AVERAGE: { description: 'Returns the average of numbers', category: 'Math', syntax: 'AVERAGE(number1, [number2], ...)' },
  COUNT: { description: 'Counts cells containing numbers', category: 'Math', syntax: 'COUNT(value1, [value2], ...)' },
  COUNTA: { description: 'Counts non-empty cells', category: 'Math', syntax: 'COUNTA(value1, [value2], ...)' },
  MAX: { description: 'Returns the largest value', category: 'Math', syntax: 'MAX(number1, [number2], ...)' },
  MIN: { description: 'Returns the smallest value', category: 'Math', syntax: 'MIN(number1, [number2], ...)' },
  ROUND: { description: 'Rounds to specified digits', category: 'Math', syntax: 'ROUND(number, num_digits)' },
  ROUNDUP: { description: 'Rounds up away from zero', category: 'Math', syntax: 'ROUNDUP(number, num_digits)' },
  ROUNDDOWN: { description: 'Rounds down toward zero', category: 'Math', syntax: 'ROUNDDOWN(number, num_digits)' },
  ABS: { description: 'Returns absolute value', category: 'Math', syntax: 'ABS(number)' },
  SQRT: { description: 'Returns square root', category: 'Math', syntax: 'SQRT(number)' },
  POWER: { description: 'Returns number raised to power', category: 'Math', syntax: 'POWER(number, power)' },
  MOD: { description: 'Returns remainder after division', category: 'Math', syntax: 'MOD(number, divisor)' },
  PRODUCT: { description: 'Multiplies all numbers', category: 'Math', syntax: 'PRODUCT(number1, [number2], ...)' },
  SUMIF: { description: 'Adds cells meeting criteria', category: 'Math', syntax: 'SUMIF(range, criteria, [sum_range])' },
  SUMIFS: { description: 'Adds cells meeting multiple criteria', category: 'Math', syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, ...)' },
  COUNTIF: { description: 'Counts cells meeting criteria', category: 'Math', syntax: 'COUNTIF(range, criteria)' },
  COUNTIFS: { description: 'Counts cells meeting multiple criteria', category: 'Math', syntax: 'COUNTIFS(criteria_range1, criteria1, ...)' },
  AVERAGEIF: { description: 'Averages cells meeting criteria', category: 'Math', syntax: 'AVERAGEIF(range, criteria, [average_range])' },

  // Text
  CONCATENATE: { description: 'Joins text strings', category: 'Text', syntax: 'CONCATENATE(text1, [text2], ...)' },
  CONCAT: { description: 'Joins text strings or ranges', category: 'Text', syntax: 'CONCAT(text1, [text2], ...)' },
  TEXTJOIN: { description: 'Joins with delimiter', category: 'Text', syntax: 'TEXTJOIN(delimiter, ignore_empty, text1, ...)' },
  LEFT: { description: 'Returns leftmost characters', category: 'Text', syntax: 'LEFT(text, [num_chars])' },
  RIGHT: { description: 'Returns rightmost characters', category: 'Text', syntax: 'RIGHT(text, [num_chars])' },
  MID: { description: 'Returns characters from middle', category: 'Text', syntax: 'MID(text, start_num, num_chars)' },
  LEN: { description: 'Returns length of text', category: 'Text', syntax: 'LEN(text)' },
  UPPER: { description: 'Converts to uppercase', category: 'Text', syntax: 'UPPER(text)' },
  LOWER: { description: 'Converts to lowercase', category: 'Text', syntax: 'LOWER(text)' },
  PROPER: { description: 'Capitalizes first letters', category: 'Text', syntax: 'PROPER(text)' },
  TRIM: { description: 'Removes extra spaces', category: 'Text', syntax: 'TRIM(text)' },
  SUBSTITUTE: { description: 'Replaces text', category: 'Text', syntax: 'SUBSTITUTE(text, old_text, new_text, [instance])' },
  REPLACE: { description: 'Replaces text by position', category: 'Text', syntax: 'REPLACE(old_text, start, num_chars, new_text)' },
  FIND: { description: 'Finds text position (case-sensitive)', category: 'Text', syntax: 'FIND(find_text, within_text, [start])' },
  SEARCH: { description: 'Finds text position (case-insensitive)', category: 'Text', syntax: 'SEARCH(find_text, within_text, [start])' },
  TEXT: { description: 'Formats number as text', category: 'Text', syntax: 'TEXT(value, format_text)' },
  VALUE: { description: 'Converts text to number', category: 'Text', syntax: 'VALUE(text)' },

  // Logical
  IF: { description: 'Conditional logic', category: 'Logical', syntax: 'IF(condition, value_if_true, [value_if_false])' },
  IFS: { description: 'Multiple conditions', category: 'Logical', syntax: 'IFS(condition1, value1, [condition2, value2], ...)' },
  AND: { description: 'TRUE if all conditions true', category: 'Logical', syntax: 'AND(logical1, [logical2], ...)' },
  OR: { description: 'TRUE if any condition true', category: 'Logical', syntax: 'OR(logical1, [logical2], ...)' },
  NOT: { description: 'Reverses logic', category: 'Logical', syntax: 'NOT(logical)' },
  XOR: { description: 'Exclusive OR', category: 'Logical', syntax: 'XOR(logical1, [logical2], ...)' },
  TRUE: { description: 'Returns TRUE', category: 'Logical', syntax: 'TRUE()' },
  FALSE: { description: 'Returns FALSE', category: 'Logical', syntax: 'FALSE()' },
  IFERROR: { description: 'Value if error', category: 'Logical', syntax: 'IFERROR(value, value_if_error)' },
  IFNA: { description: 'Value if #N/A', category: 'Logical', syntax: 'IFNA(value, value_if_na)' },
  SWITCH: { description: 'Switch between values', category: 'Logical', syntax: 'SWITCH(expression, value1, result1, ...)' },

  // Date
  TODAY: { description: 'Current date', category: 'Date', syntax: 'TODAY()' },
  NOW: { description: 'Current date and time', category: 'Date', syntax: 'NOW()' },
  DATE: { description: 'Creates date from parts', category: 'Date', syntax: 'DATE(year, month, day)' },
  YEAR: { description: 'Extracts year', category: 'Date', syntax: 'YEAR(date)' },
  MONTH: { description: 'Extracts month', category: 'Date', syntax: 'MONTH(date)' },
  DAY: { description: 'Extracts day', category: 'Date', syntax: 'DAY(date)' },
  WEEKDAY: { description: 'Day of week (1-7)', category: 'Date', syntax: 'WEEKDAY(date, [type])' },
  HOUR: { description: 'Extracts hour', category: 'Date', syntax: 'HOUR(time)' },
  MINUTE: { description: 'Extracts minute', category: 'Date', syntax: 'MINUTE(time)' },
  SECOND: { description: 'Extracts second', category: 'Date', syntax: 'SECOND(time)' },
  DATEDIF: { description: 'Difference between dates', category: 'Date', syntax: 'DATEDIF(start_date, end_date, unit)' },
  EDATE: { description: 'Date months before/after', category: 'Date', syntax: 'EDATE(start_date, months)' },
  EOMONTH: { description: 'End of month', category: 'Date', syntax: 'EOMONTH(start_date, months)' },

  // Lookup
  VLOOKUP: { description: 'Vertical lookup', category: 'Lookup', syntax: 'VLOOKUP(lookup_value, table, col_index, [range_lookup])' },
  HLOOKUP: { description: 'Horizontal lookup', category: 'Lookup', syntax: 'HLOOKUP(lookup_value, table, row_index, [range_lookup])' },
  XLOOKUP: { description: 'Advanced lookup', category: 'Lookup', syntax: 'XLOOKUP(lookup_value, lookup_array, return_array, ...)' },
  INDEX: { description: 'Value at row/col position', category: 'Lookup', syntax: 'INDEX(array, row_num, [col_num])' },
  MATCH: { description: 'Position of value in range', category: 'Lookup', syntax: 'MATCH(lookup_value, lookup_array, [match_type])' },
  CHOOSE: { description: 'Chooses from list', category: 'Lookup', syntax: 'CHOOSE(index_num, value1, [value2], ...)' },
  OFFSET: { description: 'Reference offset from cell', category: 'Lookup', syntax: 'OFFSET(reference, rows, cols, [height], [width])' },
  INDIRECT: { description: 'Reference from text', category: 'Lookup', syntax: 'INDIRECT(ref_text, [a1])' },
  ROW: { description: 'Row number', category: 'Lookup', syntax: 'ROW([reference])' },
  COLUMN: { description: 'Column number', category: 'Lookup', syntax: 'COLUMN([reference])' },
  ROWS: { description: 'Number of rows', category: 'Lookup', syntax: 'ROWS(array)' },
  COLUMNS: { description: 'Number of columns', category: 'Lookup', syntax: 'COLUMNS(array)' },

  // Statistical
  STDEV: { description: 'Standard deviation (sample)', category: 'Statistical', syntax: 'STDEV(number1, [number2], ...)' },
  STDEVP: { description: 'Standard deviation (population)', category: 'Statistical', syntax: 'STDEVP(number1, [number2], ...)' },
  VAR: { description: 'Variance (sample)', category: 'Statistical', syntax: 'VAR(number1, [number2], ...)' },
  VARP: { description: 'Variance (population)', category: 'Statistical', syntax: 'VARP(number1, [number2], ...)' },
  MEDIAN: { description: 'Middle value', category: 'Statistical', syntax: 'MEDIAN(number1, [number2], ...)' },
  MODE: { description: 'Most common value', category: 'Statistical', syntax: 'MODE(number1, [number2], ...)' },
  LARGE: { description: 'Kth largest value', category: 'Statistical', syntax: 'LARGE(array, k)' },
  SMALL: { description: 'Kth smallest value', category: 'Statistical', syntax: 'SMALL(array, k)' },
  RANK: { description: 'Rank of number', category: 'Statistical', syntax: 'RANK(number, ref, [order])' },
  PERCENTILE: { description: 'Value at percentile', category: 'Statistical', syntax: 'PERCENTILE(array, k)' },
  CORREL: { description: 'Correlation coefficient', category: 'Statistical', syntax: 'CORREL(array1, array2)' },

  // Financial
  PMT: { description: 'Payment for loan', category: 'Financial', syntax: 'PMT(rate, nper, pv, [fv], [type])' },
  FV: { description: 'Future value', category: 'Financial', syntax: 'FV(rate, nper, pmt, [pv], [type])' },
  PV: { description: 'Present value', category: 'Financial', syntax: 'PV(rate, nper, pmt, [fv], [type])' },
  NPV: { description: 'Net present value', category: 'Financial', syntax: 'NPV(rate, value1, [value2], ...)' },
  IRR: { description: 'Internal rate of return', category: 'Financial', syntax: 'IRR(values, [guess])' },
  RATE: { description: 'Interest rate per period', category: 'Financial', syntax: 'RATE(nper, pmt, pv, [fv], [type], [guess])' },
  NPER: { description: 'Number of periods', category: 'Financial', syntax: 'NPER(rate, pmt, pv, [fv], [type])' },

  // Array
  SORT: { description: 'Sorts range or array', category: 'Array', syntax: 'SORT(array, [sort_index], [sort_order], [by_col])' },
  SORTBY: { description: 'Sorts by another array', category: 'Array', syntax: 'SORTBY(array, by_array1, [sort_order1], ...)' },
  FILTER: { description: 'Filters by conditions', category: 'Array', syntax: 'FILTER(array, include, [if_empty])' },
  UNIQUE: { description: 'Unique values', category: 'Array', syntax: 'UNIQUE(array, [by_col], [exactly_once])' },
  SEQUENCE: { description: 'Generates sequence', category: 'Array', syntax: 'SEQUENCE(rows, [cols], [start], [step])' },
  TRANSPOSE: { description: 'Transposes array', category: 'Array', syntax: 'TRANSPOSE(array)' },
  FLATTEN: { description: 'Flattens array', category: 'Array', syntax: 'FLATTEN(range1, [range2], ...)' },

  // Lambda
  LAMBDA: { description: 'Creates custom function', category: 'Lambda', syntax: 'LAMBDA(parameter1, ..., calculation)' },
  LET: { description: 'Names calculation results', category: 'Lambda', syntax: 'LET(name1, value1, ..., calculation)' },
  MAP: { description: 'Applies LAMBDA to each element', category: 'Lambda', syntax: 'MAP(array1, ..., LAMBDA)' },
  REDUCE: { description: 'Reduces array to value', category: 'Lambda', syntax: 'REDUCE(initial_value, array, LAMBDA)' },
  SCAN: { description: 'Scans with running total', category: 'Lambda', syntax: 'SCAN(initial_value, array, LAMBDA)' },
  MAKEARRAY: { description: 'Creates array with LAMBDA', category: 'Lambda', syntax: 'MAKEARRAY(rows, cols, LAMBDA)' },
  BYROW: { description: 'Applies LAMBDA to each row', category: 'Lambda', syntax: 'BYROW(array, LAMBDA)' },
  BYCOL: { description: 'Applies LAMBDA to each column', category: 'Lambda', syntax: 'BYCOL(array, LAMBDA)' },
};

// Recent functions storage key
const RECENT_FUNCTIONS_KEY = 'excelai-recent-functions';
const MAX_RECENT_FUNCTIONS = 5;

// Get recent functions from localStorage
function getRecentFunctions(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_FUNCTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save recent function
export function saveRecentFunction(name: string): void {
  try {
    const recent = getRecentFunctions();
    const filtered = recent.filter(f => f !== name.toUpperCase());
    const updated = [name.toUpperCase(), ...filtered].slice(0, MAX_RECENT_FUNCTIONS);
    localStorage.setItem(RECENT_FUNCTIONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

// Parse formula to get current word being typed
function getCurrentWord(formula: string, cursorPosition: number): { word: string; startPos: number } {
  // Get text before cursor
  const beforeCursor = formula.slice(0, cursorPosition);

  // Find the start of the current word (function name or identifier)
  const match = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
  if (match) {
    return {
      word: match[1],
      startPos: cursorPosition - match[1].length,
    };
  }

  return { word: '', startPos: cursorPosition };
}

// Fuzzy match score
function fuzzyScore(query: string, target: string): number {
  const q = query.toUpperCase();
  const t = target.toUpperCase();

  // Exact start match is best
  if (t.startsWith(q)) return 100;

  // Contains match
  if (t.includes(q)) return 50;

  // Fuzzy match
  let score = 0;
  let qIndex = 0;
  for (let i = 0; i < t.length && qIndex < q.length; i++) {
    if (t[i] === q[qIndex]) {
      score += 10;
      qIndex++;
    }
  }

  return qIndex === q.length ? score : 0;
}

export const FormulaAutocomplete: React.FC<FormulaAutocompleteProps> = ({
  formula,
  cursorPosition,
  onSelect,
  onClose,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { getAllNames } = useNameManagerStore();

  // Get current word being typed
  const { word: currentWord } = useMemo(
    () => getCurrentWord(formula, cursorPosition),
    [formula, cursorPosition]
  );

  // Get all suggestions
  const suggestions = useMemo((): AutocompleteSuggestion[] => {
    const results: AutocompleteSuggestion[] = [];
    const recentFns = getRecentFunctions();

    // If formula doesn't start with =, no suggestions
    if (!formula.startsWith('=')) return [];

    // If no current word, show recent functions first
    if (!currentWord || currentWord.length === 0) {
      // Add recent functions
      for (const fn of recentFns) {
        const meta = FUNCTION_METADATA[fn];
        if (meta) {
          results.push({
            type: 'function',
            name: fn,
            description: meta.description,
            syntax: meta.syntax,
            category: meta.category,
            isRecent: true,
          });
        }
      }
      return results.slice(0, 10);
    }

    // Get matching functions
    const allFunctions = getAllFunctionNames();
    const scored: { suggestion: AutocompleteSuggestion; score: number }[] = [];

    for (const fn of allFunctions) {
      const score = fuzzyScore(currentWord, fn);
      if (score > 0) {
        const meta = FUNCTION_METADATA[fn] || {
          description: `${fn} function`,
          category: 'Other',
          syntax: `${fn}()`,
        };

        scored.push({
          suggestion: {
            type: 'function',
            name: fn,
            description: meta.description,
            syntax: meta.syntax,
            category: meta.category,
            isRecent: recentFns.includes(fn),
          },
          score: score + (recentFns.includes(fn) ? 5 : 0),
        });
      }
    }

    // Get matching named items
    const namedItems = getAllNames();
    for (const item of namedItems) {
      const score = fuzzyScore(currentWord, item.name);
      if (score > 0) {
        scored.push({
          suggestion: {
            type: item.type === 'lambda' ? 'lambda' :
                  item.type === 'range' ? 'range' :
                  item.type === 'constant' ? 'constant' : 'name',
            name: item.name,
            description: item.comment || `${item.type}: ${item.refersTo}`,
            syntax: item.type === 'lambda' && item.parameters
              ? `${item.name}(${item.parameters.join(', ')})`
              : item.name,
            category: 'Named',
          },
          score,
        });
      }
    }

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.suggestion).slice(0, 15);
  }, [formula, currentWord, getAllNames]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Tab':
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [suggestions, selectedIndex, onClose]);

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle selection
  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    // Save to recent if it's a function
    if (suggestion.type === 'function') {
      saveRecentFunction(suggestion.name);
    }

    // Determine insert text
    let insertText = suggestion.name;
    if (suggestion.type === 'function' || suggestion.type === 'lambda') {
      insertText = suggestion.name + '(';
    }

    onSelect(suggestion, insertText);
  };

  // Don't show if no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="formula-autocomplete"
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        zIndex: 1000,
      }}
    >
      <div className="autocomplete-list" ref={listRef}>
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${suggestion.name}`}
            className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => handleSelect(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="autocomplete-icon">
              {suggestion.isRecent && <Clock size={12} className="recent-icon" />}
              {CATEGORY_ICONS[suggestion.category || 'Other'] || <Calculator size={14} />}
            </div>
            <div className="autocomplete-content">
              <div className="autocomplete-name">
                {suggestion.name}
                {suggestion.type !== 'function' && (
                  <span className="autocomplete-type">{suggestion.type}</span>
                )}
              </div>
              <div className="autocomplete-description">{suggestion.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Syntax hint for selected item */}
      {suggestions[selectedIndex]?.syntax && (
        <div className="autocomplete-syntax">
          <code>{suggestions[selectedIndex].syntax}</code>
        </div>
      )}
    </div>
  );
};

export default FormulaAutocomplete;

import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

// All Excel functions
const ALL_FUNCTIONS = [
  // Math
  { name: 'SUM', category: 'Math', syntax: 'SUM(number1, [number2], ...)', desc: 'Adds all numbers in a range' },
  { name: 'AVERAGE', category: 'Math', syntax: 'AVERAGE(number1, [number2], ...)', desc: 'Returns the average of arguments' },
  { name: 'COUNT', category: 'Math', syntax: 'COUNT(value1, [value2], ...)', desc: 'Counts cells with numbers' },
  { name: 'COUNTA', category: 'Math', syntax: 'COUNTA(value1, [value2], ...)', desc: 'Counts non-empty cells' },
  { name: 'MAX', category: 'Math', syntax: 'MAX(number1, [number2], ...)', desc: 'Returns the maximum value' },
  { name: 'MIN', category: 'Math', syntax: 'MIN(number1, [number2], ...)', desc: 'Returns the minimum value' },
  { name: 'ROUND', category: 'Math', syntax: 'ROUND(number, num_digits)', desc: 'Rounds to specified digits' },
  { name: 'ROUNDUP', category: 'Math', syntax: 'ROUNDUP(number, num_digits)', desc: 'Rounds up' },
  { name: 'ROUNDDOWN', category: 'Math', syntax: 'ROUNDDOWN(number, num_digits)', desc: 'Rounds down' },
  { name: 'ABS', category: 'Math', syntax: 'ABS(number)', desc: 'Returns absolute value' },
  { name: 'SQRT', category: 'Math', syntax: 'SQRT(number)', desc: 'Returns square root' },
  { name: 'POWER', category: 'Math', syntax: 'POWER(number, power)', desc: 'Returns number raised to power' },
  { name: 'MOD', category: 'Math', syntax: 'MOD(number, divisor)', desc: 'Returns remainder' },
  { name: 'CEILING', category: 'Math', syntax: 'CEILING(number, significance)', desc: 'Rounds up to nearest multiple' },
  { name: 'FLOOR', category: 'Math', syntax: 'FLOOR(number, significance)', desc: 'Rounds down to nearest multiple' },
  { name: 'RAND', category: 'Math', syntax: 'RAND()', desc: 'Returns random number 0-1' },
  { name: 'RANDBETWEEN', category: 'Math', syntax: 'RANDBETWEEN(bottom, top)', desc: 'Random integer between values' },

  // Text
  { name: 'CONCATENATE', category: 'Text', syntax: 'CONCATENATE(text1, [text2], ...)', desc: 'Joins text strings' },
  { name: 'CONCAT', category: 'Text', syntax: 'CONCAT(text1, [text2], ...)', desc: 'Joins text strings' },
  { name: 'LEFT', category: 'Text', syntax: 'LEFT(text, [num_chars])', desc: 'Returns leftmost characters' },
  { name: 'RIGHT', category: 'Text', syntax: 'RIGHT(text, [num_chars])', desc: 'Returns rightmost characters' },
  { name: 'MID', category: 'Text', syntax: 'MID(text, start_num, num_chars)', desc: 'Returns middle characters' },
  { name: 'LEN', category: 'Text', syntax: 'LEN(text)', desc: 'Returns text length' },
  { name: 'UPPER', category: 'Text', syntax: 'UPPER(text)', desc: 'Converts to uppercase' },
  { name: 'LOWER', category: 'Text', syntax: 'LOWER(text)', desc: 'Converts to lowercase' },
  { name: 'PROPER', category: 'Text', syntax: 'PROPER(text)', desc: 'Capitalizes each word' },
  { name: 'TRIM', category: 'Text', syntax: 'TRIM(text)', desc: 'Removes extra spaces' },
  { name: 'SUBSTITUTE', category: 'Text', syntax: 'SUBSTITUTE(text, old, new)', desc: 'Replaces text' },
  { name: 'TEXT', category: 'Text', syntax: 'TEXT(value, format_text)', desc: 'Formats number as text' },
  { name: 'VALUE', category: 'Text', syntax: 'VALUE(text)', desc: 'Converts text to number' },

  // Logical
  { name: 'IF', category: 'Logical', syntax: 'IF(logical_test, value_if_true, value_if_false)', desc: 'Conditional test' },
  { name: 'IFS', category: 'Logical', syntax: 'IFS(test1, value1, [test2, value2], ...)', desc: 'Multiple conditions' },
  { name: 'AND', category: 'Logical', syntax: 'AND(logical1, [logical2], ...)', desc: 'Returns TRUE if all true' },
  { name: 'OR', category: 'Logical', syntax: 'OR(logical1, [logical2], ...)', desc: 'Returns TRUE if any true' },
  { name: 'NOT', category: 'Logical', syntax: 'NOT(logical)', desc: 'Reverses logic' },
  { name: 'XOR', category: 'Logical', syntax: 'XOR(logical1, [logical2], ...)', desc: 'Exclusive OR' },
  { name: 'IFERROR', category: 'Logical', syntax: 'IFERROR(value, value_if_error)', desc: 'Handles errors' },
  { name: 'IFNA', category: 'Logical', syntax: 'IFNA(value, value_if_na)', desc: 'Handles #N/A errors' },
  { name: 'SWITCH', category: 'Logical', syntax: 'SWITCH(expression, value1, result1, ...)', desc: 'Switch statement' },

  // Date & Time
  { name: 'TODAY', category: 'Date', syntax: 'TODAY()', desc: 'Returns current date' },
  { name: 'NOW', category: 'Date', syntax: 'NOW()', desc: 'Returns current date and time' },
  { name: 'DATE', category: 'Date', syntax: 'DATE(year, month, day)', desc: 'Creates a date' },
  { name: 'TIME', category: 'Date', syntax: 'TIME(hour, minute, second)', desc: 'Creates a time' },
  { name: 'YEAR', category: 'Date', syntax: 'YEAR(serial_number)', desc: 'Returns year' },
  { name: 'MONTH', category: 'Date', syntax: 'MONTH(serial_number)', desc: 'Returns month' },
  { name: 'DAY', category: 'Date', syntax: 'DAY(serial_number)', desc: 'Returns day' },
  { name: 'HOUR', category: 'Date', syntax: 'HOUR(serial_number)', desc: 'Returns hour' },
  { name: 'WEEKDAY', category: 'Date', syntax: 'WEEKDAY(serial_number, [return_type])', desc: 'Returns day of week' },
  { name: 'EDATE', category: 'Date', syntax: 'EDATE(start_date, months)', desc: 'Date plus months' },
  { name: 'EOMONTH', category: 'Date', syntax: 'EOMONTH(start_date, months)', desc: 'End of month' },
  { name: 'DATEDIF', category: 'Date', syntax: 'DATEDIF(start, end, unit)', desc: 'Difference between dates' },

  // Lookup
  { name: 'VLOOKUP', category: 'Lookup', syntax: 'VLOOKUP(lookup_value, table_array, col_index, [range_lookup])', desc: 'Vertical lookup' },
  { name: 'HLOOKUP', category: 'Lookup', syntax: 'HLOOKUP(lookup_value, table_array, row_index, [range_lookup])', desc: 'Horizontal lookup' },
  { name: 'XLOOKUP', category: 'Lookup', syntax: 'XLOOKUP(lookup_value, lookup_array, return_array)', desc: 'Modern lookup' },
  { name: 'INDEX', category: 'Lookup', syntax: 'INDEX(array, row_num, [column_num])', desc: 'Returns value at position' },
  { name: 'MATCH', category: 'Lookup', syntax: 'MATCH(lookup_value, lookup_array, [match_type])', desc: 'Returns position' },
  { name: 'CHOOSE', category: 'Lookup', syntax: 'CHOOSE(index_num, value1, [value2], ...)', desc: 'Chooses from list' },
  { name: 'INDIRECT', category: 'Lookup', syntax: 'INDIRECT(ref_text)', desc: 'Returns reference from text' },
  { name: 'OFFSET', category: 'Lookup', syntax: 'OFFSET(reference, rows, cols, [height], [width])', desc: 'Returns offset reference' },
  { name: 'ROW', category: 'Lookup', syntax: 'ROW([reference])', desc: 'Returns row number' },
  { name: 'COLUMN', category: 'Lookup', syntax: 'COLUMN([reference])', desc: 'Returns column number' },

  // Statistical
  { name: 'COUNTIF', category: 'Statistical', syntax: 'COUNTIF(range, criteria)', desc: 'Counts cells meeting criteria' },
  { name: 'COUNTIFS', category: 'Statistical', syntax: 'COUNTIFS(range1, criteria1, ...)', desc: 'Counts with multiple criteria' },
  { name: 'SUMIF', category: 'Statistical', syntax: 'SUMIF(range, criteria, [sum_range])', desc: 'Sums cells meeting criteria' },
  { name: 'SUMIFS', category: 'Statistical', syntax: 'SUMIFS(sum_range, range1, criteria1, ...)', desc: 'Sums with multiple criteria' },
  { name: 'AVERAGEIF', category: 'Statistical', syntax: 'AVERAGEIF(range, criteria, [average_range])', desc: 'Average with criteria' },
  { name: 'MEDIAN', category: 'Statistical', syntax: 'MEDIAN(number1, [number2], ...)', desc: 'Returns median' },
  { name: 'MODE', category: 'Statistical', syntax: 'MODE(number1, [number2], ...)', desc: 'Returns mode' },
  { name: 'STDEV', category: 'Statistical', syntax: 'STDEV(number1, [number2], ...)', desc: 'Standard deviation' },
  { name: 'LARGE', category: 'Statistical', syntax: 'LARGE(array, k)', desc: 'Returns k-th largest' },
  { name: 'SMALL', category: 'Statistical', syntax: 'SMALL(array, k)', desc: 'Returns k-th smallest' },
  { name: 'RANK', category: 'Statistical', syntax: 'RANK(number, ref, [order])', desc: 'Returns rank' },

  // Financial
  { name: 'PMT', category: 'Financial', syntax: 'PMT(rate, nper, pv, [fv], [type])', desc: 'Calculates loan payment' },
  { name: 'PV', category: 'Financial', syntax: 'PV(rate, nper, pmt, [fv], [type])', desc: 'Present value' },
  { name: 'FV', category: 'Financial', syntax: 'FV(rate, nper, pmt, [pv], [type])', desc: 'Future value' },
  { name: 'NPV', category: 'Financial', syntax: 'NPV(rate, value1, [value2], ...)', desc: 'Net present value' },
  { name: 'IRR', category: 'Financial', syntax: 'IRR(values, [guess])', desc: 'Internal rate of return' },
  { name: 'RATE', category: 'Financial', syntax: 'RATE(nper, pmt, pv, [fv], [type])', desc: 'Interest rate' },
  { name: 'NPER', category: 'Financial', syntax: 'NPER(rate, pmt, pv, [fv], [type])', desc: 'Number of periods' },
];

const CATEGORIES = ['All', 'Math', 'Text', 'Logical', 'Date', 'Lookup', 'Statistical', 'Financial'];

interface InsertFunctionDialogProps {
  onClose: () => void;
  onInsert: (funcName: string) => void;
}

export const InsertFunctionDialog: React.FC<InsertFunctionDialogProps> = ({
  onClose,
  onInsert
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedFunc, setSelectedFunc] = useState<typeof ALL_FUNCTIONS[0] | null>(null);

  const filteredFunctions = useMemo(() => {
    return ALL_FUNCTIONS.filter(fn => {
      const matchesSearch = search === '' ||
        fn.name.toLowerCase().includes(search.toLowerCase()) ||
        fn.desc.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || fn.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const handleInsert = () => {
    if (selectedFunc) {
      onInsert(selectedFunc.name);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 560, height: 520 }}>
        <div className="dialog-header">
          <h2>Insert Function</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Search */}
          <div className="dialog-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search for a function..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Category Filter */}
          <div className="dialog-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Function List */}
          <div className="function-list">
            {filteredFunctions.map(fn => (
              <div
                key={fn.name}
                className={`function-item ${selectedFunc?.name === fn.name ? 'selected' : ''}`}
                onClick={() => setSelectedFunc(fn)}
                onDoubleClick={() => onInsert(fn.name)}
              >
                <div className="fn-name">{fn.name}</div>
                <div className="fn-syntax">{fn.syntax}</div>
              </div>
            ))}
          </div>

          {/* Function Details */}
          {selectedFunc && (
            <div className="function-details">
              <div className="fn-detail-name">{selectedFunc.name}</div>
              <div className="fn-detail-syntax">{selectedFunc.syntax}</div>
              <div className="fn-detail-desc">{selectedFunc.desc}</div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dialog-btn-primary"
            onClick={handleInsert}
            disabled={!selectedFunc}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

import { FormulaValue, FormulaError } from '../types';

// Flatten nested arrays of values into a single array
export function flattenValues(values: FormulaValue[]): FormulaValue[] {
  const result: FormulaValue[] = [];

  function flatten(val: FormulaValue | FormulaValue[]): void {
    if (Array.isArray(val)) {
      for (const item of val) {
        flatten(item as FormulaValue | FormulaValue[]);
      }
    } else {
      result.push(val);
    }
  }

  for (const val of values) {
    flatten(val as FormulaValue | FormulaValue[]);
  }

  return result;
}

// Convert value to number
export function toNumber(val: FormulaValue): number | FormulaError {
  if (val instanceof FormulaError) return val;
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val === null || val === '') return 0;
  if (typeof val === 'string') {
    const num = parseFloat(val);
    if (isNaN(num)) {
      return new FormulaError('#VALUE!', `Cannot convert "${val}" to number`);
    }
    return num;
  }
  return new FormulaError('#VALUE!');
}

// Convert value to string
export function toString(val: FormulaValue): string {
  if (val instanceof FormulaError) return val.type;
  if (val === null) return '';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val;
  return String(val);
}

// Convert value to boolean
export function toBoolean(val: FormulaValue): boolean | FormulaError {
  if (val instanceof FormulaError) return val;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const upper = val.toUpperCase();
    if (upper === 'TRUE') return true;
    if (upper === 'FALSE') return false;
    return new FormulaError('#VALUE!', 'Cannot convert to boolean');
  }
  if (val === null) return false;
  return false;
}

// Check if value is an error
export function isError(val: FormulaValue): val is FormulaError {
  return val instanceof FormulaError;
}

// Check if value is blank/empty
export function isBlank(val: FormulaValue): boolean {
  return val === null || val === '' || val === undefined;
}

// Check if value is a number
export function isNumber(val: FormulaValue): val is number {
  return typeof val === 'number' && !isNaN(val);
}

// Check if value is text
export function isText(val: FormulaValue): val is string {
  return typeof val === 'string';
}

// Get numbers from values, ignoring non-numbers
// Note: String numbers passed directly as arguments are counted (Excel behavior for direct args)
export function getNumbers(values: FormulaValue[]): number[] {
  const flat = flattenValues(values);
  const result: number[] = [];

  for (const val of flat) {
    if (typeof val === 'number' && !isNaN(val)) {
      result.push(val);
    } else if (typeof val === 'string') {
      // Try to parse string as number (for direct string arguments)
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && val.trim() !== '') {
        result.push(parsed);
      }
    }
  }

  return result;
}

// Compare two values (for sorting/matching)
export function compareValues(a: FormulaValue, b: FormulaValue): number {
  // Errors first
  if (isError(a) && isError(b)) return 0;
  if (isError(a)) return -1;
  if (isError(b)) return 1;

  // Nulls
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;

  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Mixed types - numbers before strings before booleans
  const typeOrder = { number: 0, string: 1, boolean: 2 };
  const typeA = typeof a as keyof typeof typeOrder;
  const typeB = typeof b as keyof typeof typeOrder;
  return (typeOrder[typeA] ?? 3) - (typeOrder[typeB] ?? 3);
}

// Format number for display
export function formatNumber(num: number, decimals?: number): string {
  if (decimals !== undefined) {
    return num.toFixed(decimals);
  }

  // Auto-format: remove trailing zeros after decimal
  if (Number.isInteger(num)) {
    return String(num);
  }

  // Limit to reasonable precision
  const formatted = num.toPrecision(15);
  return parseFloat(formatted).toString();
}

// Parse a date from various formats
export function parseDate(val: FormulaValue): Date | null {
  if (val instanceof Date) return val;

  if (typeof val === 'number') {
    // Excel serial date (days since 1900-01-01)
    const date = new Date(1900, 0, val - 1);
    return date;
  }

  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  return null;
}

// Convert date to Excel serial number
export function dateToSerial(date: Date): number {
  const start = new Date(1900, 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 2; // +2 for Excel compatibility
}

// Convert Excel serial number to Date
export function serialToDate(serial: number): Date {
  // Excel serial date (days since 1900-01-01)
  return new Date(1900, 0, serial - 1);
}

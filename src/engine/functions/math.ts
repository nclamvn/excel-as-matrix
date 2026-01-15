import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { flattenValues, toNumber, isError } from './utils';

export const mathFunctions: FunctionDef[] = [
  // SUM - adds all numbers in a range
  {
    name: 'SUM',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues(args);
      let sum = 0;
      for (const val of values) {
        if (isError(val)) return val;
        if (typeof val === 'number') {
          sum += val;
        }
      }
      return sum;
    },
  },

  // SUMIF - sum cells that meet a condition
  {
    name: 'SUMIF',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const range = args[0] as FormulaValue[][];
      const criteria = args[1];
      const sumRange = args[2] as FormulaValue[][] | undefined;

      if (!Array.isArray(range)) {
        return new FormulaError('#VALUE!', 'SUMIF requires a range');
      }

      let sum = 0;
      const flat = flattenValues([range]);
      const sumFlat = sumRange ? flattenValues([sumRange]) : flat;

      for (let i = 0; i < flat.length; i++) {
        if (matchesCriteria(flat[i], criteria)) {
          const val = sumFlat[i];
          if (typeof val === 'number') {
            sum += val;
          }
        }
      }

      return sum;
    },
  },

  // PRODUCT - multiplies all numbers
  {
    name: 'PRODUCT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues(args);
      let product = 1;
      let hasNumber = false;
      for (const val of values) {
        if (isError(val)) return val;
        if (typeof val === 'number') {
          product *= val;
          hasNumber = true;
        }
      }
      return hasNumber ? product : 0;
    },
  },

  // POWER - raises number to power
  {
    name: 'POWER',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const base = toNumber(args[0]);
      const exp = toNumber(args[1]);
      if (isError(base)) return base;
      if (isError(exp)) return exp;
      return Math.pow(base as number, exp as number);
    },
  },

  // SQRT - square root
  {
    name: 'SQRT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) < 0) {
        return new FormulaError('#NUM!', 'SQRT of negative number');
      }
      return Math.sqrt(num as number);
    },
  },

  // ABS - absolute value
  {
    name: 'ABS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.abs(num as number);
    },
  },

  // ROUND - round to specified digits
  {
    name: 'ROUND',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const digits = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(digits)) return digits;
      const factor = Math.pow(10, digits as number);
      return Math.round((num as number) * factor) / factor;
    },
  },

  // ROUNDUP - round up away from zero
  {
    name: 'ROUNDUP',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const digits = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(digits)) return digits;
      const factor = Math.pow(10, digits as number);
      const n = num as number;
      return n >= 0 ? Math.ceil(n * factor) / factor : Math.floor(n * factor) / factor;
    },
  },

  // ROUNDDOWN - round down toward zero
  {
    name: 'ROUNDDOWN',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const digits = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(digits)) return digits;
      const factor = Math.pow(10, digits as number);
      const n = num as number;
      return n >= 0 ? Math.floor(n * factor) / factor : Math.ceil(n * factor) / factor;
    },
  },

  // CEILING - round up to nearest multiple
  {
    name: 'CEILING',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const sig = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(sig)) return sig;
      if ((sig as number) === 0) return 0;
      return Math.ceil((num as number) / (sig as number)) * (sig as number);
    },
  },

  // FLOOR - round down to nearest multiple
  {
    name: 'FLOOR',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const sig = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(sig)) return sig;
      if ((sig as number) === 0) return 0;
      return Math.floor((num as number) / (sig as number)) * (sig as number);
    },
  },

  // INT - round down to integer
  {
    name: 'INT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.floor(num as number);
    },
  },

  // MOD - modulo/remainder
  {
    name: 'MOD',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const divisor = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(divisor)) return divisor;
      if ((divisor as number) === 0) {
        return new FormulaError('#DIV/0!');
      }
      return (num as number) % (divisor as number);
    },
  },

  // QUOTIENT - integer division
  {
    name: 'QUOTIENT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const divisor = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(divisor)) return divisor;
      if ((divisor as number) === 0) {
        return new FormulaError('#DIV/0!');
      }
      return Math.trunc((num as number) / (divisor as number));
    },
  },

  // RAND - random number between 0 and 1
  {
    name: 'RAND',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      return Math.random();
    },
  },

  // RANDBETWEEN - random integer between two values
  {
    name: 'RANDBETWEEN',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const bottom = toNumber(args[0]);
      const top = toNumber(args[1]);
      if (isError(bottom)) return bottom;
      if (isError(top)) return top;
      const min = Math.ceil(bottom as number);
      const max = Math.floor(top as number);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
  },

  // PI - returns pi
  {
    name: 'PI',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      return Math.PI;
    },
  },

  // EXP - e raised to power
  {
    name: 'EXP',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.exp(num as number);
    },
  },

  // LN - natural logarithm
  {
    name: 'LN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) <= 0) {
        return new FormulaError('#NUM!');
      }
      return Math.log(num as number);
    },
  },

  // LOG - logarithm with base
  {
    name: 'LOG',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) <= 0) {
        return new FormulaError('#NUM!');
      }
      const base = args[1] !== undefined ? toNumber(args[1]) : 10;
      if (isError(base)) return base;
      return Math.log(num as number) / Math.log(base as number);
    },
  },

  // LOG10 - base 10 logarithm
  {
    name: 'LOG10',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) <= 0) {
        return new FormulaError('#NUM!');
      }
      return Math.log10(num as number);
    },
  },

  // SIN, COS, TAN, etc.
  {
    name: 'SIN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.sin(num as number);
    },
  },

  {
    name: 'COS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.cos(num as number);
    },
  },

  {
    name: 'TAN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.tan(num as number);
    },
  },

  // DEGREES - radians to degrees
  {
    name: 'DEGREES',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return (num as number) * (180 / Math.PI);
    },
  },

  // RADIANS - degrees to radians
  {
    name: 'RADIANS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return (num as number) * (Math.PI / 180);
    },
  },
];

// Helper function to match criteria (like ">5", "=A", etc.)
function matchesCriteria(value: FormulaValue, criteria: FormulaValue): boolean {
  if (typeof criteria === 'string') {
    // Parse criteria like ">5", "<=10", "=text"
    const match = criteria.match(/^([<>=!]+)?(.*)$/);
    if (match) {
      const op = match[1] || '=';
      const compareVal = match[2];

      const numCompare = parseFloat(compareVal);
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));

      if (!isNaN(numCompare) && !isNaN(numValue)) {
        switch (op) {
          case '>': return numValue > numCompare;
          case '<': return numValue < numCompare;
          case '>=': return numValue >= numCompare;
          case '<=': return numValue <= numCompare;
          case '<>': case '!=': return numValue !== numCompare;
          case '=': return numValue === numCompare;
        }
      } else {
        // String comparison
        switch (op) {
          case '<>': case '!=': return String(value) !== compareVal;
          case '=': default: return String(value) === compareVal;
        }
      }
    }
  }

  return value === criteria;
}

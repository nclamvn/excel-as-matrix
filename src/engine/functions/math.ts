import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { flattenValues, toNumber, isError } from './utils';

export const mathFunctions: FunctionDef[] = [
  // SUM - adds all numbers in a range
  {
    name: 'SUM',
    minArgs: 0,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (args.length === 0) return 0;
      const values = flattenValues(args);
      let sum = 0;
      for (const val of values) {
        if (isError(val)) return val;
        if (typeof val === 'number') {
          sum += val;
        } else if (typeof val === 'boolean') {
          // Excel counts TRUE as 1, FALSE as 0 in SUM
          sum += val ? 1 : 0;
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

  // ROUND - round to specified digits (Excel rounds away from zero for .5)
  {
    name: 'ROUND',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const digits = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(digits)) return digits;
      const n = num as number;
      const d = digits as number;
      const factor = Math.pow(10, d);
      // Excel rounds away from zero for .5 values
      const scaled = n * factor;
      const rounded = n >= 0 ? Math.round(scaled) : -Math.round(-scaled);
      return rounded / factor;
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

  // MOD - modulo/remainder (Excel: result has same sign as divisor)
  {
    name: 'MOD',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const divisor = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(divisor)) return divisor;
      const n = num as number;
      const d = divisor as number;
      if (d === 0) {
        return new FormulaError('#DIV/0!');
      }
      // Excel MOD: n - d * INT(n/d), result has same sign as divisor
      const result = n - d * Math.floor(n / d);
      return result;
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

  // SUMIFS - sum with multiple criteria
  {
    name: 'SUMIFS',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const sumRange = args[0] as FormulaValue[][];
      if (!Array.isArray(sumRange)) {
        return new FormulaError('#VALUE!', 'SUMIFS requires a sum range');
      }

      const sumFlat = flattenValues([sumRange]);
      let sum = 0;

      // Process criteria pairs
      const criteriaPairs: Array<{ range: FormulaValue[]; criteria: FormulaValue }> = [];
      for (let i = 1; i < args.length; i += 2) {
        const criteriaRange = args[i] as FormulaValue[][];
        const criteria = args[i + 1];
        if (!Array.isArray(criteriaRange)) {
          return new FormulaError('#VALUE!', 'Invalid criteria range');
        }
        criteriaPairs.push({
          range: flattenValues([criteriaRange]),
          criteria,
        });
      }

      // Check each cell
      for (let i = 0; i < sumFlat.length; i++) {
        let allMatch = true;
        for (const pair of criteriaPairs) {
          if (!matchesCriteria(pair.range[i], pair.criteria)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          const val = sumFlat[i];
          if (typeof val === 'number') {
            sum += val;
          }
        }
      }

      return sum;
    },
  },

  // SUMPRODUCT - sum of products
  {
    name: 'SUMPRODUCT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (args.length === 0) return 0;

      // Flatten all arrays
      const arrays = args.map((arg) => flattenValues([arg]));
      const length = arrays[0].length;

      // Check all arrays have same length
      for (const arr of arrays) {
        if (arr.length !== length) {
          return new FormulaError('#VALUE!', 'Arrays must have same dimensions');
        }
      }

      let sum = 0;
      for (let i = 0; i < length; i++) {
        let product = 1;
        for (const arr of arrays) {
          const val = arr[i];
          if (typeof val === 'number') {
            product *= val;
          } else if (typeof val === 'boolean') {
            product *= val ? 1 : 0;
          } else {
            product *= 0;
          }
        }
        sum += product;
      }

      return sum;
    },
  },

  // SIGN - returns sign of number
  {
    name: 'SIGN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.sign(num as number);
    },
  },

  // TRUNC - truncate to integer
  {
    name: 'TRUNC',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const digits = args[1] !== undefined ? toNumber(args[1]) : 0;
      if (isError(digits)) return digits;
      const factor = Math.pow(10, digits as number);
      return Math.trunc((num as number) * factor) / factor;
    },
  },

  // EVEN - round up to nearest even
  {
    name: 'EVEN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      const rounded = n >= 0 ? Math.ceil(n) : Math.floor(n);
      return rounded % 2 === 0 ? rounded : rounded + (n >= 0 ? 1 : -1);
    },
  },

  // ODD - round up to nearest odd
  {
    name: 'ODD',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      const rounded = n >= 0 ? Math.ceil(n) : Math.floor(n);
      return rounded % 2 !== 0 ? rounded : rounded + (n >= 0 ? 1 : -1);
    },
  },

  // FACT - factorial
  {
    name: 'FACT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = Math.floor(num as number);
      if (n < 0) return new FormulaError('#NUM!', 'Negative factorial');
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      return result;
    },
  },

  // COMBIN - combinations
  {
    name: 'COMBIN',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const n = toNumber(args[0]);
      const k = toNumber(args[1]);
      if (isError(n)) return n;
      if (isError(k)) return k;
      const nVal = Math.floor(n as number);
      const kVal = Math.floor(k as number);
      if (nVal < 0 || kVal < 0 || kVal > nVal) {
        return new FormulaError('#NUM!');
      }
      // Calculate n! / (k! * (n-k)!)
      let result = 1;
      for (let i = 0; i < kVal; i++) {
        result = (result * (nVal - i)) / (i + 1);
      }
      return Math.round(result);
    },
  },

  // PERMUT - permutations
  {
    name: 'PERMUT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const n = toNumber(args[0]);
      const k = toNumber(args[1]);
      if (isError(n)) return n;
      if (isError(k)) return k;
      const nVal = Math.floor(n as number);
      const kVal = Math.floor(k as number);
      if (nVal < 0 || kVal < 0 || kVal > nVal) {
        return new FormulaError('#NUM!');
      }
      // Calculate n! / (n-k)!
      let result = 1;
      for (let i = 0; i < kVal; i++) {
        result *= nVal - i;
      }
      return result;
    },
  },

  // GCD - greatest common divisor
  {
    name: 'GCD',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = flattenValues(args)
        .map((v) => toNumber(v))
        .filter((v): v is number => typeof v === 'number' && !isNaN(v))
        .map((v) => Math.abs(Math.floor(v)));

      if (numbers.length === 0) return new FormulaError('#NUM!');

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      return numbers.reduce((acc, num) => gcd(acc, num));
    },
  },

  // LCM - least common multiple
  {
    name: 'LCM',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = flattenValues(args)
        .map((v) => toNumber(v))
        .filter((v): v is number => typeof v === 'number' && !isNaN(v))
        .map((v) => Math.abs(Math.floor(v)));

      if (numbers.length === 0) return new FormulaError('#NUM!');

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
      return numbers.reduce((acc, num) => lcm(acc, num));
    },
  },

  // MROUND - round to multiple
  {
    name: 'MROUND',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      const multiple = toNumber(args[1]);
      if (isError(num)) return num;
      if (isError(multiple)) return multiple;
      if ((multiple as number) === 0) return 0;
      return Math.round((num as number) / (multiple as number)) * (multiple as number);
    },
  },

  // ASIN - arcsine
  {
    name: 'ASIN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) < -1 || (num as number) > 1) {
        return new FormulaError('#NUM!');
      }
      return Math.asin(num as number);
    },
  },

  // ACOS - arccosine
  {
    name: 'ACOS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      if ((num as number) < -1 || (num as number) > 1) {
        return new FormulaError('#NUM!');
      }
      return Math.acos(num as number);
    },
  },

  // ATAN - arctangent
  {
    name: 'ATAN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.atan(num as number);
    },
  },

  // ATAN2 - arctangent from x,y coordinates
  {
    name: 'ATAN2',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      const y = toNumber(args[1]);
      if (isError(x)) return x;
      if (isError(y)) return y;
      if ((x as number) === 0 && (y as number) === 0) {
        return new FormulaError('#DIV/0!');
      }
      return Math.atan2(y as number, x as number);
    },
  },

  // SINH - hyperbolic sine
  {
    name: 'SINH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.sinh(num as number);
    },
  },

  // COSH - hyperbolic cosine
  {
    name: 'COSH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.cosh(num as number);
    },
  },

  // TANH - hyperbolic tangent
  {
    name: 'TANH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.tanh(num as number);
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

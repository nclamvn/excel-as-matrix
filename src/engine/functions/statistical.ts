import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { flattenValues, toNumber, isError, getNumbers, isBlank } from './utils';

export const statisticalFunctions: FunctionDef[] = [
  // AVERAGE - arithmetic mean
  {
    name: 'AVERAGE',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#DIV/0!');
      }
      const sum = numbers.reduce((a, b) => a + b, 0);
      return sum / numbers.length;
    },
  },

  // AVERAGEIF - average with condition
  {
    name: 'AVERAGEIF',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const range = args[0] as FormulaValue[][];
      const criteria = args[1];
      const avgRange = args[2] as FormulaValue[][] | undefined;

      if (!Array.isArray(range)) {
        return new FormulaError('#VALUE!');
      }

      const flat = flattenValues([range]);
      const avgFlat = avgRange ? flattenValues([avgRange]) : flat;
      const numbers: number[] = [];

      for (let i = 0; i < flat.length; i++) {
        if (matchesCriteria(flat[i], criteria)) {
          const val = avgFlat[i];
          if (typeof val === 'number') {
            numbers.push(val);
          }
        }
      }

      if (numbers.length === 0) {
        return new FormulaError('#DIV/0!');
      }

      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    },
  },

  // COUNT - count numbers
  {
    name: 'COUNT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      return getNumbers(args).length;
    },
  },

  // COUNTA - count non-empty values
  {
    name: 'COUNTA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      return flat.filter((v) => !isBlank(v)).length;
    },
  },

  // COUNTBLANK - count empty cells
  {
    name: 'COUNTBLANK',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      return flat.filter((v) => isBlank(v)).length;
    },
  },

  // COUNTIF - count with condition
  {
    name: 'COUNTIF',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const range = args[0];
      const criteria = args[1];

      if (!Array.isArray(range)) {
        return matchesCriteria(range, criteria) ? 1 : 0;
      }

      const flat = flattenValues([range]);
      return flat.filter((v) => matchesCriteria(v, criteria)).length;
    },
  },

  // MAX - maximum value
  {
    name: 'MAX',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return 0;
      return Math.max(...numbers);
    },
  },

  // MIN - minimum value
  {
    name: 'MIN',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return 0;
      return Math.min(...numbers);
    },
  },

  // LARGE - nth largest value
  {
    name: 'LARGE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const k = toNumber(args[1]);
      if (isError(k)) return k;

      if ((k as number) < 1 || (k as number) > numbers.length) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => b - a);
      return numbers[(k as number) - 1];
    },
  },

  // SMALL - nth smallest value
  {
    name: 'SMALL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const k = toNumber(args[1]);
      if (isError(k)) return k;

      if ((k as number) < 1 || (k as number) > numbers.length) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      return numbers[(k as number) - 1];
    },
  },

  // MEDIAN - median value
  {
    name: 'MEDIAN',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      const mid = Math.floor(numbers.length / 2);

      if (numbers.length % 2 === 0) {
        return (numbers[mid - 1] + numbers[mid]) / 2;
      }
      return numbers[mid];
    },
  },

  // MODE - most frequent value
  {
    name: 'MODE',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#N/A');
      }

      const counts = new Map<number, number>();
      for (const num of numbers) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }

      let maxCount = 0;
      let mode = numbers[0];

      for (const [num, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          mode = num;
        }
      }

      if (maxCount === 1) {
        return new FormulaError('#N/A', 'No repeated values');
      }

      return mode;
    },
  },

  // STDEV - sample standard deviation
  {
    name: 'STDEV',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 2) {
        return new FormulaError('#DIV/0!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
      return Math.sqrt(variance);
    },
  },

  // STDEVP - population standard deviation
  {
    name: 'STDEVP',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#DIV/0!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
      return Math.sqrt(variance);
    },
  },

  // VAR - sample variance
  {
    name: 'VAR',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 2) {
        return new FormulaError('#DIV/0!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
    },
  },

  // VARP - population variance
  {
    name: 'VARP',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#DIV/0!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    },
  },

  // RANK - rank of value
  {
    name: 'RANK',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;

      const numbers = getNumbers([args[1]]);
      const order = args[2] !== undefined ? toNumber(args[2]) : 0;
      if (isError(order)) return order;

      if ((order as number) === 0) {
        // Descending (largest = 1)
        numbers.sort((a, b) => b - a);
      } else {
        // Ascending (smallest = 1)
        numbers.sort((a, b) => a - b);
      }

      const index = numbers.indexOf(num as number);
      if (index === -1) {
        return new FormulaError('#N/A');
      }

      return index + 1;
    },
  },

  // PERCENTILE - percentile value
  {
    name: 'PERCENTILE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const k = toNumber(args[1]);
      if (isError(k)) return k;

      if ((k as number) < 0 || (k as number) > 1) {
        return new FormulaError('#NUM!');
      }

      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      const n = numbers.length;
      const position = (k as number) * (n - 1);
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower === upper) {
        return numbers[lower];
      }

      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // CORREL - correlation coefficient
  {
    name: 'CORREL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array1 = getNumbers([args[0]]);
      const array2 = getNumbers([args[1]]);

      if (array1.length !== array2.length || array1.length < 2) {
        return new FormulaError('#N/A');
      }

      const n = array1.length;
      const mean1 = array1.reduce((a, b) => a + b, 0) / n;
      const mean2 = array2.reduce((a, b) => a + b, 0) / n;

      let sumProduct = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      for (let i = 0; i < n; i++) {
        const d1 = array1[i] - mean1;
        const d2 = array2[i] - mean2;
        sumProduct += d1 * d2;
        sumSq1 += d1 * d1;
        sumSq2 += d2 * d2;
      }

      const denominator = Math.sqrt(sumSq1 * sumSq2);
      if (denominator === 0) {
        return new FormulaError('#DIV/0!');
      }

      return sumProduct / denominator;
    },
  },
];

// Helper function to match criteria
function matchesCriteria(value: FormulaValue, criteria: FormulaValue): boolean {
  if (typeof criteria === 'string') {
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
        switch (op) {
          case '<>': case '!=': return String(value) !== compareVal;
          case '=': default: return String(value) === compareVal;
        }
      }
    }
  }
  return value === criteria;
}

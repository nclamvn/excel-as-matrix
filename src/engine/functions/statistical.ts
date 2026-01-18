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

  // COUNTA - count non-empty values (empty strings count as values)
  {
    name: 'COUNTA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      // COUNTA counts any non-null/undefined value, including empty strings
      return flat.filter((v) => v !== null && v !== undefined).length;
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

  // COUNTIFS - count with multiple criteria
  {
    name: 'COUNTIFS',
    minArgs: 2,
    maxArgs: 254,
    fn: (args: FormulaValue[]): FormulaValue => {
      // Process criteria pairs
      const criteriaPairs: Array<{ range: FormulaValue[]; criteria: FormulaValue }> = [];
      for (let i = 0; i < args.length; i += 2) {
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

      if (criteriaPairs.length === 0) return 0;

      const length = criteriaPairs[0].range.length;
      let count = 0;

      // Check each cell
      for (let i = 0; i < length; i++) {
        let allMatch = true;
        for (const pair of criteriaPairs) {
          if (!matchesCriteria(pair.range[i], pair.criteria)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          count++;
        }
      }

      return count;
    },
  },

  // AVERAGEIFS - average with multiple criteria
  {
    name: 'AVERAGEIFS',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const avgRange = args[0] as FormulaValue[][];
      if (!Array.isArray(avgRange)) {
        return new FormulaError('#VALUE!', 'AVERAGEIFS requires an average range');
      }

      const avgFlat = flattenValues([avgRange]);

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

      const numbers: number[] = [];

      // Check each cell
      for (let i = 0; i < avgFlat.length; i++) {
        let allMatch = true;
        for (const pair of criteriaPairs) {
          if (!matchesCriteria(pair.range[i], pair.criteria)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
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

  // MAXIFS - max with criteria
  {
    name: 'MAXIFS',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const maxRange = args[0] as FormulaValue[][];
      if (!Array.isArray(maxRange)) {
        return new FormulaError('#VALUE!', 'MAXIFS requires a max range');
      }

      const maxFlat = flattenValues([maxRange]);

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

      const numbers: number[] = [];

      for (let i = 0; i < maxFlat.length; i++) {
        let allMatch = true;
        for (const pair of criteriaPairs) {
          if (!matchesCriteria(pair.range[i], pair.criteria)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          const val = maxFlat[i];
          if (typeof val === 'number') {
            numbers.push(val);
          }
        }
      }

      if (numbers.length === 0) return 0;
      return Math.max(...numbers);
    },
  },

  // MINIFS - min with criteria
  {
    name: 'MINIFS',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const minRange = args[0] as FormulaValue[][];
      if (!Array.isArray(minRange)) {
        return new FormulaError('#VALUE!', 'MINIFS requires a min range');
      }

      const minFlat = flattenValues([minRange]);

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

      const numbers: number[] = [];

      for (let i = 0; i < minFlat.length; i++) {
        let allMatch = true;
        for (const pair of criteriaPairs) {
          if (!matchesCriteria(pair.range[i], pair.criteria)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          const val = minFlat[i];
          if (typeof val === 'number') {
            numbers.push(val);
          }
        }
      }

      if (numbers.length === 0) return 0;
      return Math.min(...numbers);
    },
  },

  // GEOMEAN - geometric mean
  {
    name: 'GEOMEAN',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }
      for (const n of numbers) {
        if (n <= 0) return new FormulaError('#NUM!');
      }
      const product = numbers.reduce((a, b) => a * b, 1);
      return Math.pow(product, 1 / numbers.length);
    },
  },

  // HARMEAN - harmonic mean
  {
    name: 'HARMEAN',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }
      for (const n of numbers) {
        if (n <= 0) return new FormulaError('#NUM!');
      }
      const sumReciprocals = numbers.reduce((sum, n) => sum + 1 / n, 0);
      return numbers.length / sumReciprocals;
    },
  },

  // QUARTILE - quartile value
  {
    name: 'QUARTILE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const quart = toNumber(args[1]);
      if (isError(quart)) return quart;

      const q = quart as number;
      if (q < 0 || q > 4 || !Number.isInteger(q)) {
        return new FormulaError('#NUM!');
      }

      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      const n = numbers.length;

      if (q === 0) return numbers[0];
      if (q === 4) return numbers[n - 1];

      const position = (q / 4) * (n - 1);
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower === upper) {
        return numbers[lower];
      }

      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // TRIMMEAN - mean excluding outliers
  {
    name: 'TRIMMEAN',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const percent = toNumber(args[1]);
      if (isError(percent)) return percent;

      const p = percent as number;
      if (p < 0 || p >= 1) {
        return new FormulaError('#NUM!');
      }

      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      const trimCount = Math.floor((numbers.length * p) / 2);
      const trimmed = numbers.slice(trimCount, numbers.length - trimCount);

      if (trimmed.length === 0) {
        return new FormulaError('#NUM!');
      }

      return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    },
  },

  // AVEDEV - average absolute deviation
  {
    name: 'AVEDEV',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const sumDeviations = numbers.reduce((sum, n) => sum + Math.abs(n - mean), 0);
      return sumDeviations / numbers.length;
    },
  },

  // DEVSQ - sum of squared deviations
  {
    name: 'DEVSQ',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#NUM!');
      }

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0);
    },
  },

  // SLOPE - slope of linear regression
  {
    name: 'SLOPE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const yValues = getNumbers([args[0]]);
      const xValues = getNumbers([args[1]]);

      if (yValues.length !== xValues.length || yValues.length < 2) {
        return new FormulaError('#N/A');
      }

      const n = yValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) {
        return new FormulaError('#DIV/0!');
      }

      return (n * sumXY - sumX * sumY) / denominator;
    },
  },

  // INTERCEPT - y-intercept of linear regression
  {
    name: 'INTERCEPT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const yValues = getNumbers([args[0]]);
      const xValues = getNumbers([args[1]]);

      if (yValues.length !== xValues.length || yValues.length < 2) {
        return new FormulaError('#N/A');
      }

      const n = yValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

      const denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) {
        return new FormulaError('#DIV/0!');
      }

      const slope = (n * sumXY - sumX * sumY) / denominator;
      return (sumY - slope * sumX) / n;
    },
  },

  // RSQ - R-squared (coefficient of determination)
  {
    name: 'RSQ',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const yValues = getNumbers([args[0]]);
      const xValues = getNumbers([args[1]]);

      if (yValues.length !== xValues.length || yValues.length < 2) {
        return new FormulaError('#N/A');
      }

      const n = yValues.length;
      const meanX = xValues.reduce((a, b) => a + b, 0) / n;
      const meanY = yValues.reduce((a, b) => a + b, 0) / n;

      let sumProduct = 0;
      let sumSqX = 0;
      let sumSqY = 0;

      for (let i = 0; i < n; i++) {
        const dx = xValues[i] - meanX;
        const dy = yValues[i] - meanY;
        sumProduct += dx * dy;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
      }

      const denominator = Math.sqrt(sumSqX * sumSqY);
      if (denominator === 0) {
        return new FormulaError('#DIV/0!');
      }

      const r = sumProduct / denominator;
      return r * r;
    },
  },

  // AVERAGEA - average including text as 0 and booleans
  {
    name: 'AVERAGEA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') {
          values.push(val);
        } else if (typeof val === 'boolean') {
          values.push(val ? 1 : 0);
        } else if (typeof val === 'string' && val !== '') {
          values.push(0); // Text counts as 0
        }
      }
      if (values.length === 0) {
        return new FormulaError('#DIV/0!');
      }
      return values.reduce((a, b) => a + b, 0) / values.length;
    },
  },

  // COVAR - covariance of two data sets
  {
    name: 'COVAR',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xValues = getNumbers([args[0]]);
      const yValues = getNumbers([args[1]]);

      if (xValues.length !== yValues.length || xValues.length === 0) {
        return new FormulaError('#N/A');
      }

      const n = xValues.length;
      const meanX = xValues.reduce((a, b) => a + b, 0) / n;
      const meanY = yValues.reduce((a, b) => a + b, 0) / n;

      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += (xValues[i] - meanX) * (yValues[i] - meanY);
      }

      return sum / n;
    },
  },

  // NORM.DIST - normal distribution
  {
    name: 'NORM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      const mean = toNumber(args[1]);
      const stdDev = toNumber(args[2]);
      const cumulative = args[3];

      if (isError(x)) return x;
      if (isError(mean)) return mean;
      if (isError(stdDev)) return stdDev;

      const xVal = x as number;
      const meanVal = mean as number;
      const stdVal = stdDev as number;

      if (stdVal <= 0) {
        return new FormulaError('#NUM!');
      }

      const z = (xVal - meanVal) / stdVal;

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF - cumulative distribution function
        return 0.5 * (1 + erf(z / Math.sqrt(2)));
      } else {
        // PDF - probability density function
        return Math.exp(-0.5 * z * z) / (stdVal * Math.sqrt(2 * Math.PI));
      }
    },
  },

  // NORM.INV - inverse normal distribution
  {
    name: 'NORM.INV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      const mean = toNumber(args[1]);
      const stdDev = toNumber(args[2]);

      if (isError(p)) return p;
      if (isError(mean)) return mean;
      if (isError(stdDev)) return stdDev;

      const pVal = p as number;
      const meanVal = mean as number;
      const stdVal = stdDev as number;

      if (pVal <= 0 || pVal >= 1 || stdVal <= 0) {
        return new FormulaError('#NUM!');
      }

      // Approximation using rational approximation
      const z = normInv(pVal);
      return meanVal + z * stdVal;
    },
  },

  // T.DIST - Student's t-distribution
  {
    name: 'T.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      const df = toNumber(args[1]);
      const cumulative = args[2];

      if (isError(x)) return x;
      if (isError(df)) return df;

      const xVal = x as number;
      const dfVal = Math.floor(df as number);

      if (dfVal < 1) {
        return new FormulaError('#NUM!');
      }

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF
        return tDistCDF(xVal, dfVal);
      } else {
        // PDF
        const coef = gamma((dfVal + 1) / 2) / (Math.sqrt(dfVal * Math.PI) * gamma(dfVal / 2));
        return coef * Math.pow(1 + (xVal * xVal) / dfVal, -(dfVal + 1) / 2);
      }
    },
  },

  // FREQUENCY - frequency distribution
  {
    name: 'FREQUENCY',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const dataArray = getNumbers([args[0]]);
      const binsArray = getNumbers([args[1]]);

      if (dataArray.length === 0) {
        return [[0]];
      }

      const sortedBins = [...binsArray].sort((a, b) => a - b);
      const result: number[] = new Array(sortedBins.length + 1).fill(0);

      for (const value of dataArray) {
        let placed = false;
        for (let i = 0; i < sortedBins.length; i++) {
          if (value <= sortedBins[i]) {
            result[i]++;
            placed = true;
            break;
          }
        }
        if (!placed) {
          result[sortedBins.length]++;
        }
      }

      return result.map(v => [v]);
    },
  },

  // TREND - linear trend values
  {
    name: 'TREND',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const knownY = getNumbers([args[0]]);
      const knownX = args[1] ? getNumbers([args[1]]) : knownY.map((_, i) => i + 1);
      const newX = args[2] ? getNumbers([args[2]]) : knownX;

      if (knownY.length !== knownX.length || knownY.length === 0) {
        return new FormulaError('#N/A');
      }

      // Calculate linear regression coefficients
      const n = knownY.length;
      const sumX = knownX.reduce((a, b) => a + b, 0);
      const sumY = knownY.reduce((a, b) => a + b, 0);
      const sumXY = knownX.reduce((acc, x, i) => acc + x * knownY[i], 0);
      const sumX2 = knownX.reduce((acc, x) => acc + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate trend values for newX
      return newX.map(x => [intercept + slope * x]);
    },
  },

  // GROWTH - exponential growth values
  {
    name: 'GROWTH',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const knownY = getNumbers([args[0]]);
      const knownX = args[1] ? getNumbers([args[1]]) : knownY.map((_, i) => i + 1);
      const newX = args[2] ? getNumbers([args[2]]) : knownX;

      if (knownY.length !== knownX.length || knownY.length === 0) {
        return new FormulaError('#N/A');
      }

      // Check for non-positive Y values
      if (knownY.some(y => y <= 0)) {
        return new FormulaError('#NUM!');
      }

      // Calculate exponential regression: y = b * m^x
      // Take log: ln(y) = ln(b) + x*ln(m)
      const logY = knownY.map(y => Math.log(y));
      const n = knownY.length;
      const sumX = knownX.reduce((a, b) => a + b, 0);
      const sumLogY = logY.reduce((a, b) => a + b, 0);
      const sumXLogY = knownX.reduce((acc, x, i) => acc + x * logY[i], 0);
      const sumX2 = knownX.reduce((acc, x) => acc + x * x, 0);

      const logM = (n * sumXLogY - sumX * sumLogY) / (n * sumX2 - sumX * sumX);
      const logB = (sumLogY - logM * sumX) / n;

      const m = Math.exp(logM);
      const b = Math.exp(logB);

      // Calculate growth values for newX
      return newX.map(x => [b * Math.pow(m, x)]);
    },
  },
];

// Error function approximation for normal distribution
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Inverse normal distribution approximation
function normInv(p: number): number {
  // Rational approximation for lower tail
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Gamma function approximation
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// T-distribution CDF approximation
function tDistCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * betaInc(df / 2, 0.5, x);
}

// Incomplete beta function approximation
function betaInc(a: number, b: number, x: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  const bt = Math.exp(
    gamma(a + b) - gamma(a) - gamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaCF(a, b, x) / a;
  } else {
    return 1 - bt * betaCF(b, a, 1 - x) / b;
  }
}

// Continued fraction for incomplete beta
function betaCF(a: number, b: number, x: number): number {
  const maxIterations = 100;
  const epsilon = 1e-10;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < epsilon) d = epsilon;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < epsilon) break;
  }

  return h;
}

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

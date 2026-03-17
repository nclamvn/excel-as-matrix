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

  // COVARIANCE.P - Population covariance (alias for COVAR)
  {
    name: 'COVARIANCE.P',
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

  // COVARIANCE.S - Sample covariance
  {
    name: 'COVARIANCE.S',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xValues = getNumbers([args[0]]);
      const yValues = getNumbers([args[1]]);
      if (xValues.length !== yValues.length || xValues.length < 2) {
        return new FormulaError('#N/A');
      }
      const n = xValues.length;
      const meanX = xValues.reduce((a, b) => a + b, 0) / n;
      const meanY = yValues.reduce((a, b) => a + b, 0) / n;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += (xValues[i] - meanX) * (yValues[i] - meanY);
      }
      return sum / (n - 1);
    },
  },

  // FORECAST - Predicts a value using linear regression
  {
    name: 'FORECAST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const knownY = getNumbers([args[1]]);
      const knownX = getNumbers([args[2]]);
      if (knownY.length !== knownX.length || knownY.length < 2) {
        return new FormulaError('#N/A');
      }
      const n = knownY.length;
      const sumX = knownX.reduce((a, b) => a + b, 0);
      const sumY = knownY.reduce((a, b) => a + b, 0);
      const sumXY = knownX.reduce((acc, xi, i) => acc + xi * knownY[i], 0);
      const sumXX = knownX.reduce((acc, xi) => acc + xi * xi, 0);
      const denom = n * sumXX - sumX * sumX;
      if (denom === 0) return new FormulaError('#DIV/0!');
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      return intercept + slope * (x as number);
    },
  },

  // FORECAST.LINEAR - Same as FORECAST
  {
    name: 'FORECAST.LINEAR',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const knownY = getNumbers([args[1]]);
      const knownX = getNumbers([args[2]]);
      if (knownY.length !== knownX.length || knownY.length < 2) {
        return new FormulaError('#N/A');
      }
      const n = knownY.length;
      const sumX = knownX.reduce((a, b) => a + b, 0);
      const sumY = knownY.reduce((a, b) => a + b, 0);
      const sumXY = knownX.reduce((acc, xi, i) => acc + xi * knownY[i], 0);
      const sumXX = knownX.reduce((acc, xi) => acc + xi * xi, 0);
      const denom = n * sumXX - sumX * sumX;
      if (denom === 0) return new FormulaError('#DIV/0!');
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      return intercept + slope * (x as number);
    },
  },

  // STEYX - Standard error of the predicted y-value for each x in a regression
  {
    name: 'STEYX',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const yValues = getNumbers([args[0]]);
      const xValues = getNumbers([args[1]]);
      if (yValues.length !== xValues.length || yValues.length < 3) {
        return new FormulaError('#N/A');
      }
      const n = yValues.length;
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
      const sumXX = xValues.reduce((acc, x) => acc + x * x, 0);
      const denom = n * sumXX - sumX * sumX;
      if (denom === 0) return new FormulaError('#DIV/0!');
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      let sse = 0;
      for (let i = 0; i < n; i++) {
        const predicted = intercept + slope * xValues[i];
        sse += Math.pow(yValues[i] - predicted, 2);
      }
      return Math.sqrt(sse / (n - 2));
    },
  },

  // PEARSON - Pearson product-moment correlation (same as CORREL)
  {
    name: 'PEARSON',
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
      let sumProduct = 0, sumSq1 = 0, sumSq2 = 0;
      for (let i = 0; i < n; i++) {
        const d1 = array1[i] - mean1;
        const d2 = array2[i] - mean2;
        sumProduct += d1 * d2;
        sumSq1 += d1 * d1;
        sumSq2 += d2 * d2;
      }
      const denom = Math.sqrt(sumSq1 * sumSq2);
      if (denom === 0) return new FormulaError('#DIV/0!');
      return sumProduct / denom;
    },
  },

  // FISHER - Fisher transformation
  {
    name: 'FISHER',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const val = x as number;
      if (val <= -1 || val >= 1) return new FormulaError('#NUM!');
      return 0.5 * Math.log((1 + val) / (1 - val));
    },
  },

  // FISHERINV - Inverse Fisher transformation
  {
    name: 'FISHERINV',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const y = toNumber(args[0]);
      if (isError(y)) return y;
      const val = y as number;
      const e2y = Math.exp(2 * val);
      return (e2y - 1) / (e2y + 1);
    },
  },

  // STANDARDIZE - Computes a normalized value (z-score)
  {
    name: 'STANDARDIZE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const mean = toNumber(args[1]);
      if (isError(mean)) return mean;
      const stdDev = toNumber(args[2]);
      if (isError(stdDev)) return stdDev;
      if ((stdDev as number) <= 0) return new FormulaError('#NUM!');
      return ((x as number) - (mean as number)) / (stdDev as number);
    },
  },

  // CONFIDENCE - Returns confidence interval for a population mean
  {
    name: 'CONFIDENCE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const alpha = toNumber(args[0]);
      if (isError(alpha)) return alpha;
      const stdDev = toNumber(args[1]);
      if (isError(stdDev)) return stdDev;
      const size = toNumber(args[2]);
      if (isError(size)) return size;
      const a = alpha as number;
      const s = stdDev as number;
      const n = Math.floor(size as number);
      if (a <= 0 || a >= 1 || s <= 0 || n < 1) return new FormulaError('#NUM!');
      // z-value for two-tailed test
      const z = normInv(1 - a / 2);
      return z * s / Math.sqrt(n);
    },
  },

  // CONFIDENCE.NORM - Same as CONFIDENCE
  {
    name: 'CONFIDENCE.NORM',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const alpha = toNumber(args[0]);
      if (isError(alpha)) return alpha;
      const stdDev = toNumber(args[1]);
      if (isError(stdDev)) return stdDev;
      const size = toNumber(args[2]);
      if (isError(size)) return size;
      const a = alpha as number;
      const s = stdDev as number;
      const n = Math.floor(size as number);
      if (a <= 0 || a >= 1 || s <= 0 || n < 1) return new FormulaError('#NUM!');
      const z = normInv(1 - a / 2);
      return z * s / Math.sqrt(n);
    },
  },

  // NORM.S.DIST - Standard normal cumulative distribution
  {
    name: 'NORM.S.DIST',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const z = toNumber(args[0]);
      if (isError(z)) return z;
      const cumulative = args[1];
      const zVal = z as number;
      if (cumulative === true || cumulative === 'TRUE') {
        return 0.5 * (1 + erf(zVal / Math.sqrt(2)));
      }
      return Math.exp(-0.5 * zVal * zVal) / Math.sqrt(2 * Math.PI);
    },
  },

  // NORM.S.INV - Inverse standard normal distribution
  {
    name: 'NORM.S.INV',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const pVal = p as number;
      if (pVal <= 0 || pVal >= 1) return new FormulaError('#NUM!');
      return normInv(pVal);
    },
  },

  // POISSON.DIST - Poisson distribution
  {
    name: 'POISSON.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const mean = toNumber(args[1]);
      if (isError(mean)) return mean;
      const cumulative = args[2];
      const xVal = Math.floor(x as number);
      const meanVal = mean as number;
      if (xVal < 0 || meanVal < 0) return new FormulaError('#NUM!');

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF: sum of PMF from 0 to x
        let sum = 0;
        for (let k = 0; k <= xVal; k++) {
          sum += Math.pow(meanVal, k) * Math.exp(-meanVal) / factorial(k);
        }
        return sum;
      }
      // PMF
      return Math.pow(meanVal, xVal) * Math.exp(-meanVal) / factorial(xVal);
    },
  },

  // BINOM.DIST - Binomial distribution
  {
    name: 'BINOM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numS = toNumber(args[0]);
      if (isError(numS)) return numS;
      const trials = toNumber(args[1]);
      if (isError(trials)) return trials;
      const probS = toNumber(args[2]);
      if (isError(probS)) return probS;
      const cumulative = args[3];

      const s = Math.floor(numS as number);
      const n = Math.floor(trials as number);
      const p = probS as number;

      if (s < 0 || n < 0 || s > n || p < 0 || p > 1) return new FormulaError('#NUM!');

      const binomPMF = (k: number, nn: number, pp: number): number => {
        let coeff = 1;
        for (let i = 0; i < k; i++) {
          coeff = (coeff * (nn - i)) / (i + 1);
        }
        return coeff * Math.pow(pp, k) * Math.pow(1 - pp, nn - k);
      };

      if (cumulative === true || cumulative === 'TRUE') {
        let sum = 0;
        for (let k = 0; k <= s; k++) {
          sum += binomPMF(k, n, p);
        }
        return sum;
      }
      return binomPMF(s, n, p);
    },
  },

  // BINOM.INV - Inverse binomial distribution (smallest value where CDF >= criterion)
  {
    name: 'BINOM.INV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const trials = toNumber(args[0]);
      if (isError(trials)) return trials;
      const probS = toNumber(args[1]);
      if (isError(probS)) return probS;
      const alpha = toNumber(args[2]);
      if (isError(alpha)) return alpha;

      const n = Math.floor(trials as number);
      const p = probS as number;
      const a = alpha as number;

      if (n < 0 || p < 0 || p > 1 || a < 0 || a > 1) return new FormulaError('#NUM!');

      let cdf = 0;
      for (let k = 0; k <= n; k++) {
        let coeff = 1;
        for (let i = 0; i < k; i++) {
          coeff = (coeff * (n - i)) / (i + 1);
        }
        cdf += coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
        if (cdf >= a) return k;
      }
      return n;
    },
  },

  // EXPON.DIST - Exponential distribution
  {
    name: 'EXPON.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const lambda = toNumber(args[1]);
      if (isError(lambda)) return lambda;
      const cumulative = args[2];

      const xVal = x as number;
      const lam = lambda as number;
      if (xVal < 0 || lam <= 0) return new FormulaError('#NUM!');

      if (cumulative === true || cumulative === 'TRUE') {
        return 1 - Math.exp(-lam * xVal);
      }
      return lam * Math.exp(-lam * xVal);
    },
  },

  // GAMMA.DIST - Gamma distribution
  {
    name: 'GAMMA.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const alpha = toNumber(args[1]);
      if (isError(alpha)) return alpha;
      const beta = toNumber(args[2]);
      if (isError(beta)) return beta;
      const cumulative = args[3];

      const xVal = x as number;
      const a = alpha as number;
      const b = beta as number;

      if (xVal < 0 || a <= 0 || b <= 0) return new FormulaError('#NUM!');
      if (xVal === 0) return cumulative === true || cumulative === 'TRUE' ? 0 : 0;

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF: regularized incomplete gamma function
        return gammaIncLower(a, xVal / b) / gamma(a);
      }
      // PDF
      return Math.pow(xVal, a - 1) * Math.exp(-xVal / b) / (Math.pow(b, a) * gamma(a));
    },
  },

  // WEIBULL.DIST - Weibull distribution
  {
    name: 'WEIBULL.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const alpha = toNumber(args[1]);
      if (isError(alpha)) return alpha;
      const beta = toNumber(args[2]);
      if (isError(beta)) return beta;
      const cumulative = args[3];

      const xVal = x as number;
      const a = alpha as number;
      const b = beta as number;

      if (xVal < 0 || a <= 0 || b <= 0) return new FormulaError('#NUM!');

      if (cumulative === true || cumulative === 'TRUE') {
        return 1 - Math.exp(-Math.pow(xVal / b, a));
      }
      return (a / b) * Math.pow(xVal / b, a - 1) * Math.exp(-Math.pow(xVal / b, a));
    },
  },

  // LOGNORM.DIST - Lognormal distribution
  {
    name: 'LOGNORM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const mean = toNumber(args[1]);
      if (isError(mean)) return mean;
      const stdDev = toNumber(args[2]);
      if (isError(stdDev)) return stdDev;
      const cumulative = args[3];

      const xVal = x as number;
      const mu = mean as number;
      const sigma = stdDev as number;

      if (xVal <= 0 || sigma <= 0) return new FormulaError('#NUM!');

      const z = (Math.log(xVal) - mu) / sigma;

      if (cumulative === true || cumulative === 'TRUE') {
        return 0.5 * (1 + erf(z / Math.sqrt(2)));
      }
      return Math.exp(-0.5 * z * z) / (xVal * sigma * Math.sqrt(2 * Math.PI));
    },
  },

  // LOGNORM.INV - Inverse lognormal distribution
  {
    name: 'LOGNORM.INV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const mean = toNumber(args[1]);
      if (isError(mean)) return mean;
      const stdDev = toNumber(args[2]);
      if (isError(stdDev)) return stdDev;

      const pVal = p as number;
      const mu = mean as number;
      const sigma = stdDev as number;

      if (pVal <= 0 || pVal >= 1 || sigma <= 0) return new FormulaError('#NUM!');

      return Math.exp(mu + sigma * normInv(pVal));
    },
  },

  // BETA.DIST - Beta distribution
  {
    name: 'BETA.DIST',
    minArgs: 4,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const alpha = toNumber(args[1]);
      if (isError(alpha)) return alpha;
      const betaParam = toNumber(args[2]);
      if (isError(betaParam)) return betaParam;
      const cumulative = args[3];
      const A = args.length > 4 ? toNumber(args[4]) : 0;
      if (isError(A)) return A;
      const B = args.length > 5 ? toNumber(args[5]) : 1;
      if (isError(B)) return B;

      const xVal = x as number;
      const a = alpha as number;
      const b = betaParam as number;
      const lo = A as number;
      const hi = B as number;

      if (a <= 0 || b <= 0 || xVal < lo || xVal > hi || lo >= hi) return new FormulaError('#NUM!');

      // Normalize x to [0, 1]
      const xNorm = (xVal - lo) / (hi - lo);

      if (cumulative === true || cumulative === 'TRUE') {
        return betaInc(a, b, xNorm);
      }
      // PDF
      const betaFunc = gamma(a) * gamma(b) / gamma(a + b);
      return Math.pow(xNorm, a - 1) * Math.pow(1 - xNorm, b - 1) / (betaFunc * (hi - lo));
    },
  },

  // CHISQ.DIST - Chi-squared distribution
  {
    name: 'CHISQ.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const df = toNumber(args[1]);
      if (isError(df)) return df;
      const cumulative = args[2];

      const xVal = x as number;
      const dfVal = Math.floor(df as number);

      if (xVal < 0 || dfVal < 1) return new FormulaError('#NUM!');

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF using incomplete gamma
        return gammaIncLower(dfVal / 2, xVal / 2) / gamma(dfVal / 2);
      }
      // PDF
      const k2 = dfVal / 2;
      return Math.pow(xVal, k2 - 1) * Math.exp(-xVal / 2) / (Math.pow(2, k2) * gamma(k2));
    },
  },

  // CHISQ.INV - Inverse chi-squared distribution (left-tailed)
  {
    name: 'CHISQ.INV',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const pVal = p as number;
      const dfVal = Math.floor(df as number);

      if (pVal < 0 || pVal >= 1 || dfVal < 1) return new FormulaError('#NUM!');
      if (pVal === 0) return 0;

      // Use Newton's method to invert the CDF
      let x = dfVal; // initial guess = degrees of freedom
      for (let iter = 0; iter < 100; iter++) {
        const cdf = gammaIncLower(dfVal / 2, x / 2) / gamma(dfVal / 2);
        const k2 = dfVal / 2;
        const pdf = Math.pow(x, k2 - 1) * Math.exp(-x / 2) / (Math.pow(2, k2) * gamma(k2));
        if (pdf === 0) break;
        const delta = (cdf - pVal) / pdf;
        x = Math.max(0.0001, x - delta);
        if (Math.abs(delta) < 1e-10) break;
      }
      return x;
    },
  },

  // F.DIST - F-distribution
  {
    name: 'F.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const df1 = toNumber(args[1]);
      if (isError(df1)) return df1;
      const df2 = toNumber(args[2]);
      if (isError(df2)) return df2;
      const cumulative = args[3];

      const xVal = x as number;
      const d1 = Math.floor(df1 as number);
      const d2 = Math.floor(df2 as number);

      if (xVal < 0 || d1 < 1 || d2 < 1) return new FormulaError('#NUM!');

      if (cumulative === true || cumulative === 'TRUE') {
        // CDF using incomplete beta function
        const z = d1 * xVal / (d1 * xVal + d2);
        return betaInc(d1 / 2, d2 / 2, z);
      }
      // PDF
      const betaFunc = gamma(d1 / 2) * gamma(d2 / 2) / gamma((d1 + d2) / 2);
      return Math.pow(d1 / d2, d1 / 2) * Math.pow(xVal, d1 / 2 - 1) /
             (betaFunc * Math.pow(1 + d1 * xVal / d2, (d1 + d2) / 2));
    },
  },

  // HYPGEOM.DIST - Hypergeometric distribution
  {
    name: 'HYPGEOM.DIST',
    minArgs: 5,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const sampleS = toNumber(args[0]);
      if (isError(sampleS)) return sampleS;
      const numSample = toNumber(args[1]);
      if (isError(numSample)) return numSample;
      const popS = toNumber(args[2]);
      if (isError(popS)) return popS;
      const popN = toNumber(args[3]);
      if (isError(popN)) return popN;
      const cumulative = args[4];

      const k = Math.floor(sampleS as number);
      const n = Math.floor(numSample as number);
      const K = Math.floor(popS as number);
      const N = Math.floor(popN as number);

      if (k < 0 || n < 0 || K < 0 || N < 0 || n > N || K > N || k > n || k > K) {
        return new FormulaError('#NUM!');
      }

      const combin = (nn: number, kk: number): number => {
        if (kk < 0 || kk > nn) return 0;
        if (kk === 0 || kk === nn) return 1;
        let result = 1;
        for (let i = 0; i < kk; i++) {
          result = (result * (nn - i)) / (i + 1);
        }
        return result;
      };

      const pmf = (x: number): number => {
        return (combin(K, x) * combin(N - K, n - x)) / combin(N, n);
      };

      if (cumulative === true || cumulative === 'TRUE') {
        let sum = 0;
        for (let i = 0; i <= k; i++) {
          sum += pmf(i);
        }
        return sum;
      }
      return pmf(k);
    },
  },

  // NEGBINOM.DIST - Negative binomial distribution
  {
    name: 'NEGBINOM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numF = toNumber(args[0]);
      if (isError(numF)) return numF;
      const numS = toNumber(args[1]);
      if (isError(numS)) return numS;
      const probS = toNumber(args[2]);
      if (isError(probS)) return probS;
      const cumulative = args[3];

      const f = Math.floor(numF as number);
      const s = Math.floor(numS as number);
      const p = probS as number;

      if (f < 0 || s < 1 || p <= 0 || p >= 1) return new FormulaError('#NUM!');

      const combin = (nn: number, kk: number): number => {
        if (kk < 0 || kk > nn) return 0;
        let result = 1;
        for (let i = 0; i < kk; i++) {
          result = (result * (nn - i)) / (i + 1);
        }
        return result;
      };

      const pmf = (x: number): number => {
        return combin(x + s - 1, s - 1) * Math.pow(p, s) * Math.pow(1 - p, x);
      };

      if (cumulative === true || cumulative === 'TRUE') {
        let sum = 0;
        for (let i = 0; i <= f; i++) {
          sum += pmf(i);
        }
        return sum;
      }
      return pmf(f);
    },
  },

  // MAXA - Maximum including text (0) and booleans
  {
    name: 'MAXA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length === 0) return 0;
      return Math.max(...values);
    },
  },

  // MINA - Minimum including text (0) and booleans
  {
    name: 'MINA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length === 0) return 0;
      return Math.min(...values);
    },
  },

  // VARA - Sample variance including text (0) and booleans
  {
    name: 'VARA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length < 2) return new FormulaError('#DIV/0!');
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    },
  },

  // VARPA - Population variance including text (0) and booleans
  {
    name: 'VARPA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length === 0) return new FormulaError('#DIV/0!');
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    },
  },

  // STDEVA - Sample standard deviation including text (0) and booleans
  {
    name: 'STDEVA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length < 2) return new FormulaError('#DIV/0!');
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
      return Math.sqrt(variance);
    },
  },

  // STDEVPA - Population standard deviation including text (0) and booleans
  {
    name: 'STDEVPA',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      const values: number[] = [];
      for (const val of flat) {
        if (isError(val)) return val;
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else if (typeof val === 'string' && val !== '') values.push(0);
      }
      if (values.length === 0) return new FormulaError('#DIV/0!');
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      return Math.sqrt(variance);
    },
  },

  // SUMIFS alias: SUMPRODUCT already in math - add PROB
  // PROB - Returns the probability that values are between limits
  {
    name: 'PROB',
    minArgs: 3,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xRange = getNumbers([args[0]]);
      const probRange = getNumbers([args[1]]);
      const lowerLimit = toNumber(args[2]);
      if (isError(lowerLimit)) return lowerLimit;
      const upperLimit = args.length > 3 ? toNumber(args[3]) : lowerLimit;
      if (isError(upperLimit)) return upperLimit;

      if (xRange.length !== probRange.length) return new FormulaError('#N/A');

      // Check probabilities sum to ~1 and are all valid
      if (probRange.some(p => p < 0 || p > 1)) return new FormulaError('#NUM!');

      let result = 0;
      for (let i = 0; i < xRange.length; i++) {
        if (xRange[i] >= (lowerLimit as number) && xRange[i] <= (upperLimit as number)) {
          result += probRange[i];
        }
      }
      return result;
    },
  },

  // PERMUT alias: PERMUTATIONA
  {
    name: 'PERMUTATIONA',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const n = toNumber(args[0]);
      const k = toNumber(args[1]);
      if (isError(n)) return n;
      if (isError(k)) return k;
      const nVal = Math.floor(n as number);
      const kVal = Math.floor(k as number);
      if (nVal < 0 || kVal < 0) return new FormulaError('#NUM!');
      // n^k
      return Math.pow(nVal, kVal);
    },
  },

  // PHI - Returns the value of the standard normal density function
  {
    name: 'PHI',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const xVal = x as number;
      return Math.exp(-0.5 * xVal * xVal) / Math.sqrt(2 * Math.PI);
    },
  },

  // GAUSS - Returns 0.5 less than the standard normal cumulative distribution
  {
    name: 'GAUSS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const z = toNumber(args[0]);
      if (isError(z)) return z;
      const zVal = z as number;
      return 0.5 * erf(zVal / Math.sqrt(2));
    },
  },

  // SKEW - Returns the skewness of a distribution
  {
    name: 'SKEW',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 3) return new FormulaError('#DIV/0!');
      const n = numbers.length;
      const mean = numbers.reduce((a, b) => a + b, 0) / n;
      const s = Math.sqrt(numbers.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1));
      if (s === 0) return new FormulaError('#DIV/0!');
      const m3 = numbers.reduce((sum, v) => sum + Math.pow((v - mean) / s, 3), 0);
      return (n / ((n - 1) * (n - 2))) * m3;
    },
  },

  // KURT - Returns the kurtosis of a data set
  {
    name: 'KURT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 4) return new FormulaError('#DIV/0!');
      const n = numbers.length;
      const mean = numbers.reduce((a, b) => a + b, 0) / n;
      const s = Math.sqrt(numbers.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1));
      if (s === 0) return new FormulaError('#DIV/0!');
      const m4 = numbers.reduce((sum, v) => sum + Math.pow((v - mean) / s, 4), 0);
      return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 -
             (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    },
  },

  // T.INV - Inverse of the Student's t-distribution (left-tailed)
  {
    name: 'T.INV',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const pVal = p as number;
      const dfVal = Math.floor(df as number);

      if (pVal <= 0 || pVal >= 1 || dfVal < 1) return new FormulaError('#NUM!');

      // Approximate using normal distribution for large df
      if (dfVal > 100) return normInv(pVal);

      // Newton's method
      let x = normInv(pVal);
      for (let iter = 0; iter < 50; iter++) {
        const cdf = tDistCDF(x, dfVal);
        const k2 = (dfVal + 1) / 2;
        const pdf = gamma(k2) / (Math.sqrt(dfVal * Math.PI) * gamma(dfVal / 2)) *
                    Math.pow(1 + x * x / dfVal, -k2);
        if (pdf === 0) break;
        const delta = (cdf - pVal) / pdf;
        x -= delta;
        if (Math.abs(delta) < 1e-10) break;
      }
      return x;
    },
  },

  // T.INV.2T - Inverse of the two-tailed Student's t-distribution
  {
    name: 'T.INV.2T',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const pVal = p as number;
      const dfVal = Math.floor(df as number);

      if (pVal <= 0 || pVal > 1 || dfVal < 1) return new FormulaError('#NUM!');

      // Two-tailed: find t such that P(|T| > t) = p, i.e., CDF(t) = 1 - p/2
      const target = 1 - pVal / 2;
      if (dfVal > 100) return Math.abs(normInv(target));

      let x = Math.abs(normInv(target));
      for (let iter = 0; iter < 50; iter++) {
        const cdf = tDistCDF(x, dfVal);
        const k2 = (dfVal + 1) / 2;
        const pdf = gamma(k2) / (Math.sqrt(dfVal * Math.PI) * gamma(dfVal / 2)) *
                    Math.pow(1 + x * x / dfVal, -k2);
        if (pdf === 0) break;
        const delta = (cdf - target) / pdf;
        x -= delta;
        if (Math.abs(delta) < 1e-10) break;
      }
      return Math.abs(x);
    },
  },

  // T.DIST.2T - Two-tailed Student's t-distribution
  {
    name: 'T.DIST.2T',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const xVal = Math.abs(x as number);
      const dfVal = Math.floor(df as number);

      if (dfVal < 1) return new FormulaError('#NUM!');

      // P(|T| > x) = 2 * (1 - CDF(|x|))
      return 2 * (1 - tDistCDF(xVal, dfVal));
    },
  },

  // T.DIST.RT - Right-tailed Student's t-distribution
  {
    name: 'T.DIST.RT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const xVal = x as number;
      const dfVal = Math.floor(df as number);

      if (dfVal < 1) return new FormulaError('#NUM!');

      return 1 - tDistCDF(xVal, dfVal);
    },
  },

  // CHISQ.DIST.RT - Right-tailed chi-squared distribution
  {
    name: 'CHISQ.DIST.RT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const xVal = x as number;
      const dfVal = Math.floor(df as number);

      if (xVal < 0 || dfVal < 1) return new FormulaError('#NUM!');

      // 1 - CDF
      return 1 - gammaIncLower(dfVal / 2, xVal / 2) / gamma(dfVal / 2);
    },
  },

  // CHISQ.INV.RT - Right-tailed inverse chi-squared
  {
    name: 'CHISQ.INV.RT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const p = toNumber(args[0]);
      if (isError(p)) return p;
      const df = toNumber(args[1]);
      if (isError(df)) return df;

      const pVal = p as number;
      const dfVal = Math.floor(df as number);

      if (pVal <= 0 || pVal > 1 || dfVal < 1) return new FormulaError('#NUM!');

      // Invert: find x such that 1 - CDF(x) = p, i.e., CDF(x) = 1 - p
      const target = 1 - pVal;
      let x = dfVal;
      for (let iter = 0; iter < 100; iter++) {
        const cdf = gammaIncLower(dfVal / 2, x / 2) / gamma(dfVal / 2);
        const k2 = dfVal / 2;
        const pdf = Math.pow(x, k2 - 1) * Math.exp(-x / 2) / (Math.pow(2, k2) * gamma(k2));
        if (pdf === 0) break;
        const delta = (cdf - target) / pdf;
        x = Math.max(0.0001, x - delta);
        if (Math.abs(delta) < 1e-10) break;
      }
      return x;
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

// Factorial helper
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Lower incomplete gamma function (series expansion)
function gammaIncLower(s: number, x: number): number {
  if (x === 0) return 0;
  // Use series expansion: gamma_lower(s, x) = x^s * e^(-x) * sum(x^n / (s*(s+1)*...*(s+n)), n=0..inf)
  let sum = 0;
  let term = 1 / s;
  sum = term;
  for (let n = 1; n < 200; n++) {
    term *= x / (s + n);
    sum += term;
    if (Math.abs(term) < 1e-14 * Math.abs(sum)) break;
  }
  return Math.pow(x, s) * Math.exp(-x) * sum;
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

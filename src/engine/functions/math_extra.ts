import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, toString, isError, getNumbers } from './utils';

// Helper: get a 2D number matrix from a FormulaValue
function toMatrix(val: FormulaValue): number[][] | FormulaError {
  if (!Array.isArray(val)) {
    const n = toNumber(val);
    if (n instanceof FormulaError) return n;
    return [[n as number]];
  }
  const arr = val as FormulaValue[][];
  const result: number[][] = [];
  for (const row of arr) {
    if (!Array.isArray(row)) {
      const n = toNumber(row);
      if (n instanceof FormulaError) return n;
      result.push([n as number]);
    } else {
      const numRow: number[] = [];
      for (const cell of row) {
        const n = toNumber(cell);
        if (n instanceof FormulaError) return n;
        numRow.push(n as number);
      }
      result.push(numRow);
    }
  }
  return result;
}

// Helper: compute determinant of a square matrix using LU decomposition-like approach
function determinant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  // Cofactor expansion along first row
  let det = 0;
  for (let j = 0; j < n; j++) {
    // Create minor matrix
    const minor: number[][] = [];
    for (let i = 1; i < n; i++) {
      const row: number[] = [];
      for (let k = 0; k < n; k++) {
        if (k !== j) row.push(matrix[i][k]);
      }
      minor.push(row);
    }
    det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * determinant(minor);
  }
  return det;
}

// Helper: compute matrix inverse using Gauss-Jordan elimination
function invertMatrix(matrix: number[][]): number[][] | FormulaError {
  const n = matrix.length;

  // Create augmented matrix [A | I]
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [...matrix[i]];
    for (let j = 0; j < n; j++) {
      row.push(i === j ? 1 : 0);
    }
    aug.push(row);
  }

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      return new FormulaError('#NUM!', 'Matrix is singular and cannot be inverted');
    }

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  const inverse: number[][] = [];
  for (let i = 0; i < n; i++) {
    inverse.push(aug[i].slice(n));
  }
  return inverse;
}

export const mathExtraFunctions: FunctionDef[] = [
  // MMULT - Matrix multiplication
  {
    name: 'MMULT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const matA = toMatrix(args[0]);
      if (matA instanceof FormulaError) return matA;
      const matB = toMatrix(args[1]);
      if (matB instanceof FormulaError) return matB;

      const rowsA = matA.length;
      const colsA = matA[0].length;
      const rowsB = matB.length;
      const colsB = matB[0].length;

      if (colsA !== rowsB) {
        return new FormulaError('#VALUE!', 'Matrix dimensions incompatible for multiplication');
      }

      const result: FormulaValue[][] = [];
      for (let i = 0; i < rowsA; i++) {
        const row: FormulaValue[] = [];
        for (let j = 0; j < colsB; j++) {
          let sum = 0;
          for (let k = 0; k < colsA; k++) {
            sum += matA[i][k] * matB[k][j];
          }
          row.push(sum);
        }
        result.push(row);
      }
      return result;
    },
  },

  // MINVERSE - Matrix inverse
  {
    name: 'MINVERSE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const mat = toMatrix(args[0]);
      if (mat instanceof FormulaError) return mat;

      const rows = mat.length;
      const cols = mat[0].length;

      if (rows !== cols) {
        return new FormulaError('#VALUE!', 'Matrix must be square');
      }

      const result = invertMatrix(mat);
      if (result instanceof FormulaError) return result;
      return result as FormulaValue[][];
    },
  },

  // MDETERM - Matrix determinant
  {
    name: 'MDETERM',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const mat = toMatrix(args[0]);
      if (mat instanceof FormulaError) return mat;

      const rows = mat.length;
      const cols = mat[0].length;

      if (rows !== cols) {
        return new FormulaError('#VALUE!', 'Matrix must be square');
      }

      return determinant(mat);
    },
  },

  // MUNIT - Identity matrix of size N
  {
    name: 'MUNIT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const n = toNumber(args[0]);
      if (isError(n)) return n;
      const size = Math.floor(n as number);

      if (size < 1) {
        return new FormulaError('#VALUE!', 'Size must be at least 1');
      }

      const result: FormulaValue[][] = [];
      for (let i = 0; i < size; i++) {
        const row: FormulaValue[] = [];
        for (let j = 0; j < size; j++) {
          row.push(i === j ? 1 : 0);
        }
        result.push(row);
      }
      return result;
    },
  },

  // ARABIC - Converts a Roman numeral to an Arabic number
  {
    name: 'ARABIC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]).toUpperCase().trim();

      if (text === '') return 0;

      // Handle negative
      let negative = false;
      let roman = text;
      if (roman.startsWith('-')) {
        negative = true;
        roman = roman.substring(1);
      }

      const romanValues: Record<string, number> = {
        'I': 1, 'V': 5, 'X': 10, 'L': 50,
        'C': 100, 'D': 500, 'M': 1000,
      };

      let result = 0;
      for (let i = 0; i < roman.length; i++) {
        const current = romanValues[roman[i]];
        if (current === undefined) {
          return new FormulaError('#VALUE!', `Invalid Roman numeral character: ${roman[i]}`);
        }
        const next = i + 1 < roman.length ? romanValues[roman[i + 1]] : 0;
        if (next !== undefined && current < next) {
          result -= current;
        } else {
          result += current;
        }
      }

      return negative ? -result : result;
    },
  },

  // ROMAN - Converts an Arabic number to a Roman numeral
  {
    name: 'ROMAN',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      let n = Math.floor(num as number);

      if (n < 0 || n > 3999) {
        return new FormulaError('#VALUE!', 'Number must be between 0 and 3999');
      }

      if (n === 0) return '';

      const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
      const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

      let result = '';
      for (let i = 0; i < values.length; i++) {
        while (n >= values[i]) {
          result += symbols[i];
          n -= values[i];
        }
      }

      return result;
    },
  },

  // BASE - Converts a number to a text representation in a given base
  {
    name: 'BASE',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const base = toNumber(args[1]);
      if (isError(base)) return base;
      const minLength = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(minLength)) return minLength;

      const n = Math.floor(num as number);
      const b = Math.floor(base as number);
      const ml = Math.floor(minLength as number);

      if (b < 2 || b > 36) {
        return new FormulaError('#NUM!', 'Base must be between 2 and 36');
      }
      if (n < 0) {
        return new FormulaError('#NUM!', 'Number must be non-negative');
      }

      let result = n.toString(b).toUpperCase();
      while (result.length < ml) {
        result = '0' + result;
      }
      return result;
    },
  },

  // DECIMAL - Converts a text representation of a number in a given base to decimal
  {
    name: 'DECIMAL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]).trim();
      const base = toNumber(args[1]);
      if (isError(base)) return base;
      const b = Math.floor(base as number);

      if (b < 2 || b > 36) {
        return new FormulaError('#NUM!', 'Base must be between 2 and 36');
      }

      const result = parseInt(text, b);
      if (isNaN(result)) {
        return new FormulaError('#NUM!', `Cannot parse "${text}" as base ${b}`);
      }
      return result;
    },
  },

  // MULTINOMIAL - Returns the multinomial of a set of numbers
  // MULTINOMIAL(n1, n2, ...) = (n1 + n2 + ...)! / (n1! * n2! * ...)
  {
    name: 'MULTINOMIAL',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) {
        return new FormulaError('#VALUE!');
      }

      for (const n of numbers) {
        if (n < 0 || Math.floor(n) !== n) {
          return new FormulaError('#NUM!', 'Arguments must be non-negative integers');
        }
      }

      const factorial = (n: number): number => {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
      };

      const sum = numbers.reduce((a, b) => a + b, 0);
      let denominator = 1;
      for (const n of numbers) {
        denominator *= factorial(n);
      }

      return factorial(sum) / denominator;
    },
  },

  // SERIESSUM - Returns the sum of a power series
  // SERIESSUM(x, n, m, coefficients) = sum of a[i] * x^(n + i*m)
  {
    name: 'SERIESSUM',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const x = toNumber(args[0]);
      if (isError(x)) return x;
      const n = toNumber(args[1]);
      if (isError(n)) return n;
      const m = toNumber(args[2]);
      if (isError(m)) return m;

      const coefficients = getNumbers([args[3]]);
      if (coefficients.length === 0) {
        return new FormulaError('#VALUE!', 'Coefficients array is empty');
      }

      let sum = 0;
      const xVal = x as number;
      const nVal = n as number;
      const mVal = m as number;

      for (let i = 0; i < coefficients.length; i++) {
        sum += coefficients[i] * Math.pow(xVal, nVal + i * mVal);
      }

      return sum;
    },
  },

  // SUMSQ - Sum of squares
  {
    name: 'SUMSQ',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      return numbers.reduce((sum, n) => sum + n * n, 0);
    },
  },

  // SUMX2MY2 - Sum of x^2 - y^2 for paired arrays
  {
    name: 'SUMX2MY2',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xValues = getNumbers([args[0]]);
      const yValues = getNumbers([args[1]]);

      if (xValues.length !== yValues.length || xValues.length === 0) {
        return new FormulaError('#N/A', 'Arrays must have the same number of elements');
      }

      let sum = 0;
      for (let i = 0; i < xValues.length; i++) {
        sum += xValues[i] * xValues[i] - yValues[i] * yValues[i];
      }
      return sum;
    },
  },

  // SUMX2PY2 - Sum of x^2 + y^2 for paired arrays
  {
    name: 'SUMX2PY2',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xValues = getNumbers([args[0]]);
      const yValues = getNumbers([args[1]]);

      if (xValues.length !== yValues.length || xValues.length === 0) {
        return new FormulaError('#N/A', 'Arrays must have the same number of elements');
      }

      let sum = 0;
      for (let i = 0; i < xValues.length; i++) {
        sum += xValues[i] * xValues[i] + yValues[i] * yValues[i];
      }
      return sum;
    },
  },

  // SUMXMY2 - Sum of (x - y)^2 for paired arrays
  {
    name: 'SUMXMY2',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const xValues = getNumbers([args[0]]);
      const yValues = getNumbers([args[1]]);

      if (xValues.length !== yValues.length || xValues.length === 0) {
        return new FormulaError('#N/A', 'Arrays must have the same number of elements');
      }

      let sum = 0;
      for (let i = 0; i < xValues.length; i++) {
        const diff = xValues[i] - yValues[i];
        sum += diff * diff;
      }
      return sum;
    },
  },

  // SQRTPI - Square root of number * PI
  {
    name: 'SQRTPI',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n < 0) return new FormulaError('#NUM!', 'Number must be non-negative');
      return Math.sqrt(n * Math.PI);
    },
  },

  // FACTDOUBLE - Double factorial (n!!)
  {
    name: 'FACTDOUBLE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = Math.floor(num as number);
      if (n < -1) return new FormulaError('#NUM!', 'Number must be >= -1');
      if (n <= 0) return 1;
      let result = 1;
      for (let i = n; i > 0; i -= 2) {
        result *= i;
      }
      return result;
    },
  },

  // RANDBETWEEN is in math.ts, but RANDARRAY is useful
  // RANDARRAY - Returns an array of random numbers
  {
    name: 'RANDARRAY',
    minArgs: 0,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rows = args.length > 0 ? toNumber(args[0]) : 1;
      if (isError(rows)) return rows;
      const cols = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(cols)) return cols;
      const min = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(min)) return min;
      const max = args.length > 3 ? toNumber(args[3]) : 1;
      if (isError(max)) return max;
      const wholeNumber = args.length > 4 ? args[4] === true : false;

      const r = Math.floor(rows as number);
      const c = Math.floor(cols as number);
      const lo = min as number;
      const hi = max as number;

      if (r < 1 || c < 1) return new FormulaError('#VALUE!', 'Rows and cols must be >= 1');
      if (lo > hi) return new FormulaError('#VALUE!', 'Min must be <= Max');

      const result: FormulaValue[][] = [];
      for (let i = 0; i < r; i++) {
        const row: FormulaValue[] = [];
        for (let j = 0; j < c; j++) {
          if (wholeNumber) {
            row.push(Math.floor(Math.random() * (hi - lo + 1)) + lo);
          } else {
            row.push(Math.random() * (hi - lo) + lo);
          }
        }
        result.push(row);
      }

      if (r === 1 && c === 1) return result[0][0];
      return result;
    },
  },

  // SEQUENCE - Generates a sequence of numbers
  {
    name: 'SEQUENCE',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rows = toNumber(args[0]);
      if (isError(rows)) return rows;
      const cols = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(cols)) return cols;
      const start = args.length > 2 ? toNumber(args[2]) : 1;
      if (isError(start)) return start;
      const step = args.length > 3 ? toNumber(args[3]) : 1;
      if (isError(step)) return step;

      const r = Math.floor(rows as number);
      const c = Math.floor(cols as number);
      const s = start as number;
      const st = step as number;

      if (r < 1 || c < 1) return new FormulaError('#VALUE!', 'Rows and cols must be >= 1');

      const result: FormulaValue[][] = [];
      let current = s;
      for (let i = 0; i < r; i++) {
        const row: FormulaValue[] = [];
        for (let j = 0; j < c; j++) {
          row.push(current);
          current += st;
        }
        result.push(row);
      }

      if (r === 1 && c === 1) return result[0][0];
      return result;
    },
  },

  // COMBINA - Number of combinations with repetitions
  {
    name: 'COMBINA',
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

      // COMBINA(n, k) = COMBIN(n + k - 1, k)
      const total = nVal + kVal - 1;
      let result = 1;
      for (let i = 0; i < kVal; i++) {
        result = (result * (total - i)) / (i + 1);
      }
      return Math.round(result);
    },
  },

  // AGGREGATE helper: PERCENTILE.INC equivalent for internal use
  // PERCENTILE.INC - Same as PERCENTILE
  {
    name: 'PERCENTILE.INC',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const k = toNumber(args[1]);
      if (isError(k)) return k;
      const kVal = k as number;

      if (kVal < 0 || kVal > 1) return new FormulaError('#NUM!');
      if (numbers.length === 0) return new FormulaError('#NUM!');

      numbers.sort((a, b) => a - b);
      const n = numbers.length;
      const position = kVal * (n - 1);
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower === upper) return numbers[lower];
      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // PERCENTILE.EXC - Percentile excluding 0 and 1
  {
    name: 'PERCENTILE.EXC',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const k = toNumber(args[1]);
      if (isError(k)) return k;
      const kVal = k as number;
      const n = numbers.length;

      if (kVal <= 0 || kVal >= 1) return new FormulaError('#NUM!');
      if (n === 0) return new FormulaError('#NUM!');

      // k must be between 1/(n+1) and n/(n+1)
      if (kVal < 1 / (n + 1) || kVal > n / (n + 1)) {
        return new FormulaError('#NUM!');
      }

      numbers.sort((a, b) => a - b);
      const position = kVal * (n + 1) - 1;
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower < 0) return numbers[0];
      if (upper >= n) return numbers[n - 1];
      if (lower === upper) return numbers[lower];
      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // QUARTILE.INC - Quartile inclusive (same as QUARTILE)
  {
    name: 'QUARTILE.INC',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const quart = toNumber(args[1]);
      if (isError(quart)) return quart;
      const q = quart as number;

      if (q < 0 || q > 4 || Math.floor(q) !== q) return new FormulaError('#NUM!');
      if (numbers.length === 0) return new FormulaError('#NUM!');

      numbers.sort((a, b) => a - b);
      const n = numbers.length;

      if (q === 0) return numbers[0];
      if (q === 4) return numbers[n - 1];

      const position = (q / 4) * (n - 1);
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower === upper) return numbers[lower];
      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // QUARTILE.EXC - Quartile exclusive
  {
    name: 'QUARTILE.EXC',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers([args[0]]);
      const quart = toNumber(args[1]);
      if (isError(quart)) return quart;
      const q = quart as number;

      if (q < 1 || q > 3 || Math.floor(q) !== q) return new FormulaError('#NUM!');
      if (numbers.length === 0) return new FormulaError('#NUM!');

      numbers.sort((a, b) => a - b);
      const n = numbers.length;
      const k = q / 4;

      // Use PERCENTILE.EXC logic
      if (k < 1 / (n + 1) || k > n / (n + 1)) return new FormulaError('#NUM!');

      const position = k * (n + 1) - 1;
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      const fraction = position - lower;

      if (lower < 0) return numbers[0];
      if (upper >= n) return numbers[n - 1];
      if (lower === upper) return numbers[lower];
      return numbers[lower] + fraction * (numbers[upper] - numbers[lower]);
    },
  },

  // RANK.AVG - Rank with average for ties
  {
    name: 'RANK.AVG',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const numbers = getNumbers([args[1]]);
      const order = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(order)) return order;

      const val = num as number;
      if (!numbers.includes(val)) {
        return new FormulaError('#N/A');
      }

      if ((order as number) === 0) {
        numbers.sort((a, b) => b - a);
      } else {
        numbers.sort((a, b) => a - b);
      }

      // Find all occurrences
      const indices: number[] = [];
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] === val) indices.push(i + 1);
      }

      // Average rank
      return indices.reduce((a, b) => a + b, 0) / indices.length;
    },
  },

  // RANK.EQ - Rank (same as RANK, for Excel compatibility)
  {
    name: 'RANK.EQ',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const numbers = getNumbers([args[1]]);
      const order = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(order)) return order;

      if ((order as number) === 0) {
        numbers.sort((a, b) => b - a);
      } else {
        numbers.sort((a, b) => a - b);
      }

      const index = numbers.indexOf(num as number);
      if (index === -1) return new FormulaError('#N/A');
      return index + 1;
    },
  },

  // STDEV.S - Sample standard deviation (alias for STDEV)
  {
    name: 'STDEV.S',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 2) return new FormulaError('#DIV/0!');
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
      return Math.sqrt(variance);
    },
  },

  // STDEV.P - Population standard deviation (alias for STDEVP)
  {
    name: 'STDEV.P',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return new FormulaError('#DIV/0!');
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
      return Math.sqrt(variance);
    },
  },

  // VAR.S - Sample variance (alias for VAR)
  {
    name: 'VAR.S',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length < 2) return new FormulaError('#DIV/0!');
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
    },
  },

  // VAR.P - Population variance (alias for VARP)
  {
    name: 'VAR.P',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return new FormulaError('#DIV/0!');
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      return numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    },
  },

  // MODE.SNGL - Mode (single value, alias for MODE)
  {
    name: 'MODE.SNGL',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return new FormulaError('#N/A');
      const counts = new Map<number, number>();
      for (const num of numbers) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }
      let maxCount = 0;
      let mode = numbers[0];
      for (const [num, count] of counts) {
        if (count > maxCount) { maxCount = count; mode = num; }
      }
      if (maxCount === 1) return new FormulaError('#N/A', 'No repeated values');
      return mode;
    },
  },

  // MODE.MULT - Returns a vertical array of the most frequently occurring values
  {
    name: 'MODE.MULT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const numbers = getNumbers(args);
      if (numbers.length === 0) return new FormulaError('#N/A');
      const counts = new Map<number, number>();
      for (const num of numbers) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }
      let maxCount = 0;
      for (const count of counts.values()) {
        if (count > maxCount) maxCount = count;
      }
      if (maxCount === 1) return new FormulaError('#N/A', 'No repeated values');
      const modes: number[] = [];
      for (const [num, count] of counts) {
        if (count === maxCount) modes.push(num);
      }
      modes.sort((a, b) => a - b);
      return modes.map(m => [m as FormulaValue]) as FormulaValue[][];
    },
  },

  // CEILING.MATH - Rounds a number up to the nearest integer or nearest multiple
  {
    name: 'CEILING.MATH',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const sig = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(sig)) return sig;
      const mode = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(mode)) return mode;

      const n = num as number;
      const s = sig as number;
      if (s === 0) return 0;

      if ((mode as number) !== 0 && n < 0) {
        // Round toward negative infinity
        return Math.floor(n / s) * s;
      }
      return Math.ceil(n / s) * s;
    },
  },

  // FLOOR.MATH - Rounds a number down to the nearest integer or nearest multiple
  {
    name: 'FLOOR.MATH',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const sig = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(sig)) return sig;
      const mode = args.length > 2 ? toNumber(args[2]) : 0;
      if (isError(mode)) return mode;

      const n = num as number;
      const s = sig as number;
      if (s === 0) return 0;

      if ((mode as number) !== 0 && n < 0) {
        // Round toward positive infinity for negative numbers
        return Math.ceil(n / s) * s;
      }
      return Math.floor(n / s) * s;
    },
  },

  // CEILING.PRECISE - Rounds up to nearest multiple, always away from zero
  {
    name: 'CEILING.PRECISE',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const sig = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(sig)) return sig;

      const n = num as number;
      const s = Math.abs(sig as number);
      if (s === 0) return 0;

      return Math.ceil(n / s) * s;
    },
  },

  // FLOOR.PRECISE - Rounds down to nearest multiple
  {
    name: 'FLOOR.PRECISE',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const sig = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(sig)) return sig;

      const n = num as number;
      const s = Math.abs(sig as number);
      if (s === 0) return 0;

      return Math.floor(n / s) * s;
    },
  },

  // ISO.CEILING - Same as CEILING.PRECISE
  {
    name: 'ISO.CEILING',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const sig = args.length > 1 ? toNumber(args[1]) : 1;
      if (isError(sig)) return sig;

      const n = num as number;
      const s = Math.abs(sig as number);
      if (s === 0) return 0;

      return Math.ceil(n / s) * s;
    },
  },

  // ACOT - Inverse cotangent
  {
    name: 'ACOT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.atan(1 / (num as number));
    },
  },

  // ACOTH - Inverse hyperbolic cotangent
  {
    name: 'ACOTH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (Math.abs(n) <= 1) return new FormulaError('#NUM!', 'Absolute value must be > 1');
      return 0.5 * Math.log((n + 1) / (n - 1));
    },
  },

  // COT - Cotangent
  {
    name: 'COT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n === 0) return new FormulaError('#DIV/0!');
      return 1 / Math.tan(n);
    },
  },

  // COTH - Hyperbolic cotangent
  {
    name: 'COTH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n === 0) return new FormulaError('#DIV/0!');
      return 1 / Math.tanh(n);
    },
  },

  // CSC - Cosecant
  {
    name: 'CSC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      const sinVal = Math.sin(n);
      if (sinVal === 0) return new FormulaError('#DIV/0!');
      return 1 / sinVal;
    },
  },

  // CSCH - Hyperbolic cosecant
  {
    name: 'CSCH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n === 0) return new FormulaError('#DIV/0!');
      return 1 / Math.sinh(n);
    },
  },

  // SEC - Secant
  {
    name: 'SEC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const cosVal = Math.cos(num as number);
      if (cosVal === 0) return new FormulaError('#DIV/0!');
      return 1 / cosVal;
    },
  },

  // SECH - Hyperbolic secant
  {
    name: 'SECH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return 1 / Math.cosh(num as number);
    },
  },

  // ASINH - Inverse hyperbolic sine
  {
    name: 'ASINH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      return Math.asinh(num as number);
    },
  },

  // ACOSH - Inverse hyperbolic cosine
  {
    name: 'ACOSH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n < 1) return new FormulaError('#NUM!', 'Number must be >= 1');
      return Math.acosh(n);
    },
  },

  // ATANH - Inverse hyperbolic tangent
  {
    name: 'ATANH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const n = num as number;
      if (n <= -1 || n >= 1) return new FormulaError('#NUM!', 'Number must be between -1 and 1 exclusive');
      return Math.atanh(n);
    },
  },
];

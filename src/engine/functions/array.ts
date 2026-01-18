import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, isError, flattenValues, toBoolean, isBlank } from './utils';

export const arrayFunctions: FunctionDef[] = [
  // FILTER - filter array based on criteria
  {
    name: 'FILTER',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const include = args[1];
      const ifEmpty = args[2];

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'FILTER requires an array');
      }

      // Flatten include array to get boolean conditions
      const includeFlat = flattenValues([include]).map((v) => toBoolean(v));

      // Handle 2D array
      const rows = Array.isArray(array[0]) ? (array as FormulaValue[][]) : [[...array] as FormulaValue[]];

      if (includeFlat.length !== rows.length) {
        return new FormulaError('#VALUE!', 'Array and include must have same dimensions');
      }

      const result: FormulaValue[][] = [];

      for (let i = 0; i < rows.length; i++) {
        const condition = includeFlat[i];
        if (isError(condition)) continue;
        if (condition === true) {
          result.push(rows[i]);
        }
      }

      if (result.length === 0) {
        if (ifEmpty !== undefined) {
          return ifEmpty;
        }
        return new FormulaError('#N/A', 'No data returned from FILTER');
      }

      return result;
    },
  },

  // SORT - sort an array
  {
    name: 'SORT',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const sortIndex = args[1] !== undefined ? toNumber(args[1]) : 1;
      const sortOrder = args[2] !== undefined ? toNumber(args[2]) : 1;
      const byCol = args[3] !== undefined ? toBoolean(args[3]) : false;

      if (isError(sortIndex)) return sortIndex;
      if (isError(sortOrder)) return sortOrder;
      if (isError(byCol)) return byCol;

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'SORT requires an array');
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = (array as FormulaValue[][]).map((row) => [...row]);
      } else {
        rows = (array as unknown as FormulaValue[]).map((v) => [v]);
      }

      const idx = (sortIndex as number) - 1;
      const ascending = (sortOrder as number) === 1;

      if (byCol) {
        // Sort columns - transpose, sort, transpose back
        const transposed = transposeArray(rows);
        transposed.sort((a, b) => compareForSort(a[idx], b[idx], ascending));
        return transposeArray(transposed);
      } else {
        // Sort rows
        rows.sort((a, b) => compareForSort(a[idx], b[idx], ascending));
        return rows;
      }
    },
  },

  // SORTBY - sort array by another array
  {
    name: 'SORTBY',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'SORTBY requires an array');
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = (array as FormulaValue[][]).map((row) => [...row]);
      } else {
        rows = (array as unknown as FormulaValue[]).map((v) => [v]);
      }

      // Create index array for sorting
      const indices = rows.map((_, i) => i);

      // Process sort pairs (byArray, sortOrder)
      const sortPairs: Array<{ values: FormulaValue[]; ascending: boolean }> = [];
      for (let i = 1; i < args.length; i += 2) {
        const byArray = flattenValues([args[i]]);
        const sortOrder = args[i + 1] !== undefined ? toNumber(args[i + 1]) : 1;
        if (isError(sortOrder)) return sortOrder;
        sortPairs.push({
          values: byArray,
          ascending: (sortOrder as number) === 1,
        });
      }

      // Sort indices based on sort pairs
      indices.sort((a, b) => {
        for (const pair of sortPairs) {
          const cmp = compareForSort(pair.values[a], pair.values[b], pair.ascending);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });

      // Reorder rows based on sorted indices
      const result = indices.map((i) => rows[i]);
      return result;
    },
  },

  // UNIQUE - return unique values
  {
    name: 'UNIQUE',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const byCol = args[1] !== undefined ? toBoolean(args[1]) : false;
      const exactlyOnce = args[2] !== undefined ? toBoolean(args[2]) : false;

      if (isError(byCol)) return byCol;
      if (isError(exactlyOnce)) return exactlyOnce;

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'UNIQUE requires an array');
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = array as FormulaValue[][];
      } else {
        rows = (array as unknown as FormulaValue[]).map((v) => [v]);
      }

      if (byCol) {
        rows = transposeArray(rows);
      }

      // Track unique rows
      const seen = new Map<string, number>();
      const result: FormulaValue[][] = [];

      for (const row of rows) {
        const key = JSON.stringify(row);
        seen.set(key, (seen.get(key) || 0) + 1);
      }

      for (const row of rows) {
        const key = JSON.stringify(row);
        const count = seen.get(key) || 0;

        if (exactlyOnce) {
          if (count === 1) {
            result.push(row);
          }
        } else {
          if (!result.some((r) => JSON.stringify(r) === key)) {
            result.push(row);
          }
        }
      }

      if (result.length === 0) {
        return new FormulaError('#N/A', 'No unique values found');
      }

      const finalResult = byCol ? transposeArray(result) : result;
      return finalResult;
    },
  },

  // SEQUENCE - generate a sequence of numbers
  {
    name: 'SEQUENCE',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rows = toNumber(args[0]);
      const cols = args[1] !== undefined ? toNumber(args[1]) : 1;
      const start = args[2] !== undefined ? toNumber(args[2]) : 1;
      const step = args[3] !== undefined ? toNumber(args[3]) : 1;

      if (isError(rows)) return rows;
      if (isError(cols)) return cols;
      if (isError(start)) return start;
      if (isError(step)) return step;

      const numRows = Math.floor(rows as number);
      const numCols = Math.floor(cols as number);
      const startVal = start as number;
      const stepVal = step as number;

      if (numRows <= 0 || numCols <= 0) {
        return new FormulaError('#VALUE!', 'Rows and columns must be positive');
      }

      const result: FormulaValue[][] = [];
      let current = startVal;

      for (let r = 0; r < numRows; r++) {
        const row: FormulaValue[] = [];
        for (let c = 0; c < numCols; c++) {
          row.push(current);
          current += stepVal;
        }
        result.push(row);
      }

      return result;
    },
  },

  // RANDARRAY - generate array of random numbers
  {
    name: 'RANDARRAY',
    minArgs: 0,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rows = args[0] !== undefined ? toNumber(args[0]) : 1;
      const cols = args[1] !== undefined ? toNumber(args[1]) : 1;
      const min = args[2] !== undefined ? toNumber(args[2]) : 0;
      const max = args[3] !== undefined ? toNumber(args[3]) : 1;
      const wholeNumber = args[4] !== undefined ? toBoolean(args[4]) : false;

      if (isError(rows)) return rows;
      if (isError(cols)) return cols;
      if (isError(min)) return min;
      if (isError(max)) return max;
      if (isError(wholeNumber)) return wholeNumber;

      const numRows = Math.floor(rows as number);
      const numCols = Math.floor(cols as number);
      const minVal = min as number;
      const maxVal = max as number;

      if (numRows <= 0 || numCols <= 0) {
        return new FormulaError('#VALUE!', 'Rows and columns must be positive');
      }

      const result: FormulaValue[][] = [];

      for (let r = 0; r < numRows; r++) {
        const row: FormulaValue[] = [];
        for (let c = 0; c < numCols; c++) {
          let value = Math.random() * (maxVal - minVal) + minVal;
          if (wholeNumber) {
            value = Math.floor(value);
          }
          row.push(value);
        }
        result.push(row);
      }

      // Return single value if 1x1
      if (numCols === 1 && numRows === 1) {
        return result[0][0];
      }

      return result;
    },
  },

  // TRANSPOSE - transpose array
  {
    name: 'TRANSPOSE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];

      if (!Array.isArray(array)) {
        return [[array]];
      }

      const is2D = Array.isArray(array[0]);

      if (!is2D) {
        // 1D row -> 2D column
        return (array as unknown as FormulaValue[]).map((v) => [v]);
      }

      return transposeArray(array as FormulaValue[][]);
    },
  },

  // FLATTEN - flatten array to single column
  {
    name: 'FLATTEN',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const result: FormulaValue[][] = [];

      for (const arg of args) {
        const flat = flattenValues([arg]);
        for (const val of flat) {
          result.push([val]);
        }
      }

      return result;
    },
  },

  // TOCOL - convert array to single column
  {
    name: 'TOCOL',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const ignore = args[1] !== undefined ? toNumber(args[1]) : 0;
      const scanByCol = args[2] !== undefined ? toBoolean(args[2]) : false;

      if (isError(ignore)) return ignore;
      if (isError(scanByCol)) return scanByCol;

      if (!Array.isArray(array)) {
        return [[array]];
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = scanByCol ? transposeArray(array as FormulaValue[][]) : (array as FormulaValue[][]);
      } else {
        rows = [(array as unknown as FormulaValue[])];
      }

      const result: FormulaValue[][] = [];
      const ignoreVal = ignore as number;

      for (const row of rows) {
        for (const val of row) {
          if (ignoreVal === 1 && isBlank(val)) continue;
          if (ignoreVal === 2 && isError(val)) continue;
          if (ignoreVal === 3 && (isBlank(val) || isError(val))) continue;
          result.push([val]);
        }
      }

      return result;
    },
  },

  // TOROW - convert array to single row
  {
    name: 'TOROW',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const ignore = args[1] !== undefined ? toNumber(args[1]) : 0;
      const scanByCol = args[2] !== undefined ? toBoolean(args[2]) : false;

      if (isError(ignore)) return ignore;
      if (isError(scanByCol)) return scanByCol;

      if (!Array.isArray(array)) {
        return [[array]];
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = scanByCol ? transposeArray(array as FormulaValue[][]) : (array as FormulaValue[][]);
      } else {
        rows = [(array as unknown as FormulaValue[])];
      }

      const result: FormulaValue[] = [];
      const ignoreVal = ignore as number;

      for (const row of rows) {
        for (const val of row) {
          if (ignoreVal === 1 && isBlank(val)) continue;
          if (ignoreVal === 2 && isError(val)) continue;
          if (ignoreVal === 3 && (isBlank(val) || isError(val))) continue;
          result.push(val);
        }
      }

      return [result];
    },
  },

  // WRAPROWS - wrap values into rows
  {
    name: 'WRAPROWS',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const vector = flattenValues([args[0]]);
      const wrapCount = toNumber(args[1]);
      const padWith = args[2];

      if (isError(wrapCount)) return wrapCount;

      const cols = Math.floor(wrapCount as number);
      if (cols <= 0) {
        return new FormulaError('#VALUE!', 'Wrap count must be positive');
      }

      const result: FormulaValue[][] = [];
      let currentRow: FormulaValue[] = [];

      for (const val of vector) {
        currentRow.push(val);
        if (currentRow.length === cols) {
          result.push(currentRow);
          currentRow = [];
        }
      }

      // Handle remaining values
      if (currentRow.length > 0) {
        while (currentRow.length < cols) {
          currentRow.push(padWith !== undefined ? padWith : new FormulaError('#N/A'));
        }
        result.push(currentRow);
      }

      return result;
    },
  },

  // WRAPCOLS - wrap values into columns
  {
    name: 'WRAPCOLS',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const vector = flattenValues([args[0]]);
      const wrapCount = toNumber(args[1]);
      const padWith = args[2];

      if (isError(wrapCount)) return wrapCount;

      const rows = Math.floor(wrapCount as number);
      if (rows <= 0) {
        return new FormulaError('#VALUE!', 'Wrap count must be positive');
      }

      const cols = Math.ceil(vector.length / rows);
      const result: FormulaValue[][] = Array.from({ length: rows }, () => []);

      for (let i = 0; i < vector.length; i++) {
        const rowIdx = i % rows;
        result[rowIdx].push(vector[i]);
      }

      // Pad remaining cells
      const pad = padWith !== undefined ? padWith : new FormulaError('#N/A');
      for (const row of result) {
        while (row.length < cols) {
          row.push(pad);
        }
      }

      return result;
    },
  },

  // TAKE - take first/last n rows or columns
  {
    name: 'TAKE',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const rowCount = toNumber(args[1]);
      const colCount = args[2] !== undefined ? toNumber(args[2]) : undefined;

      if (isError(rowCount)) return rowCount;
      if (colCount !== undefined && isError(colCount)) return colCount as FormulaError;

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'TAKE requires an array');
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = array as FormulaValue[][];
      } else {
        rows = [(array as unknown as FormulaValue[])];
      }

      const numRows = rowCount as number;

      // Take rows
      let result: FormulaValue[][];
      if (numRows >= 0) {
        result = rows.slice(0, numRows);
      } else {
        result = rows.slice(numRows);
      }

      // Take columns if specified
      if (colCount !== undefined) {
        const numCols = colCount as number;
        result = result.map((row) => {
          if (numCols >= 0) {
            return row.slice(0, numCols);
          } else {
            return row.slice(numCols);
          }
        });
      }

      if (result.length === 0) {
        return new FormulaError('#N/A', 'No data to return');
      }

      return result;
    },
  },

  // DROP - drop first/last n rows or columns
  {
    name: 'DROP',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const rowCount = toNumber(args[1]);
      const colCount = args[2] !== undefined ? toNumber(args[2]) : undefined;

      if (isError(rowCount)) return rowCount;
      if (colCount !== undefined && isError(colCount)) return colCount as FormulaError;

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'DROP requires an array');
      }

      const is2D = Array.isArray(array[0]);
      let rows: FormulaValue[][];

      if (is2D) {
        rows = array as FormulaValue[][];
      } else {
        rows = [(array as unknown as FormulaValue[])];
      }

      const numRows = rowCount as number;

      // Drop rows
      let result: FormulaValue[][];
      if (numRows >= 0) {
        result = rows.slice(numRows);
      } else {
        result = rows.slice(0, rows.length + numRows);
      }

      // Drop columns if specified
      if (colCount !== undefined) {
        const numCols = colCount as number;
        result = result.map((row) => {
          if (numCols >= 0) {
            return row.slice(numCols);
          } else {
            return row.slice(0, row.length + numCols);
          }
        });
      }

      if (result.length === 0 || (result.length > 0 && result[0].length === 0)) {
        return new FormulaError('#N/A', 'No data to return');
      }

      return result;
    },
  },

  // EXPAND - expand array to specified dimensions
  {
    name: 'EXPAND',
    minArgs: 2,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      const rows = toNumber(args[1]);
      const cols = args[2] !== undefined ? toNumber(args[2]) : undefined;
      const padWith = args[3] !== undefined ? args[3] : new FormulaError('#N/A');

      if (isError(rows)) return rows;
      if (cols !== undefined && isError(cols)) return cols as FormulaError;

      if (!Array.isArray(array)) {
        const numRows = Math.floor(rows as number);
        const numCols = cols !== undefined ? Math.floor(cols as number) : 1;
        return Array.from({ length: numRows }, (_, r) =>
          Array.from({ length: numCols }, (_, c) => (r === 0 && c === 0 ? array : padWith))
        );
      }

      const is2D = Array.isArray(array[0]);
      const sourceRows: FormulaValue[][] = is2D
        ? (array as FormulaValue[][])
        : [(array as unknown as FormulaValue[])];

      const numRows = Math.floor(rows as number);
      const numCols = cols !== undefined ? Math.floor(cols as number) : sourceRows[0].length;

      const result: FormulaValue[][] = [];

      for (let r = 0; r < numRows; r++) {
        const row: FormulaValue[] = [];
        for (let c = 0; c < numCols; c++) {
          if (r < sourceRows.length && c < sourceRows[r].length) {
            row.push(sourceRows[r][c]);
          } else {
            row.push(padWith);
          }
        }
        result.push(row);
      }

      return result;
    },
  },

  // CHOOSECOLS - select specific columns
  {
    name: 'CHOOSECOLS',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];

      if (!Array.isArray(array) || !Array.isArray(array[0])) {
        return new FormulaError('#VALUE!', 'CHOOSECOLS requires a 2D array');
      }

      const colIndices: number[] = [];
      for (let i = 1; i < args.length; i++) {
        const idx = toNumber(args[i]);
        if (isError(idx)) return idx;
        colIndices.push(idx as number);
      }

      const numCols = array[0].length;
      const result: FormulaValue[][] = array.map((row) => {
        return colIndices.map((idx) => {
          const colIdx = idx > 0 ? idx - 1 : numCols + idx;
          if (colIdx < 0 || colIdx >= numCols) {
            return new FormulaError('#VALUE!', 'Column index out of range');
          }
          return row[colIdx];
        });
      });

      return result;
    },
  },

  // CHOOSEROWS - select specific rows
  {
    name: 'CHOOSEROWS',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];

      if (!Array.isArray(array)) {
        return new FormulaError('#VALUE!', 'CHOOSEROWS requires an array');
      }

      const is2D = Array.isArray(array[0]);
      const rows: FormulaValue[][] = is2D
        ? (array as FormulaValue[][])
        : (array as unknown as FormulaValue[]).map((v) => [v]);

      const rowIndices: number[] = [];
      for (let i = 1; i < args.length; i++) {
        const idx = toNumber(args[i]);
        if (isError(idx)) return idx;
        rowIndices.push(idx as number);
      }

      const numRows = rows.length;
      const result: FormulaValue[][] = rowIndices.map((idx) => {
        const rowIdx = idx > 0 ? idx - 1 : numRows + idx;
        if (rowIdx < 0 || rowIdx >= numRows) {
          return [new FormulaError('#VALUE!', 'Row index out of range')];
        }
        return rows[rowIdx];
      });

      return result;
    },
  },

  // HSTACK - stack arrays horizontally
  {
    name: 'HSTACK',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const arrays: FormulaValue[][][] = args.map((arg) => {
        if (!Array.isArray(arg)) {
          return [[arg]];
        }
        if (!Array.isArray((arg as FormulaValue[][])[0])) {
          return (arg as unknown as FormulaValue[]).map((v) => [v]);
        }
        return arg as FormulaValue[][];
      });

      const maxRows = Math.max(...arrays.map((a) => a.length));
      const result: FormulaValue[][] = [];

      for (let r = 0; r < maxRows; r++) {
        const row: FormulaValue[] = [];
        for (const array of arrays) {
          if (r < array.length) {
            row.push(...array[r]);
          } else {
            row.push(...Array(array[0].length).fill(new FormulaError('#N/A')));
          }
        }
        result.push(row);
      }

      return result;
    },
  },

  // VSTACK - stack arrays vertically
  {
    name: 'VSTACK',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const arrays: FormulaValue[][][] = args.map((arg) => {
        if (!Array.isArray(arg)) {
          return [[arg]];
        }
        if (!Array.isArray((arg as FormulaValue[][])[0])) {
          return [(arg as unknown as FormulaValue[])];
        }
        return arg as FormulaValue[][];
      });

      const maxCols = Math.max(...arrays.map((a) => (a[0] ? a[0].length : 0)));
      const result: FormulaValue[][] = [];

      for (const array of arrays) {
        for (const row of array) {
          const paddedRow = [...row];
          while (paddedRow.length < maxCols) {
            paddedRow.push(new FormulaError('#N/A'));
          }
          result.push(paddedRow);
        }
      }

      return result;
    },
  },
];

// Helper function to transpose a 2D array
function transposeArray(array: FormulaValue[][]): FormulaValue[][] {
  if (array.length === 0) return [];
  const rows = array.length;
  const cols = array[0].length;
  const result: FormulaValue[][] = [];

  for (let c = 0; c < cols; c++) {
    const row: FormulaValue[] = [];
    for (let r = 0; r < rows; r++) {
      row.push(array[r][c]);
    }
    result.push(row);
  }

  return result;
}

// Helper function for sorting comparison
function compareForSort(a: FormulaValue, b: FormulaValue, ascending: boolean): number {
  // Handle nulls/undefined
  if (a == null && b == null) return 0;
  if (a == null) return ascending ? 1 : -1;
  if (b == null) return ascending ? -1 : 1;

  // Handle errors
  if (isError(a) && isError(b)) return 0;
  if (isError(a)) return ascending ? 1 : -1;
  if (isError(b)) return ascending ? -1 : 1;

  // Handle booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return ascending ? (a === b ? 0 : a ? 1 : -1) : (a === b ? 0 : a ? -1 : 1);
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return ascending ? a - b : b - a;
  }

  // Handle strings
  if (typeof a === 'string' && typeof b === 'string') {
    const cmp = a.toLowerCase().localeCompare(b.toLowerCase());
    return ascending ? cmp : -cmp;
  }

  // Mixed types: numbers < text < booleans
  const typeOrder = (v: FormulaValue): number => {
    if (typeof v === 'number') return 0;
    if (typeof v === 'string') return 1;
    if (typeof v === 'boolean') return 2;
    return 3;
  };

  const orderA = typeOrder(a);
  const orderB = typeOrder(b);
  return ascending ? orderA - orderB : orderB - orderA;
}

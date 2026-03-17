import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, toString, flattenValues, isError, getNumbers } from './utils';

// Helper: extract matching rows from a database based on criteria
// database is a 2D array where row 0 is headers
// criteria is a 2D array where row 0 is headers matching database headers, rows below are conditions
function getFieldIndex(database: FormulaValue[][], field: FormulaValue): number | FormulaError {
  if (typeof field === 'number') {
    const idx = Math.floor(field) - 1; // 1-based
    if (idx < 0 || idx >= database[0].length) {
      return new FormulaError('#VALUE!', 'Field index out of range');
    }
    return idx;
  }
  if (typeof field === 'string') {
    const headers = database[0];
    for (let c = 0; c < headers.length; c++) {
      if (toString(headers[c]).toLowerCase() === field.toLowerCase()) {
        return c;
      }
    }
    return new FormulaError('#VALUE!', `Field "${field}" not found in database headers`);
  }
  return new FormulaError('#VALUE!', 'Invalid field argument');
}

function matchesCriteriaValue(cellValue: FormulaValue, criteriaValue: FormulaValue): boolean {
  if (criteriaValue === null || criteriaValue === '' || criteriaValue === undefined) {
    return true; // Empty criteria matches everything
  }
  if (typeof criteriaValue === 'string') {
    const match = criteriaValue.match(/^([<>=!]+)(.*)$/);
    if (match) {
      const op = match[1];
      const compareStr = match[2];
      const numCompare = parseFloat(compareStr);
      const numValue = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue));

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
          case '<>': case '!=': return String(cellValue).toLowerCase() !== compareStr.toLowerCase();
          case '=': return String(cellValue).toLowerCase() === compareStr.toLowerCase();
        }
      }
    }
    // Plain string comparison (case-insensitive)
    return String(cellValue).toLowerCase() === String(criteriaValue).toLowerCase();
  }
  if (typeof criteriaValue === 'number') {
    const numVal = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue));
    return numVal === criteriaValue;
  }
  return cellValue === criteriaValue;
}

function getMatchingRows(database: FormulaValue[][], criteria: FormulaValue[][]): number[] {
  const dbHeaders = database[0];
  const critHeaders = criteria[0];
  const matchingRows: number[] = [];

  // Map criteria columns to database columns
  const critColMap: number[] = [];
  for (let cc = 0; cc < critHeaders.length; cc++) {
    const critHeader = toString(critHeaders[cc]).toLowerCase();
    let found = -1;
    for (let dc = 0; dc < dbHeaders.length; dc++) {
      if (toString(dbHeaders[dc]).toLowerCase() === critHeader) {
        found = dc;
        break;
      }
    }
    critColMap.push(found);
  }

  // For each data row (skip header)
  for (let r = 1; r < database.length; r++) {
    let rowMatches = false;

    // Each criteria row is OR'd (any criteria row matching means the data row matches)
    for (let cr = 1; cr < criteria.length; cr++) {
      let allColsMatch = true;
      for (let cc = 0; cc < critHeaders.length; cc++) {
        const dbCol = critColMap[cc];
        if (dbCol === -1) continue; // Skip unmapped criteria columns
        const criteriaVal = criteria[cr][cc];
        if (criteriaVal === null || criteriaVal === '' || criteriaVal === undefined) continue;
        const cellVal = database[r][dbCol];
        if (!matchesCriteriaValue(cellVal, criteriaVal)) {
          allColsMatch = false;
          break;
        }
      }
      if (allColsMatch) {
        rowMatches = true;
        break;
      }
    }

    if (rowMatches) {
      matchingRows.push(r);
    }
  }

  return matchingRows;
}

function parseDatabaseArgs(args: FormulaValue[]): { database: FormulaValue[][]; fieldIdx: number; criteria: FormulaValue[][] } | FormulaError {
  const database = args[0] as FormulaValue[][];
  const field = args[1];
  const criteria = args[2] as FormulaValue[][];

  if (!Array.isArray(database) || database.length < 2) {
    return new FormulaError('#VALUE!', 'Database must be a 2D array with at least a header row and one data row');
  }
  if (!Array.isArray(criteria) || criteria.length < 1) {
    return new FormulaError('#VALUE!', 'Criteria must be a 2D array with at least a header row');
  }

  const fieldIdx = getFieldIndex(database, field);
  if (fieldIdx instanceof FormulaError) return fieldIdx;

  return { database, fieldIdx, criteria };
}

function getMatchingFieldValues(database: FormulaValue[][], fieldIdx: number, matchingRows: number[]): FormulaValue[] {
  return matchingRows.map(r => database[r][fieldIdx]);
}

export const databaseFunctions: FunctionDef[] = [
  // DSUM - Sum of values in a database field matching criteria
  {
    name: 'DSUM',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      let sum = 0;
      for (const v of values) {
        if (typeof v === 'number') sum += v;
      }
      return sum;
    },
  },

  // DAVERAGE - Average of values in a database field matching criteria
  {
    name: 'DAVERAGE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return new FormulaError('#DIV/0!');
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    },
  },

  // DCOUNT - Count numeric values in a database field matching criteria
  {
    name: 'DCOUNT',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      return values.filter(v => typeof v === 'number').length;
    },
  },

  // DCOUNTA - Count non-blank values in a database field matching criteria
  {
    name: 'DCOUNTA',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      return values.filter(v => v !== null && v !== undefined && v !== '').length;
    },
  },

  // DMAX - Maximum value in a database field matching criteria
  {
    name: 'DMAX',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return 0;
      return Math.max(...nums);
    },
  },

  // DMIN - Minimum value in a database field matching criteria
  {
    name: 'DMIN',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return 0;
      return Math.min(...nums);
    },
  },

  // DGET - Get single value from database field matching criteria
  {
    name: 'DGET',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      if (rows.length === 0) {
        return new FormulaError('#VALUE!', 'No matching record found');
      }
      if (rows.length > 1) {
        return new FormulaError('#NUM!', 'More than one record matches criteria');
      }
      return database[rows[0]][fieldIdx];
    },
  },

  // DVAR - Sample variance of values in a database field matching criteria
  {
    name: 'DVAR',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length < 2) return new FormulaError('#DIV/0!');
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (nums.length - 1);
      return variance;
    },
  },

  // DVARP - Population variance of values in a database field matching criteria
  {
    name: 'DVARP',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return new FormulaError('#DIV/0!');
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nums.length;
      return variance;
    },
  },

  // DSTDEV - Sample standard deviation of values in a database field matching criteria
  {
    name: 'DSTDEV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length < 2) return new FormulaError('#DIV/0!');
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (nums.length - 1);
      return Math.sqrt(variance);
    },
  },

  // DSTDEVP - Population standard deviation of values in a database field matching criteria
  {
    name: 'DSTDEVP',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return new FormulaError('#DIV/0!');
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nums.length;
      return Math.sqrt(variance);
    },
  },

  // DPRODUCT - Product of values in a database field matching criteria
  {
    name: 'DPRODUCT',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const parsed = parseDatabaseArgs(args);
      if (parsed instanceof FormulaError) return parsed;
      const { database, fieldIdx, criteria } = parsed;
      const rows = getMatchingRows(database, criteria);
      const values = getMatchingFieldValues(database, fieldIdx, rows);
      const nums = values.filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return 0;
      return nums.reduce((a, b) => a * b, 1);
    },
  },

  // SUBTOTAL - Performs a specified calculation on a list or database
  // function_num: 1=AVERAGE, 2=COUNT, 3=COUNTA, 4=MAX, 5=MIN, 6=PRODUCT, 7=STDEV, 8=STDEVP, 9=SUM, 10=VAR, 11=VARP
  // 101-111 are the same but ignore hidden rows (we treat same as 1-11 since we don't track hidden rows)
  {
    name: 'SUBTOTAL',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const fnNum = toNumber(args[0]);
      if (isError(fnNum)) return fnNum;
      const funcId = Math.floor(fnNum as number);

      // Normalize 101-111 to 1-11 (ignore hidden rows not applicable here)
      const normalizedId = funcId > 100 ? funcId - 100 : funcId;

      const dataArgs = args.slice(1);
      const numbers = getNumbers(dataArgs);
      const flat = flattenValues(dataArgs);

      switch (normalizedId) {
        case 1: { // AVERAGE
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          return numbers.reduce((a, b) => a + b, 0) / numbers.length;
        }
        case 2: { // COUNT
          return numbers.length;
        }
        case 3: { // COUNTA
          return flat.filter(v => v !== null && v !== undefined).length;
        }
        case 4: { // MAX
          if (numbers.length === 0) return 0;
          return Math.max(...numbers);
        }
        case 5: { // MIN
          if (numbers.length === 0) return 0;
          return Math.min(...numbers);
        }
        case 6: { // PRODUCT
          if (numbers.length === 0) return 0;
          return numbers.reduce((a, b) => a * b, 1);
        }
        case 7: { // STDEV
          if (numbers.length < 2) return new FormulaError('#DIV/0!');
          const mean7 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const var7 = numbers.reduce((s, v) => s + Math.pow(v - mean7, 2), 0) / (numbers.length - 1);
          return Math.sqrt(var7);
        }
        case 8: { // STDEVP
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          const mean8 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const var8 = numbers.reduce((s, v) => s + Math.pow(v - mean8, 2), 0) / numbers.length;
          return Math.sqrt(var8);
        }
        case 9: { // SUM
          return numbers.reduce((a, b) => a + b, 0);
        }
        case 10: { // VAR
          if (numbers.length < 2) return new FormulaError('#DIV/0!');
          const mean10 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          return numbers.reduce((s, v) => s + Math.pow(v - mean10, 2), 0) / (numbers.length - 1);
        }
        case 11: { // VARP
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          const mean11 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          return numbers.reduce((s, v) => s + Math.pow(v - mean11, 2), 0) / numbers.length;
        }
        default:
          return new FormulaError('#VALUE!', `Invalid SUBTOTAL function_num: ${funcId}`);
      }
    },
  },

  // AGGREGATE - Similar to SUBTOTAL but with options to ignore errors/hidden rows
  // function_num: 1-13 (1=AVERAGE, 2=COUNT, 3=COUNTA, 4=MAX, 5=MIN, 6=PRODUCT, 7=STDEV.S, 8=STDEV.P,
  //   9=SUM, 10=VAR.S, 11=VAR.P, 12=MEDIAN, 13=MODE.SNGL)
  // options: 0=ignore nothing, 1=ignore hidden, 2=ignore errors, 3=ignore hidden+errors,
  //   4=ignore nothing, 5=ignore hidden, 6=ignore errors, 7=ignore hidden+errors
  {
    name: 'AGGREGATE',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const fnNum = toNumber(args[0]);
      if (isError(fnNum)) return fnNum;
      const funcId = Math.floor(fnNum as number);

      const optNum = toNumber(args[1]);
      if (isError(optNum)) return optNum;
      const options = Math.floor(optNum as number);

      const ignoreErrors = options === 2 || options === 3 || options === 6 || options === 7;

      const dataArgs = args.slice(2);
      let flat = flattenValues(dataArgs);

      // Filter out errors if requested
      if (ignoreErrors) {
        flat = flat.filter(v => !(v instanceof FormulaError));
      } else {
        // If not ignoring errors, check for errors
        for (const v of flat) {
          if (v instanceof FormulaError) return v;
        }
      }

      const numbers: number[] = [];
      for (const v of flat) {
        if (typeof v === 'number' && !isNaN(v)) numbers.push(v);
        else if (typeof v === 'string') {
          const parsed = parseFloat(v);
          if (!isNaN(parsed) && v.trim() !== '') numbers.push(parsed);
        }
      }

      switch (funcId) {
        case 1: { // AVERAGE
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          return numbers.reduce((a, b) => a + b, 0) / numbers.length;
        }
        case 2: { // COUNT
          return numbers.length;
        }
        case 3: { // COUNTA
          return flat.filter(v => v !== null && v !== undefined).length;
        }
        case 4: { // MAX
          if (numbers.length === 0) return 0;
          return Math.max(...numbers);
        }
        case 5: { // MIN
          if (numbers.length === 0) return 0;
          return Math.min(...numbers);
        }
        case 6: { // PRODUCT
          if (numbers.length === 0) return 0;
          return numbers.reduce((a, b) => a * b, 1);
        }
        case 7: { // STDEV.S
          if (numbers.length < 2) return new FormulaError('#DIV/0!');
          const mean7 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const var7 = numbers.reduce((s, v) => s + Math.pow(v - mean7, 2), 0) / (numbers.length - 1);
          return Math.sqrt(var7);
        }
        case 8: { // STDEV.P
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          const mean8 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const var8 = numbers.reduce((s, v) => s + Math.pow(v - mean8, 2), 0) / numbers.length;
          return Math.sqrt(var8);
        }
        case 9: { // SUM
          return numbers.reduce((a, b) => a + b, 0);
        }
        case 10: { // VAR.S
          if (numbers.length < 2) return new FormulaError('#DIV/0!');
          const mean10 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          return numbers.reduce((s, v) => s + Math.pow(v - mean10, 2), 0) / (numbers.length - 1);
        }
        case 11: { // VAR.P
          if (numbers.length === 0) return new FormulaError('#DIV/0!');
          const mean11 = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          return numbers.reduce((s, v) => s + Math.pow(v - mean11, 2), 0) / numbers.length;
        }
        case 12: { // MEDIAN
          if (numbers.length === 0) return new FormulaError('#NUM!');
          numbers.sort((a, b) => a - b);
          const mid = Math.floor(numbers.length / 2);
          if (numbers.length % 2 === 0) {
            return (numbers[mid - 1] + numbers[mid]) / 2;
          }
          return numbers[mid];
        }
        case 13: { // MODE.SNGL
          if (numbers.length === 0) return new FormulaError('#N/A');
          const counts = new Map<number, number>();
          for (const n of numbers) {
            counts.set(n, (counts.get(n) || 0) + 1);
          }
          let maxCount = 0;
          let mode = numbers[0];
          for (const [num, count] of counts) {
            if (count > maxCount) {
              maxCount = count;
              mode = num;
            }
          }
          if (maxCount === 1) return new FormulaError('#N/A', 'No repeated values');
          return mode;
        }
        default:
          return new FormulaError('#VALUE!', `Invalid AGGREGATE function_num: ${funcId}`);
      }
    },
  },
];

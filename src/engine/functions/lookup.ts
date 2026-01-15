import { FunctionDef, FormulaValue, FormulaError, EvalContext } from '../types';
import { toNumber, isError, flattenValues, toString } from './utils';

export const lookupFunctions: FunctionDef[] = [
  // VLOOKUP - vertical lookup
  {
    name: 'VLOOKUP',
    minArgs: 3,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const lookupValue = args[0];
      const tableArray = args[1] as FormulaValue[][];
      const colIndex = toNumber(args[2]);
      const rangeLookup = args[3] !== undefined ? args[3] !== false && args[3] !== 0 : true;

      if (isError(colIndex)) return colIndex;

      if (!Array.isArray(tableArray) || !Array.isArray(tableArray[0])) {
        return new FormulaError('#VALUE!', 'Invalid table array');
      }

      if ((colIndex as number) < 1 || (colIndex as number) > tableArray[0].length) {
        return new FormulaError('#REF!', 'Column index out of range');
      }

      // Search first column
      let foundRow = -1;
      let lastMatch = -1;

      for (let i = 0; i < tableArray.length; i++) {
        const cellValue = tableArray[i][0];

        if (rangeLookup) {
          // Approximate match - find largest value <= lookup value
          if (compareValues(cellValue, lookupValue) <= 0) {
            lastMatch = i;
          } else {
            break; // Assumes sorted data
          }
        } else {
          // Exact match
          if (valuesEqual(cellValue, lookupValue)) {
            foundRow = i;
            break;
          }
        }
      }

      if (rangeLookup) {
        foundRow = lastMatch;
      }

      if (foundRow === -1) {
        return new FormulaError('#N/A', 'Value not found');
      }

      return tableArray[foundRow][(colIndex as number) - 1];
    },
  },

  // HLOOKUP - horizontal lookup
  {
    name: 'HLOOKUP',
    minArgs: 3,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const lookupValue = args[0];
      const tableArray = args[1] as FormulaValue[][];
      const rowIndex = toNumber(args[2]);
      const rangeLookup = args[3] !== undefined ? args[3] !== false && args[3] !== 0 : true;

      if (isError(rowIndex)) return rowIndex;

      if (!Array.isArray(tableArray) || !Array.isArray(tableArray[0])) {
        return new FormulaError('#VALUE!', 'Invalid table array');
      }

      if ((rowIndex as number) < 1 || (rowIndex as number) > tableArray.length) {
        return new FormulaError('#REF!', 'Row index out of range');
      }

      // Search first row
      let foundCol = -1;
      let lastMatch = -1;

      for (let i = 0; i < tableArray[0].length; i++) {
        const cellValue = tableArray[0][i];

        if (rangeLookup) {
          if (compareValues(cellValue, lookupValue) <= 0) {
            lastMatch = i;
          } else {
            break;
          }
        } else {
          if (valuesEqual(cellValue, lookupValue)) {
            foundCol = i;
            break;
          }
        }
      }

      if (rangeLookup) {
        foundCol = lastMatch;
      }

      if (foundCol === -1) {
        return new FormulaError('#N/A', 'Value not found');
      }

      return tableArray[(rowIndex as number) - 1][foundCol];
    },
  },

  // INDEX - get value at position
  {
    name: 'INDEX',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][] | FormulaValue[];
      const rowNum = toNumber(args[1]);
      const colNum = args[2] !== undefined ? toNumber(args[2]) : 1;

      if (isError(rowNum)) return rowNum;
      if (isError(colNum)) return colNum;

      // Handle 1D array
      if (!Array.isArray(array[0])) {
        const arr = array as FormulaValue[];
        if ((rowNum as number) < 1 || (rowNum as number) > arr.length) {
          return new FormulaError('#REF!');
        }
        return arr[(rowNum as number) - 1];
      }

      // Handle 2D array
      const arr2D = array as FormulaValue[][];

      // If rowNum is 0, return entire column as array
      if ((rowNum as number) === 0) {
        return arr2D.map((row) => [row[(colNum as number) - 1]]);
      }

      // If colNum is 0, return entire row as array
      if ((colNum as number) === 0) {
        return [arr2D[(rowNum as number) - 1]];
      }

      if ((rowNum as number) < 1 || (rowNum as number) > arr2D.length) {
        return new FormulaError('#REF!');
      }
      if ((colNum as number) < 1 || (colNum as number) > arr2D[0].length) {
        return new FormulaError('#REF!');
      }

      return arr2D[(rowNum as number) - 1][(colNum as number) - 1];
    },
  },

  // MATCH - find position
  {
    name: 'MATCH',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const lookupValue = args[0];
      const lookupArray = flattenValues([args[1]]);
      const matchType = args[2] !== undefined ? toNumber(args[2]) : 1;

      if (isError(matchType)) return matchType;

      if (matchType === 0) {
        // Exact match
        for (let i = 0; i < lookupArray.length; i++) {
          if (valuesEqual(lookupArray[i], lookupValue)) {
            return i + 1;
          }
        }
        return new FormulaError('#N/A');
      }

      if ((matchType as number) === 1) {
        // Find largest value <= lookup value (assumes ascending order)
        let lastMatch = -1;
        for (let i = 0; i < lookupArray.length; i++) {
          if (compareValues(lookupArray[i], lookupValue) <= 0) {
            lastMatch = i;
          } else {
            break;
          }
        }
        if (lastMatch === -1) {
          return new FormulaError('#N/A');
        }
        return lastMatch + 1;
      }

      if ((matchType as number) === -1) {
        // Find smallest value >= lookup value (assumes descending order)
        let lastMatch = -1;
        for (let i = 0; i < lookupArray.length; i++) {
          if (compareValues(lookupArray[i], lookupValue) >= 0) {
            lastMatch = i;
          } else {
            break;
          }
        }
        if (lastMatch === -1) {
          return new FormulaError('#N/A');
        }
        return lastMatch + 1;
      }

      return new FormulaError('#VALUE!');
    },
  },

  // OFFSET - reference offset
  {
    name: 'OFFSET',
    minArgs: 3,
    maxArgs: 5,
    fn: (_args: FormulaValue[]): FormulaValue => {
      // OFFSET is complex because it needs to return a reference, not a value
      // For now, return error indicating it's not fully supported
      return new FormulaError('#VALUE!', 'OFFSET requires cell reference context');
    },
  },

  // INDIRECT - indirect reference
  {
    name: 'INDIRECT',
    minArgs: 1,
    maxArgs: 2,
    fn: (_args: FormulaValue[]): FormulaValue => {
      // INDIRECT is complex because it needs to parse a reference string
      // For now, return error indicating it's not fully supported
      return new FormulaError('#VALUE!', 'INDIRECT requires reference parsing');
    },
  },

  // ROW - row number
  {
    name: 'ROW',
    minArgs: 0,
    maxArgs: 1,
    fn: (args: FormulaValue[], context: EvalContext): FormulaValue => {
      if (args.length === 0) {
        // Return current row
        if (context.currentCell) {
          return context.currentCell.row + 1; // 1-indexed
        }
        return 1;
      }
      // For now, return error for reference argument
      return new FormulaError('#VALUE!', 'ROW with reference not supported');
    },
  },

  // COLUMN - column number
  {
    name: 'COLUMN',
    minArgs: 0,
    maxArgs: 1,
    fn: (args: FormulaValue[], context: EvalContext): FormulaValue => {
      if (args.length === 0) {
        if (context.currentCell) {
          return context.currentCell.col + 1; // 1-indexed
        }
        return 1;
      }
      return new FormulaError('#VALUE!', 'COLUMN with reference not supported');
    },
  },

  // ROWS - count rows
  {
    name: 'ROWS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      if (!Array.isArray(array)) {
        return 1;
      }
      return array.length;
    },
  },

  // COLUMNS - count columns
  {
    name: 'COLUMNS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const array = args[0] as FormulaValue[][];
      if (!Array.isArray(array)) {
        return 1;
      }
      if (!Array.isArray(array[0])) {
        return (array as FormulaValue[]).length;
      }
      return array[0].length;
    },
  },

  // LOOKUP - simple lookup
  {
    name: 'LOOKUP',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const lookupValue = args[0];
      const lookupVector = flattenValues([args[1]]);
      const resultVector = args[2] ? flattenValues([args[2]]) : lookupVector;

      // Find largest value <= lookup value (assumes sorted)
      let lastMatch = -1;
      for (let i = 0; i < lookupVector.length; i++) {
        if (compareValues(lookupVector[i], lookupValue) <= 0) {
          lastMatch = i;
        } else {
          break;
        }
      }

      if (lastMatch === -1) {
        return new FormulaError('#N/A');
      }

      return resultVector[lastMatch];
    },
  },

  // XLOOKUP - modern lookup (Excel 365)
  {
    name: 'XLOOKUP',
    minArgs: 3,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const lookupValue = args[0];
      const lookupArray = flattenValues([args[1]]);
      const returnArray = flattenValues([args[2]]);
      const ifNotFound = args[3];
      const matchMode = args[4] !== undefined ? toNumber(args[4]) : 0;
      const searchMode = args[5] !== undefined ? toNumber(args[5]) : 1;

      if (isError(matchMode)) return matchMode;
      if (isError(searchMode)) return searchMode;

      // matchMode: 0 = exact, -1 = exact or next smaller, 1 = exact or next larger, 2 = wildcard
      let foundIndex = -1;

      if (matchMode === 0) {
        // Exact match
        for (let i = 0; i < lookupArray.length; i++) {
          if (valuesEqual(lookupArray[i], lookupValue)) {
            foundIndex = i;
            break;
          }
        }
      } else {
        // Approximate match
        let bestMatch = -1;
        for (let i = 0; i < lookupArray.length; i++) {
          const cmp = compareValues(lookupArray[i], lookupValue);
          if (cmp === 0) {
            foundIndex = i;
            break;
          }
          if ((matchMode as number) === -1 && cmp < 0) {
            if (bestMatch === -1 || compareValues(lookupArray[i], lookupArray[bestMatch]) > 0) {
              bestMatch = i;
            }
          }
          if ((matchMode as number) === 1 && cmp > 0) {
            if (bestMatch === -1 || compareValues(lookupArray[i], lookupArray[bestMatch]) < 0) {
              bestMatch = i;
            }
          }
        }
        if (foundIndex === -1) {
          foundIndex = bestMatch;
        }
      }

      if (foundIndex === -1) {
        if (ifNotFound !== undefined) {
          return ifNotFound;
        }
        return new FormulaError('#N/A');
      }

      return returnArray[foundIndex];
    },
  },
];

// Compare values for sorting/matching
function compareValues(a: FormulaValue, b: FormulaValue): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }
  // Mixed types
  const aStr = toString(a).toLowerCase();
  const bStr = toString(b).toLowerCase();
  return aStr.localeCompare(bStr);
}

// Check if values are equal
function valuesEqual(a: FormulaValue, b: FormulaValue): boolean {
  if (a === b) return true;
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return false;
}

import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toBoolean, isError, flattenValues, isBlank } from './utils';

export const logicalFunctions: FunctionDef[] = [
  // IF - conditional
  {
    name: 'IF',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const condition = toBoolean(args[0]);
      if (isError(condition)) return condition;

      if (condition) {
        return args[1];
      } else {
        return args[2] !== undefined ? args[2] : false;
      }
    },
  },

  // IFS - multiple conditions
  {
    name: 'IFS',
    minArgs: 2,
    maxArgs: 254,
    fn: (args: FormulaValue[]): FormulaValue => {
      for (let i = 0; i < args.length; i += 2) {
        const condition = toBoolean(args[i]);
        if (isError(condition)) return condition;

        if (condition) {
          return args[i + 1];
        }
      }
      return new FormulaError('#N/A', 'No matching condition');
    },
  },

  // IFERROR - return value or alternate if error
  {
    name: 'IFERROR',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (isError(args[0])) {
        return args[1];
      }
      return args[0];
    },
  },

  // IFNA - return value or alternate if #N/A
  {
    name: 'IFNA',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (args[0] instanceof FormulaError && args[0].type === '#N/A') {
        return args[1];
      }
      return args[0];
    },
  },

  // IFBLANK - return value or alternate if blank
  {
    name: 'IFBLANK',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (isBlank(args[0])) {
        return args[1];
      }
      return args[0];
    },
  },

  // AND - logical AND
  {
    name: 'AND',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues(args);
      for (const val of values) {
        if (isError(val)) return val;
        const bool = toBoolean(val);
        if (isError(bool)) return bool;
        if (!bool) return false;
      }
      return true;
    },
  },

  // OR - logical OR
  {
    name: 'OR',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues(args);
      for (const val of values) {
        if (isError(val)) return val;
        const bool = toBoolean(val);
        if (isError(bool)) continue; // Skip errors in OR
        if (bool) return true;
      }
      return false;
    },
  },

  // NOT - logical NOT
  {
    name: 'NOT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const bool = toBoolean(args[0]);
      if (isError(bool)) return bool;
      return !bool;
    },
  },

  // XOR - exclusive OR
  {
    name: 'XOR',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues(args);
      let trueCount = 0;
      for (const val of values) {
        if (isError(val)) return val;
        const bool = toBoolean(val);
        if (isError(bool)) return bool;
        if (bool) trueCount++;
      }
      return trueCount % 2 === 1;
    },
  },

  // TRUE - returns TRUE
  {
    name: 'TRUE',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      return true;
    },
  },

  // FALSE - returns FALSE
  {
    name: 'FALSE',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      return false;
    },
  },

  // SWITCH - match value and return result
  {
    name: 'SWITCH',
    minArgs: 3,
    maxArgs: 254,
    fn: (args: FormulaValue[]): FormulaValue => {
      const expression = args[0];

      // Check pairs of value, result
      for (let i = 1; i < args.length - 1; i += 2) {
        if (expression === args[i]) {
          return args[i + 1];
        }
      }

      // Return default if odd number of remaining args
      if ((args.length - 1) % 2 === 1) {
        return args[args.length - 1];
      }

      return new FormulaError('#N/A', 'No matching value');
    },
  },

  // CHOOSE - choose from list by index
  {
    name: 'CHOOSE',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const index = args[0];
      if (typeof index !== 'number' || !Number.isInteger(index)) {
        return new FormulaError('#VALUE!', 'Index must be integer');
      }
      if (index < 1 || index >= args.length) {
        return new FormulaError('#VALUE!', 'Index out of range');
      }
      return args[index];
    },
  },

  // ISBLANK - check if blank
  {
    name: 'ISBLANK',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      // ISBLANK returns TRUE only for null/undefined, not empty strings
      // An empty string "" is a value, not blank
      return args[0] === null || args[0] === undefined;
    },
  },

  // ISERROR - check if error
  {
    name: 'ISERROR',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return isError(args[0]);
    },
  },

  // ISNA - check if #N/A error
  {
    name: 'ISNA',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return args[0] instanceof FormulaError && args[0].type === '#N/A';
    },
  },

  // ISNUMBER - check if number
  {
    name: 'ISNUMBER',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return typeof args[0] === 'number' && !isNaN(args[0]);
    },
  },

  // ISTEXT - check if text
  {
    name: 'ISTEXT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return typeof args[0] === 'string';
    },
  },

  // ISLOGICAL - check if boolean
  {
    name: 'ISLOGICAL',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return typeof args[0] === 'boolean';
    },
  },

  // ISEVEN - check if even
  {
    name: 'ISEVEN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (typeof args[0] !== 'number') {
        return new FormulaError('#VALUE!');
      }
      return Math.floor(args[0]) % 2 === 0;
    },
  },

  // ISODD - check if odd
  {
    name: 'ISODD',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (typeof args[0] !== 'number') {
        return new FormulaError('#VALUE!');
      }
      return Math.floor(args[0]) % 2 !== 0;
    },
  },

  // NA - return #N/A error
  {
    name: 'NA',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      return new FormulaError('#N/A');
    },
  },

  // ERROR.TYPE - return error type number
  {
    name: 'ERROR.TYPE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (!(args[0] instanceof FormulaError)) {
        return new FormulaError('#N/A');
      }
      const errorTypes: Record<string, number> = {
        '#NULL!': 1,
        '#DIV/0!': 2,
        '#VALUE!': 3,
        '#REF!': 4,
        '#NAME?': 5,
        '#NUM!': 6,
        '#N/A': 7,
      };
      return errorTypes[args[0].type] || 8;
    },
  },

  // N - convert value to number
  {
    name: 'N',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const val = args[0];
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (val instanceof FormulaError) return val;
      // Strings and other values return 0
      return 0;
    },
  },
];

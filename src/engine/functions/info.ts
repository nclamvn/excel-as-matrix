import { FunctionDef, FormulaValue, FormulaError, EvalContext } from '../types';
import { toNumber, toString, isError } from './utils';

export const infoFunctions: FunctionDef[] = [
  // TYPE - Returns a number indicating the data type of a value
  // 1=number, 2=text, 4=boolean, 16=error, 64=array
  {
    name: 'TYPE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const val = args[0];
      if (val instanceof FormulaError) return 16;
      if (typeof val === 'number') return 1;
      if (typeof val === 'string') return 2;
      if (typeof val === 'boolean') return 4;
      if (Array.isArray(val)) return 64;
      if (val === null) return 1; // null treated as 0 (number)
      return 1;
    },
  },

  // CELL - Returns information about a cell's formatting, location, or contents
  // Simplified implementation returning basic info
  {
    name: 'CELL',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[], context: EvalContext): FormulaValue => {
      const infoType = toString(args[0]).toLowerCase();
      const value = args.length > 1 ? args[1] : null;

      switch (infoType) {
        case 'address':
          if (context.currentCell) {
            const col = String.fromCharCode(65 + context.currentCell.col);
            return `$${col}$${context.currentCell.row + 1}`;
          }
          return '';
        case 'col':
          if (context.currentCell) return context.currentCell.col + 1;
          return 0;
        case 'row':
          if (context.currentCell) return context.currentCell.row + 1;
          return 0;
        case 'type':
          if (value === null || value === '') return 'b'; // blank
          if (typeof value === 'string') return 'l'; // label (text)
          return 'v'; // value
        case 'contents':
          return value !== null && value !== undefined ? value : '';
        case 'width':
          return 8; // default column width
        case 'format':
          return 'G'; // General format
        case 'protect':
          return 0; // not protected
        case 'prefix':
          return ''; // no alignment prefix
        case 'filename':
          return ''; // no filename available
        case 'sheet':
          return context.sheetId || '';
        default:
          return new FormulaError('#VALUE!', `Unknown CELL info_type: "${infoType}"`);
      }
    },
  },

  // ISREF - Returns TRUE if value is a reference (simplified: check if it's an array/range)
  {
    name: 'ISREF',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      // In our engine, range references are resolved to arrays before reaching functions
      // So we check if the value is an array (which indicates it came from a range reference)
      return Array.isArray(args[0]);
    },
  },

  // ISFORMULA - Returns TRUE if value contains a formula
  // In our engine context, we can't truly detect formulas, so we provide a basic implementation
  {
    name: 'ISFORMULA',
    minArgs: 1,
    maxArgs: 1,
    fn: (_args: FormulaValue[]): FormulaValue => {
      // Cannot determine formula status from the value alone
      // Return false as default - would need cell metadata to implement properly
      return false;
    },
  },

  // ISNONTEXT - Returns TRUE if value is not text
  {
    name: 'ISNONTEXT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return typeof args[0] !== 'string';
    },
  },

  // ISERR - Returns TRUE if value is any error except #N/A
  {
    name: 'ISERR',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (args[0] instanceof FormulaError) {
        return args[0].type !== '#N/A';
      }
      return false;
    },
  },

  // SHEET - Returns the sheet number of the referenced sheet
  {
    name: 'SHEET',
    minArgs: 0,
    maxArgs: 1,
    fn: (): FormulaValue => {
      // Return 1 as default (single sheet assumption)
      return 1;
    },
  },

  // SHEETS - Returns the number of sheets in a reference
  {
    name: 'SHEETS',
    minArgs: 0,
    maxArgs: 1,
    fn: (): FormulaValue => {
      // Return 1 as default (single sheet assumption)
      return 1;
    },
  },

  // INFO - Returns information about the current operating environment
  {
    name: 'INFO',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const infoType = toString(args[0]).toLowerCase();
      switch (infoType) {
        case 'directory':
          return '/';
        case 'numfile':
          return 1;
        case 'origin':
          return '$A:$A$1';
        case 'osversion':
          return 'ExcelAI Engine 1.0';
        case 'recalc':
          return 'Automatic';
        case 'release':
          return '1.0';
        case 'system':
          return 'pcdos'; // Windows compatibility
        default:
          return new FormulaError('#VALUE!', `Unknown INFO type: "${infoType}"`);
      }
    },
  },

  // NUMBERVALUE - Converts text to number with locale-specific decimal/group separators
  {
    name: 'NUMBERVALUE',
    minArgs: 1,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const decimalSep = args.length > 1 ? toString(args[1]) : '.';
      const groupSep = args.length > 2 ? toString(args[2]) : ',';

      if (text === '') return 0;

      // Remove group separators
      let cleaned = text;
      if (groupSep) {
        cleaned = cleaned.split(groupSep).join('');
      }

      // Replace decimal separator with '.'
      if (decimalSep && decimalSep !== '.') {
        cleaned = cleaned.split(decimalSep).join('.');
      }

      // Handle percentage
      let multiplier = 1;
      if (cleaned.endsWith('%')) {
        cleaned = cleaned.slice(0, -1);
        multiplier = 0.01;
      }

      // Trim whitespace
      cleaned = cleaned.trim();

      const result = parseFloat(cleaned);
      if (isNaN(result)) {
        return new FormulaError('#VALUE!', `Cannot convert "${text}" to number`);
      }

      return result * multiplier;
    },
  },

  // FORMULATEXT - Returns a formula as a string
  // In our context, we can't access the raw formula, so we return a placeholder
  {
    name: 'FORMULATEXT',
    minArgs: 1,
    maxArgs: 1,
    fn: (_args: FormulaValue[]): FormulaValue => {
      // Without access to cell metadata, we return #N/A
      // In a real spreadsheet, this would return the formula text of the referenced cell
      return new FormulaError('#N/A', 'Formula text not available');
    },
  },

  // CONVERT - Converts a number from one measurement system to another
  {
    name: 'CONVERT',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const fromUnit = toString(args[1]).toLowerCase();
      const toUnit = toString(args[2]).toLowerCase();

      // Simplified conversion tables
      const lengthToMeter: Record<string, number> = {
        'm': 1, 'cm': 0.01, 'mm': 0.001, 'km': 1000, 'in': 0.0254,
        'ft': 0.3048, 'yd': 0.9144, 'mi': 1609.344, 'nm': 1852,
        'ang': 1e-10, 'um': 1e-6,
      };
      const weightToKg: Record<string, number> = {
        'kg': 1, 'g': 0.001, 'mg': 0.000001, 'lbm': 0.45359237,
        'ozm': 0.028349523125, 'ton': 907.18474, 'sg': 14.593903,
        'u': 1.66053906660e-27,
      };
      const tempConvert = (val: number, from: string, to: string): number | null => {
        let celsius: number;
        switch (from) {
          case 'c': case 'cel': celsius = val; break;
          case 'f': case 'fah': celsius = (val - 32) * 5 / 9; break;
          case 'k': case 'kel': celsius = val - 273.15; break;
          default: return null;
        }
        switch (to) {
          case 'c': case 'cel': return celsius;
          case 'f': case 'fah': return celsius * 9 / 5 + 32;
          case 'k': case 'kel': return celsius + 273.15;
          default: return null;
        }
      };

      const val = num as number;

      // Try temperature
      const tempResult = tempConvert(val, fromUnit, toUnit);
      if (tempResult !== null) return tempResult;

      // Try length
      if (fromUnit in lengthToMeter && toUnit in lengthToMeter) {
        return val * lengthToMeter[fromUnit] / lengthToMeter[toUnit];
      }

      // Try weight
      if (fromUnit in weightToKg && toUnit in weightToKg) {
        return val * weightToKg[fromUnit] / weightToKg[toUnit];
      }

      return new FormulaError('#N/A', `Cannot convert from "${fromUnit}" to "${toUnit}"`);
    },
  },

  // ROWS - Returns the number of rows in a reference or array
  {
    name: 'ROWS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (Array.isArray(args[0])) {
        return (args[0] as FormulaValue[][]).length;
      }
      return 1;
    },
  },

  // COLUMNS - Returns the number of columns in a reference or array
  {
    name: 'COLUMNS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (Array.isArray(args[0])) {
        const arr = args[0] as FormulaValue[][];
        if (arr.length > 0 && Array.isArray(arr[0])) {
          return arr[0].length;
        }
        return 1;
      }
      return 1;
    },
  },

  // ROW - Returns the row number of a reference
  {
    name: 'ROW',
    minArgs: 0,
    maxArgs: 1,
    fn: (_args: FormulaValue[], context: EvalContext): FormulaValue => {
      if (context.currentCell) {
        return context.currentCell.row + 1;
      }
      return 1;
    },
  },

  // COLUMN - Returns the column number of a reference
  {
    name: 'COLUMN',
    minArgs: 0,
    maxArgs: 1,
    fn: (_args: FormulaValue[], context: EvalContext): FormulaValue => {
      if (context.currentCell) {
        return context.currentCell.col + 1;
      }
      return 1;
    },
  },

  // ADDRESS - Creates a cell address as text
  {
    name: 'ADDRESS',
    minArgs: 2,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const row = toNumber(args[0]);
      if (isError(row)) return row;
      const col = toNumber(args[1]);
      if (isError(col)) return col;
      const absNum = args.length > 2 ? toNumber(args[2]) : 1;
      if (isError(absNum)) return absNum;
      const a1Style = args.length > 3 ? args[3] !== false : true;
      const sheetText = args.length > 4 ? toString(args[4]) : '';

      const rowVal = Math.floor(row as number);
      const colVal = Math.floor(col as number);
      const absType = Math.floor(absNum as number);

      if (rowVal < 1 || colVal < 1) return new FormulaError('#VALUE!');

      // Convert column number to letter(s)
      let colStr = '';
      let c = colVal;
      while (c > 0) {
        c--;
        colStr = String.fromCharCode(65 + (c % 26)) + colStr;
        c = Math.floor(c / 26);
      }

      let result = '';
      if (sheetText) result += sheetText + '!';

      if (a1Style) {
        switch (absType) {
          case 1: result += `$${colStr}$${rowVal}`; break;
          case 2: result += `${colStr}$${rowVal}`; break;
          case 3: result += `$${colStr}${rowVal}`; break;
          case 4: result += `${colStr}${rowVal}`; break;
          default: result += `$${colStr}$${rowVal}`;
        }
      } else {
        // R1C1 style
        switch (absType) {
          case 1: result += `R${rowVal}C${colVal}`; break;
          case 2: result += `R${rowVal}C[${colVal}]`; break;
          case 3: result += `R[${rowVal}]C${colVal}`; break;
          case 4: result += `R[${rowVal}]C[${colVal}]`; break;
          default: result += `R${rowVal}C${colVal}`;
        }
      }

      return result;
    },
  },

  // INDIRECT - Returns the reference specified by a text string (simplified)
  {
    name: 'INDIRECT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      // INDIRECT requires dynamic reference resolution which our engine handles at eval time
      // Return the text for now - the evaluator should resolve this
      return toString(args[0]);
    },
  },

  // OFFSET - Returns a reference offset from a given reference (simplified - returns value)
  {
    name: 'OFFSET',
    minArgs: 3,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      // OFFSET is typically handled at the evaluator level since it creates references
      // This is a simplified placeholder
      return args[0];
    },
  },

  // AREAS - Returns the number of areas in a reference
  {
    name: 'AREAS',
    minArgs: 1,
    maxArgs: 1,
    fn: (_args: FormulaValue[]): FormulaValue => {
      // In our engine, each arg is one area
      return 1;
    },
  },

  // TRANSPOSE - Transposes an array
  {
    name: 'TRANSPOSE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (!Array.isArray(args[0])) {
        return [[args[0]]];
      }
      const arr = args[0] as FormulaValue[][];
      const rows = arr.length;
      const cols = Array.isArray(arr[0]) ? arr[0].length : 1;

      const result: FormulaValue[][] = [];
      for (let c = 0; c < cols; c++) {
        const row: FormulaValue[] = [];
        for (let r = 0; r < rows; r++) {
          row.push(Array.isArray(arr[r]) ? arr[r][c] : arr[r] as unknown as FormulaValue);
        }
        result.push(row);
      }
      return result;
    },
  },

  // FLATTEN - Flattens a 2D array to a single column (non-standard but useful)
  {
    name: 'FLATTEN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (!Array.isArray(args[0])) return [[args[0]]];
      const arr = args[0] as FormulaValue[][];
      const result: FormulaValue[][] = [];
      for (const row of arr) {
        if (Array.isArray(row)) {
          for (const cell of row) {
            result.push([cell]);
          }
        } else {
          result.push([row]);
        }
      }
      return result;
    },
  },

  // FORMULATYPE - Returns the type of formula in a cell (0=formula, 1=array, 2=data table)
  {
    name: 'FORMULATYPE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      if (Array.isArray(args[0])) return 1;
      return 0;
    },
  },

  // COALESCE - Returns the first non-null/non-error value
  {
    name: 'COALESCE',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      for (const arg of args) {
        if (arg !== null && arg !== undefined && !(arg instanceof FormulaError)) {
          return arg;
        }
      }
      return new FormulaError('#N/A', 'All values are null or error');
    },
  },

  // NVL - Returns alternate value if first is null (like Oracle NVL)
  {
    name: 'NVL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      return (args[0] === null || args[0] === undefined) ? args[1] : args[0];
    },
  },
];

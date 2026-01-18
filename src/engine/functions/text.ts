import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toString, toNumber, isError, flattenValues } from './utils';

export const textFunctions: FunctionDef[] = [
  // CONCAT / CONCATENATE - join strings
  {
    name: 'CONCAT',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const flat = flattenValues(args);
      let result = '';
      for (const val of flat) {
        if (isError(val)) return val;
        result += toString(val);
      }
      return result;
    },
  },

  {
    name: 'CONCATENATE',
    minArgs: 1,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      let result = '';
      for (const val of args) {
        if (isError(val)) return val;
        result += toString(val);
      }
      return result;
    },
  },

  // LEFT - extract left characters
  {
    name: 'LEFT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const numChars = args[1] !== undefined ? toNumber(args[1]) : 1;
      if (isError(numChars)) return numChars;
      if ((numChars as number) < 0) {
        return new FormulaError('#VALUE!', 'Negative length not allowed');
      }
      return text.substring(0, numChars as number);
    },
  },

  // RIGHT - extract right characters
  {
    name: 'RIGHT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const numChars = args[1] !== undefined ? toNumber(args[1]) : 1;
      if (isError(numChars)) return numChars;
      if ((numChars as number) < 0) {
        return new FormulaError('#VALUE!', 'Negative length not allowed');
      }
      return text.substring(text.length - (numChars as number));
    },
  },

  // MID - extract middle characters
  {
    name: 'MID',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const startNum = toNumber(args[1]);
      const numChars = toNumber(args[2]);
      if (isError(startNum)) return startNum;
      if (isError(numChars)) return numChars;
      if ((startNum as number) < 1 || (numChars as number) < 0) {
        return new FormulaError('#VALUE!');
      }
      return text.substring((startNum as number) - 1, (startNum as number) - 1 + (numChars as number));
    },
  },

  // LEN - string length
  {
    name: 'LEN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return toString(args[0]).length;
    },
  },

  // LOWER - convert to lowercase
  {
    name: 'LOWER',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return toString(args[0]).toLowerCase();
    },
  },

  // UPPER - convert to uppercase
  {
    name: 'UPPER',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return toString(args[0]).toUpperCase();
    },
  },

  // PROPER - capitalize each word (after any non-letter character)
  {
    name: 'PROPER',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      // Capitalize first letter and any letter after a non-letter character
      return text.replace(/(^|[^a-zA-Z])([a-zA-Z])/g, (_match, prefix, letter) => {
        return prefix + letter.toUpperCase();
      }).replace(/([a-zA-Z])([a-zA-Z]+)/g, (_match, first, rest) => {
        return first + rest.toLowerCase();
      });
    },
  },

  // TRIM - remove extra spaces
  {
    name: 'TRIM',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return toString(args[0]).trim().replace(/\s+/g, ' ');
    },
  },

  // CLEAN - remove non-printable characters
  {
    name: 'CLEAN',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      // eslint-disable-next-line no-control-regex
      return text.replace(/[\x00-\x1F\x7F]/g, '');
    },
  },

  // FIND - find position (case-sensitive)
  {
    name: 'FIND',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const findText = toString(args[0]);
      const withinText = toString(args[1]);
      const startNum = args[2] !== undefined ? toNumber(args[2]) : 1;
      if (isError(startNum)) return startNum;

      const pos = withinText.indexOf(findText, (startNum as number) - 1);
      if (pos === -1) {
        return new FormulaError('#VALUE!', 'Text not found');
      }
      return pos + 1; // 1-indexed
    },
  },

  // SEARCH - find position (case-insensitive)
  {
    name: 'SEARCH',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const findText = toString(args[0]).toLowerCase();
      const withinText = toString(args[1]).toLowerCase();
      const startNum = args[2] !== undefined ? toNumber(args[2]) : 1;
      if (isError(startNum)) return startNum;

      const pos = withinText.indexOf(findText, (startNum as number) - 1);
      if (pos === -1) {
        return new FormulaError('#VALUE!', 'Text not found');
      }
      return pos + 1;
    },
  },

  // REPLACE - replace by position
  {
    name: 'REPLACE',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const oldText = toString(args[0]);
      const startNum = toNumber(args[1]);
      const numChars = toNumber(args[2]);
      const newText = toString(args[3]);
      if (isError(startNum)) return startNum;
      if (isError(numChars)) return numChars;

      const start = (startNum as number) - 1;
      return oldText.substring(0, start) + newText + oldText.substring(start + (numChars as number));
    },
  },

  // SUBSTITUTE - replace text occurrences
  {
    name: 'SUBSTITUTE',
    minArgs: 3,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const oldText = toString(args[1]);
      const newText = toString(args[2]);
      const instance = args[3] !== undefined ? toNumber(args[3]) : undefined;

      if (instance !== undefined && isError(instance)) return instance;

      if (instance === undefined) {
        // Replace all
        return text.split(oldText).join(newText);
      } else {
        // Replace specific instance
        let count = 0;
        let result = '';
        let lastIndex = 0;
        let index = text.indexOf(oldText);

        while (index !== -1) {
          count++;
          if (count === instance) {
            result += text.substring(lastIndex, index) + newText;
            lastIndex = index + oldText.length;
            break;
          }
          index = text.indexOf(oldText, index + 1);
        }

        result += text.substring(lastIndex);
        return result || text;
      }
    },
  },

  // REPT - repeat text
  {
    name: 'REPT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const times = toNumber(args[1]);
      if (isError(times)) return times;
      if ((times as number) < 0) {
        return new FormulaError('#VALUE!');
      }
      return text.repeat(Math.floor(times as number));
    },
  },

  // TEXT - format number as text
  {
    name: 'TEXT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const value = toNumber(args[0]);
      const format = toString(args[1]);
      if (isError(value)) return value;

      const num = value as number;

      // Check for percentage format (e.g., "0%", "0.00%")
      if (format.includes('%')) {
        const percentValue = num * 100;
        const decimalMatch = format.match(/0\.(0+)%/);
        const decimals = decimalMatch ? decimalMatch[1].length : 0;
        const formatted = percentValue.toFixed(decimals);
        // Add thousands separator if format has comma
        if (format.includes(',')) {
          return parseFloat(formatted).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
        }
        return formatted + '%';
      }

      // Check for currency format (e.g., "$#,##0.00")
      const currencyMatch = format.match(/^(\$)?/);
      const hasCurrency = currencyMatch && currencyMatch[1];
      const hasComma = format.includes(',');

      // Check for leading zeros format (e.g., "000")
      const leadingZerosMatch = format.match(/^0+$/);
      if (leadingZerosMatch) {
        const width = leadingZerosMatch[0].length;
        const intPart = Math.floor(Math.abs(num));
        const sign = num < 0 ? '-' : '';
        return sign + intPart.toString().padStart(width, '0');
      }

      // Number format with possible thousands separator and decimals
      if (format.includes('#') || format.includes('0')) {
        // Count decimal places
        const decimalMatch = format.match(/\.([0#]+)(?!.*\.)/);
        const decimals = decimalMatch ? decimalMatch[1].replace(/#/g, '').length : 0;

        let formatted: string;
        if (hasComma) {
          formatted = num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        } else {
          formatted = num.toFixed(decimals);
        }

        if (hasCurrency) {
          formatted = '$' + formatted;
        }

        return formatted;
      }

      // Date format
      if (format.toLowerCase().includes('yy') || format.toLowerCase().includes('mm') || format.toLowerCase().includes('dd')) {
        const date = new Date(1900, 0, num - 1);
        return date.toLocaleDateString();
      }

      return String(num);
    },
  },

  // VALUE - convert text to number
  {
    name: 'VALUE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]).trim();
      const num = parseFloat(text.replace(/[,$%]/g, ''));
      if (isNaN(num)) {
        return new FormulaError('#VALUE!', 'Cannot convert to number');
      }
      if (text.includes('%')) {
        return num / 100;
      }
      return num;
    },
  },

  // TEXTJOIN - join with delimiter
  {
    name: 'TEXTJOIN',
    minArgs: 3,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const delimiter = toString(args[0]);
      const ignoreEmpty = args[1] === true || args[1] === 'TRUE';
      const values = flattenValues(args.slice(2));

      const texts: string[] = [];
      for (const val of values) {
        if (isError(val)) return val;
        const text = toString(val);
        if (!ignoreEmpty || text !== '') {
          texts.push(text);
        }
      }

      return texts.join(delimiter);
    },
  },

  // CHAR - character from code
  {
    name: 'CHAR',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const code = toNumber(args[0]);
      if (isError(code)) return code;
      return String.fromCharCode(code as number);
    },
  },

  // CODE - code from character
  {
    name: 'CODE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      if (text.length === 0) {
        return new FormulaError('#VALUE!');
      }
      return text.charCodeAt(0);
    },
  },

  // EXACT - case-sensitive comparison
  {
    name: 'EXACT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      return toString(args[0]) === toString(args[1]);
    },
  },

  // T - return text or empty string
  {
    name: 'T',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return typeof args[0] === 'string' ? args[0] : '';
    },
  },
];

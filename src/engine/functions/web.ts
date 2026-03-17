import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toString, toNumber, isError, flattenValues } from './utils';

export const webFunctions: FunctionDef[] = [
  // ENCODEURL - Encodes a string for use in a URL
  {
    name: 'ENCODEURL',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      try {
        return encodeURIComponent(text);
      } catch {
        return new FormulaError('#VALUE!', 'Cannot encode URL');
      }
    },
  },

  // TEXTBEFORE - Returns text before a delimiter
  {
    name: 'TEXTBEFORE',
    minArgs: 2,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const delimiter = toString(args[1]);
      const instanceNum = args.length > 2 ? toNumber(args[2]) : 1;
      if (isError(instanceNum)) return instanceNum;
      const instance = instanceNum as number;

      // match_mode: 0=case-sensitive (default), 1=case-insensitive
      const matchMode = args.length > 3 ? toNumber(args[3]) : 0;
      if (isError(matchMode)) return matchMode;
      const caseInsensitive = (matchMode as number) === 1;

      // match_end: 0=default, 1=match end of text if delimiter not found
      const matchEnd = args.length > 4 ? toNumber(args[4]) : 0;
      if (isError(matchEnd)) return matchEnd;

      // if_not_found: value to return if delimiter not found
      const ifNotFound = args.length > 5 ? args[5] : undefined;

      if (delimiter === '') {
        // Empty delimiter: return empty string for positive instance, full text for negative
        if (instance > 0) return '';
        return text;
      }

      const searchText = caseInsensitive ? text.toLowerCase() : text;
      const searchDelim = caseInsensitive ? delimiter.toLowerCase() : delimiter;

      if (instance > 0) {
        // Search from left
        let pos = -1;
        let count = 0;
        let startSearch = 0;
        while (count < instance) {
          pos = searchText.indexOf(searchDelim, startSearch);
          if (pos === -1) break;
          count++;
          if (count < instance) {
            startSearch = pos + searchDelim.length;
          }
        }
        if (count < instance) {
          if (ifNotFound !== undefined) return ifNotFound;
          if ((matchEnd as number) === 1) return text;
          return new FormulaError('#N/A', 'Delimiter not found');
        }
        return text.substring(0, pos);
      } else {
        // Search from right (negative instance)
        const absInstance = Math.abs(instance);
        let pos = text.length;
        let count = 0;
        while (count < absInstance) {
          pos = searchText.lastIndexOf(searchDelim, pos - 1);
          if (pos === -1) break;
          count++;
        }
        if (count < absInstance) {
          if (ifNotFound !== undefined) return ifNotFound;
          if ((matchEnd as number) === 1) return '';
          return new FormulaError('#N/A', 'Delimiter not found');
        }
        return text.substring(0, pos);
      }
    },
  },

  // TEXTAFTER - Returns text after a delimiter
  {
    name: 'TEXTAFTER',
    minArgs: 2,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const delimiter = toString(args[1]);
      const instanceNum = args.length > 2 ? toNumber(args[2]) : 1;
      if (isError(instanceNum)) return instanceNum;
      const instance = instanceNum as number;

      const matchMode = args.length > 3 ? toNumber(args[3]) : 0;
      if (isError(matchMode)) return matchMode;
      const caseInsensitive = (matchMode as number) === 1;

      const matchEnd = args.length > 4 ? toNumber(args[4]) : 0;
      if (isError(matchEnd)) return matchEnd;

      const ifNotFound = args.length > 5 ? args[5] : undefined;

      if (delimiter === '') {
        if (instance > 0) return text;
        return '';
      }

      const searchText = caseInsensitive ? text.toLowerCase() : text;
      const searchDelim = caseInsensitive ? delimiter.toLowerCase() : delimiter;

      if (instance > 0) {
        let pos = -1;
        let count = 0;
        let startSearch = 0;
        while (count < instance) {
          pos = searchText.indexOf(searchDelim, startSearch);
          if (pos === -1) break;
          count++;
          if (count < instance) {
            startSearch = pos + searchDelim.length;
          }
        }
        if (count < instance) {
          if (ifNotFound !== undefined) return ifNotFound;
          if ((matchEnd as number) === 1) return '';
          return new FormulaError('#N/A', 'Delimiter not found');
        }
        return text.substring(pos + delimiter.length);
      } else {
        const absInstance = Math.abs(instance);
        let pos = text.length;
        let count = 0;
        while (count < absInstance) {
          pos = searchText.lastIndexOf(searchDelim, pos - 1);
          if (pos === -1) break;
          count++;
        }
        if (count < absInstance) {
          if (ifNotFound !== undefined) return ifNotFound;
          if ((matchEnd as number) === 1) return text;
          return new FormulaError('#N/A', 'Delimiter not found');
        }
        return text.substring(pos + delimiter.length);
      }
    },
  },

  // TEXTSPLIT - Splits text by column and/or row delimiters into a 2D array
  {
    name: 'TEXTSPLIT',
    minArgs: 2,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const colDelimiter = args[1] !== null && args[1] !== undefined ? toString(args[1]) : null;
      const rowDelimiter = args.length > 2 && args[2] !== null && args[2] !== undefined ? toString(args[2]) : null;

      // ignore_empty: FALSE by default
      const ignoreEmpty = args.length > 3 ? args[3] === true : false;

      // match_mode: 0=case-sensitive, 1=case-insensitive
      const matchMode = args.length > 4 ? toNumber(args[4]) : 0;
      if (isError(matchMode)) return matchMode;

      // pad_with: value for empty cells in jagged results (default empty string)
      const padWith = args.length > 5 ? args[5] : '';

      let rows: string[];
      if (rowDelimiter) {
        rows = text.split(rowDelimiter);
      } else {
        rows = [text];
      }

      if (ignoreEmpty) {
        rows = rows.filter(r => r !== '');
      }

      const result: FormulaValue[][] = [];
      let maxCols = 0;

      for (const row of rows) {
        let cols: string[];
        if (colDelimiter) {
          cols = row.split(colDelimiter);
        } else {
          cols = [row];
        }
        if (ignoreEmpty) {
          cols = cols.filter(c => c !== '');
        }
        if (cols.length > maxCols) maxCols = cols.length;
        // Convert string values to numbers where possible
        const rowValues: FormulaValue[] = cols.map(c => {
          const num = parseFloat(c);
          if (!isNaN(num) && c.trim() === String(num)) return num;
          return c;
        });
        result.push(rowValues);
      }

      // Pad rows to equal length
      for (const row of result) {
        while (row.length < maxCols) {
          row.push(padWith);
        }
      }

      if (result.length === 1 && result[0].length === 1) {
        return result[0][0];
      }

      return result;
    },
  },

  // VALUETOTEXT - Converts a value to text
  {
    name: 'VALUETOTEXT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const value = args[0];
      const format = args.length > 1 ? toNumber(args[1]) : 0;
      if (isError(format)) return format;

      if (value instanceof FormulaError) {
        return value.type;
      }

      if ((format as number) === 1) {
        // Strict format - show quotes around text, etc.
        if (typeof value === 'string') return `"${value}"`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value === null) return '""';
        return String(value);
      }

      // Concise format (default)
      return toString(value);
    },
  },

  // ARRAYTOTEXT - Converts an array to text
  {
    name: 'ARRAYTOTEXT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const value = args[0];
      const format = args.length > 1 ? toNumber(args[1]) : 0;
      if (isError(format)) return format;

      if (!Array.isArray(value)) {
        if (value instanceof FormulaError) return value.type;
        return toString(value);
      }

      const arr = value as FormulaValue[][];

      if ((format as number) === 1) {
        // Strict format - enclosed in braces, rows separated by semicolons, cols by commas
        const rowStrs = arr.map(row => {
          if (!Array.isArray(row)) return toString(row);
          return (row as FormulaValue[]).map(cell => {
            if (typeof cell === 'string') return `"${cell}"`;
            if (cell instanceof FormulaError) return cell.type;
            return toString(cell);
          }).join(',');
        });
        return `{${rowStrs.join(';')}}`;
      }

      // Concise format - comma-separated values
      const flat = flattenValues([value]);
      return flat.map(v => toString(v)).join(', ');
    },
  },

  // IMAGE - Returns an image from a URL (in our engine, returns the URL as text)
  {
    name: 'IMAGE',
    minArgs: 1,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const url = toString(args[0]);
      if (!url) {
        return new FormulaError('#VALUE!', 'URL cannot be empty');
      }
      // In a spreadsheet engine without rendering, return the URL
      return url;
    },
  },

  // HYPERLINK - Creates a hyperlink (returns display text or URL)
  {
    name: 'HYPERLINK',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const url = toString(args[0]);
      const friendlyName = args.length > 1 ? toString(args[1]) : url;
      // In computation context, return the friendly name (display text)
      return friendlyName;
    },
  },

  // FILTERXML - Extracts data from XML using XPath (simplified)
  {
    name: 'FILTERXML',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      // XML parsing is complex; return a simplified implementation
      const xml = toString(args[0]);
      const xpath = toString(args[1]);
      if (!xml || !xpath) {
        return new FormulaError('#VALUE!', 'Invalid XML or XPath');
      }
      // Basic extraction: find content between matching tags
      const tagMatch = xpath.match(/\/\/(\w+)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
        const match = xml.match(regex);
        if (match) return match[1];
      }
      return new FormulaError('#VALUE!', 'XPath match not found');
    },
  },

  // WEBSERVICE - Would call a web service (returns placeholder)
  {
    name: 'WEBSERVICE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const url = toString(args[0]);
      if (!url) {
        return new FormulaError('#VALUE!', 'URL cannot be empty');
      }
      // Cannot make HTTP requests from formula engine
      return new FormulaError('#VALUE!', 'WEBSERVICE requires network access');
    },
  },

  // LAMBDA - Already exists in lambda.ts but LET is useful here
  // LET-like binding via TEXTJOIN pattern

  // DECODEURL - Decodes a URL-encoded string
  {
    name: 'DECODEURL',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      try {
        return decodeURIComponent(text);
      } catch {
        return new FormulaError('#VALUE!', 'Cannot decode URL');
      }
    },
  },

  // REGEXMATCH - Returns TRUE if text matches a regex pattern
  {
    name: 'REGEXMATCH',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const pattern = toString(args[1]);
      try {
        const regex = new RegExp(pattern);
        return regex.test(text);
      } catch {
        return new FormulaError('#VALUE!', 'Invalid regex pattern');
      }
    },
  },

  // REGEXEXTRACT - Extracts first match of a regex pattern from text
  {
    name: 'REGEXEXTRACT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const pattern = toString(args[1]);
      try {
        const regex = new RegExp(pattern);
        const match = text.match(regex);
        if (match) return match[0];
        return new FormulaError('#N/A', 'No match found');
      } catch {
        return new FormulaError('#VALUE!', 'Invalid regex pattern');
      }
    },
  },

  // REGEXREPLACE - Replaces text matching a regex pattern
  {
    name: 'REGEXREPLACE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const pattern = toString(args[1]);
      const replacement = toString(args[2]);
      try {
        const regex = new RegExp(pattern, 'g');
        return text.replace(regex, replacement);
      } catch {
        return new FormulaError('#VALUE!', 'Invalid regex pattern');
      }
    },
  },

  // SPLIT - Splits text by a delimiter into a horizontal array
  {
    name: 'SPLIT',
    minArgs: 2,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const delimiter = toString(args[1]);
      const splitByEach = args.length > 2 ? args[2] === true : false;
      const removeEmpty = args.length > 3 ? args[3] === true : false;

      let parts: string[];
      if (splitByEach) {
        // Split by each character in delimiter
        const regex = new RegExp(`[${delimiter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
        parts = text.split(regex);
      } else {
        parts = text.split(delimiter);
      }

      if (removeEmpty) {
        parts = parts.filter(p => p !== '');
      }

      // Return as a horizontal array (single row)
      return [parts.map(p => p as FormulaValue)];
    },
  },

  // JOIN - Joins array elements with a delimiter (inverse of SPLIT)
  {
    name: 'JOIN',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const delimiter = toString(args[0]);
      const flat = flattenValues([args[1]]);
      return flat.map(v => toString(v)).join(delimiter);
    },
  },

  // DETECTLANGUAGE - Returns language code (simplified - always returns "en")
  {
    name: 'DETECTLANGUAGE',
    minArgs: 1,
    maxArgs: 1,
    fn: (_args: FormulaValue[]): FormulaValue => {
      return 'en';
    },
  },

  // LAMBDA wrapper for reusable formulas: MAKEARRAY
  {
    name: 'MAKEARRAY',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rows = toNumber(args[0]);
      if (isError(rows)) return rows;
      const cols = toNumber(args[1]);
      if (isError(cols)) return cols;
      const lambda = args[2];

      const r = Math.floor(rows as number);
      const c = Math.floor(cols as number);

      if (r < 1 || c < 1) return new FormulaError('#VALUE!');

      // If lambda is a LambdaFunction, call it for each cell
      if (lambda && typeof lambda === 'object' && '__isLambda' in lambda && lambda.__isLambda) {
        const result: FormulaValue[][] = [];
        for (let i = 0; i < r; i++) {
          const row: FormulaValue[] = [];
          for (let j = 0; j < c; j++) {
            // Pass 1-based row and column to lambda
            const context = { getCellValue: () => null, getRangeValues: () => [[]], sheetId: '' };
            row.push(lambda.evaluate([i + 1, j + 1], context));
          }
          result.push(row);
        }
        return result;
      }

      // If not a lambda, fill array with the value
      const result: FormulaValue[][] = [];
      for (let i = 0; i < r; i++) {
        const row: FormulaValue[] = [];
        for (let j = 0; j < c; j++) {
          row.push(lambda);
        }
        result.push(row);
      }
      return result;
    },
  },

  // ISOMITTED - Check if an argument was omitted in a LAMBDA
  {
    name: 'ISOMITTED',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      return args[0] === null || args[0] === undefined;
    },
  },

  // TEXTTRIM - More advanced trim (removes extra spaces, leading/trailing)
  {
    name: 'TEXTTRIM',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      return text.replace(/\s+/g, ' ').trim();
    },
  },

  // TEXTREVERSE - Reverses the characters in a text string
  {
    name: 'TEXTREVERSE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      return [...text].reverse().join('');
    },
  },

  // TEXTCOUNT - Counts occurrences of a substring in text
  {
    name: 'TEXTCOUNT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]);
      const findText = toString(args[1]);
      if (findText === '') return 0;
      let count = 0;
      let pos = 0;
      while ((pos = text.indexOf(findText, pos)) !== -1) {
        count++;
        pos += findText.length;
      }
      return count;
    },
  },

  // WORDCOUNT - Counts words in text
  {
    name: 'WORDCOUNT',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = toString(args[0]).trim();
      if (text === '') return 0;
      return text.split(/\s+/).length;
    },
  },
];

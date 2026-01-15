import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, isError, dateToSerial, parseDate } from './utils';

export const dateFunctions: FunctionDef[] = [
  // TODAY - current date as serial
  {
    name: 'TODAY',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dateToSerial(today);
    },
  },

  // NOW - current date/time as serial
  {
    name: 'NOW',
    minArgs: 0,
    maxArgs: 0,
    fn: (): FormulaValue => {
      const now = new Date();
      const serial = dateToSerial(now);
      // Add fractional day for time
      const timeDecimal = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
      return serial + timeDecimal;
    },
  },

  // DATE - create date from year, month, day
  {
    name: 'DATE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const year = toNumber(args[0]);
      const month = toNumber(args[1]);
      const day = toNumber(args[2]);
      if (isError(year)) return year;
      if (isError(month)) return month;
      if (isError(day)) return day;

      // JavaScript months are 0-indexed, Excel months are 1-indexed
      const date = new Date(year as number, (month as number) - 1, day as number);
      return dateToSerial(date);
    },
  },

  // YEAR - extract year from date serial
  {
    name: 'YEAR',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      return date.getFullYear();
    },
  },

  // MONTH - extract month from date serial
  {
    name: 'MONTH',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      return date.getMonth() + 1; // 1-indexed
    },
  },

  // DAY - extract day from date serial
  {
    name: 'DAY',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      return date.getDate();
    },
  },

  // HOUR - extract hour from time serial
  {
    name: 'HOUR',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const decimal = (num as number) % 1;
      return Math.floor(decimal * 24);
    },
  },

  // MINUTE - extract minute from time serial
  {
    name: 'MINUTE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const decimal = (num as number) % 1;
      const hours = decimal * 24;
      return Math.floor((hours % 1) * 60);
    },
  },

  // SECOND - extract second from time serial
  {
    name: 'SECOND',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const num = toNumber(args[0]);
      if (isError(num)) return num;
      const decimal = (num as number) % 1;
      const totalSeconds = decimal * 86400;
      return Math.floor(totalSeconds % 60);
    },
  },

  // TIME - create time from hours, minutes, seconds
  {
    name: 'TIME',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const hour = toNumber(args[0]);
      const minute = toNumber(args[1]);
      const second = toNumber(args[2]);
      if (isError(hour)) return hour;
      if (isError(minute)) return minute;
      if (isError(second)) return second;

      const totalSeconds = (hour as number) * 3600 + (minute as number) * 60 + (second as number);
      return totalSeconds / 86400;
    },
  },

  // WEEKDAY - day of week (1-7)
  {
    name: 'WEEKDAY',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      const returnType = args[1] !== undefined ? toNumber(args[1]) : 1;
      if (isError(returnType)) return returnType;

      const day = date.getDay(); // 0 = Sunday

      switch (returnType) {
        case 1: // Sunday = 1
          return day + 1;
        case 2: // Monday = 1
          return day === 0 ? 7 : day;
        case 3: // Monday = 0
          return day === 0 ? 6 : day - 1;
        default:
          return day + 1;
      }
    },
  },

  // WEEKNUM - week number of year
  {
    name: 'WEEKNUM',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }

      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    },
  },

  // EOMONTH - end of month
  {
    name: 'EOMONTH',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      const months = toNumber(args[1]);
      if (isError(months)) return months;

      // Move to next month's day 0 (last day of target month)
      const result = new Date(date.getFullYear(), date.getMonth() + (months as number) + 1, 0);
      return dateToSerial(result);
    },
  },

  // EDATE - add months to date
  {
    name: 'EDATE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      const months = toNumber(args[1]);
      if (isError(months)) return months;

      const result = new Date(date.getFullYear(), date.getMonth() + (months as number), date.getDate());
      return dateToSerial(result);
    },
  },

  // DATEDIF - difference between dates
  {
    name: 'DATEDIF',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const startDate = parseDate(args[0]);
      const endDate = parseDate(args[1]);
      const unit = String(args[2]).toUpperCase();

      if (!startDate || !endDate) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }

      if (startDate > endDate) {
        return new FormulaError('#NUM!', 'Start date must be before end date');
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      switch (unit) {
        case 'D':
          return diffDays;
        case 'M':
          return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
        case 'Y':
          return endDate.getFullYear() - startDate.getFullYear();
        case 'MD':
          return endDate.getDate() - startDate.getDate();
        case 'YM':
          let months = endDate.getMonth() - startDate.getMonth();
          if (months < 0) months += 12;
          return months;
        case 'YD':
          const startOfYear = new Date(endDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          return Math.floor((endDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        default:
          return new FormulaError('#VALUE!', 'Invalid unit');
      }
    },
  },

  // DAYS - days between dates
  {
    name: 'DAYS',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const endDate = parseDate(args[0]);
      const startDate = parseDate(args[1]);

      if (!startDate || !endDate) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },
  },

  // NETWORKDAYS - working days between dates
  {
    name: 'NETWORKDAYS',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const startDate = parseDate(args[0]);
      const endDate = parseDate(args[1]);
      // holidays parameter ignored for simplicity

      if (!startDate || !endDate) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }

      let count = 0;
      const current = new Date(startDate);

      while (current <= endDate) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      return count;
    },
  },

  // WORKDAY - add working days to date
  {
    name: 'WORKDAY',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const startDate = parseDate(args[0]);
      const days = toNumber(args[1]);
      // holidays parameter ignored for simplicity

      if (!startDate) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      if (isError(days)) return days;

      const result = new Date(startDate);
      let remaining = Math.abs(days as number);
      const direction = (days as number) >= 0 ? 1 : -1;

      while (remaining > 0) {
        result.setDate(result.getDate() + direction);
        const day = result.getDay();
        if (day !== 0 && day !== 6) {
          remaining--;
        }
      }

      return dateToSerial(result);
    },
  },

  // DATEVALUE - convert text to date serial
  {
    name: 'DATEVALUE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const date = parseDate(args[0]);
      if (!date) {
        return new FormulaError('#VALUE!', 'Invalid date');
      }
      return dateToSerial(date);
    },
  },

  // TIMEVALUE - convert text to time serial
  {
    name: 'TIMEVALUE',
    minArgs: 1,
    maxArgs: 1,
    fn: (args: FormulaValue[]): FormulaValue => {
      const text = String(args[0]);
      const match = text.match(/(\d+):(\d+)(?::(\d+))?/);

      if (!match) {
        return new FormulaError('#VALUE!', 'Invalid time');
      }

      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = match[3] ? parseInt(match[3], 10) : 0;

      return (hours * 3600 + minutes * 60 + seconds) / 86400;
    },
  },
];

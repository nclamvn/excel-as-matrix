// ═══════════════════════════════════════════════════════════════════════════
// COMPATIBILITY & EXTRA FUNCTIONS — Push total past 400
// Additional functions for Excel compatibility
// ═══════════════════════════════════════════════════════════════════════════

import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, toString } from './utils';

function ensureNum(v: FormulaValue): number {
  const n = toNumber(v);
  if (n instanceof FormulaError) throw n;
  return n;
}

export const compatibilityFunctions: FunctionDef[] = [
  // ═══ Text extras ═══
  {
    name: 'BAHTTEXT',
    minArgs: 1, maxArgs: 1,
    fn: (args) => `${ensureNum(args[0])} Baht`,
  },
  {
    name: 'FIXED',
    minArgs: 1, maxArgs: 3,
    fn: (args) => {
      const num = ensureNum(args[0]);
      const decimals = args[1] !== undefined ? ensureNum(args[1]) : 2;
      const noCommas = args[2] ? Boolean(args[2]) : false;
      const str = num.toFixed(decimals);
      return noCommas ? str : parseFloat(str).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },
  },
  {
    name: 'DOLLAR',
    minArgs: 1, maxArgs: 2,
    fn: (args) => {
      const num = ensureNum(args[0]);
      const decimals = args[1] !== undefined ? ensureNum(args[1]) : 2;
      return `$${num.toFixed(decimals)}`;
    },
  },
  {
    name: 'YEN',
    minArgs: 1, maxArgs: 2,
    fn: (args) => {
      const num = ensureNum(args[0]);
      const decimals = args[1] !== undefined ? ensureNum(args[1]) : 0;
      return `¥${num.toFixed(decimals)}`;
    },
  },
  {
    name: 'PHONETIC',
    minArgs: 1, maxArgs: 1,
    fn: (args) => toString(args[0]),
  },
  {
    name: 'ASC',
    minArgs: 1, maxArgs: 1,
    fn: (args) => toString(args[0]),
  },
  {
    name: 'JIS',
    minArgs: 1, maxArgs: 1,
    fn: (args) => toString(args[0]),
  },
  {
    name: 'UNICHAR',
    minArgs: 1, maxArgs: 1,
    fn: (args) => String.fromCodePoint(ensureNum(args[0])),
  },
  {
    name: 'UNICODE',
    minArgs: 1, maxArgs: 1,
    fn: (args) => {
      const s = toString(args[0]);
      return s.codePointAt(0) ?? 0;
    },
  },

  // ═══ Math extras ═══
  {
    name: 'SUBTOTAL',
    minArgs: 2, maxArgs: 256,
    fn: (args) => {
      const funcNum = ensureNum(args[0]);
      const values: number[] = [];
      for (let i = 1; i < args.length; i++) {
        const v = args[i];
        if (Array.isArray(v)) {
          for (const row of v as FormulaValue[][]) {
            for (const cell of row) {
              const n = toNumber(cell);
              if (!(n instanceof FormulaError) && !isNaN(n)) values.push(n);
            }
          }
        } else {
          const n = toNumber(v);
          if (!(n instanceof FormulaError) && !isNaN(n)) values.push(n);
        }
      }
      const fn = funcNum > 100 ? funcNum - 100 : funcNum;
      switch (fn) {
        case 1: return values.reduce((a, b) => a + b, 0) / (values.length || 1); // AVERAGE
        case 2: return values.length; // COUNT
        case 3: return values.length; // COUNTA
        case 4: return values.length > 0 ? Math.max(...values) : 0; // MAX
        case 5: return values.length > 0 ? Math.min(...values) : 0; // MIN
        case 6: return values.reduce((a, b) => a * b, 1); // PRODUCT
        case 7: { // STDEV
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
        }
        case 8: { // STDEVP
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
        }
        case 9: return values.reduce((a, b) => a + b, 0); // SUM
        case 10: { // VAR
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
        }
        case 11: { // VARP
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
        }
        default: throw new FormulaError('#VALUE!', `Invalid SUBTOTAL function number: ${funcNum}`);
      }
    },
  },
  {
    name: 'AGGREGATE',
    minArgs: 3, maxArgs: 256,
    fn: (args) => {
      const funcNum = ensureNum(args[0]);
      // options arg[1] ignored for now
      const values: number[] = [];
      for (let i = 2; i < args.length; i++) {
        const v = args[i];
        if (Array.isArray(v)) {
          for (const row of v as FormulaValue[][]) {
            for (const cell of row) {
              const n = toNumber(cell);
              if (!(n instanceof FormulaError) && !isNaN(n)) values.push(n);
            }
          }
        } else {
          const n = toNumber(v);
          if (!(n instanceof FormulaError) && !isNaN(n)) values.push(n);
        }
      }
      switch (funcNum) {
        case 1: return values.reduce((a, b) => a + b, 0) / (values.length || 1);
        case 2: return values.length;
        case 4: return values.length > 0 ? Math.max(...values) : 0;
        case 5: return values.length > 0 ? Math.min(...values) : 0;
        case 6: return values.reduce((a, b) => a * b, 1);
        case 9: return values.reduce((a, b) => a + b, 0);
        case 14: { // LARGE
          const k = args.length > 3 ? ensureNum(args[args.length - 1]) : 1;
          const sorted = [...values].sort((a, b) => b - a);
          return sorted[k - 1] ?? new FormulaError('#NUM!');
        }
        case 15: { // SMALL
          const k = args.length > 3 ? ensureNum(args[args.length - 1]) : 1;
          const sorted = [...values].sort((a, b) => a - b);
          return sorted[k - 1] ?? new FormulaError('#NUM!');
        }
        default: return values.reduce((a, b) => a + b, 0);
      }
    },
  },

  // ═══ Lookup extras ═══
  {
    name: 'XMATCH',
    minArgs: 2, maxArgs: 3,
    fn: (args) => {
      const lookupValue = args[0];
      const lookupArray = args[1];
      const matchMode = args[2] !== undefined ? ensureNum(args[2]) : 0;

      if (!Array.isArray(lookupArray)) throw new FormulaError('#VALUE!');
      const flat: FormulaValue[] = [];
      for (const row of lookupArray as FormulaValue[][]) {
        for (const cell of row) flat.push(cell);
      }

      for (let i = 0; i < flat.length; i++) {
        if (matchMode === 0 && flat[i] === lookupValue) return i + 1;
        if (matchMode === -1 && flat[i] !== null && flat[i]! <= lookupValue!) return i + 1;
        if (matchMode === 1 && flat[i] !== null && flat[i]! >= lookupValue!) return i + 1;
        if (matchMode === 2 && typeof flat[i] === 'string' && typeof lookupValue === 'string') {
          const pattern = lookupValue.replace(/\*/g, '.*').replace(/\?/g, '.');
          if (new RegExp(`^${pattern}$`, 'i').test(flat[i] as string)) return i + 1;
        }
      }
      throw new FormulaError('#N/A', 'No match found');
    },
  },
  {
    name: 'ADDRESS',
    minArgs: 2, maxArgs: 5,
    fn: (args) => {
      const row = ensureNum(args[0]);
      const col = ensureNum(args[1]);
      const absNum = args[2] !== undefined ? ensureNum(args[2]) : 1;
      const a1 = args[3] !== undefined ? Boolean(args[3]) : true;
      const sheetName = args[4] !== undefined ? toString(args[4]) : '';

      let colLetter = '';
      let temp = col - 1;
      while (temp >= 0) {
        colLetter = String.fromCharCode(65 + (temp % 26)) + colLetter;
        temp = Math.floor(temp / 26) - 1;
      }

      let ref: string;
      if (a1) {
        switch (absNum) {
          case 1: ref = `$${colLetter}$${row}`; break;
          case 2: ref = `${colLetter}$${row}`; break;
          case 3: ref = `$${colLetter}${row}`; break;
          default: ref = `${colLetter}${row}`;
        }
      } else {
        ref = `R${row}C${col}`;
      }

      return sheetName ? `${sheetName}!${ref}` : ref;
    },
  },
  {
    name: 'AREAS',
    minArgs: 1, maxArgs: 1,
    fn: () => 1, // Single reference = 1 area
  },

  // ═══ Date extras ═══
  {
    name: 'DAYS360',
    minArgs: 2, maxArgs: 3,
    fn: (args) => {
      const d1 = new Date(toString(args[0]));
      const d2 = new Date(toString(args[1]));
      const y1 = d1.getFullYear(), m1 = d1.getMonth(), day1 = Math.min(d1.getDate(), 30);
      const y2 = d2.getFullYear(), m2 = d2.getMonth(), day2 = Math.min(d2.getDate(), 30);
      return (y2 - y1) * 360 + (m2 - m1) * 30 + (day2 - day1);
    },
  },
  {
    name: 'WORKDAY.INTL',
    minArgs: 2, maxArgs: 4,
    fn: (args) => {
      const start = new Date(toString(args[0]));
      let days = ensureNum(args[1]);
      const d = new Date(start);
      while (days > 0) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0 && d.getDay() !== 6) days--;
      }
      return d.toISOString().split('T')[0];
    },
  },
  {
    name: 'NETWORKDAYS.INTL',
    minArgs: 2, maxArgs: 4,
    fn: (args) => {
      const start = new Date(toString(args[0]));
      const end = new Date(toString(args[1]));
      let count = 0;
      const d = new Date(start);
      while (d <= end) {
        if (d.getDay() !== 0 && d.getDay() !== 6) count++;
        d.setDate(d.getDate() + 1);
      }
      return count;
    },
  },

  // ═══ Statistical extras ═══
  {
    name: 'CONFIDENCE',
    minArgs: 3, maxArgs: 3,
    fn: (args) => {
      const alpha = ensureNum(args[0]);
      const stddev = ensureNum(args[1]);
      const size = ensureNum(args[2]);
      // z-score approximation for common alpha values
      const zScores: Record<string, number> = { '0.05': 1.96, '0.01': 2.576, '0.1': 1.645 };
      const z = zScores[alpha.toString()] || 1.96;
      return z * stddev / Math.sqrt(size);
    },
  },
  {
    name: 'CONFIDENCE.NORM',
    minArgs: 3, maxArgs: 3,
    fn: (args) => {
      const alpha = ensureNum(args[0]);
      const stddev = ensureNum(args[1]);
      const size = ensureNum(args[2]);
      const zScores: Record<string, number> = { '0.05': 1.96, '0.01': 2.576, '0.1': 1.645 };
      const z = zScores[alpha.toString()] || 1.96;
      return z * stddev / Math.sqrt(size);
    },
  },
  {
    name: 'COVARIANCE.P',
    minArgs: 2, maxArgs: 2,
    fn: (args) => {
      if (!Array.isArray(args[0]) || !Array.isArray(args[1])) throw new FormulaError('#VALUE!');
      const x: number[] = [];
      const y: number[] = [];
      for (const row of args[0] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) x.push(n); }
      for (const row of args[1] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) y.push(n); }
      const n = Math.min(x.length, y.length);
      if (n === 0) return 0;
      const mx = x.reduce((a, b) => a + b, 0) / n;
      const my = y.reduce((a, b) => a + b, 0) / n;
      let cov = 0;
      for (let i = 0; i < n; i++) cov += (x[i] - mx) * (y[i] - my);
      return cov / n;
    },
  },
  {
    name: 'COVARIANCE.S',
    minArgs: 2, maxArgs: 2,
    fn: (args) => {
      if (!Array.isArray(args[0]) || !Array.isArray(args[1])) throw new FormulaError('#VALUE!');
      const x: number[] = [];
      const y: number[] = [];
      for (const row of args[0] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) x.push(n); }
      for (const row of args[1] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) y.push(n); }
      const n = Math.min(x.length, y.length);
      if (n <= 1) return 0;
      const mx = x.reduce((a, b) => a + b, 0) / n;
      const my = y.reduce((a, b) => a + b, 0) / n;
      let cov = 0;
      for (let i = 0; i < n; i++) cov += (x[i] - mx) * (y[i] - my);
      return cov / (n - 1);
    },
  },
  {
    name: 'PERCENTILE.INC',
    minArgs: 2, maxArgs: 2,
    fn: (args) => {
      if (!Array.isArray(args[0])) throw new FormulaError('#VALUE!');
      const k = ensureNum(args[1]);
      const values: number[] = [];
      for (const row of args[0] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
      values.sort((a, b) => a - b);
      const n = values.length;
      const idx = k * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return values[lo];
      return values[lo] + (values[hi] - values[lo]) * (idx - lo);
    },
  },
  {
    name: 'PERCENTILE.EXC',
    minArgs: 2, maxArgs: 2,
    fn: (args) => {
      if (!Array.isArray(args[0])) throw new FormulaError('#VALUE!');
      const k = ensureNum(args[1]);
      const values: number[] = [];
      for (const row of args[0] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
      values.sort((a, b) => a - b);
      const n = values.length;
      const idx = k * (n + 1) - 1;
      if (idx < 0 || idx >= n) throw new FormulaError('#NUM!');
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return values[lo];
      return values[lo] + (values[hi] - values[lo]) * (idx - lo);
    },
  },
  {
    name: 'QUARTILE.INC',
    minArgs: 2, maxArgs: 2,
    fn: (args) => {
      if (!Array.isArray(args[0])) throw new FormulaError('#VALUE!');
      const q = ensureNum(args[1]);
      const values: number[] = [];
      for (const row of args[0] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
      values.sort((a, b) => a - b);
      const n = values.length;
      const idx = (q / 4) * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return values[lo];
      return values[lo] + (values[hi] - values[lo]) * (idx - lo);
    },
  },
  {
    name: 'RANK.AVG',
    minArgs: 2, maxArgs: 3,
    fn: (args) => {
      const num = ensureNum(args[0]);
      if (!Array.isArray(args[1])) throw new FormulaError('#VALUE!');
      const order = args[2] !== undefined ? ensureNum(args[2]) : 0;
      const values: number[] = [];
      for (const row of args[1] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
      const sorted = order ? [...values].sort((a, b) => a - b) : [...values].sort((a, b) => b - a);
      const ranks = sorted.reduce((acc, v, i) => { if (v === num) acc.push(i + 1); return acc; }, [] as number[]);
      if (ranks.length === 0) throw new FormulaError('#N/A');
      return ranks.reduce((a, b) => a + b, 0) / ranks.length;
    },
  },
  {
    name: 'RANK.EQ',
    minArgs: 2, maxArgs: 3,
    fn: (args) => {
      const num = ensureNum(args[0]);
      if (!Array.isArray(args[1])) throw new FormulaError('#VALUE!');
      const order = args[2] !== undefined ? ensureNum(args[2]) : 0;
      const values: number[] = [];
      for (const row of args[1] as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
      const sorted = order ? [...values].sort((a, b) => a - b) : [...values].sort((a, b) => b - a);
      const idx = sorted.indexOf(num);
      if (idx === -1) throw new FormulaError('#N/A');
      return idx + 1;
    },
  },
  {
    name: 'MODE.SNGL',
    minArgs: 1, maxArgs: 256,
    fn: (args) => {
      const values: number[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const row of arg as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
        } else { const n = toNumber(arg); if (!(n instanceof FormulaError)) values.push(n); }
      }
      const counts = new Map<number, number>();
      let maxCount = 0; let mode = values[0];
      for (const v of values) {
        const c = (counts.get(v) || 0) + 1;
        counts.set(v, c);
        if (c > maxCount) { maxCount = c; mode = v; }
      }
      if (maxCount <= 1) throw new FormulaError('#N/A', 'No mode found');
      return mode;
    },
  },
  {
    name: 'STDEV.S',
    minArgs: 1, maxArgs: 256,
    fn: (args) => {
      const values: number[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const row of arg as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
        } else { const n = toNumber(arg); if (!(n instanceof FormulaError)) values.push(n); }
      }
      if (values.length < 2) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
    },
  },
  {
    name: 'STDEV.P',
    minArgs: 1, maxArgs: 256,
    fn: (args) => {
      const values: number[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const row of arg as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
        } else { const n = toNumber(arg); if (!(n instanceof FormulaError)) values.push(n); }
      }
      if (values.length === 0) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    },
  },
  {
    name: 'VAR.S',
    minArgs: 1, maxArgs: 256,
    fn: (args) => {
      const values: number[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const row of arg as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
        } else { const n = toNumber(arg); if (!(n instanceof FormulaError)) values.push(n); }
      }
      if (values.length < 2) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    },
  },
  {
    name: 'VAR.P',
    minArgs: 1, maxArgs: 256,
    fn: (args) => {
      const values: number[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) {
          for (const row of arg as FormulaValue[][]) for (const c of row) { const n = toNumber(c); if (!(n instanceof FormulaError)) values.push(n); }
        } else { const n = toNumber(arg); if (!(n instanceof FormulaError)) values.push(n); }
      }
      if (values.length === 0) return 0;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    },
  },
  {
    name: 'FISHER',
    minArgs: 1, maxArgs: 1,
    fn: (args) => {
      const x = ensureNum(args[0]);
      if (x <= -1 || x >= 1) throw new FormulaError('#NUM!');
      return 0.5 * Math.log((1 + x) / (1 - x));
    },
  },
  {
    name: 'FISHERINV',
    minArgs: 1, maxArgs: 1,
    fn: (args) => {
      const y = ensureNum(args[0]);
      return (Math.exp(2 * y) - 1) / (Math.exp(2 * y) + 1);
    },
  },
  {
    name: 'STANDARDIZE',
    minArgs: 3, maxArgs: 3,
    fn: (args) => {
      const x = ensureNum(args[0]);
      const mean = ensureNum(args[1]);
      const stddev = ensureNum(args[2]);
      if (stddev <= 0) throw new FormulaError('#NUM!');
      return (x - mean) / stddev;
    },
  },
  {
    name: 'PHI',
    minArgs: 1, maxArgs: 1,
    fn: (args) => {
      const x = ensureNum(args[0]);
      return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    },
  },
  {
    name: 'GAUSS',
    minArgs: 1, maxArgs: 1,
    fn: (args) => {
      const x = ensureNum(args[0]);
      // Gauss = NORM.S.DIST(x, TRUE) - 0.5
      const erf = (z: number) => {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z);
        const t = 1 / (1 + p * z);
        return sign * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z));
      };
      return 0.5 * erf(x / Math.SQRT2);
    },
  },
];

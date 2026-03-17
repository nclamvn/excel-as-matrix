// ═══════════════════════════════════════════════════════════════════════════
// ENGINEERING FUNCTIONS
// Base conversions, complex numbers, unit conversions, special functions
// ═══════════════════════════════════════════════════════════════════════════

import { FunctionDef, FormulaValue, FormulaError } from '../types';
import { toNumber, toString } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ensureNumber(v: FormulaValue): number {
  const n = toNumber(v);
  if (n instanceof FormulaError) throw n;
  if (isNaN(n)) throw new FormulaError('#VALUE!', 'Expected number');
  return n;
}

function ensureString(v: FormulaValue): string {
  return toString(v);
}

// Gamma function approximation (Lanczos)
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Beta function
function beta(a: number, b: number): number {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}

// Incomplete gamma (lower, regularized) — series expansion
function gammainc(a: number, x: number): number {
  if (x === 0) return 0;
  if (x < 0) return 0;

  let sum = 0;
  let term = 1 / a;
  sum = term;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-12) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - Math.log(gamma(a)));
}

// Error function approximation
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Complementary error function
function erfc(x: number): number {
  return 1 - erf(x);
}

// Normal CDF (for chi-sq, F, etc.)
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Binomial coefficient
function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engineering Functions
// ─────────────────────────────────────────────────────────────────────────────

export const engineeringFunctions: FunctionDef[] = [
  // ═══ Base Conversion ═══

  {
    name: 'BIN2DEC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const bin = ensureString(args[0]);
      if (!/^[01]{1,10}$/.test(bin)) throw new FormulaError('#NUM!', 'Invalid binary number');
      // Handle negative (10-bit two's complement)
      if (bin.length === 10 && bin[0] === '1') {
        return parseInt(bin, 2) - 1024;
      }
      return parseInt(bin, 2);
    },
  },
  {
    name: 'BIN2HEX',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const bin = ensureString(args[0]);
      const dec = parseInt(bin, 2);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const hex = (dec < 0 ? (dec + Math.pow(16, 10)).toString(16) : dec.toString(16)).toUpperCase();
      return places > 0 ? hex.padStart(places, '0') : hex;
    },
  },
  {
    name: 'BIN2OCT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const bin = ensureString(args[0]);
      const dec = parseInt(bin, 2);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const oct = dec.toString(8);
      return places > 0 ? oct.padStart(places, '0') : oct;
    },
  },
  {
    name: 'DEC2BIN',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      let dec = ensureNumber(args[0]);
      if (dec < -512 || dec > 511) throw new FormulaError('#NUM!', 'Out of range');
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      if (dec < 0) dec = dec + 1024;
      const bin = dec.toString(2);
      return places > 0 ? bin.padStart(places, '0') : bin;
    },
  },
  {
    name: 'DEC2HEX',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      let dec = ensureNumber(args[0]);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      if (dec < 0) dec = dec + Math.pow(16, 10);
      const hex = dec.toString(16).toUpperCase();
      return places > 0 ? hex.padStart(places, '0') : hex;
    },
  },
  {
    name: 'DEC2OCT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      let dec = ensureNumber(args[0]);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      if (dec < 0) dec = dec + Math.pow(8, 10);
      const oct = dec.toString(8);
      return places > 0 ? oct.padStart(places, '0') : oct;
    },
  },
  {
    name: 'HEX2DEC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const hex = ensureString(args[0]);
      if (!/^[0-9A-Fa-f]{1,10}$/.test(hex)) throw new FormulaError('#NUM!', 'Invalid hex');
      const dec = parseInt(hex, 16);
      // Handle negative (10-char hex = 40-bit two's complement)
      if (hex.length === 10 && parseInt(hex[0], 16) >= 8) {
        return dec - Math.pow(16, 10);
      }
      return dec;
    },
  },
  {
    name: 'HEX2BIN',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const hex = ensureString(args[0]);
      const dec = parseInt(hex, 16);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const bin = dec.toString(2);
      return places > 0 ? bin.padStart(places, '0') : bin;
    },
  },
  {
    name: 'HEX2OCT',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const hex = ensureString(args[0]);
      const dec = parseInt(hex, 16);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const oct = dec.toString(8);
      return places > 0 ? oct.padStart(places, '0') : oct;
    },
  },
  {
    name: 'OCT2DEC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const oct = ensureString(args[0]);
      if (!/^[0-7]{1,10}$/.test(oct)) throw new FormulaError('#NUM!', 'Invalid octal');
      const dec = parseInt(oct, 8);
      if (oct.length === 10 && parseInt(oct[0]) >= 4) {
        return dec - Math.pow(8, 10);
      }
      return dec;
    },
  },
  {
    name: 'OCT2BIN',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const oct = ensureString(args[0]);
      const dec = parseInt(oct, 8);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const bin = dec.toString(2);
      return places > 0 ? bin.padStart(places, '0') : bin;
    },
  },
  {
    name: 'OCT2HEX',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const oct = ensureString(args[0]);
      const dec = parseInt(oct, 8);
      const places = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      const hex = dec.toString(16).toUpperCase();
      return places > 0 ? hex.padStart(places, '0') : hex;
    },
  },

  // ═══ Complex Numbers ═══

  {
    name: 'COMPLEX',
    minArgs: 2,
    maxArgs: 3,
    fn: (args) => {
      const real = ensureNumber(args[0]);
      const imag = ensureNumber(args[1]);
      const suffix = args[2] !== undefined ? ensureString(args[2]) : 'i';
      if (suffix !== 'i' && suffix !== 'j') throw new FormulaError('#VALUE!', 'Suffix must be i or j');
      if (imag === 0) return String(real);
      if (real === 0) return imag === 1 ? suffix : imag === -1 ? `-${suffix}` : `${imag}${suffix}`;
      const sign = imag > 0 ? '+' : '';
      const imagStr = imag === 1 ? '' : imag === -1 ? '-' : String(imag);
      return `${real}${sign}${imagStr}${suffix}`;
    },
  },
  {
    name: 'IMAGINARY',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const str = ensureString(args[0]);
      const match = str.match(/^([+-]?\d*\.?\d*)?([+-]\d*\.?\d*)?[ij]$/);
      if (!match) {
        // Pure real number
        if (/^[+-]?\d*\.?\d+$/.test(str)) return 0;
        throw new FormulaError('#NUM!', 'Not a complex number');
      }
      const imagPart = match[2] || match[1] || '1';
      const val = imagPart === '+' || imagPart === '' ? 1 : imagPart === '-' ? -1 : parseFloat(imagPart);
      return val;
    },
  },
  {
    name: 'IMREAL',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const str = ensureString(args[0]);
      const match = str.match(/^([+-]?\d*\.?\d+)/);
      if (!match) return 0;
      // Check if entire string is just the imaginary part
      if (/^[+-]?\d*\.?\d*[ij]$/.test(str)) return 0;
      return parseFloat(match[1]);
    },
  },
  {
    name: 'IMABS',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const str = ensureString(args[0]);
      // Parse real+imag
      const parts = str.match(/^([+-]?\d*\.?\d+)?([+-]\d*\.?\d*)?[ij]?$/);
      let real = 0;
      let imag = 0;
      if (parts) {
        real = parts[1] ? parseFloat(parts[1]) : 0;
        if (str.includes('i') || str.includes('j')) {
          imag = parts[2] ? parseFloat(parts[2]) : (parts[1] && !str.match(/[ij]$/) ? 0 : parseFloat(parts[1] || '1'));
        }
      }
      return Math.sqrt(real * real + imag * imag);
    },
  },

  // ═══ Special Functions ═══

  {
    name: 'DELTA',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const n1 = ensureNumber(args[0]);
      const n2 = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      return n1 === n2 ? 1 : 0;
    },
  },
  {
    name: 'GESTEP',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const number = ensureNumber(args[0]);
      const step = args[1] !== undefined ? ensureNumber(args[1]) : 0;
      return number >= step ? 1 : 0;
    },
  },
  {
    name: 'ERF',
    minArgs: 1,
    maxArgs: 2,
    fn: (args) => {
      const lower = ensureNumber(args[0]);
      if (args[1] !== undefined) {
        const upper = ensureNumber(args[1]);
        return erf(upper) - erf(lower);
      }
      return erf(lower);
    },
  },
  {
    name: 'ERFC',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      return erfc(ensureNumber(args[0]));
    },
  },

  // ═══ Statistical Distributions ═══

  {
    name: 'NORM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const mean = ensureNumber(args[1]);
      const stddev = ensureNumber(args[2]);
      const cumulative = Boolean(args[3]);
      if (stddev <= 0) throw new FormulaError('#NUM!', 'Standard deviation must be positive');

      const z = (x - mean) / stddev;
      if (cumulative) {
        return normalCDF(z);
      }
      // PDF
      return Math.exp(-0.5 * z * z) / (stddev * Math.sqrt(2 * Math.PI));
    },
  },
  {
    name: 'NORM.S.DIST',
    minArgs: 2,
    maxArgs: 2,
    fn: (args) => {
      const z = ensureNumber(args[0]);
      const cumulative = Boolean(args[1]);
      if (cumulative) return normalCDF(z);
      return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    },
  },
  {
    name: 'NORM.INV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const p = ensureNumber(args[0]);
      const mean = ensureNumber(args[1]);
      const stddev = ensureNumber(args[2]);
      if (p <= 0 || p >= 1) throw new FormulaError('#NUM!', 'Probability must be between 0 and 1');
      if (stddev <= 0) throw new FormulaError('#NUM!', 'Standard deviation must be positive');

      // Rational approximation (Abramowitz and Stegun)
      const a = p < 0.5 ? p : 1 - p;
      const t = Math.sqrt(-2 * Math.log(a));
      let z = t - (2.515517 + t * (0.802853 + t * 0.010328)) / (1 + t * (1.432788 + t * (0.189269 + t * 0.001308)));
      if (p < 0.5) z = -z;
      return mean + z * stddev;
    },
  },
  {
    name: 'BINOM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const s = ensureNumber(args[0]); // successes
      const n = ensureNumber(args[1]); // trials
      const p = ensureNumber(args[2]); // probability
      const cumulative = Boolean(args[3]);

      if (s < 0 || s > n || p < 0 || p > 1) throw new FormulaError('#NUM!');

      if (cumulative) {
        let sum = 0;
        for (let k = 0; k <= s; k++) {
          sum += binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        }
        return sum;
      }
      return binomCoeff(n, s) * Math.pow(p, s) * Math.pow(1 - p, n - s);
    },
  },
  {
    name: 'POISSON.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const mean = ensureNumber(args[1]);
      const cumulative = Boolean(args[2]);

      if (x < 0 || mean < 0) throw new FormulaError('#NUM!');

      if (cumulative) {
        let sum = 0;
        for (let k = 0; k <= x; k++) {
          sum += Math.pow(mean, k) * Math.exp(-mean) / gamma(k + 1);
        }
        return sum;
      }
      return Math.pow(mean, x) * Math.exp(-mean) / gamma(x + 1);
    },
  },
  {
    name: 'CHISQ.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const df = ensureNumber(args[1]);
      const cumulative = Boolean(args[2]);

      if (x < 0 || df < 1) throw new FormulaError('#NUM!');

      if (cumulative) {
        return gammainc(df / 2, x / 2);
      }
      // PDF
      const k = df / 2;
      return (Math.pow(x, k - 1) * Math.exp(-x / 2)) / (Math.pow(2, k) * gamma(k));
    },
  },
  {
    name: 'F.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const d1 = ensureNumber(args[1]);
      const d2 = ensureNumber(args[2]);
      const cumulative = Boolean(args[3]);

      if (x < 0 || d1 < 1 || d2 < 1) throw new FormulaError('#NUM!');

      if (!cumulative) {
        // PDF of F-distribution
        const num = Math.pow(d1 * x / (d1 * x + d2), d1 / 2) * Math.pow(d2 / (d1 * x + d2), d2 / 2);
        return num / (x * beta(d1 / 2, d2 / 2));
      }
      // CDF — use regularized incomplete beta function approximation
      const z = d1 * x / (d1 * x + d2);
      return gammainc(d1 / 2, z * d1 / 2);
    },
  },
  {
    name: 'GAMMA.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const alpha = ensureNumber(args[1]);
      const b = ensureNumber(args[2]); // beta (scale)
      const cumulative = Boolean(args[3]);

      if (x < 0 || alpha <= 0 || b <= 0) throw new FormulaError('#NUM!');

      if (cumulative) {
        return gammainc(alpha, x / b);
      }
      // PDF
      return (Math.pow(x, alpha - 1) * Math.exp(-x / b)) / (Math.pow(b, alpha) * gamma(alpha));
    },
  },
  {
    name: 'WEIBULL.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const alpha = ensureNumber(args[1]); // shape
      const b = ensureNumber(args[2]); // scale
      const cumulative = Boolean(args[3]);

      if (x < 0 || alpha <= 0 || b <= 0) throw new FormulaError('#NUM!');

      if (cumulative) {
        return 1 - Math.exp(-Math.pow(x / b, alpha));
      }
      // PDF
      return (alpha / b) * Math.pow(x / b, alpha - 1) * Math.exp(-Math.pow(x / b, alpha));
    },
  },
  {
    name: 'BETA.DIST',
    minArgs: 4,
    maxArgs: 6,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const alpha = ensureNumber(args[1]);
      const b = ensureNumber(args[2]);
      const cumulative = Boolean(args[3]);
      const a_bound = args[4] !== undefined ? ensureNumber(args[4]) : 0;
      const b_bound = args[5] !== undefined ? ensureNumber(args[5]) : 1;

      if (alpha <= 0 || b <= 0) throw new FormulaError('#NUM!');

      const z = (x - a_bound) / (b_bound - a_bound);
      if (z < 0 || z > 1) throw new FormulaError('#NUM!');

      if (!cumulative) {
        return Math.pow(z, alpha - 1) * Math.pow(1 - z, b - 1) / beta(alpha, b) / (b_bound - a_bound);
      }
      // CDF — approximate with incomplete beta
      return gammainc(alpha, z * alpha);
    },
  },
  {
    name: 'EXPON.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const lambda = ensureNumber(args[1]);
      const cumulative = Boolean(args[2]);

      if (x < 0 || lambda <= 0) throw new FormulaError('#NUM!');

      if (cumulative) {
        return 1 - Math.exp(-lambda * x);
      }
      return lambda * Math.exp(-lambda * x);
    },
  },
  {
    name: 'T.DIST',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const df = ensureNumber(args[1]);
      const cumulative = Boolean(args[2]);

      if (df < 1) throw new FormulaError('#NUM!');

      if (!cumulative) {
        // PDF of Student's t-distribution
        return (gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * gamma(df / 2))) *
          Math.pow(1 + x * x / df, -(df + 1) / 2);
      }
      // CDF approximation using normal CDF for large df
      if (df > 100) return normalCDF(x);
      // For smaller df, use series approximation
      const z = x / Math.sqrt(df);
      const t2 = z * z;
      return 0.5 + 0.5 * (1 - Math.pow(1 + t2 / df, -(df - 1) / 2)) * (x > 0 ? 1 : -1);
    },
  },
  {
    name: 'LOGNORM.DIST',
    minArgs: 4,
    maxArgs: 4,
    fn: (args) => {
      const x = ensureNumber(args[0]);
      const mean = ensureNumber(args[1]);
      const stddev = ensureNumber(args[2]);
      const cumulative = Boolean(args[3]);

      if (x <= 0 || stddev <= 0) throw new FormulaError('#NUM!');

      const z = (Math.log(x) - mean) / stddev;
      if (cumulative) return normalCDF(z);
      return Math.exp(-0.5 * z * z) / (x * stddev * Math.sqrt(2 * Math.PI));
    },
  },

  // ═══ Unit Conversion ═══

  {
    name: 'CONVERT',
    minArgs: 3,
    maxArgs: 3,
    fn: (args) => {
      const value = ensureNumber(args[0]);
      const from = ensureString(args[1]).toLowerCase();
      const to = ensureString(args[2]).toLowerCase();

      if (from === to) return value;

      // Define conversion factors to a base unit per category
      const conversions: Record<string, Record<string, number>> = {
        // Length (base: meter)
        m: { m: 1, cm: 100, mm: 1000, km: 0.001, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 },
        cm: { m: 0.01 },
        mm: { m: 0.001 },
        km: { m: 1000 },
        in: { m: 0.0254 },
        ft: { m: 0.3048 },
        yd: { m: 0.9144 },
        mi: { m: 1609.344 },
        // Weight (base: kg)
        kg: { kg: 1, g: 1000, mg: 1e6, lb: 2.20462, oz: 35.274, ton: 0.001 },
        g: { kg: 0.001 },
        mg: { kg: 1e-6 },
        lb: { kg: 0.453592 },
        oz: { kg: 0.0283495 },
        ton: { kg: 1000 },
        // Temperature handled separately
        // Time (base: second)
        s: { s: 1, min: 1/60, hr: 1/3600, day: 1/86400 },
        min: { s: 60 },
        hr: { s: 3600 },
        day: { s: 86400 },
      };

      // Temperature special handling
      if ((from === 'c' || from === 'f' || from === 'k') && (to === 'c' || to === 'f' || to === 'k')) {
        let celsius: number;
        if (from === 'c') celsius = value;
        else if (from === 'f') celsius = (value - 32) * 5 / 9;
        else celsius = value - 273.15;

        if (to === 'c') return celsius;
        if (to === 'f') return celsius * 9 / 5 + 32;
        return celsius + 273.15;
      }

      // Find base unit for 'from'
      const fromToBase = conversions[from];
      if (!fromToBase) throw new FormulaError('#N/A', `Unknown unit: ${from}`);

      // Convert from → base → to
      const baseUnit = Object.keys(fromToBase)[0];
      const toBase = fromToBase[baseUnit] ?? 1;
      const baseValue = baseUnit === from ? value : value * toBase;

      // Find conversion from base to target
      const baseConversions = conversions[baseUnit];
      if (!baseConversions || baseConversions[to] === undefined) {
        throw new FormulaError('#N/A', `Cannot convert ${from} to ${to}`);
      }

      return baseValue * baseConversions[to];
    },
  },
];

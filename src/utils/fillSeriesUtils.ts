import { CellValue } from '../types/cell';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PatternType =
  | 'linear'
  | 'growth'
  | 'date'
  | 'dayName'
  | 'monthName'
  | 'quarter'
  | 'textWithNumber'
  | 'copy';

export type DateUnit = 'day' | 'weekday' | 'month' | 'year';

export interface DetectedPattern {
  type: PatternType;
  step?: number;
  prefix?: string;
  suffix?: string;
  isShortForm?: boolean;
  startIndex?: number;
  dateUnit?: DateUnit;
  numberPadding?: number;
}

export interface FillSeriesConfig {
  type: 'linear' | 'growth' | 'date' | 'autofill';
  direction: 'rows' | 'columns';
  step: number;
  stopValue?: number;
  dateUnit?: DateUnit;
  trend?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect the pattern type from an array of values
 */
export function detectPattern(values: CellValue[]): DetectedPattern {
  if (!values || values.length === 0) {
    return { type: 'copy' };
  }

  const stringValues = values.map((v) => String(v ?? '').trim());

  // Try each pattern in order of priority
  const dayPattern = detectDayNamePattern(stringValues);
  if (dayPattern) return dayPattern;

  const monthPattern = detectMonthNamePattern(stringValues);
  if (monthPattern) return monthPattern;

  const quarterPattern = detectQuarterPattern(stringValues);
  if (quarterPattern) return quarterPattern;

  const textWithNumberPattern = detectTextWithNumberPattern(stringValues);
  if (textWithNumberPattern) return textWithNumberPattern;

  const numericPattern = detectNumericPattern(values);
  if (numericPattern) return numericPattern;

  const datePattern = detectDatePattern(stringValues);
  if (datePattern) return datePattern;

  return { type: 'copy' };
}

/**
 * Detect day name pattern (Mon, Tue... or Monday, Tuesday...)
 */
function detectDayNamePattern(values: string[]): DetectedPattern | null {
  if (values.length === 0) return null;

  // Check short form
  const shortIndices = values.map((v) => SHORT_DAY_NAMES.findIndex((d) => d.toLowerCase() === v.toLowerCase()));
  if (shortIndices.every((i) => i !== -1)) {
    const step = values.length >= 2 ? calculateCyclicStep(shortIndices, 7) : 1;
    return { type: 'dayName', isShortForm: true, startIndex: shortIndices[0], step };
  }

  // Check full form
  const fullIndices = values.map((v) => FULL_DAY_NAMES.findIndex((d) => d.toLowerCase() === v.toLowerCase()));
  if (fullIndices.every((i) => i !== -1)) {
    const step = values.length >= 2 ? calculateCyclicStep(fullIndices, 7) : 1;
    return { type: 'dayName', isShortForm: false, startIndex: fullIndices[0], step };
  }

  return null;
}

/**
 * Detect month name pattern (Jan, Feb... or January, February...)
 */
function detectMonthNamePattern(values: string[]): DetectedPattern | null {
  if (values.length === 0) return null;

  // Check short form
  const shortIndices = values.map((v) => SHORT_MONTH_NAMES.findIndex((m) => m.toLowerCase() === v.toLowerCase()));
  if (shortIndices.every((i) => i !== -1)) {
    const step = values.length >= 2 ? calculateCyclicStep(shortIndices, 12) : 1;
    return { type: 'monthName', isShortForm: true, startIndex: shortIndices[0], step };
  }

  // Check full form
  const fullIndices = values.map((v) => FULL_MONTH_NAMES.findIndex((m) => m.toLowerCase() === v.toLowerCase()));
  if (fullIndices.every((i) => i !== -1)) {
    const step = values.length >= 2 ? calculateCyclicStep(fullIndices, 12) : 1;
    return { type: 'monthName', isShortForm: false, startIndex: fullIndices[0], step };
  }

  return null;
}

/**
 * Detect quarter pattern (Q1, Q2, Q3, Q4)
 */
function detectQuarterPattern(values: string[]): DetectedPattern | null {
  if (values.length === 0) return null;

  const indices = values.map((v) => QUARTERS.findIndex((q) => q.toLowerCase() === v.toLowerCase()));
  if (indices.every((i) => i !== -1)) {
    const step = values.length >= 2 ? calculateCyclicStep(indices, 4) : 1;
    return { type: 'quarter', startIndex: indices[0], step };
  }

  return null;
}

/**
 * Detect text with number pattern (Item1, Item2... or Product_001, Product_002...)
 */
function detectTextWithNumberPattern(values: string[]): DetectedPattern | null {
  if (values.length === 0) return null;

  // Match patterns like "Item1", "Product_001", "Row 5", etc.
  const patterns = values.map((v) => {
    const match = v.match(/^(.*?)(\d+)(.*)$/);
    if (match) {
      return {
        prefix: match[1],
        number: parseInt(match[2], 10),
        suffix: match[3],
        padding: match[2].length,
      };
    }
    return null;
  });

  // Check if all values match and have consistent prefix/suffix
  if (patterns.every((p) => p !== null)) {
    const validPatterns = patterns as NonNullable<typeof patterns[0]>[];
    const firstPrefix = validPatterns[0].prefix;
    const firstSuffix = validPatterns[0].suffix;
    const firstPadding = validPatterns[0].padding;

    // All patterns must have the same prefix and suffix
    if (validPatterns.every((p) => p.prefix === firstPrefix && p.suffix === firstSuffix)) {
      // Calculate step
      const numbers = validPatterns.map((p) => p.number);
      const step = numbers.length >= 2 ? calculateLinearStep(numbers) : 1;

      if (step !== null) {
        return {
          type: 'textWithNumber',
          prefix: firstPrefix,
          suffix: firstSuffix,
          step,
          startIndex: numbers[numbers.length - 1],
          numberPadding: firstPadding,
        };
      }
    }
  }

  return null;
}

/**
 * Detect numeric series pattern (1, 2, 3... or 10, 20, 30...)
 */
function detectNumericPattern(values: CellValue[]): DetectedPattern | null {
  if (values.length < 2) {
    // Single number - assume step of 1
    const num = parseFloat(String(values[0]));
    if (!isNaN(num)) {
      return { type: 'linear', step: 1 };
    }
    return null;
  }

  const numbers = values.map((v) => parseFloat(String(v)));
  if (numbers.some((n) => isNaN(n))) return null;

  // Check for linear pattern (constant difference)
  const linearStep = calculateLinearStep(numbers);
  if (linearStep !== null) {
    return { type: 'linear', step: linearStep };
  }

  // Check for growth pattern (constant ratio)
  const growthStep = calculateGrowthRatio(numbers);
  if (growthStep !== null) {
    return { type: 'growth', step: growthStep };
  }

  return null;
}

/**
 * Detect date pattern (2024-01-01, 2024-01-02...)
 */
function detectDatePattern(values: string[]): DetectedPattern | null {
  if (values.length === 0) return null;

  const dates = values.map((v) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });

  if (dates.some((d) => d === null)) return null;

  const validDates = dates as Date[];

  if (validDates.length >= 2) {
    // Calculate day difference
    const dayDiffs: number[] = [];
    for (let i = 1; i < validDates.length; i++) {
      dayDiffs.push(Math.round((validDates[i].getTime() - validDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Check if all differences are the same
    if (dayDiffs.every((d) => d === dayDiffs[0])) {
      return { type: 'date', step: dayDiffs[0], dateUnit: 'day' };
    }
  }

  return { type: 'date', step: 1, dateUnit: 'day' };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERIES GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate series values based on pattern and count
 */
export function generateSeriesValues(
  sourceValues: CellValue[],
  pattern: DetectedPattern,
  count: number,
  config?: Partial<FillSeriesConfig>
): CellValue[] {
  switch (pattern.type) {
    case 'linear':
      return generateLinearSeries(sourceValues, count, config?.step ?? pattern.step ?? 1);

    case 'growth':
      return generateGrowthSeries(sourceValues, count, config?.step ?? pattern.step ?? 2);

    case 'date':
      return generateDateSeries(sourceValues, count, config?.step ?? pattern.step ?? 1, config?.dateUnit ?? pattern.dateUnit ?? 'day');

    case 'dayName':
      return generateDayNameSeries(pattern, count);

    case 'monthName':
      return generateMonthNameSeries(pattern, count);

    case 'quarter':
      return generateQuarterSeries(pattern, count);

    case 'textWithNumber':
      return generateTextWithNumberSeries(pattern, count);

    case 'copy':
    default:
      return generateCopySeries(sourceValues, count);
  }
}

/**
 * Generate linear series (1, 2, 3... or 10, 20, 30...)
 */
export function generateLinearSeries(sourceValues: CellValue[], count: number, step: number = 1): CellValue[] {
  const result: CellValue[] = [];
  const lastValue = parseFloat(String(sourceValues[sourceValues.length - 1]));

  if (isNaN(lastValue)) {
    return generateCopySeries(sourceValues, count);
  }

  for (let i = 1; i <= count; i++) {
    result.push(lastValue + step * i);
  }

  return result;
}

/**
 * Generate growth series (1, 2, 4, 8... exponential)
 */
export function generateGrowthSeries(sourceValues: CellValue[], count: number, ratio: number = 2): CellValue[] {
  const result: CellValue[] = [];
  const lastValue = parseFloat(String(sourceValues[sourceValues.length - 1]));

  if (isNaN(lastValue) || lastValue === 0) {
    return generateCopySeries(sourceValues, count);
  }

  for (let i = 1; i <= count; i++) {
    result.push(lastValue * Math.pow(ratio, i));
  }

  return result;
}

/**
 * Generate date series
 */
export function generateDateSeries(
  sourceValues: CellValue[],
  count: number,
  step: number = 1,
  unit: DateUnit = 'day'
): CellValue[] {
  const result: CellValue[] = [];
  const lastDateStr = String(sourceValues[sourceValues.length - 1]);
  const lastDate = new Date(lastDateStr);

  if (isNaN(lastDate.getTime())) {
    return generateCopySeries(sourceValues, count);
  }

  for (let i = 1; i <= count; i++) {
    const newDate = new Date(lastDate);

    switch (unit) {
      case 'day':
        newDate.setDate(newDate.getDate() + step * i);
        break;
      case 'weekday':
        // Skip weekends
        let daysToAdd = step * i;
        let currentDate = new Date(lastDate);
        while (daysToAdd > 0) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            daysToAdd--;
          }
        }
        result.push(currentDate.toISOString().split('T')[0]);
        continue;
      case 'month':
        newDate.setMonth(newDate.getMonth() + step * i);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + step * i);
        break;
    }

    result.push(newDate.toISOString().split('T')[0]);
  }

  return result;
}

/**
 * Generate day name series (Mon, Tue, Wed...)
 */
export function generateDayNameSeries(pattern: DetectedPattern, count: number): CellValue[] {
  const result: CellValue[] = [];
  const names = pattern.isShortForm ? SHORT_DAY_NAMES : FULL_DAY_NAMES;
  const step = pattern.step ?? 1;
  let currentIndex = pattern.startIndex ?? 0;

  // Advance by one step from the last value
  currentIndex = (currentIndex + step) % 7;

  for (let i = 0; i < count; i++) {
    result.push(names[currentIndex]);
    currentIndex = (currentIndex + step + 7) % 7;
  }

  return result;
}

/**
 * Generate month name series (Jan, Feb, Mar...)
 */
export function generateMonthNameSeries(pattern: DetectedPattern, count: number): CellValue[] {
  const result: CellValue[] = [];
  const names = pattern.isShortForm ? SHORT_MONTH_NAMES : FULL_MONTH_NAMES;
  const step = pattern.step ?? 1;
  let currentIndex = pattern.startIndex ?? 0;

  // Advance by one step from the last value
  currentIndex = (currentIndex + step) % 12;

  for (let i = 0; i < count; i++) {
    result.push(names[currentIndex]);
    currentIndex = (currentIndex + step + 12) % 12;
  }

  return result;
}

/**
 * Generate quarter series (Q1, Q2, Q3, Q4)
 */
export function generateQuarterSeries(pattern: DetectedPattern, count: number): CellValue[] {
  const result: CellValue[] = [];
  const step = pattern.step ?? 1;
  let currentIndex = pattern.startIndex ?? 0;

  // Advance by one step from the last value
  currentIndex = (currentIndex + step) % 4;

  for (let i = 0; i < count; i++) {
    result.push(QUARTERS[currentIndex]);
    currentIndex = (currentIndex + step + 4) % 4;
  }

  return result;
}

/**
 * Generate text with number series (Item1, Item2, Item3...)
 */
export function generateTextWithNumberSeries(pattern: DetectedPattern, count: number): CellValue[] {
  const result: CellValue[] = [];
  const step = pattern.step ?? 1;
  let currentNumber = (pattern.startIndex ?? 0) + step;
  const padding = pattern.numberPadding ?? 1;

  for (let i = 0; i < count; i++) {
    const paddedNumber = String(currentNumber).padStart(padding, '0');
    result.push(`${pattern.prefix ?? ''}${paddedNumber}${pattern.suffix ?? ''}`);
    currentNumber += step;
  }

  return result;
}

/**
 * Generate copy series (repeat source values)
 */
export function generateCopySeries(sourceValues: CellValue[], count: number): CellValue[] {
  const result: CellValue[] = [];
  for (let i = 0; i < count; i++) {
    result.push(sourceValues[i % sourceValues.length]);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate step for cyclic patterns (days, months, quarters)
 */
function calculateCyclicStep(indices: number[], cycleLength: number): number {
  if (indices.length < 2) return 1;

  const diffs: number[] = [];
  for (let i = 1; i < indices.length; i++) {
    let diff = indices[i] - indices[i - 1];
    if (diff <= 0) diff += cycleLength;
    diffs.push(diff);
  }

  // Check if all differences are the same
  if (diffs.every((d) => d === diffs[0])) {
    return diffs[0];
  }

  return 1;
}

/**
 * Calculate step for linear series
 */
function calculateLinearStep(numbers: number[]): number | null {
  if (numbers.length < 2) return null;

  const diffs: number[] = [];
  for (let i = 1; i < numbers.length; i++) {
    diffs.push(numbers[i] - numbers[i - 1]);
  }

  // Check if all differences are approximately the same
  const tolerance = 0.0001;
  if (diffs.every((d) => Math.abs(d - diffs[0]) < tolerance)) {
    return diffs[0];
  }

  return null;
}

/**
 * Calculate ratio for growth series
 */
function calculateGrowthRatio(numbers: number[]): number | null {
  if (numbers.length < 2) return null;
  if (numbers.some((n) => n === 0)) return null;

  const ratios: number[] = [];
  for (let i = 1; i < numbers.length; i++) {
    ratios.push(numbers[i] / numbers[i - 1]);
  }

  // Check if all ratios are approximately the same
  const tolerance = 0.0001;
  if (ratios.every((r) => Math.abs(r - ratios[0]) < tolerance)) {
    return ratios[0];
  }

  return null;
}

/**
 * Apply fill series with configuration (used by FillSeriesDialog)
 */
export function applyFillSeries(
  sourceValues: CellValue[],
  count: number,
  config: FillSeriesConfig
): CellValue[] {
  const pattern = detectPattern(sourceValues);

  switch (config.type) {
    case 'linear':
      return generateLinearSeries(sourceValues, count, config.step);

    case 'growth':
      return generateGrowthSeries(sourceValues, count, config.step);

    case 'date':
      return generateDateSeries(sourceValues, count, config.step, config.dateUnit);

    case 'autofill':
    default:
      return generateSeriesValues(sourceValues, pattern, count, config);
  }
}

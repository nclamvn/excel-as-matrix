// ============================================================
// CONDITIONAL FORMATTING EVALUATOR
// ============================================================

import {
  CFRule,
  CFDataBar,
  CFColorScale,
  CFIconSet,
} from '../../types/conditionalFormatting';
import { logger } from '@/utils/logger';

interface CellData {
  value: unknown;
  row: number;
  col: number;
}

interface RangeStats {
  min: number;
  max: number;
  sum: number;
  count: number;
  average: number;
  stdDev: number;
  values: number[];
  duplicates: Map<string, number>;
}

// Calculate statistics for a range
export const calculateRangeStats = (cells: CellData[]): RangeStats => {
  const numbers = cells
    .map(c => parseFloat(String(c.value)))
    .filter(n => !isNaN(n));

  const sum = numbers.reduce((a, b) => a + b, 0);
  const count = numbers.length;
  const average = count > 0 ? sum / count : 0;
  const min = count > 0 ? Math.min(...numbers) : 0;
  const max = count > 0 ? Math.max(...numbers) : 0;

  // Standard deviation
  const squaredDiffs = numbers.map(n => Math.pow(n - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Duplicates
  const duplicates = new Map<string, number>();
  cells.forEach(c => {
    const key = String(c.value);
    duplicates.set(key, (duplicates.get(key) || 0) + 1);
  });

  return { min, max, sum, count, average, stdDev, values: numbers, duplicates };
};

// Evaluate a single rule against a cell
export const evaluateRule = (
  rule: CFRule,
  cell: CellData,
  stats: RangeStats
): boolean => {
  if (!rule.enabled) return false;

  const value = cell.value;
  const numValue = parseFloat(String(value));

  switch (rule.type) {
    case 'cellValue':
      return evaluateCellValueRule(rule, numValue);

    case 'text':
      return evaluateTextRule(rule, String(value));

    case 'date':
      return evaluateDateRule(rule, value);

    case 'duplicate':
      return evaluateDuplicateRule(rule, String(value), stats.duplicates);

    case 'topBottom':
      return evaluateTopBottomRule(rule, numValue, stats);

    case 'aboveAverage':
      return evaluateAverageRule(rule, numValue, stats);

    case 'formula':
      return evaluateFormulaRule(rule);

    // Data bars, color scales, icon sets always "match" - they just need rendering
    case 'dataBar':
    case 'colorScale':
    case 'iconSet':
      return true;

    default:
      return false;
  }
};

// Cell value comparison
const evaluateCellValueRule = (rule: CFRule, value: number): boolean => {
  if (isNaN(value)) return false;

  const v1 = parseFloat(String(rule.value1)) || 0;
  const v2 = parseFloat(String(rule.value2)) || 0;

  switch (rule.operator) {
    case 'greaterThan': return value > v1;
    case 'lessThan': return value < v1;
    case 'greaterThanOrEqual': return value >= v1;
    case 'lessThanOrEqual': return value <= v1;
    case 'equal': return value === v1;
    case 'notEqual': return value !== v1;
    case 'between': return value >= Math.min(v1, v2) && value <= Math.max(v1, v2);
    case 'notBetween': return value < Math.min(v1, v2) || value > Math.max(v1, v2);
    default: return false;
  }
};

// Text rule evaluation
const evaluateTextRule = (rule: CFRule, text: string): boolean => {
  const searchText = rule.text?.toLowerCase() || '';
  const cellText = text.toLowerCase();

  switch (rule.textOperator) {
    case 'contains': return cellText.includes(searchText);
    case 'notContains': return !cellText.includes(searchText);
    case 'beginsWith': return cellText.startsWith(searchText);
    case 'endsWith': return cellText.endsWith(searchText);
    default: return false;
  }
};

// Date rule evaluation
const evaluateDateRule = (rule: CFRule, value: unknown): boolean => {
  const cellDate = new Date(String(value));
  if (isNaN(cellDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const cellDateOnly = new Date(cellDate);
  cellDateOnly.setHours(0, 0, 0, 0);

  switch (rule.dateOperator) {
    case 'yesterday': return cellDateOnly.getTime() === yesterday.getTime();
    case 'today': return cellDateOnly.getTime() === today.getTime();
    case 'tomorrow': return cellDateOnly.getTime() === tomorrow.getTime();
    case 'last7Days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return cellDateOnly >= weekAgo && cellDateOnly <= today;
    }
    default: return false;
  }
};

// Duplicate/Unique rule evaluation
const evaluateDuplicateRule = (
  rule: CFRule,
  value: string,
  duplicates: Map<string, number>
): boolean => {
  const count = duplicates.get(value) || 0;
  if (rule.duplicateType === 'duplicate') {
    return count > 1;
  } else {
    return count === 1;
  }
};

// Top/Bottom rule evaluation
const evaluateTopBottomRule = (rule: CFRule, value: number, stats: RangeStats): boolean => {
  if (isNaN(value)) return false;

  const n = rule.topBottomValue || 10;
  const sorted = [...stats.values].sort((a, b) => b - a);

  switch (rule.topBottomType) {
    case 'top': {
      const threshold = sorted[Math.min(n - 1, sorted.length - 1)];
      return value >= threshold;
    }
    case 'bottom': {
      const threshold = sorted[Math.max(sorted.length - n, 0)];
      return value <= threshold;
    }
    case 'topPercent': {
      const index = Math.ceil(sorted.length * n / 100) - 1;
      const threshold = sorted[Math.min(index, sorted.length - 1)];
      return value >= threshold;
    }
    case 'bottomPercent': {
      const index = sorted.length - Math.ceil(sorted.length * n / 100);
      const threshold = sorted[Math.max(index, 0)];
      return value <= threshold;
    }
    default: return false;
  }
};

// Above/Below average rule evaluation
const evaluateAverageRule = (rule: CFRule, value: number, stats: RangeStats): boolean => {
  if (isNaN(value)) return false;

  const { average, stdDev } = stats;
  const stdDevMultiple = rule.stdDevMultiple || 1;

  switch (rule.averageType) {
    case 'above': return value > average;
    case 'below': return value < average;
    case 'equalOrAbove': return value >= average;
    case 'equalOrBelow': return value <= average;
    case 'stdDevAbove': return value > average + (stdDev * stdDevMultiple);
    case 'stdDevBelow': return value < average - (stdDev * stdDevMultiple);
    default: return false;
  }
};

// Custom formula rule evaluation
const evaluateFormulaRule = (_rule: CFRule): boolean => {
  // This would need integration with the formula engine
  logger.warn('Formula-based conditional formatting not yet implemented');
  return false;
};

// ============================================================
// VISUAL RENDERING CALCULATIONS
// ============================================================

// Calculate data bar width percentage
export const calculateDataBarWidth = (
  value: number,
  dataBar: CFDataBar,
  stats: RangeStats
): { width: number; isNegative: boolean } => {
  let min = dataBar.minType === 'auto' ? stats.min : (dataBar.minValue || 0);
  let max = dataBar.maxType === 'auto' ? stats.max : (dataBar.maxValue || 100);

  if (dataBar.minType === 'percent') min = stats.min + (stats.max - stats.min) * (dataBar.minValue || 0) / 100;
  if (dataBar.maxType === 'percent') max = stats.min + (stats.max - stats.min) * (dataBar.maxValue || 100) / 100;

  const range = max - min;
  if (range === 0) return { width: 0, isNegative: false };

  const percentage = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  return { width: percentage, isNegative: value < 0 };
};

// Calculate color for color scale
export const calculateColorScaleColor = (
  value: number,
  colorScale: CFColorScale,
  stats: RangeStats
): string => {
  const min = colorScale.minType === 'min' ? stats.min : (parseFloat(String(colorScale.minValue)) || 0);
  const max = colorScale.maxType === 'max' ? stats.max : (parseFloat(String(colorScale.maxValue)) || 100);

  const range = max - min;
  if (range === 0) return colorScale.minColor;

  const percentage = Math.max(0, Math.min(1, (value - min) / range));

  if (colorScale.type === '2-color') {
    return interpolateColor(colorScale.minColor, colorScale.maxColor, percentage);
  } else {
    // 3-color scale
    const midValue = colorScale.midValue !== undefined
      ? parseFloat(String(colorScale.midValue))
      : (min + max) / 2;
    const midPercentage = (midValue - min) / range;

    if (percentage <= midPercentage) {
      const localPercentage = percentage / midPercentage;
      return interpolateColor(colorScale.minColor, colorScale.midColor!, localPercentage);
    } else {
      const localPercentage = (percentage - midPercentage) / (1 - midPercentage);
      return interpolateColor(colorScale.midColor!, colorScale.maxColor, localPercentage);
    }
  }
};

// Color interpolation helper
const interpolateColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
};

// Calculate icon for icon set
export const calculateIconSetIcon = (
  value: number,
  iconSet: CFIconSet,
  stats: RangeStats,
  iconDefinitions: { icons: string[]; defaultThresholds: number[] }
): string => {
  const { icons } = iconDefinitions;
  const thresholds = iconSet.thresholds.length > 0
    ? iconSet.thresholds
    : iconDefinitions.defaultThresholds.map((t) => ({
        type: 'percent' as const,
        value: t,
        operator: '>=' as const
      }));

  // Calculate percentile
  const sortedValues = [...stats.values].sort((a, b) => a - b);
  const percentile = (sortedValues.indexOf(value) / (sortedValues.length - 1)) * 100;

  // Find matching icon
  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i];
    const thresholdValue = threshold.type === 'percent'
      ? threshold.value as number
      : parseFloat(String(threshold.value));

    const compareValue = threshold.type === 'percent' ? percentile : value;

    if (threshold.operator === '>=' ? compareValue >= thresholdValue : compareValue > thresholdValue) {
      return iconSet.reverseOrder ? icons[icons.length - 1 - i] : icons[i];
    }
  }

  // Return last icon if no threshold matched
  return iconSet.reverseOrder ? icons[0] : icons[icons.length - 1];
};

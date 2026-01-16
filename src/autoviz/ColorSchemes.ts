// =============================================================================
// COLOR SCHEMES — Professional color palettes for charts
// =============================================================================

import type { ColorScheme } from './types';

// =============================================================================
// PREDEFINED COLOR SCHEMES
// =============================================================================

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  // Professional Blue
  professional: {
    name: 'Professional Blue',
    colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
    positive: '#059669',
    negative: '#dc2626',
    neutral: '#6b7280',
    highlight: '#f59e0b',
    background: '#ffffff',
    gridColor: '#e5e7eb',
    textColor: '#1f2937',
  },

  // Modern Gradient
  modern: {
    name: 'Modern Gradient',
    colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#9ca3af',
    highlight: '#fbbf24',
    background: '#ffffff',
    gridColor: '#f3f4f6',
    textColor: '#111827',
  },

  // Dark Mode
  dark: {
    name: 'Dark Mode',
    colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'],
    positive: '#34d399',
    negative: '#f87171',
    neutral: '#9ca3af',
    highlight: '#fbbf24',
    background: '#1f2937',
    gridColor: '#374151',
    textColor: '#f9fafb',
  },

  // Nature Green
  nature: {
    name: 'Nature Green',
    colors: ['#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'],
    positive: '#059669',
    negative: '#dc2626',
    neutral: '#6b7280',
    highlight: '#f59e0b',
    background: '#ffffff',
    gridColor: '#d1fae5',
    textColor: '#064e3b',
  },

  // Warm Sunset
  sunset: {
    name: 'Warm Sunset',
    colors: ['#b91c1c', '#dc2626', '#f87171', '#fb923c', '#fbbf24', '#fde047'],
    positive: '#16a34a',
    negative: '#dc2626',
    neutral: '#78716c',
    highlight: '#7c3aed',
    background: '#fffbeb',
    gridColor: '#fef3c7',
    textColor: '#78350f',
  },

  // Ocean Blue
  ocean: {
    name: 'Ocean Blue',
    colors: ['#0c4a6e', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
    positive: '#059669',
    negative: '#dc2626',
    neutral: '#64748b',
    highlight: '#f59e0b',
    background: '#f0f9ff',
    gridColor: '#e0f2fe',
    textColor: '#0c4a6e',
  },

  // Corporate Gray
  corporate: {
    name: 'Corporate Gray',
    colors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
    positive: '#059669',
    negative: '#dc2626',
    neutral: '#6b7280',
    highlight: '#2563eb',
    background: '#ffffff',
    gridColor: '#e5e7eb',
    textColor: '#1f2937',
  },

  // Vibrant
  vibrant: {
    name: 'Vibrant',
    colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#6b7280',
    highlight: '#06b6d4',
    background: '#ffffff',
    gridColor: '#f3f4f6',
    textColor: '#111827',
  },

  // Pastel
  pastel: {
    name: 'Pastel',
    colors: ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe'],
    positive: '#86efac',
    negative: '#fca5a5',
    neutral: '#d1d5db',
    highlight: '#fde047',
    background: '#ffffff',
    gridColor: '#f9fafb',
    textColor: '#374151',
  },

  // Monochrome
  monochrome: {
    name: 'Monochrome',
    colors: ['#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'],
    positive: '#111827',
    negative: '#6b7280',
    neutral: '#9ca3af',
    highlight: '#374151',
    background: '#ffffff',
    gridColor: '#e5e7eb',
    textColor: '#111827',
  },

  // Excel Classic
  excel: {
    name: 'Excel Classic',
    colors: ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'],
    positive: '#70ad47',
    negative: '#ed7d31',
    neutral: '#a5a5a5',
    highlight: '#ffc000',
    background: '#ffffff',
    gridColor: '#d9d9d9',
    textColor: '#000000',
  },

  // Financial
  financial: {
    name: 'Financial',
    colors: ['#1e3a5f', '#2d5986', '#3d78ad', '#4d97d4', '#5db6fb', '#8dcfff'],
    positive: '#00a86b',
    negative: '#dc143c',
    neutral: '#808080',
    highlight: '#ffd700',
    background: '#ffffff',
    gridColor: '#e8e8e8',
    textColor: '#1e3a5f',
  },
};

// =============================================================================
// COLOR SCHEME UTILITIES
// =============================================================================

/**
 * Get color scheme by name
 */
export function getColorScheme(name: string): ColorScheme {
  return COLOR_SCHEMES[name] || COLOR_SCHEMES.professional;
}

/**
 * Get all available color scheme names
 */
export function getColorSchemeNames(): string[] {
  return Object.keys(COLOR_SCHEMES);
}

/**
 * Get all color schemes as array
 */
export function getAllColorSchemes(): ColorScheme[] {
  return Object.values(COLOR_SCHEMES);
}

/**
 * Get color for a specific index in scheme
 */
export function getColorByIndex(scheme: ColorScheme, index: number): string {
  return scheme.colors[index % scheme.colors.length];
}

/**
 * Generate gradient colors between two colors
 */
export function generateGradient(
  startColor: string,
  endColor: string,
  steps: number
): string[] {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  if (!start || !end) return [startColor, endColor];

  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    colors.push(rgbToHex(r, g, b));
  }

  return colors;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Adjust color brightness
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value * (1 + percent / 100))));

  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

/**
 * Get contrasting text color (black or white)
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Create custom color scheme
 */
export function createColorScheme(
  name: string,
  baseColor: string,
  options: {
    steps?: number;
    isDark?: boolean;
  } = {}
): ColorScheme {
  const { steps = 6, isDark = false } = options;

  // Generate colors from base
  const colors = generateGradient(
    adjustBrightness(baseColor, isDark ? 20 : -40),
    adjustBrightness(baseColor, isDark ? -40 : 60),
    steps
  );

  return {
    name,
    colors,
    positive: '#059669',
    negative: '#dc2626',
    neutral: isDark ? '#9ca3af' : '#6b7280',
    highlight: '#f59e0b',
    background: isDark ? '#1f2937' : '#ffffff',
    gridColor: isDark ? '#374151' : '#e5e7eb',
    textColor: isDark ? '#f9fafb' : '#1f2937',
  };
}

/**
 * Get recommended scheme for chart type
 */
export function getRecommendedScheme(chartType: string): ColorScheme {
  switch (chartType) {
    case 'pie':
    case 'donut':
      return COLOR_SCHEMES.vibrant;
    case 'heatmap':
      return COLOR_SCHEMES.sunset;
    case 'line':
    case 'area':
      return COLOR_SCHEMES.professional;
    case 'bar':
    case 'column':
      return COLOR_SCHEMES.modern;
    case 'scatter':
    case 'bubble':
      return COLOR_SCHEMES.ocean;
    case 'funnel':
    case 'waterfall':
      return COLOR_SCHEMES.corporate;
    case 'gauge':
    case 'kpi':
      return COLOR_SCHEMES.financial;
    default:
      return COLOR_SCHEMES.professional;
  }
}

// =============================================================================
// CATEGORICAL COLOR PALETTES
// =============================================================================

export const CATEGORICAL_PALETTES = {
  // For 2-3 categories
  small: ['#3b82f6', '#ef4444', '#22c55e'],

  // For 4-6 categories
  medium: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'],

  // For 7-12 categories
  large: [
    '#3b82f6',
    '#ef4444',
    '#22c55e',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#84cc16',
    '#f97316',
    '#14b8a6',
    '#6366f1',
    '#a855f7',
  ],
};

/**
 * Get categorical palette based on number of categories
 */
export function getCategoricalPalette(categoryCount: number): string[] {
  if (categoryCount <= 3) return CATEGORICAL_PALETTES.small;
  if (categoryCount <= 6) return CATEGORICAL_PALETTES.medium;
  return CATEGORICAL_PALETTES.large;
}

// =============================================================================
// SEQUENTIAL COLOR PALETTES (for heatmaps, choropleth)
// =============================================================================

export const SEQUENTIAL_PALETTES = {
  blues: ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'],
  greens: ['#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a', '#166534'],
  reds: ['#fef2f2', '#fecaca', '#f87171', '#dc2626', '#991b1b'],
  oranges: ['#fff7ed', '#fed7aa', '#fb923c', '#ea580c', '#c2410c'],
  purples: ['#faf5ff', '#e9d5ff', '#c084fc', '#9333ea', '#6b21a8'],
};

/**
 * Get sequential palette by name
 */
export function getSequentialPalette(name: string): string[] {
  return (
    SEQUENTIAL_PALETTES[name as keyof typeof SEQUENTIAL_PALETTES] ||
    SEQUENTIAL_PALETTES.blues
  );
}

// =============================================================================
// DIVERGING COLOR PALETTES (for data with positive/negative values)
// =============================================================================

export const DIVERGING_PALETTES = {
  redBlue: ['#dc2626', '#f87171', '#fca5a5', '#ffffff', '#93c5fd', '#3b82f6', '#1d4ed8'],
  redGreen: ['#dc2626', '#f87171', '#fca5a5', '#ffffff', '#86efac', '#22c55e', '#15803d'],
  purpleOrange: ['#7c3aed', '#a78bfa', '#ddd6fe', '#ffffff', '#fed7aa', '#fb923c', '#ea580c'],
};

/**
 * Get diverging palette by name
 */
export function getDivergingPalette(name: string): string[] {
  return (
    DIVERGING_PALETTES[name as keyof typeof DIVERGING_PALETTES] ||
    DIVERGING_PALETTES.redBlue
  );
}

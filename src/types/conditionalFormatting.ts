// ============================================================
// CONDITIONAL FORMATTING TYPES
// ============================================================

// Rule Types
export type CFRuleType =
  | 'cellValue'      // Value-based rules
  | 'text'           // Text contains
  | 'date'           // Date occurring
  | 'duplicate'      // Duplicate/Unique values
  | 'topBottom'      // Top/Bottom N
  | 'aboveAverage'   // Above/Below average
  | 'dataBar'        // Data bars
  | 'colorScale'     // Color scales
  | 'iconSet'        // Icon sets
  | 'formula';       // Custom formula

// Operators for cell value rules
export type CFOperator =
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'equal'
  | 'notEqual'
  | 'between'
  | 'notBetween';

// Text operators
export type CFTextOperator =
  | 'contains'
  | 'notContains'
  | 'beginsWith'
  | 'endsWith';

// Date operators
export type CFDateOperator =
  | 'yesterday'
  | 'today'
  | 'tomorrow'
  | 'last7Days'
  | 'lastWeek'
  | 'thisWeek'
  | 'nextWeek'
  | 'lastMonth'
  | 'thisMonth'
  | 'nextMonth';

// Top/Bottom types
export type CFTopBottomType =
  | 'top'
  | 'bottom'
  | 'topPercent'
  | 'bottomPercent';

// Average types
export type CFAverageType =
  | 'above'
  | 'below'
  | 'equalOrAbove'
  | 'equalOrBelow'
  | 'stdDevAbove'
  | 'stdDevBelow';

// Base style for formatting
export interface CFStyle {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  border?: {
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
    width: number;
  };
}

// Data Bar configuration
export interface CFDataBar {
  minType: 'auto' | 'min' | 'number' | 'percent' | 'percentile';
  maxType: 'auto' | 'max' | 'number' | 'percent' | 'percentile';
  minValue?: number;
  maxValue?: number;
  fillType: 'gradient' | 'solid';
  positiveColor: string;
  negativeColor: string;
  borderColor?: string;
  showValue: boolean;
  direction: 'ltr' | 'rtl' | 'context';
  axisPosition: 'auto' | 'midpoint' | 'none';
  axisColor?: string;
}

// Color Scale configuration
export interface CFColorScale {
  type: '2-color' | '3-color';
  minType: 'min' | 'number' | 'percent' | 'percentile' | 'formula';
  midType?: 'number' | 'percent' | 'percentile' | 'formula';
  maxType: 'max' | 'number' | 'percent' | 'percentile' | 'formula';
  minValue?: number | string;
  midValue?: number | string;
  maxValue?: number | string;
  minColor: string;
  midColor?: string;
  maxColor: string;
}

// Icon Set configuration
export interface CFIconSet {
  iconStyle: string;  // e.g., '3Arrows', '4Arrows', '5Arrows', '3TrafficLights', etc.
  showValue: boolean;
  reverseOrder: boolean;
  thresholds: CFIconThreshold[];
}

export interface CFIconThreshold {
  type: 'number' | 'percent' | 'percentile' | 'formula';
  value: number | string;
  operator: '>=' | '>';
}

// Main Rule interface
export interface CFRule {
  id: string;
  type: CFRuleType;
  priority: number;
  range: string;           // e.g., "A1:D10"
  stopIfTrue: boolean;
  enabled: boolean;

  // Cell Value rules
  operator?: CFOperator;
  value1?: number | string;
  value2?: number | string; // For 'between'

  // Text rules
  textOperator?: CFTextOperator;
  text?: string;

  // Date rules
  dateOperator?: CFDateOperator;

  // Top/Bottom rules
  topBottomType?: CFTopBottomType;
  topBottomValue?: number;

  // Average rules
  averageType?: CFAverageType;
  stdDevMultiple?: number;

  // Duplicate rules
  duplicateType?: 'duplicate' | 'unique';

  // Formula rules
  formula?: string;

  // Visual formatting
  style?: CFStyle;
  dataBar?: CFDataBar;
  colorScale?: CFColorScale;
  iconSet?: CFIconSet;
}

// Preset definitions
export interface CFPreset {
  id: string;
  name: string;
  type: CFRuleType;
  preview: string;  // CSS or icon representation
  config: Partial<CFRule>;
}

// Data Bar Presets
export const DATA_BAR_PRESETS: CFPreset[] = [
  // Gradient fills
  { id: 'db-gradient-blue', name: 'Blue Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #5B9BD5 0%, #DEEBF7 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#5B9BD5', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-gradient-green', name: 'Green Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #70AD47 0%, #E2EFDA 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#70AD47', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-gradient-red', name: 'Red Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #FF6B6B 0%, #FFE6E6 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#FF6B6B', negativeColor: '#5B9BD5', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-gradient-orange', name: 'Orange Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #ED7D31 0%, #FCE4D6 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#ED7D31', negativeColor: '#5B9BD5', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-gradient-purple', name: 'Purple Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #7030A0 0%, #E4DFEC 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#7030A0', negativeColor: '#70AD47', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-gradient-cyan', name: 'Cyan Gradient', type: 'dataBar', preview: 'linear-gradient(90deg, #00B0F0 0%, #DEEAF6 100%)', config: { dataBar: { fillType: 'gradient', positiveColor: '#00B0F0', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  // Solid fills
  { id: 'db-solid-blue', name: 'Blue Solid', type: 'dataBar', preview: '#5B9BD5', config: { dataBar: { fillType: 'solid', positiveColor: '#5B9BD5', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-solid-green', name: 'Green Solid', type: 'dataBar', preview: '#70AD47', config: { dataBar: { fillType: 'solid', positiveColor: '#70AD47', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-solid-red', name: 'Red Solid', type: 'dataBar', preview: '#FF6B6B', config: { dataBar: { fillType: 'solid', positiveColor: '#FF6B6B', negativeColor: '#5B9BD5', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-solid-orange', name: 'Orange Solid', type: 'dataBar', preview: '#ED7D31', config: { dataBar: { fillType: 'solid', positiveColor: '#ED7D31', negativeColor: '#5B9BD5', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-solid-purple', name: 'Purple Solid', type: 'dataBar', preview: '#7030A0', config: { dataBar: { fillType: 'solid', positiveColor: '#7030A0', negativeColor: '#70AD47', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
  { id: 'db-solid-cyan', name: 'Cyan Solid', type: 'dataBar', preview: '#00B0F0', config: { dataBar: { fillType: 'solid', positiveColor: '#00B0F0', negativeColor: '#FF6B6B', showValue: true, minType: 'auto', maxType: 'auto', direction: 'ltr', axisPosition: 'auto' } } },
];

// Color Scale Presets
export const COLOR_SCALE_PRESETS: CFPreset[] = [
  // 2-color scales
  { id: 'cs-2-green-yellow', name: 'Green - Yellow', type: 'colorScale', preview: 'linear-gradient(90deg, #63BE7B 0%, #FFEB84 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#63BE7B', maxColor: '#FFEB84' } } },
  { id: 'cs-2-red-yellow', name: 'Red - Yellow', type: 'colorScale', preview: 'linear-gradient(90deg, #F8696B 0%, #FFEB84 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#F8696B', maxColor: '#FFEB84' } } },
  { id: 'cs-2-green-white', name: 'Green - White', type: 'colorScale', preview: 'linear-gradient(90deg, #63BE7B 0%, #FFFFFF 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#63BE7B', maxColor: '#FFFFFF' } } },
  { id: 'cs-2-red-white', name: 'Red - White', type: 'colorScale', preview: 'linear-gradient(90deg, #F8696B 0%, #FFFFFF 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#F8696B', maxColor: '#FFFFFF' } } },
  { id: 'cs-2-blue-white', name: 'Blue - White', type: 'colorScale', preview: 'linear-gradient(90deg, #5A8AC6 0%, #FFFFFF 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#5A8AC6', maxColor: '#FFFFFF' } } },
  { id: 'cs-2-white-red', name: 'White - Red', type: 'colorScale', preview: 'linear-gradient(90deg, #FFFFFF 0%, #F8696B 100%)', config: { colorScale: { type: '2-color', minType: 'min', maxType: 'max', minColor: '#FFFFFF', maxColor: '#F8696B' } } },
  // 3-color scales
  { id: 'cs-3-gyr', name: 'Green - Yellow - Red', type: 'colorScale', preview: 'linear-gradient(90deg, #63BE7B 0%, #FFEB84 50%, #F8696B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#63BE7B', midColor: '#FFEB84', maxColor: '#F8696B' } } },
  { id: 'cs-3-ryg', name: 'Red - Yellow - Green', type: 'colorScale', preview: 'linear-gradient(90deg, #F8696B 0%, #FFEB84 50%, #63BE7B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#F8696B', midColor: '#FFEB84', maxColor: '#63BE7B' } } },
  { id: 'cs-3-gwg', name: 'Green - White - Green', type: 'colorScale', preview: 'linear-gradient(90deg, #63BE7B 0%, #FFFFFF 50%, #63BE7B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#63BE7B', midColor: '#FFFFFF', maxColor: '#63BE7B' } } },
  { id: 'cs-3-rwr', name: 'Red - White - Red', type: 'colorScale', preview: 'linear-gradient(90deg, #F8696B 0%, #FFFFFF 50%, #F8696B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#F8696B', midColor: '#FFFFFF', maxColor: '#F8696B' } } },
  { id: 'cs-3-gwr', name: 'Green - White - Red', type: 'colorScale', preview: 'linear-gradient(90deg, #63BE7B 0%, #FFFFFF 50%, #F8696B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#63BE7B', midColor: '#FFFFFF', maxColor: '#F8696B' } } },
  { id: 'cs-3-rwg', name: 'Red - White - Green', type: 'colorScale', preview: 'linear-gradient(90deg, #F8696B 0%, #FFFFFF 50%, #63BE7B 100%)', config: { colorScale: { type: '3-color', minType: 'min', midType: 'percentile', maxType: 'max', midValue: 50, minColor: '#F8696B', midColor: '#FFFFFF', maxColor: '#63BE7B' } } },
];

// Icon Set Presets
export interface IconSetDefinition {
  id: string;
  name: string;
  category: 'directional' | 'shapes' | 'indicators' | 'ratings';
  icons: string[];  // SVG paths or emoji/unicode
  defaultThresholds: number[];
}

export const ICON_SET_DEFINITIONS: IconSetDefinition[] = [
  // Directional
  { id: '3Arrows', name: '3 Arrows', category: 'directional', icons: ['↑', '→', '↓'], defaultThresholds: [67, 33] },
  { id: '3ArrowsGray', name: '3 Arrows (Gray)', category: 'directional', icons: ['⬆', '➡', '⬇'], defaultThresholds: [67, 33] },
  { id: '4Arrows', name: '4 Arrows', category: 'directional', icons: ['↑', '↗', '↘', '↓'], defaultThresholds: [75, 50, 25] },
  { id: '4ArrowsGray', name: '4 Arrows (Gray)', category: 'directional', icons: ['⬆', '⬈', '⬊', '⬇'], defaultThresholds: [75, 50, 25] },
  { id: '5Arrows', name: '5 Arrows', category: 'directional', icons: ['↑', '↗', '→', '↘', '↓'], defaultThresholds: [80, 60, 40, 20] },
  { id: '5ArrowsGray', name: '5 Arrows (Gray)', category: 'directional', icons: ['⬆', '⬈', '➡', '⬊', '⬇'], defaultThresholds: [80, 60, 40, 20] },
  // Shapes
  { id: '3TrafficLights', name: '3 Traffic Lights', category: 'shapes', icons: ['🟢', '🟡', '🔴'], defaultThresholds: [67, 33] },
  { id: '3TrafficLightsRim', name: '3 Traffic Lights (Rim)', category: 'shapes', icons: ['🟢', '🟡', '🔴'], defaultThresholds: [67, 33] },
  { id: '3Signs', name: '3 Signs', category: 'shapes', icons: ['🔷', '🔶', '⬠'], defaultThresholds: [67, 33] },
  { id: '4TrafficLights', name: '4 Traffic Lights', category: 'shapes', icons: ['🟢', '🟡', '🟠', '🔴'], defaultThresholds: [75, 50, 25] },
  // Indicators
  { id: '3Symbols', name: '3 Symbols', category: 'indicators', icons: ['✔', '!', '✖'], defaultThresholds: [67, 33] },
  { id: '3Symbols2', name: '3 Symbols (Circled)', category: 'indicators', icons: ['✅', '⚠️', '❌'], defaultThresholds: [67, 33] },
  { id: '3Flags', name: '3 Flags', category: 'indicators', icons: ['🟢', '🟡', '🔴'], defaultThresholds: [67, 33] },
  // Ratings
  { id: '3Stars', name: '3 Stars', category: 'ratings', icons: ['★★★', '★★☆', '★☆☆'], defaultThresholds: [67, 33] },
  { id: '4Ratings', name: '4 Ratings', category: 'ratings', icons: ['◉◉◉◉', '◉◉◉○', '◉◉○○', '◉○○○'], defaultThresholds: [75, 50, 25] },
  { id: '5Ratings', name: '5 Ratings', category: 'ratings', icons: ['★★★★★', '★★★★☆', '★★★☆☆', '★★☆☆☆', '★☆☆☆☆'], defaultThresholds: [80, 60, 40, 20] },
  { id: '5Quarters', name: '5 Quarters', category: 'ratings', icons: ['●', '◕', '◑', '◔', '○'], defaultThresholds: [80, 60, 40, 20] },
];

// Highlight styles presets
export const HIGHLIGHT_STYLES: { name: string; style: CFStyle }[] = [
  { name: 'Light Red Fill with Dark Red Text', style: { backgroundColor: '#FFC7CE', textColor: '#9C0006' } },
  { name: 'Yellow Fill with Dark Yellow Text', style: { backgroundColor: '#FFEB9C', textColor: '#9C6500' } },
  { name: 'Green Fill with Dark Green Text', style: { backgroundColor: '#C6EFCE', textColor: '#006100' } },
  { name: 'Light Red Fill', style: { backgroundColor: '#FFC7CE' } },
  { name: 'Light Yellow Fill', style: { backgroundColor: '#FFEB9C' } },
  { name: 'Light Green Fill', style: { backgroundColor: '#C6EFCE' } },
  { name: 'Red Text', style: { textColor: '#9C0006' } },
  { name: 'Red Border', style: { border: { color: '#9C0006', style: 'solid', width: 1 } } },
  { name: 'Custom Format...', style: {} },
];

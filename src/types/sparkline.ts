// ============================================================
// SPARKLINE TYPE DEFINITIONS
// ============================================================

export type SparklineType = 'line' | 'column' | 'winloss';

export interface SparklineStyle {
  // Line style
  lineColor: string;
  lineWeight: number;

  // Column style
  columnColor: string;
  negativeColor: string;

  // Markers (for line sparklines)
  showMarkers: boolean;
  markerColor: string;
  showHighPoint: boolean;
  highPointColor: string;
  showLowPoint: boolean;
  lowPointColor: string;
  showFirstPoint: boolean;
  firstPointColor: string;
  showLastPoint: boolean;
  lastPointColor: string;
  showNegativePoints: boolean;
  negativePointColor: string;

  // Win/Loss colors
  winColor: string;
  lossColor: string;

  // Axis
  showAxis: boolean;
  axisColor: string;
}

export interface Sparkline {
  id: string;
  sheetId: string;
  type: SparklineType;

  // Data source
  dataRange: string;        // e.g., "B2:B10"

  // Location (cell where sparkline is displayed)
  locationCell: string;     // e.g., "A2"
  locationRow: number;
  locationCol: number;

  // Style
  style: SparklineStyle;

  // Options
  minValue?: number;        // Custom min (auto if undefined)
  maxValue?: number;        // Custom max (auto if undefined)
  rightToLeft: boolean;
  dateAxis: boolean;

  // Grouping
  groupId?: string;         // For grouped sparklines
}

export interface SparklineGroup {
  id: string;
  sparklineIds: string[];
  sharedStyle: boolean;
}

export const DEFAULT_SPARKLINE_STYLE: SparklineStyle = {
  // Line
  lineColor: '#2563eb',
  lineWeight: 1.5,

  // Column
  columnColor: '#2563eb',
  negativeColor: '#dc2626',

  // Markers
  showMarkers: false,
  markerColor: '#2563eb',
  showHighPoint: false,
  highPointColor: '#16a34a',
  showLowPoint: false,
  lowPointColor: '#dc2626',
  showFirstPoint: false,
  firstPointColor: '#f59e0b',
  showLastPoint: false,
  lastPointColor: '#f59e0b',
  showNegativePoints: true,
  negativePointColor: '#dc2626',

  // Win/Loss
  winColor: '#2563eb',
  lossColor: '#dc2626',

  // Axis
  showAxis: false,
  axisColor: '#9ca3af',
};

export const SPARKLINE_PRESETS: Record<string, Partial<SparklineStyle>> = {
  blue: {
    lineColor: '#2563eb',
    columnColor: '#2563eb',
    markerColor: '#2563eb',
    winColor: '#2563eb',
  },
  green: {
    lineColor: '#16a34a',
    columnColor: '#16a34a',
    markerColor: '#16a34a',
    winColor: '#16a34a',
  },
  orange: {
    lineColor: '#f59e0b',
    columnColor: '#f59e0b',
    markerColor: '#f59e0b',
    winColor: '#f59e0b',
  },
  red: {
    lineColor: '#dc2626',
    columnColor: '#dc2626',
    markerColor: '#dc2626',
    winColor: '#dc2626',
  },
  purple: {
    lineColor: '#9333ea',
    columnColor: '#9333ea',
    markerColor: '#9333ea',
    winColor: '#9333ea',
  },
};

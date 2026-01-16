// ============================================================
// SHAPE TYPE DEFINITIONS
// ============================================================

export type ShapeCategory =
  | 'lines'
  | 'rectangles'
  | 'basicShapes'
  | 'blockArrows'
  | 'flowchart'
  | 'callouts'
  | 'stars';

export interface ShapeDefinition {
  id: string;
  name: string;
  category: ShapeCategory;
  path: string;           // SVG path data
  viewBox: string;        // SVG viewBox
  defaultWidth: number;
  defaultHeight: number;
  isLine?: boolean;       // For line-type shapes
  hasText?: boolean;      // Can contain text
}

export interface ShapeStyle {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface ShapeTextStyle {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface ShapeObject {
  id: string;
  shapeId: string;        // Reference to ShapeDefinition.id
  sheetId: string;

  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;       // Degrees

  // Style
  style: ShapeStyle;

  // Text (optional)
  textStyle?: ShapeTextStyle;

  // State
  locked: boolean;
  hidden: boolean;
  zIndex: number;

  // Metadata
  name?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ShapeSelection {
  shapeId: string | null;
  isResizing: boolean;
  isRotating: boolean;
  isDragging: boolean;
  resizeHandle: ResizeHandle | null;
}

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se'
  | 'rotate';

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fill: '#4285F4',
  fillOpacity: 1,
  stroke: '#1a73e8',
  strokeWidth: 2,
};

export const DEFAULT_TEXT_STYLE: ShapeTextStyle = {
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  align: 'center',
  verticalAlign: 'middle',
};

export const CATEGORY_LABELS: Record<ShapeCategory, string> = {
  lines: 'Lines',
  rectangles: 'Rectangles',
  basicShapes: 'Basic Shapes',
  blockArrows: 'Block Arrows',
  flowchart: 'Flowchart',
  callouts: 'Callouts',
  stars: 'Stars & Banners',
};

export const CATEGORY_ORDER: ShapeCategory[] = [
  'lines',
  'rectangles',
  'basicShapes',
  'blockArrows',
  'flowchart',
  'callouts',
  'stars',
];

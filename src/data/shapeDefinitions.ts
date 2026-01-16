// ============================================================
// SHAPE DEFINITIONS — 46 SHAPES
// ============================================================

import { ShapeDefinition, ShapeCategory } from '../types/shapes';

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  // ═══════════════════════════════════════════════════════════
  // LINES (5)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'line',
    name: 'Line',
    category: 'lines',
    path: 'M0,50 L100,50',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 2,
    isLine: true,
  },
  {
    id: 'line-arrow',
    name: 'Arrow',
    category: 'lines',
    path: 'M0,50 L85,50 M70,35 L85,50 L70,65',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 30,
    isLine: true,
  },
  {
    id: 'line-double-arrow',
    name: 'Double Arrow',
    category: 'lines',
    path: 'M15,50 L85,50 M15,35 L0,50 L15,65 M85,35 L100,50 L85,65',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 30,
    isLine: true,
  },
  {
    id: 'line-elbow',
    name: 'Elbow Connector',
    category: 'lines',
    path: 'M0,20 L50,20 L50,80 L100,80',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 80,
    isLine: true,
  },
  {
    id: 'line-curve',
    name: 'Curved Connector',
    category: 'lines',
    path: 'M0,50 Q50,0 100,50',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 60,
    isLine: true,
  },

  // ═══════════════════════════════════════════════════════════
  // RECTANGLES (5)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'rectangle',
    name: 'Rectangle',
    category: 'rectangles',
    path: 'M0,0 H100 V100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'rounded-rectangle',
    name: 'Rounded Rectangle',
    category: 'rectangles',
    path: 'M15,0 H85 A15,15 0 0,1 100,15 V85 A15,15 0 0,1 85,100 H15 A15,15 0 0,1 0,85 V15 A15,15 0 0,1 15,0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'snip-rectangle',
    name: 'Snip Rectangle',
    category: 'rectangles',
    path: 'M15,0 H100 V85 L85,100 H0 V15 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'round-single-corner',
    name: 'Round Single Corner',
    category: 'rectangles',
    path: 'M0,0 H85 A15,15 0 0,1 100,15 V100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'frame',
    name: 'Frame',
    category: 'rectangles',
    path: 'M0,0 H100 V100 H0 Z M10,10 V90 H90 V10 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 150,
    hasText: true,
  },

  // ═══════════════════════════════════════════════════════════
  // BASIC SHAPES (10)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'oval',
    name: 'Oval',
    category: 'basicShapes',
    path: 'M50,0 A50,50 0 1,1 50,100 A50,50 0 1,1 50,0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'basicShapes',
    path: 'M50,0 L100,100 L0,100 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'right-triangle',
    name: 'Right Triangle',
    category: 'basicShapes',
    path: 'M0,0 L100,100 L0,100 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'basicShapes',
    path: 'M50,0 L100,50 L50,100 L0,50 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 100,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'parallelogram',
    name: 'Parallelogram',
    category: 'basicShapes',
    path: 'M25,0 H100 L75,100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    category: 'basicShapes',
    path: 'M20,0 H80 L100,100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    category: 'basicShapes',
    path: 'M50,0 L100,38 L81,100 L19,100 L0,38 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 110,
    defaultHeight: 110,
    hasText: true,
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'basicShapes',
    path: 'M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'octagon',
    name: 'Octagon',
    category: 'basicShapes',
    path: 'M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 110,
    defaultHeight: 110,
    hasText: true,
  },
  {
    id: 'cross',
    name: 'Cross',
    category: 'basicShapes',
    path: 'M35,0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 100,
    defaultHeight: 100,
    hasText: true,
  },

  // ═══════════════════════════════════════════════════════════
  // BLOCK ARROWS (8)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'arrow-right',
    name: 'Right Arrow',
    category: 'blockArrows',
    path: 'M0,30 H60 V10 L100,50 L60,90 V70 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'arrow-left',
    name: 'Left Arrow',
    category: 'blockArrows',
    path: 'M100,30 H40 V10 L0,50 L40,90 V70 H100 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'arrow-up',
    name: 'Up Arrow',
    category: 'blockArrows',
    path: 'M30,100 V40 H10 L50,0 L90,40 H70 V100 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 80,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'arrow-down',
    name: 'Down Arrow',
    category: 'blockArrows',
    path: 'M30,0 V60 H10 L50,100 L90,60 H70 V0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 80,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'arrow-left-right',
    name: 'Left-Right Arrow',
    category: 'blockArrows',
    path: 'M0,50 L20,25 V40 H80 V25 L100,50 L80,75 V60 H20 V75 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 180,
    defaultHeight: 60,
    hasText: true,
  },
  {
    id: 'arrow-up-down',
    name: 'Up-Down Arrow',
    category: 'blockArrows',
    path: 'M50,0 L75,20 H60 V80 H75 L50,100 L25,80 H40 V20 H25 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 60,
    defaultHeight: 150,
    hasText: true,
  },
  {
    id: 'arrow-quad',
    name: 'Quad Arrow',
    category: 'blockArrows',
    path: 'M50,0 L65,15 H55 V45 H85 V35 L100,50 L85,65 V55 H55 V85 H65 L50,100 L35,85 H45 V55 H15 V65 L0,50 L15,35 V45 H45 V15 H35 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'chevron',
    name: 'Chevron',
    category: 'blockArrows',
    path: 'M0,0 L75,0 L100,50 L75,100 L0,100 L25,50 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 80,
    hasText: true,
  },

  // ═══════════════════════════════════════════════════════════
  // FLOWCHART (8)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'flow-process',
    name: 'Process',
    category: 'flowchart',
    path: 'M0,0 H100 V100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'flow-decision',
    name: 'Decision',
    category: 'flowchart',
    path: 'M50,0 L100,50 L50,100 L0,50 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'flow-terminator',
    name: 'Terminator',
    category: 'flowchart',
    path: 'M25,0 H75 A25,50 0 0,1 75,100 H25 A25,50 0 0,1 25,0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 60,
    hasText: true,
  },
  {
    id: 'flow-data',
    name: 'Data',
    category: 'flowchart',
    path: 'M20,0 H100 L80,100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'flow-document',
    name: 'Document',
    category: 'flowchart',
    path: 'M0,0 H100 V85 C75,85 75,100 50,100 C25,100 25,85 0,85 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'flow-predefined',
    name: 'Predefined Process',
    category: 'flowchart',
    path: 'M0,0 H100 V100 H0 Z M12,0 V100 M88,0 V100',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },
  {
    id: 'flow-manual-input',
    name: 'Manual Input',
    category: 'flowchart',
    path: 'M0,20 L100,0 V100 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 90,
    hasText: true,
  },
  {
    id: 'flow-preparation',
    name: 'Preparation',
    category: 'flowchart',
    path: 'M20,0 H80 L100,50 L80,100 H20 L0,50 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 150,
    defaultHeight: 80,
    hasText: true,
  },

  // ═══════════════════════════════════════════════════════════
  // CALLOUTS (4)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'callout-rectangle',
    name: 'Rectangular Callout',
    category: 'callouts',
    path: 'M0,0 H100 V65 H45 L25,100 L35,65 H0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 180,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'callout-rounded',
    name: 'Rounded Callout',
    category: 'callouts',
    path: 'M10,0 H90 A10,10 0 0,1 100,10 V55 A10,10 0 0,1 90,65 H45 L25,100 L35,65 H10 A10,10 0 0,1 0,55 V10 A10,10 0 0,1 10,0 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 180,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'callout-oval',
    name: 'Oval Callout',
    category: 'callouts',
    path: 'M50,0 A50,32 0 1,1 50,64 A50,32 0 1,1 50,0 Z M38,55 L20,100 L48,60',
    viewBox: '0 0 100 100',
    defaultWidth: 180,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'callout-cloud',
    name: 'Cloud Callout',
    category: 'callouts',
    path: 'M25,55 Q0,55 8,35 Q0,15 25,18 Q32,0 50,8 Q68,0 78,18 Q100,15 95,35 Q100,55 75,55 Q78,70 65,68 L45,95 L50,68 Q25,70 25,55 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 200,
    defaultHeight: 130,
    hasText: true,
  },

  // ═══════════════════════════════════════════════════════════
  // STARS & BANNERS (6)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'star-4',
    name: '4-Point Star',
    category: 'stars',
    path: 'M50,0 L62,38 L100,50 L62,62 L50,100 L38,62 L0,50 L38,38 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 100,
    defaultHeight: 100,
    hasText: true,
  },
  {
    id: 'star-5',
    name: '5-Point Star',
    category: 'stars',
    path: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 110,
    defaultHeight: 105,
    hasText: true,
  },
  {
    id: 'star-6',
    name: '6-Point Star',
    category: 'stars',
    path: 'M50,0 L62,25 L100,25 L75,50 L100,75 L62,75 L50,100 L38,75 L0,75 L25,50 L0,25 L38,25 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 110,
    defaultHeight: 110,
    hasText: true,
  },
  {
    id: 'explosion-1',
    name: 'Explosion 1',
    category: 'stars',
    path: 'M50,0 L55,25 L80,8 L65,32 L100,38 L70,50 L98,68 L62,62 L75,95 L50,68 L25,95 L38,62 L2,68 L30,50 L0,38 L35,32 L20,8 L45,25 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 120,
    defaultHeight: 120,
    hasText: true,
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'stars',
    path: 'M50,88 C20,60 0,40 0,25 A25,25 0 0,1 50,25 A25,25 0 0,1 100,25 C100,40 80,60 50,88 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 100,
    defaultHeight: 95,
    hasText: true,
  },
  {
    id: 'ribbon',
    name: 'Ribbon Banner',
    category: 'stars',
    path: 'M0,25 L15,35 L15,15 L85,15 L85,35 L100,25 L100,75 L85,65 L85,85 L15,85 L15,65 L0,75 Z',
    viewBox: '0 0 100 100',
    defaultWidth: 180,
    defaultHeight: 70,
    hasText: true,
  },
];

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

export const getShapeById = (id: string): ShapeDefinition | undefined => {
  return SHAPE_DEFINITIONS.find(s => s.id === id);
};

export const getShapesByCategory = (category: ShapeCategory): ShapeDefinition[] => {
  return SHAPE_DEFINITIONS.filter(s => s.category === category);
};

export const SHAPES_BY_CATEGORY: Record<ShapeCategory, ShapeDefinition[]> = {
  lines: getShapesByCategory('lines'),
  rectangles: getShapesByCategory('rectangles'),
  basicShapes: getShapesByCategory('basicShapes'),
  blockArrows: getShapesByCategory('blockArrows'),
  flowchart: getShapesByCategory('flowchart'),
  callouts: getShapesByCategory('callouts'),
  stars: getShapesByCategory('stars'),
};

// Recent shapes (for quick access)
export const getRecentShapes = (recentIds: string[]): ShapeDefinition[] => {
  return recentIds
    .map(id => getShapeById(id))
    .filter((s): s is ShapeDefinition => s !== undefined);
};

// Shape presets for fill colors
export const SHAPE_FILL_PRESETS = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#FF6D01',
  '#46BDC6', '#7BAAF7', '#F07B72', '#FDD663', '#81C995',
  '#1A73E8', '#D93025', '#F9AB00', '#188038', '#E37400',
  '#FFFFFF', '#F8F9FA', '#E8EAED', '#9AA0A6', '#202124',
];

// Shape presets for stroke colors
export const SHAPE_STROKE_PRESETS = [
  '#1A73E8', '#C5221F', '#E37400', '#137333', '#C26401',
  '#007B83', '#4285F4', '#EA4335', '#FBBC04', '#34A853',
  '#5F6368', '#80868B', '#9AA0A6', '#BDC1C6', '#202124',
];

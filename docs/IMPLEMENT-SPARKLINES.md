# ✨ IMPLEMENTATION GUIDE: Sparklines
## ExcelAI — Mini Charts in Cells

---

## 🎯 Overview

| Feature | Est. Time | Files | Impact |
|---------|-----------|-------|--------|
| Sparklines | 1 day | 5 | +0.5% |

**Sparkline Types:**
- Line Sparkline
- Column Sparkline
- Win/Loss Sparkline

---

## 📁 Files to Create

```
src/
├── types/
│   └── sparkline.ts             # Sparkline type definitions
├── stores/
│   └── sparklineStore.ts        # Zustand store for sparklines
├── components/
│   └── Sparklines/
│       ├── index.ts
│       ├── SparklineRenderer.tsx
│       ├── SparklineDialog.tsx
│       └── Sparklines.css
```

---

## 📄 File 1: `src/types/sparkline.ts`

```typescript
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

export const SPARKLINE_PRESETS = {
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
```

---

## 📄 File 2: `src/stores/sparklineStore.ts`

```typescript
// ============================================================
// SPARKLINE STORE — Zustand Store for Sparkline Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  Sparkline,
  SparklineType,
  SparklineStyle,
  SparklineGroup,
  DEFAULT_SPARKLINE_STYLE,
} from '../types/sparkline';

interface SparklineStore {
  // State
  sparklines: Record<string, Sparkline[]>;  // sheetId -> sparklines
  groups: Record<string, SparklineGroup>;
  
  // CRUD
  addSparkline: (
    sheetId: string,
    type: SparklineType,
    dataRange: string,
    locationCell: string,
    row: number,
    col: number
  ) => string;
  updateSparkline: (sheetId: string, id: string, updates: Partial<Sparkline>) => void;
  deleteSparkline: (sheetId: string, id: string) => void;
  
  // Batch operations
  addSparklineRange: (
    sheetId: string,
    type: SparklineType,
    dataRanges: string[],
    locationCells: { cell: string; row: number; col: number }[]
  ) => string[];
  deleteSparklineRange: (sheetId: string, ids: string[]) => void;
  
  // Style
  updateSparklineStyle: (sheetId: string, id: string, style: Partial<SparklineStyle>) => void;
  applyStyleToGroup: (groupId: string, style: Partial<SparklineStyle>) => void;
  
  // Grouping
  createGroup: (sparklineIds: string[]) => string;
  ungroupSparklines: (groupId: string) => void;
  
  // Getters
  getSparklinesForSheet: (sheetId: string) => Sparkline[];
  getSparklineAtCell: (sheetId: string, row: number, col: number) => Sparkline | undefined;
  getSparklineById: (sheetId: string, id: string) => Sparkline | undefined;
  
  // Clear
  clearSparklinesForSheet: (sheetId: string) => void;
}

// Parse cell reference to row/col
const parseCell = (cell: string): { row: number; col: number } => {
  const match = cell.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 0, col: 0 };
  
  const colStr = match[1].toUpperCase();
  const row = parseInt(match[2]) - 1;
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  col -= 1;
  
  return { row, col };
};

export const useSparklineStore = create<SparklineStore>()(
  persist(
    (set, get) => ({
      sparklines: {},
      groups: {},

      addSparkline: (sheetId, type, dataRange, locationCell, row, col) => {
        const id = nanoid(8);
        
        const newSparkline: Sparkline = {
          id,
          sheetId,
          type,
          dataRange,
          locationCell,
          locationRow: row,
          locationCol: col,
          style: { ...DEFAULT_SPARKLINE_STYLE },
          rightToLeft: false,
          dateAxis: false,
        };

        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [...(state.sparklines[sheetId] || []), newSparkline],
          },
        }));

        return id;
      },

      updateSparkline: (sheetId, id, updates) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).map(sp =>
              sp.id === id ? { ...sp, ...updates } : sp
            ),
          },
        }));
      },

      deleteSparkline: (sheetId, id) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).filter(sp => sp.id !== id),
          },
        }));
      },

      addSparklineRange: (sheetId, type, dataRanges, locationCells) => {
        const ids: string[] = [];
        const groupId = nanoid(8);
        
        const newSparklines: Sparkline[] = dataRanges.map((dataRange, i) => {
          const id = nanoid(8);
          ids.push(id);
          
          return {
            id,
            sheetId,
            type,
            dataRange,
            locationCell: locationCells[i].cell,
            locationRow: locationCells[i].row,
            locationCol: locationCells[i].col,
            style: { ...DEFAULT_SPARKLINE_STYLE },
            rightToLeft: false,
            dateAxis: false,
            groupId,
          };
        });

        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [...(state.sparklines[sheetId] || []), ...newSparklines],
          },
          groups: {
            ...state.groups,
            [groupId]: {
              id: groupId,
              sparklineIds: ids,
              sharedStyle: true,
            },
          },
        }));

        return ids;
      },

      deleteSparklineRange: (sheetId, ids) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).filter(
              sp => !ids.includes(sp.id)
            ),
          },
        }));
      },

      updateSparklineStyle: (sheetId, id, style) => {
        const sparkline = get().getSparklineById(sheetId, id);
        if (!sparkline) return;

        get().updateSparkline(sheetId, id, {
          style: { ...sparkline.style, ...style },
        });
      },

      applyStyleToGroup: (groupId, style) => {
        const group = get().groups[groupId];
        if (!group) return;

        // Find all sparklines in group and update their styles
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sp.groupId === groupId) {
              get().updateSparklineStyle(sheetId, sp.id, style);
            }
          });
        });
      },

      createGroup: (sparklineIds) => {
        const groupId = nanoid(8);
        
        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              id: groupId,
              sparklineIds,
              sharedStyle: true,
            },
          },
        }));

        // Update sparklines with group ID
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sparklineIds.includes(sp.id)) {
              get().updateSparkline(sheetId, sp.id, { groupId });
            }
          });
        });

        return groupId;
      },

      ungroupSparklines: (groupId) => {
        const group = get().groups[groupId];
        if (!group) return;

        // Remove group ID from sparklines
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sp.groupId === groupId) {
              get().updateSparkline(sheetId, sp.id, { groupId: undefined });
            }
          });
        });

        // Remove group
        set(state => {
          const { [groupId]: _, ...rest } = state.groups;
          return { groups: rest };
        });
      },

      getSparklinesForSheet: (sheetId) => {
        return get().sparklines[sheetId] || [];
      },

      getSparklineAtCell: (sheetId, row, col) => {
        return (get().sparklines[sheetId] || []).find(
          sp => sp.locationRow === row && sp.locationCol === col
        );
      },

      getSparklineById: (sheetId, id) => {
        return (get().sparklines[sheetId] || []).find(sp => sp.id === id);
      },

      clearSparklinesForSheet: (sheetId) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [],
          },
        }));
      },
    }),
    {
      name: 'excelai-sparklines',
      partialize: (state) => ({
        sparklines: state.sparklines,
        groups: state.groups,
      }),
    }
  )
);

export default useSparklineStore;
```

---

## 📄 File 3: `src/components/Sparklines/SparklineRenderer.tsx`

```tsx
// ============================================================
// SPARKLINE RENDERER — Renders sparklines in cells
// ============================================================

import React, { useMemo } from 'react';
import { Sparkline, SparklineType } from '../../types/sparkline';
import { useWorkbookStore } from '../../stores/workbookStore';
import './Sparklines.css';

interface SparklineRendererProps {
  sparkline: Sparkline;
  width: number;
  height: number;
}

export const SparklineRenderer: React.FC<SparklineRendererProps> = ({
  sparkline,
  width,
  height,
}) => {
  const { getCellValue } = useWorkbookStore();

  // Parse data range and get values
  const data = useMemo(() => {
    const values: number[] = [];
    const range = sparkline.dataRange;
    
    // Parse range like "B2:B10" or "B2:H2"
    const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!match) return values;
    
    const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(match[2]) - 1;
    const endCol = match[3].toUpperCase().charCodeAt(0) - 65;
    const endRow = parseInt(match[4]) - 1;
    
    // Determine if horizontal or vertical range
    if (startRow === endRow) {
      // Horizontal range
      for (let col = startCol; col <= endCol; col++) {
        const val = getCellValue(sparkline.sheetId, startRow, col);
        const num = parseFloat(String(val));
        if (!isNaN(num)) values.push(num);
      }
    } else {
      // Vertical range
      for (let row = startRow; row <= endRow; row++) {
        const val = getCellValue(sparkline.sheetId, row, startCol);
        const num = parseFloat(String(val));
        if (!isNaN(num)) values.push(num);
      }
    }
    
    return sparkline.rightToLeft ? values.reverse() : values;
  }, [sparkline, getCellValue]);

  // Calculate min/max
  const { min, max, range: valueRange } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 1, range: 1 };
    
    const dataMin = sparkline.minValue ?? Math.min(...data);
    const dataMax = sparkline.maxValue ?? Math.max(...data);
    const range = dataMax - dataMin || 1;
    
    return { min: dataMin, max: dataMax, range };
  }, [data, sparkline.minValue, sparkline.maxValue]);

  // Normalize value to 0-1 range
  const normalize = (value: number): number => {
    return (value - min) / valueRange;
  };

  // Padding
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length === 0) {
    return <div className="sparkline-empty" />;
  }

  // Render based on type
  switch (sparkline.type) {
    case 'line':
      return renderLineSparkline();
    case 'column':
      return renderColumnSparkline();
    case 'winloss':
      return renderWinLossSparkline();
    default:
      return null;
  }

  function renderLineSparkline() {
    const { style } = sparkline;
    const points: string[] = [];
    const markerPoints: { x: number; y: number; color: string }[] = [];
    
    data.forEach((value, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding + (1 - normalize(value)) * chartHeight;
      points.push(`${x},${y}`);
      
      // Determine marker color
      let markerColor: string | null = null;
      
      if (style.showMarkers) {
        markerColor = style.markerColor;
      }
      if (style.showHighPoint && value === Math.max(...data)) {
        markerColor = style.highPointColor;
      }
      if (style.showLowPoint && value === Math.min(...data)) {
        markerColor = style.lowPointColor;
      }
      if (style.showFirstPoint && i === 0) {
        markerColor = style.firstPointColor;
      }
      if (style.showLastPoint && i === data.length - 1) {
        markerColor = style.lastPointColor;
      }
      if (style.showNegativePoints && value < 0) {
        markerColor = style.negativePointColor;
      }
      
      if (markerColor) {
        markerPoints.push({ x, y, color: markerColor });
      }
    });

    return (
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Axis */}
        {style.showAxis && min < 0 && max > 0 && (
          <line
            x1={padding}
            y1={padding + normalize(0) * chartHeight}
            x2={width - padding}
            y2={padding + normalize(0) * chartHeight}
            stroke={style.axisColor}
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        )}
        
        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={style.lineColor}
          strokeWidth={style.lineWeight}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Markers */}
        {markerPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={point.color}
          />
        ))}
      </svg>
    );
  }

  function renderColumnSparkline() {
    const { style } = sparkline;
    const barWidth = Math.max(2, (chartWidth / data.length) - 2);
    const gap = 1;
    
    // Calculate zero line position
    const zeroY = min >= 0 ? chartHeight : (max <= 0 ? 0 : normalize(0) * chartHeight);

    return (
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Axis */}
        {style.showAxis && min < 0 && max > 0 && (
          <line
            x1={padding}
            y1={padding + (1 - normalize(0)) * chartHeight}
            x2={width - padding}
            y2={padding + (1 - normalize(0)) * chartHeight}
            stroke={style.axisColor}
            strokeWidth="1"
          />
        )}
        
        {/* Bars */}
        {data.map((value, i) => {
          const x = padding + (i / data.length) * chartWidth + gap;
          const normalizedValue = normalize(value);
          const isNegative = value < 0;
          
          let barHeight: number;
          let barY: number;
          
          if (min >= 0) {
            // All positive
            barHeight = normalizedValue * chartHeight;
            barY = padding + chartHeight - barHeight;
          } else if (max <= 0) {
            // All negative
            barHeight = (1 - normalizedValue) * chartHeight;
            barY = padding;
          } else {
            // Mixed
            const zeroNormalized = normalize(0);
            if (value >= 0) {
              barHeight = (normalizedValue - zeroNormalized) * chartHeight;
              barY = padding + (1 - normalizedValue) * chartHeight;
            } else {
              barHeight = (zeroNormalized - normalizedValue) * chartHeight;
              barY = padding + (1 - zeroNormalized) * chartHeight;
            }
          }
          
          return (
            <rect
              key={i}
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(1, barHeight)}
              fill={isNegative ? style.negativeColor : style.columnColor}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  function renderWinLossSparkline() {
    const { style } = sparkline;
    const barWidth = Math.max(2, (chartWidth / data.length) - 2);
    const gap = 1;
    const halfHeight = chartHeight / 2;

    return (
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        {/* Center line */}
        <line
          x1={padding}
          y1={padding + halfHeight}
          x2={width - padding}
          y2={padding + halfHeight}
          stroke={style.axisColor}
          strokeWidth="1"
        />
        
        {/* Win/Loss bars */}
        {data.map((value, i) => {
          const x = padding + (i / data.length) * chartWidth + gap;
          const isWin = value > 0;
          const isLoss = value < 0;
          const barHeight = halfHeight - 4;
          
          if (value === 0) return null;
          
          return (
            <rect
              key={i}
              x={x}
              y={isWin ? padding + 2 : padding + halfHeight + 2}
              width={barWidth}
              height={barHeight}
              fill={isWin ? style.winColor : style.lossColor}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }
};

export default SparklineRenderer;
```

---

## 📄 File 4: `src/components/Sparklines/SparklineDialog.tsx`

```tsx
// ============================================================
// SPARKLINE DIALOG — Insert/Edit Sparklines
// ============================================================

import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  BarChart3, 
  Activity,
} from 'lucide-react';
import { useSparklineStore } from '../../stores/sparklineStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { 
  SparklineType, 
  DEFAULT_SPARKLINE_STYLE,
  SPARKLINE_PRESETS,
} from '../../types/sparkline';
import { SparklineRenderer } from './SparklineRenderer';
import './Sparklines.css';

interface SparklineDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
  initialType?: SparklineType;
}

export const SparklineDialog: React.FC<SparklineDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
  initialType = 'line',
}) => {
  const [type, setType] = useState<SparklineType>(initialType);
  const [dataRange, setDataRange] = useState('');
  const [locationRange, setLocationRange] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [showMarkers, setShowMarkers] = useState(false);
  const [showHighLow, setShowHighLow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addSparkline, addSparklineRange } = useSparklineStore();
  const { selection } = useWorkbookStore();

  // Auto-fill location from selection
  React.useEffect(() => {
    if (selection && isOpen) {
      const startCol = String.fromCharCode(65 + selection.start.col);
      const startRow = selection.start.row + 1;
      const endCol = String.fromCharCode(65 + selection.end.col);
      const endRow = selection.end.row + 1;
      
      if (selection.start.row === selection.end.row && selection.start.col === selection.end.col) {
        setLocationRange(`${startCol}${startRow}`);
      } else {
        setLocationRange(`${startCol}${startRow}:${endCol}${endRow}`);
      }
    }
  }, [selection, isOpen]);

  const handleInsert = () => {
    setError(null);

    // Validate inputs
    if (!dataRange.trim()) {
      setError('Please enter a data range.');
      return;
    }
    if (!locationRange.trim()) {
      setError('Please enter a location range.');
      return;
    }

    // Parse location range
    const locMatch = locationRange.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
    if (!locMatch) {
      setError('Invalid location range format. Use format like A1 or A1:A5');
      return;
    }

    const startCol = locMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(locMatch[2]) - 1;
    const endCol = locMatch[3] ? locMatch[3].toUpperCase().charCodeAt(0) - 65 : startCol;
    const endRow = locMatch[4] ? parseInt(locMatch[4]) - 1 : startRow;

    // Get style based on color preset
    const colorPreset = SPARKLINE_PRESETS[selectedColor as keyof typeof SPARKLINE_PRESETS] || SPARKLINE_PRESETS.blue;
    const style = {
      ...DEFAULT_SPARKLINE_STYLE,
      ...colorPreset,
      showMarkers,
      showHighPoint: showHighLow,
      showLowPoint: showHighLow,
    };

    // Single sparkline or multiple
    if (startRow === endRow && startCol === endCol) {
      // Single sparkline
      addSparkline(
        sheetId,
        type,
        dataRange.toUpperCase(),
        locationRange.toUpperCase(),
        startRow,
        startCol
      );
    } else {
      // Multiple sparklines - parse data ranges for each
      const dataRanges: string[] = [];
      const locations: { cell: string; row: number; col: number }[] = [];
      
      // Determine if vertical or horizontal range
      if (startCol === endCol) {
        // Vertical range of sparklines
        for (let row = startRow; row <= endRow; row++) {
          // Assume data is in adjacent columns
          const dataRangeForRow = dataRange.replace(/(\d+)/g, String(row + 1));
          dataRanges.push(dataRangeForRow.toUpperCase());
          locations.push({
            cell: `${String.fromCharCode(65 + startCol)}${row + 1}`,
            row,
            col: startCol,
          });
        }
      } else {
        // Horizontal range of sparklines
        for (let col = startCol; col <= endCol; col++) {
          const colLetter = String.fromCharCode(65 + col);
          dataRanges.push(dataRange.toUpperCase());
          locations.push({
            cell: `${colLetter}${startRow + 1}`,
            row: startRow,
            col,
          });
        }
      }
      
      addSparklineRange(sheetId, type, dataRanges, locations);
    }

    onClose();
  };

  if (!isOpen) return null;

  // Create preview sparkline
  const previewSparkline = {
    id: 'preview',
    sheetId,
    type,
    dataRange: 'A1:A5', // Dummy range
    locationCell: 'Z1',
    locationRow: 0,
    locationCol: 25,
    style: {
      ...DEFAULT_SPARKLINE_STYLE,
      ...(SPARKLINE_PRESETS[selectedColor as keyof typeof SPARKLINE_PRESETS] || SPARKLINE_PRESETS.blue),
      showMarkers,
      showHighPoint: showHighLow,
      showLowPoint: showHighLow,
    },
    rightToLeft: false,
    dateAxis: false,
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog sparkline-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Insert Sparklines</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          {/* Type Selection */}
          <div className="sparkline-types">
            <button 
              className={`type-btn ${type === 'line' ? 'active' : ''}`}
              onClick={() => setType('line')}
            >
              <TrendingUp size={24} />
              <span>Line</span>
            </button>
            <button 
              className={`type-btn ${type === 'column' ? 'active' : ''}`}
              onClick={() => setType('column')}
            >
              <BarChart3 size={24} />
              <span>Column</span>
            </button>
            <button 
              className={`type-btn ${type === 'winloss' ? 'active' : ''}`}
              onClick={() => setType('winloss')}
            >
              <Activity size={24} />
              <span>Win/Loss</span>
            </button>
          </div>

          {/* Data Range */}
          <div className="form-group">
            <label>Data Range:</label>
            <input
              type="text"
              value={dataRange}
              onChange={(e) => setDataRange(e.target.value)}
              placeholder="e.g., B2:B10"
              className="range-input"
            />
            <span className="input-hint">Enter the range containing the data values</span>
          </div>

          {/* Location Range */}
          <div className="form-group">
            <label>Location Range:</label>
            <input
              type="text"
              value={locationRange}
              onChange={(e) => setLocationRange(e.target.value)}
              placeholder="e.g., A2 or A2:A10"
              className="range-input"
            />
            <span className="input-hint">Where to place the sparkline(s)</span>
          </div>

          {/* Color Selection */}
          <div className="form-group">
            <label>Color:</label>
            <div className="color-options">
              {Object.keys(SPARKLINE_PRESETS).map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: SPARKLINE_PRESETS[color as keyof typeof SPARKLINE_PRESETS].lineColor 
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          {type === 'line' && (
            <div className="form-group">
              <label>Options:</label>
              <div className="checkbox-options">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                  />
                  Show markers
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={showHighLow}
                    onChange={(e) => setShowHighLow(e.target.checked)}
                  />
                  Highlight high/low points
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="form-group">
            <label>Preview:</label>
            <div className="sparkline-preview">
              <SparklinePreview type={type} color={selectedColor} showMarkers={showMarkers} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleInsert}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple preview component with mock data
const SparklinePreview: React.FC<{ 
  type: SparklineType; 
  color: string;
  showMarkers: boolean;
}> = ({ type, color, showMarkers }) => {
  const mockData = [3, 7, 2, 9, 4, 6, 8, 5];
  const width = 200;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const colorPreset = SPARKLINE_PRESETS[color as keyof typeof SPARKLINE_PRESETS] || SPARKLINE_PRESETS.blue;
  const min = Math.min(...mockData);
  const max = Math.max(...mockData);
  const range = max - min;
  
  const normalize = (v: number) => (v - min) / range;

  if (type === 'line') {
    const points = mockData.map((v, i) => {
      const x = padding + (i / (mockData.length - 1)) * chartWidth;
      const y = padding + (1 - normalize(v)) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke={colorPreset.lineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {showMarkers && mockData.map((v, i) => {
          const x = padding + (i / (mockData.length - 1)) * chartWidth;
          const y = padding + (1 - normalize(v)) * chartHeight;
          return <circle key={i} cx={x} cy={y} r={3} fill={colorPreset.markerColor} />;
        })}
      </svg>
    );
  }

  if (type === 'column') {
    const barWidth = (chartWidth / mockData.length) - 2;
    return (
      <svg width={width} height={height}>
        {mockData.map((v, i) => {
          const x = padding + (i / mockData.length) * chartWidth + 1;
          const barHeight = normalize(v) * chartHeight;
          return (
            <rect
              key={i}
              x={x}
              y={padding + chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={colorPreset.columnColor}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  if (type === 'winloss') {
    const winLossData = [1, 1, -1, 1, -1, -1, 1, 1];
    const barWidth = (chartWidth / winLossData.length) - 2;
    const halfHeight = chartHeight / 2;
    
    return (
      <svg width={width} height={height}>
        <line
          x1={padding}
          y1={padding + halfHeight}
          x2={width - padding}
          y2={padding + halfHeight}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        {winLossData.map((v, i) => {
          const x = padding + (i / winLossData.length) * chartWidth + 1;
          const isWin = v > 0;
          return (
            <rect
              key={i}
              x={x}
              y={isWin ? padding + 2 : padding + halfHeight + 2}
              width={barWidth}
              height={halfHeight - 4}
              fill={isWin ? colorPreset.winColor : '#dc2626'}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  return null;
};

export default SparklineDialog;
```

---

## 📄 File 5: `src/components/Sparklines/Sparklines.css`

```css
/* ============================================================
   SPARKLINES STYLES
   ============================================================ */

/* Sparkline in Cell */
.sparkline-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.sparkline-svg {
  width: 100%;
  height: 100%;
}

.sparkline-empty {
  width: 100%;
  height: 100%;
}

/* Sparkline Dialog */
.sparkline-dialog {
  width: 400px;
}

.sparkline-types {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 10px;
  background: none;
  cursor: pointer;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.type-btn:hover {
  border-color: var(--accent-color, #217346);
  color: var(--accent-color, #217346);
}

.type-btn.active {
  border-color: var(--accent-color, #217346);
  background: var(--accent-light, #e8f5e9);
  color: var(--accent-color, #217346);
}

.type-btn span {
  font-size: 12px;
  font-weight: 500;
}

/* Form Group */
.sparkline-dialog .form-group {
  margin-bottom: 16px;
}

.sparkline-dialog .form-group > label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 8px;
}

.range-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
  text-transform: uppercase;
  outline: none;
}

.range-input:focus {
  border-color: var(--accent-color, #217346);
  box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
}

.input-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #999);
  margin-top: 4px;
}

/* Color Options */
.color-options {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--text-primary, #333);
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--text-primary, #333);
}

/* Checkbox Options */
.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-options input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color, #217346);
}

/* Preview */
.sparkline-preview {
  padding: 16px;
  background: var(--bg-secondary, #f8f9fa);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

/* Error */
.sparkline-dialog .error-message {
  padding: 10px 12px;
  background: var(--error-light, #fee2e2);
  color: var(--error-color, #dc2626);
  border-radius: 6px;
  font-size: 13px;
  margin-top: 12px;
}

/* Dark Mode */
[data-theme="dark"] .sparkline-dialog {
  background: var(--bg-primary-dark, #1e1e1e);
}

[data-theme="dark"] .type-btn {
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .type-btn.active {
  background: rgba(33, 115, 70, 0.2);
}

[data-theme="dark"] .range-input {
  background: var(--bg-secondary-dark, #2a2a2a);
  border-color: var(--border-color-dark, #404040);
  color: var(--text-primary-dark, #fff);
}

[data-theme="dark"] .sparkline-preview {
  background: var(--bg-secondary-dark, #2a2a2a);
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .color-btn.active {
  border-color: var(--text-primary-dark, #fff);
  box-shadow: 0 0 0 2px var(--bg-primary-dark, #1e1e1e), 0 0 0 4px var(--text-primary-dark, #fff);
}
```

---

## 📄 File 6: `src/components/Sparklines/index.ts`

```typescript
export { SparklineRenderer } from './SparklineRenderer';
export { SparklineDialog } from './SparklineDialog';
```

---

## 🔗 Integration

### Add to Insert Toolbar

```tsx
import { SparklineDialog } from '../Sparklines';

// State
const [showSparklineDialog, setShowSparklineDialog] = useState(false);
const [sparklineType, setSparklineType] = useState<'line' | 'column' | 'winloss'>('line');

// Buttons
<div className="sparkline-buttons">
  <button onClick={() => { setSparklineType('line'); setShowSparklineDialog(true); }}>
    <TrendingUp size={16} />
    Line
  </button>
  <button onClick={() => { setSparklineType('column'); setShowSparklineDialog(true); }}>
    <BarChart3 size={16} />
    Column
  </button>
  <button onClick={() => { setSparklineType('winloss'); setShowSparklineDialog(true); }}>
    <Activity size={16} />
    Win/Loss
  </button>
</div>

// Dialog
<SparklineDialog
  sheetId={activeSheetId}
  isOpen={showSparklineDialog}
  onClose={() => setShowSparklineDialog(false)}
  initialType={sparklineType}
/>
```

### Render Sparklines in Cells

```tsx
// In Cell.tsx or CellRenderer.tsx
import { useSparklineStore } from '../../stores/sparklineStore';
import { SparklineRenderer } from '../Sparklines';

const { getSparklineAtCell } = useSparklineStore();
const sparkline = getSparklineAtCell(sheetId, row, col);

// In render
{sparkline && (
  <div className="sparkline-container">
    <SparklineRenderer 
      sparkline={sparkline}
      width={cellWidth}
      height={cellHeight}
    />
  </div>
)}
```

---

## ✅ Implementation Checklist

- [ ] `src/types/sparkline.ts`
- [ ] `src/stores/sparklineStore.ts`
- [ ] `src/components/Sparklines/SparklineRenderer.tsx`
- [ ] `src/components/Sparklines/SparklineDialog.tsx`
- [ ] `src/components/Sparklines/Sparklines.css`
- [ ] `src/components/Sparklines/index.ts`
- [ ] Integration with Insert toolbar
- [ ] Integration with cell rendering
- [ ] Dark mode testing

---

## 🎯 Features Summary

| Feature | Description |
|---------|-------------|
| **Line Sparkline** | Trend line with optional markers |
| **Column Sparkline** | Bar chart with negative value support |
| **Win/Loss Sparkline** | Binary positive/negative bars |
| **Color Presets** | 5 color themes |
| **Markers** | Show data point markers |
| **High/Low Points** | Highlight min/max values |
| **Negative Values** | Different color for negatives |
| **Axis Line** | Optional zero axis |
| **Grouping** | Group multiple sparklines |
| **Persist** | localStorage persistence |

---

**Estimated Time:** 1 day  
**Score Impact:** +0.5%

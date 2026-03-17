// ============================================================
// SPARKLINE RENDERER — Renders sparklines in cells
// ============================================================

import React, { useMemo } from 'react';
import { Sparkline } from '../../types/sparkline';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';
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
  const { sheets } = useWorkbookStore();
  const sheet = sheets[sparkline.sheetId];

  // Get cell value helper
  const getCellValue = (_sheetId: string, row: number, col: number): string | number | null => {
    const cellKey = getCellKey(row, col);
    const cell = sheet?.cells?.[cellKey];
    return cell?.displayValue ?? cell?.value ?? null;
  };

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
  }, [sparkline, sheet]);

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

  // Render Line Sparkline
  const renderLineSparkline = () => {
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
            y1={padding + (1 - normalize(0)) * chartHeight}
            x2={width - padding}
            y2={padding + (1 - normalize(0)) * chartHeight}
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
  };

  // Render Column Sparkline
  const renderColumnSparkline = () => {
    const { style } = sparkline;
    const barWidth = Math.max(2, (chartWidth / data.length) - 2);
    const gap = 1;

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
  };

  // Render Win/Loss Sparkline
  const renderWinLossSparkline = () => {
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
  };

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
};

export default SparklineRenderer;

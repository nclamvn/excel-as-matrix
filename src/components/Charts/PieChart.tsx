// Phase 5: Pie Chart Component
// SVG-based pie/doughnut chart

import React, { useMemo, useState } from 'react';
import { ChartStyle, LegendConfig } from '../../types/visualization';

interface PieChartProps {
  width: number;
  height: number;
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  style: ChartStyle;
  legend: LegendConfig;
  isDoughnut?: boolean;
}

interface SliceData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
  path: string;
  labelPosition: { x: number; y: number };
}

export const PieChart: React.FC<PieChartProps> = ({
  width,
  height,
  categories,
  series,
  legend,
  isDoughnut = false,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const centerX = width / 2;
  const centerY = (height - (legend.visible ? 30 : 0)) / 2;
  const radius = Math.min(centerX, centerY) - 40;
  const innerRadius = isDoughnut ? radius * 0.5 : 0;

  const slices = useMemo<SliceData[]>(() => {
    // Use first series values with categories as labels
    const values = series[0]?.values || [];
    const colors = series.map((s) => s.color);
    const total = values.reduce((sum, v) => sum + (v || 0), 0);

    if (total === 0) return [];

    let currentAngle = -Math.PI / 2; // Start from top

    return categories.map((label, i) => {
      const value = values[i] || 0;
      const percentage = (value / total) * 100;
      const angle = (value / total) * Math.PI * 2;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Create SVG arc path
      const path = createArcPath(
        centerX,
        centerY,
        radius,
        innerRadius,
        startAngle,
        endAngle
      );

      // Calculate label position
      const midAngle = (startAngle + endAngle) / 2;
      const labelRadius = radius * 0.7;
      const labelPosition = {
        x: centerX + Math.cos(midAngle) * labelRadius,
        y: centerY + Math.sin(midAngle) * labelRadius,
      };

      return {
        label,
        value,
        percentage,
        color: colors[i % colors.length] || `hsl(${(i * 360) / categories.length}, 70%, 50%)`,
        startAngle,
        endAngle,
        path,
        labelPosition,
      };
    });
  }, [categories, series, centerX, centerY, radius, innerRadius]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Slices */}
      <g>
        {slices.map((slice, i) => {
          const isHovered = hoveredSlice === i;
          const offset = isHovered ? 8 : 0;
          const midAngle = (slice.startAngle + slice.endAngle) / 2;
          const translateX = Math.cos(midAngle) * offset;
          const translateY = Math.sin(midAngle) * offset;

          return (
            <g
              key={`slice-${i}`}
              transform={`translate(${translateX}, ${translateY})`}
              className="transition-transform duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSlice(i)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth={2}
                opacity={isHovered ? 1 : 0.9}
              >
                <title>{`${slice.label}: ${slice.value.toLocaleString()} (${slice.percentage.toFixed(1)}%)`}</title>
              </path>
            </g>
          );
        })}
      </g>

      {/* Labels on slices (only for larger slices) */}
      {slices.map((slice, i) => {
        if (slice.percentage < 5) return null; // Skip small slices
        return (
          <text
            key={`label-${i}`}
            x={slice.labelPosition.x}
            y={slice.labelPosition.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-white pointer-events-none"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {slice.percentage.toFixed(0)}%
          </text>
        );
      })}

      {/* Center text for doughnut */}
      {isDoughnut && (
        <g>
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-700"
          >
            {total.toLocaleString()}
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Total
          </text>
        </g>
      )}

      {/* Legend */}
      {legend.visible && (
        <g transform={`translate(0, ${height - 25})`}>
          {slices.map((slice, i) => {
            const itemWidth = width / slices.length;
            const x = i * itemWidth + itemWidth / 2;
            return (
              <g
                key={`legend-${i}`}
                transform={`translate(${x}, 0)`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <rect
                  x={-40}
                  y={-6}
                  width={12}
                  height={12}
                  fill={slice.color}
                  rx={2}
                />
                <text
                  x={-25}
                  y={4}
                  className="text-xs fill-gray-600"
                  style={{ fontSize: legend.fontSize || 12 }}
                >
                  {slice.label.length > 10 ? slice.label.slice(0, 10) + '...' : slice.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

function createArcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = {
    x: cx + Math.cos(startAngle) * outerRadius,
    y: cy + Math.sin(startAngle) * outerRadius,
  };
  const endOuter = {
    x: cx + Math.cos(endAngle) * outerRadius,
    y: cy + Math.sin(endAngle) * outerRadius,
  };
  const startInner = {
    x: cx + Math.cos(endAngle) * innerRadius,
    y: cy + Math.sin(endAngle) * innerRadius,
  };
  const endInner = {
    x: cx + Math.cos(startAngle) * innerRadius,
    y: cy + Math.sin(startAngle) * innerRadius,
  };

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius === 0) {
    // Pie slice
    return [
      `M ${cx} ${cy}`,
      `L ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      'Z',
    ].join(' ');
  }

  // Doughnut slice
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

// =============================================================================
// PIE CHART — Pie and Donut chart component
// =============================================================================

import React, { useMemo, useState } from 'react';
import type { ChartConfig } from '../autoviz/types';
import { ChartWrapper } from './ChartWrapper';

interface PieChartProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  isDonut?: boolean;
  showLabels?: boolean;
  showPercentages?: boolean;
}

interface SliceData {
  startAngle: number;
  endAngle: number;
  path: string;
  color: string;
  value: number;
  percentage: number;
  label: string;
  labelPosition: { x: number; y: number };
}

export const PieChart: React.FC<PieChartProps> = ({
  config,
  width = 300,
  height = 300,
  isDonut = false,
  showLabels = true,
  showPercentages = true,
}) => {
  const { data, colorScheme, style, tooltip } = config;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartSize = Math.min(
    width - style.padding * 2,
    height - (config.title ? 60 : 0) - (config.legend?.show ? 40 : 0) - style.padding * 2
  );

  const slices = useMemo((): SliceData[] => {
    const values = data.datasets[0]?.data || [];
    const labels = data.labels || values.map((_, i) => `Item ${i + 1}`);
    const total = values.reduce((sum, v) => sum + v, 0) || 1;

    const cx = chartSize / 2;
    const cy = chartSize / 2;
    const radius = chartSize / 2 - 10;
    const innerRadius = isDonut ? radius * 0.6 : 0;

    let startAngle = -Math.PI / 2;
    const sliceData: SliceData[] = [];

    values.forEach((value, i) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const midAngle = startAngle + angle / 2;

      // Calculate path
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const innerX1 = cx + innerRadius * Math.cos(startAngle);
      const innerY1 = cy + innerRadius * Math.sin(startAngle);
      const innerX2 = cx + innerRadius * Math.cos(endAngle);
      const innerY2 = cy + innerRadius * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      let path: string;
      if (isDonut) {
        path = `
          M ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${innerX2} ${innerY2}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1}
          Z
        `;
      } else {
        path = `
          M ${cx} ${cy}
          L ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
          Z
        `;
      }

      // Label position
      const labelRadius = radius + 20;
      const labelPosition = {
        x: cx + labelRadius * Math.cos(midAngle),
        y: cy + labelRadius * Math.sin(midAngle),
      };

      sliceData.push({
        startAngle,
        endAngle,
        path,
        color: colorScheme.colors[i % colorScheme.colors.length],
        value,
        percentage,
        label: labels[i],
        labelPosition,
      });

      startAngle = endAngle;
    });

    return sliceData;
  }, [data, chartSize, colorScheme.colors, isDonut]);

  // Calculate total for donut center
  const total = data.datasets[0]?.data.reduce((sum, v) => sum + v, 0) || 0;

  return (
    <ChartWrapper config={config} className={`pie-chart ${isDonut ? 'donut' : ''}`}>
      <svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        style={{ margin: '0 auto', display: 'block' }}
      >
        {/* Slices */}
        <g className="slices">
          {slices.map((slice, i) => (
            <g
              key={i}
              className={`slice ${hoveredIndex === i ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <path
                d={slice.path}
                fill={slice.color}
                stroke="#fff"
                strokeWidth={2}
                transform={
                  hoveredIndex === i
                    ? `translate(${Math.cos((slice.startAngle + slice.endAngle) / 2) * 5}, ${Math.sin((slice.startAngle + slice.endAngle) / 2) * 5})`
                    : undefined
                }
                className={style.animation ? 'animate-slice' : ''}
                style={{ animationDelay: `${i * 100}ms` }}
              />
              {tooltip?.enabled && (
                <title>{`${slice.label}: ${formatNumber(slice.value)} (${slice.percentage.toFixed(1)}%)`}</title>
              )}
            </g>
          ))}
        </g>

        {/* Labels */}
        {showLabels && chartSize > 200 && (
          <g className="labels">
            {slices.map((slice, i) => {
              if (slice.percentage < 5) return null; // Hide small labels

              const textAnchor = slice.labelPosition.x > chartSize / 2 ? 'start' : 'end';

              return (
                <g key={i}>
                  <text
                    x={slice.labelPosition.x}
                    y={slice.labelPosition.y}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fontSize={style.labelFont.size}
                    fill={style.labelFont.color}
                  >
                    {slice.label}
                  </text>
                  {showPercentages && (
                    <text
                      x={slice.labelPosition.x}
                      y={slice.labelPosition.y + 14}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                      fontSize={style.labelFont.size - 2}
                      fill={style.labelFont.color}
                      opacity={0.7}
                    >
                      {slice.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Donut center */}
        {isDonut && (
          <g className="donut-center">
            <text
              x={chartSize / 2}
              y={chartSize / 2 - 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={style.titleFont.size}
              fontWeight={style.titleFont.weight}
              fill={style.titleFont.color}
            >
              {formatNumber(total)}
            </text>
            <text
              x={chartSize / 2}
              y={chartSize / 2 + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={style.subtitleFont.size}
              fill={style.subtitleFont.color}
            >
              Total
            </text>
          </g>
        )}
      </svg>

      {/* Inline legend for small charts */}
      {chartSize <= 200 && (
        <div className="pie-inline-legend">
          {slices.map((slice, i) => (
            <div key={i} className="inline-legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-text">
                {slice.label} ({slice.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartWrapper>
  );
};

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export default PieChart;

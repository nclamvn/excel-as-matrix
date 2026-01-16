// =============================================================================
// GAUGE CHART — Gauge/meter chart component
// =============================================================================

import React, { useMemo } from 'react';
import type { ChartConfig } from '../autoviz/types';
import { ChartWrapper } from './ChartWrapper';

interface GaugeChartProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  target?: number;
  showTarget?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  config,
  width = 200,
  height = 150,
  min = 0,
  max = 100,
  target,
  showTarget = true,
}) => {
  const { data, colorScheme, style } = config;

  // Get value from data
  const value = data.datasets[0]?.data[0] || 0;
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const chartWidth = width - style.padding * 2;
  const chartHeight = height - (config.title ? 40 : 0);

  const gaugeData = useMemo(() => {
    const cx = chartWidth / 2;
    const cy = chartHeight - 20;
    const radius = Math.min(chartWidth / 2, chartHeight - 30) - 10;
    const strokeWidth = radius * 0.2;
    const innerRadius = radius - strokeWidth;

    // Gauge arc (180 degrees, from left to right)
    const startAngle = Math.PI;
    const endAngle = 0;
    const valueAngle = startAngle - (percentage / 100) * Math.PI;

    // Background arc path
    const bgPath = describeArc(cx, cy, radius - strokeWidth / 2, startAngle, endAngle);

    // Value arc path
    const valuePath = describeArc(cx, cy, radius - strokeWidth / 2, startAngle, valueAngle);

    // Target position
    const targetAngle = target !== undefined
      ? startAngle - ((target - min) / (max - min)) * Math.PI
      : null;

    const targetPos = targetAngle !== null
      ? {
          x: cx + (radius + 5) * Math.cos(targetAngle),
          y: cy + (radius + 5) * Math.sin(targetAngle),
        }
      : null;

    // Tick marks
    const ticks = [0, 25, 50, 75, 100].map((pct) => {
      const angle = startAngle - (pct / 100) * Math.PI;
      return {
        x1: cx + (radius - strokeWidth - 5) * Math.cos(angle),
        y1: cy + (radius - strokeWidth - 5) * Math.sin(angle),
        x2: cx + (radius - strokeWidth - 15) * Math.cos(angle),
        y2: cy + (radius - strokeWidth - 15) * Math.sin(angle),
        labelX: cx + (radius - strokeWidth - 25) * Math.cos(angle),
        labelY: cy + (radius - strokeWidth - 25) * Math.sin(angle),
        value: min + (pct / 100) * (max - min),
      };
    });

    return {
      cx,
      cy,
      radius,
      strokeWidth,
      innerRadius,
      bgPath,
      valuePath,
      targetPos,
      targetAngle,
      ticks,
    };
  }, [chartWidth, chartHeight, percentage, min, max, target]);

  // Determine color based on percentage
  const getValueColor = () => {
    if (percentage >= 80) return colorScheme.positive || '#22c55e';
    if (percentage >= 50) return colorScheme.highlight || '#f59e0b';
    return colorScheme.negative || '#ef4444';
  };

  return (
    <ChartWrapper config={config} className="gauge-chart">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {/* Background arc */}
        <path
          d={gaugeData.bgPath}
          fill="none"
          stroke={colorScheme.gridColor || '#e5e7eb'}
          strokeWidth={gaugeData.strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={gaugeData.valuePath}
          fill="none"
          stroke={getValueColor()}
          strokeWidth={gaugeData.strokeWidth}
          strokeLinecap="round"
          className={style.animation ? 'animate-gauge' : ''}
        />

        {/* Tick marks */}
        {gaugeData.ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={colorScheme.gridColor || '#d1d5db'}
              strokeWidth={1}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill={style.axisFont.color}
            >
              {formatNumber(tick.value)}
            </text>
          </g>
        ))}

        {/* Target marker */}
        {showTarget && gaugeData.targetPos && gaugeData.targetAngle !== null && (
          <g className="target-marker">
            <line
              x1={gaugeData.cx + (gaugeData.radius - gaugeData.strokeWidth - 5) * Math.cos(gaugeData.targetAngle)}
              y1={gaugeData.cy + (gaugeData.radius - gaugeData.strokeWidth - 5) * Math.sin(gaugeData.targetAngle)}
              x2={gaugeData.cx + (gaugeData.radius + 5) * Math.cos(gaugeData.targetAngle)}
              y2={gaugeData.cy + (gaugeData.radius + 5) * Math.sin(gaugeData.targetAngle)}
              stroke={colorScheme.highlight || '#f59e0b'}
              strokeWidth={3}
            />
            <text
              x={gaugeData.targetPos.x}
              y={gaugeData.targetPos.y - 10}
              textAnchor="middle"
              fontSize={10}
              fill={colorScheme.highlight || '#f59e0b'}
            >
              Target
            </text>
          </g>
        )}

        {/* Center value */}
        <text
          x={gaugeData.cx}
          y={gaugeData.cy - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={style.titleFont.size * 1.5}
          fontWeight="bold"
          fill={getValueColor()}
        >
          {formatNumber(value)}
        </text>

        {/* Percentage */}
        <text
          x={gaugeData.cx}
          y={gaugeData.cy + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={style.subtitleFont.size}
          fill={style.subtitleFont.color}
        >
          {percentage.toFixed(0)}%
        </text>

        {/* Min/Max labels */}
        <text
          x={gaugeData.cx - gaugeData.radius + gaugeData.strokeWidth}
          y={gaugeData.cy + 5}
          textAnchor="start"
          fontSize={10}
          fill={style.axisFont.color}
        >
          {formatNumber(min)}
        </text>
        <text
          x={gaugeData.cx + gaugeData.radius - gaugeData.strokeWidth}
          y={gaugeData.cy + 5}
          textAnchor="end"
          fontSize={10}
          fill={style.axisFont.color}
        >
          {formatNumber(max)}
        </text>
      </svg>
    </ChartWrapper>
  );
};

// Helper function to describe arc path
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: cx + radius * Math.cos(startAngle),
    y: cy + radius * Math.sin(startAngle),
  };
  const end = {
    x: cx + radius * Math.cos(endAngle),
    y: cy + radius * Math.sin(endAngle),
  };

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

export default GaugeChart;

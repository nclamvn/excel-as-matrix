// Phase 5: Area Chart Component
// SVG-based area chart with stacked mode

import React, { useMemo, useState } from 'react';
import { ChartStyle, LegendConfig, AxesConfig } from '../../types/visualization';

interface AreaChartProps {
  width: number;
  height: number;
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  style: ChartStyle;
  legend: LegendConfig;
  axes: AxesConfig;
  stacked?: boolean;
  gradient?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  width,
  height,
  categories,
  series,
  legend,
  axes,
  stacked = false,
  gradient = true,
}) => {
  const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);

  const margin = { top: 20, right: 20, bottom: legend.visible ? 60 : 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const { minValue, maxValue, yTicks, xStep, stackedData } = useMemo(() => {
    let min = 0;
    let max = 0;

    // Calculate stacked data
    const stacked: number[][] = [];
    if (series.length > 0) {
      series.forEach((s, seriesIndex) => {
        const values = s.values.map((v, i) => {
          const base = seriesIndex > 0 ? stacked[seriesIndex - 1][i] : 0;
          return base + (v || 0);
        });
        stacked.push(values);
      });
    }

    if (stacked.length > 0) {
      max = Math.max(...stacked[stacked.length - 1]);
    } else {
      const allValues = series.flatMap((s) => s.values);
      min = Math.min(0, ...allValues);
      max = Math.max(...allValues);
    }

    const range = max - min || 1;
    const padding = range * 0.1;
    const yMax = max + padding;
    const yMin = min < 0 ? min - padding : 0;

    // Calculate nice tick values
    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(yMin + (yMax - yMin) * (i / tickCount));
    }

    return {
      minValue: yMin,
      maxValue: yMax,
      yTicks: ticks,
      xStep: chartWidth / Math.max(1, categories.length - 1),
      stackedData: stacked,
    };
  }, [series, categories, chartWidth]);

  const scaleY = (value: number) => {
    return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  const scaleX = (index: number) => {
    return index * xStep;
  };

  const generateAreaPath = (values: number[], baseline: number[] | null) => {
    if (values.length === 0) return '';

    const points = values.map((v, i) => ({
      x: scaleX(i),
      y: scaleY(v),
    }));

    const baselinePoints = baseline
      ? baseline.map((v, i) => ({ x: scaleX(i), y: scaleY(v) }))
      : values.map((_, i) => ({ x: scaleX(i), y: scaleY(0) }));

    // Create path: top line → right edge down → bottom line (reversed) → left edge up
    let path = `M ${points[0].x} ${points[0].y}`;

    // Top line
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    // Bottom line (reversed)
    for (let i = baselinePoints.length - 1; i >= 0; i--) {
      path += ` L ${baselinePoints[i].x} ${baselinePoints[i].y}`;
    }

    path += ' Z';
    return path;
  };

  const generateLinePath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`)
      .join(' ');
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gradient definitions */}
      {gradient && (
        <defs>
          {series.map((s, i) => (
            <linearGradient key={`gradient-${i}`} id={`area-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
      )}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {axes.yAxis.gridlines && yTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={0}
            y1={scaleY(tick)}
            x2={chartWidth}
            y2={scaleY(tick)}
            stroke="#E5E7EB"
            strokeDasharray="4,4"
          />
        ))}

        {/* Y Axis */}
        {axes.yAxis.visible && (
          <>
            <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#9CA3AF" strokeWidth={1} />
            {yTicks.map((tick, i) => (
              <g key={`y-tick-${i}`} transform={`translate(0, ${scaleY(tick)})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="#9CA3AF" />
                {axes.yAxis.labelsVisible && (
                  <text x={-8} y={4} textAnchor="end" className="text-xs fill-gray-500">
                    {tick.toFixed(0)}
                  </text>
                )}
              </g>
            ))}
          </>
        )}

        {/* X Axis */}
        {axes.xAxis.visible && (
          <>
            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#9CA3AF" strokeWidth={1} />
            {categories.map((cat, i) => (
              <g key={`x-tick-${i}`} transform={`translate(${scaleX(i)}, ${chartHeight})`}>
                <line x1={0} y1={0} x2={0} y2={5} stroke="#9CA3AF" />
                {axes.xAxis.labelsVisible && (
                  <text
                    x={0}
                    y={18}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {cat}
                  </text>
                )}
              </g>
            ))}
          </>
        )}

        {/* Areas - render in reverse order so first series is on top */}
        {[...series].reverse().map((s, reversedIndex) => {
          const i = series.length - 1 - reversedIndex;
          const isHovered = hoveredSeries === i;

          let areaPath: string;
          let linePath: string;

          if (stacked && stackedData.length > 0) {
            const topValues = stackedData[i];
            const bottomValues = i > 0 ? stackedData[i - 1] : null;
            areaPath = generateAreaPath(topValues, bottomValues);
            linePath = generateLinePath(topValues);
          } else {
            areaPath = generateAreaPath(s.values, null);
            linePath = generateLinePath(s.values);
          }

          return (
            <g
              key={`area-${i}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredSeries(i)}
              onMouseLeave={() => setHoveredSeries(null)}
            >
              <path
                d={areaPath}
                fill={gradient ? `url(#area-gradient-${i})` : s.color}
                opacity={isHovered ? 0.9 : 0.7}
                className="transition-opacity duration-200"
              />
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-200"
              />
              <title>{s.name}</title>
            </g>
          );
        })}

        {/* Data points for hovered series */}
        {hoveredSeries !== null && (
          <g>
            {(stacked ? stackedData[hoveredSeries] : series[hoveredSeries].values).map((v, i) => (
              <circle
                key={`point-${i}`}
                cx={scaleX(i)}
                cy={scaleY(v)}
                r={4}
                fill={series[hoveredSeries].color}
                stroke="white"
                strokeWidth={2}
              >
                <title>{`${series[hoveredSeries].name} (${categories[i]}): ${v}`}</title>
              </circle>
            ))}
          </g>
        )}

        {/* Legend */}
        {legend.visible && (
          <g transform={`translate(${chartWidth / 2}, ${chartHeight + 35})`}>
            {series.map((s, i) => {
              const offset = (i - (series.length - 1) / 2) * 100;
              return (
                <g
                  key={`legend-${i}`}
                  transform={`translate(${offset}, 0)`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredSeries(i)}
                  onMouseLeave={() => setHoveredSeries(null)}
                >
                  <rect x={-15} y={-6} width={12} height={12} fill={s.color} rx={2} />
                  <text x={0} y={4} className="text-xs fill-gray-600">
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
};

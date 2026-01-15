// Phase 5: Line Chart Component
// SVG-based line chart with D3-like calculations

import React, { useMemo } from 'react';
import { ChartStyle, LegendConfig, AxesConfig } from '../../types/visualization';

interface LineChartProps {
  width: number;
  height: number;
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  style: ChartStyle;
  legend: LegendConfig;
  axes: AxesConfig;
  showMarkers?: boolean;
  smooth?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  width,
  height,
  categories,
  series,
  legend,
  axes,
  showMarkers = true,
  smooth = false,
}) => {
  const margin = { top: 20, right: 20, bottom: legend.visible ? 60 : 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const { minValue, maxValue, yTicks, xStep } = useMemo(() => {
    const allValues = series.flatMap((s) => s.values);
    const min = Math.min(0, ...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const padding = range * 0.1;

    const yMin = min < 0 ? min - padding : 0;
    const yMax = max + padding;

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
    };
  }, [series, chartWidth, categories.length]);

  const scaleY = (value: number) => {
    return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  const scaleX = (index: number) => {
    return index * xStep;
  };

  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';

    const points = values.map((v, i) => ({
      x: scaleX(i),
      y: scaleY(v),
    }));

    if (smooth && points.length > 2) {
      // Bezier curve smoothing
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        path += ` Q ${prev.x} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      }
      path += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;
      return path;
    }

    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
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
                    transform={axes.xAxis.labelRotation ? `rotate(${axes.xAxis.labelRotation})` : ''}
                  >
                    {cat}
                  </text>
                )}
              </g>
            ))}
          </>
        )}

        {/* Lines */}
        {series.map((s, seriesIndex) => (
          <g key={`series-${seriesIndex}`}>
            <path
              d={generatePath(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              className="transition-all duration-300"
            />
            {/* Markers */}
            {showMarkers && s.values.map((v, i) => (
              <circle
                key={`marker-${seriesIndex}-${i}`}
                cx={scaleX(i)}
                cy={scaleY(v)}
                r={4}
                fill={s.color}
                stroke="white"
                strokeWidth={2}
                className="transition-all duration-150 hover:r-6"
              >
                <title>{`${s.name}: ${v}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* Legend */}
        {legend.visible && (
          <g transform={`translate(${chartWidth / 2}, ${chartHeight + 35})`}>
            {series.map((s, i) => {
              const offset = (i - (series.length - 1) / 2) * 100;
              return (
                <g key={`legend-${i}`} transform={`translate(${offset}, 0)`}>
                  <line x1={-15} y1={0} x2={-5} y2={0} stroke={s.color} strokeWidth={2} />
                  <circle cx={-10} cy={0} r={3} fill={s.color} />
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

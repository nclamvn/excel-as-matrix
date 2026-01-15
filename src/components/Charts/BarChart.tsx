// Phase 5: Bar Chart Component
// SVG-based bar chart with grouped and stacked modes

import React, { useMemo, useState } from 'react';
import { ChartStyle, LegendConfig, AxesConfig } from '../../types/visualization';

interface BarChartProps {
  width: number;
  height: number;
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  style: ChartStyle;
  legend: LegendConfig;
  axes: AxesConfig;
  stacked?: boolean;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  width,
  height,
  categories,
  series,
  legend,
  axes,
  stacked = false,
  horizontal: _horizontal = false,
}) => {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const margin = { top: 20, right: 20, bottom: legend.visible ? 60 : 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const { minValue, maxValue, yTicks, barWidth, groupWidth } = useMemo(() => {
    let min = 0;
    let max = 0;

    if (stacked) {
      // For stacked, sum up values per category
      categories.forEach((_, catIndex) => {
        let sum = 0;
        series.forEach((s) => {
          sum += s.values[catIndex] || 0;
        });
        max = Math.max(max, sum);
      });
    } else {
      // For grouped, find individual max
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

    const groupW = chartWidth / categories.length;
    const barW = stacked ? groupW * 0.7 : (groupW * 0.8) / series.length;

    return {
      minValue: yMin,
      maxValue: yMax,
      yTicks: ticks,
      barWidth: barW,
      groupWidth: groupW,
    };
  }, [series, categories, chartWidth, stacked]);

  const scaleY = (value: number) => {
    return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  const getBarX = (categoryIndex: number, seriesIndex: number) => {
    const groupStart = categoryIndex * groupWidth;
    if (stacked) {
      return groupStart + (groupWidth - barWidth) / 2;
    }
    const seriesOffset = (groupWidth - barWidth * series.length) / 2;
    return groupStart + seriesOffset + seriesIndex * barWidth;
  };

  const getStackedBars = (categoryIndex: number) => {
    let currentY = scaleY(0);
    return series.map((s, seriesIndex) => {
      const value = s.values[categoryIndex] || 0;
      const barHeight = Math.abs(scaleY(0) - scaleY(value));
      const y = currentY - barHeight;
      currentY = y;
      return { seriesIndex, value, y, height: barHeight, color: s.color, name: s.name };
    });
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

        {/* Zero line */}
        {minValue < 0 && (
          <line
            x1={0}
            y1={scaleY(0)}
            x2={chartWidth}
            y2={scaleY(0)}
            stroke="#9CA3AF"
            strokeWidth={1}
          />
        )}

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
              <g key={`x-tick-${i}`} transform={`translate(${i * groupWidth + groupWidth / 2}, ${chartHeight})`}>
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

        {/* Bars */}
        {stacked ? (
          // Stacked bars
          categories.map((cat, catIndex) => (
            <g key={`category-${catIndex}`}>
              {getStackedBars(catIndex).map((bar) => {
                const barId = `${catIndex}-${bar.seriesIndex}`;
                const isHovered = hoveredBar === barId;
                return (
                  <rect
                    key={barId}
                    x={getBarX(catIndex, 0)}
                    y={bar.y}
                    width={barWidth}
                    height={bar.height}
                    fill={bar.color}
                    opacity={isHovered ? 1 : 0.85}
                    className="transition-opacity duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredBar(barId)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <title>{`${bar.name} (${cat}): ${bar.value}`}</title>
                  </rect>
                );
              })}
            </g>
          ))
        ) : (
          // Grouped bars
          categories.map((cat, catIndex) =>
            series.map((s, seriesIndex) => {
              const value = s.values[catIndex] || 0;
              const barHeight = Math.abs(scaleY(0) - scaleY(value));
              const barY = value >= 0 ? scaleY(value) : scaleY(0);
              const barId = `${catIndex}-${seriesIndex}`;
              const isHovered = hoveredBar === barId;

              return (
                <rect
                  key={barId}
                  x={getBarX(catIndex, seriesIndex)}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={s.color}
                  opacity={isHovered ? 1 : 0.85}
                  rx={2}
                  className="transition-opacity duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredBar(barId)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <title>{`${s.name} (${cat}): ${value}`}</title>
                </rect>
              );
            })
          )
        )}

        {/* Legend */}
        {legend.visible && (
          <g transform={`translate(${chartWidth / 2}, ${chartHeight + 35})`}>
            {series.map((s, i) => {
              const offset = (i - (series.length - 1) / 2) * 100;
              return (
                <g key={`legend-${i}`} transform={`translate(${offset}, 0)`}>
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

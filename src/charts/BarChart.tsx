// =============================================================================
// BAR CHART — Bar and Column chart component
// =============================================================================

import React, { useMemo } from 'react';
import type { ChartConfig } from '../autoviz/types';
import { ChartWrapper } from './ChartWrapper';

interface BarChartProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  config,
  width = 400,
  height = 300,
  horizontal = false,
  stacked = false,
  showValues = false,
}) => {
  const { data, colorScheme, style, yAxis, tooltip } = config;

  const chartHeight = height - (config.title ? 60 : 0) - (config.legend?.show ? 40 : 0);
  const chartWidth = width - style.padding * 2;

  // Calculate bars
  const { bars, gridLines, axisLabels, valueLabels } = useMemo(() => {
    const padding = horizontal
      ? { top: 20, right: 20, bottom: 20, left: 80 }
      : { top: 20, right: 20, bottom: 40, left: 50 };

    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // Get max value for scale
    let maxValue: number;
    if (stacked) {
      maxValue = Math.max(
        ...data.labels!.map((_, i) =>
          data.datasets.reduce((sum, ds) => sum + (ds.data[i] || 0), 0)
        )
      );
    } else {
      maxValue = Math.max(...data.datasets.flatMap((ds) => ds.data), 0);
    }
    maxValue = maxValue || 1;

    const barCount = data.labels?.length || data.datasets[0]?.data.length || 0;
    const groupCount = stacked ? 1 : data.datasets.length;
    const gap = horizontal ? 10 : 8;

    const barSize = horizontal
      ? (plotHeight - gap * (barCount - 1)) / barCount / groupCount
      : (plotWidth - gap * (barCount - 1)) / barCount / groupCount;

    const scale = horizontal
      ? (plotWidth - 20) / maxValue
      : (plotHeight - 20) / maxValue;

    const bars: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      value: number;
      label: string;
      datasetLabel: string;
    }> = [];

    if (stacked) {
      // Stacked bars
      for (let i = 0; i < barCount; i++) {
        let cumulative = 0;
        for (let dsIndex = 0; dsIndex < data.datasets.length; dsIndex++) {
          const value = data.datasets[dsIndex].data[i] || 0;
          const color = data.datasets[dsIndex].color || colorScheme.colors[dsIndex];

          if (horizontal) {
            bars.push({
              x: padding.left + cumulative * scale,
              y: padding.top + i * (barSize + gap),
              width: value * scale,
              height: barSize - 2,
              color,
              value,
              label: data.labels?.[i] || `${i + 1}`,
              datasetLabel: data.datasets[dsIndex].label,
            });
          } else {
            bars.push({
              x: padding.left + i * (barSize * groupCount + gap),
              y: padding.top + plotHeight - cumulative * scale - value * scale,
              width: barSize * groupCount - 2,
              height: value * scale,
              color,
              value,
              label: data.labels?.[i] || `${i + 1}`,
              datasetLabel: data.datasets[dsIndex].label,
            });
          }
          cumulative += value;
        }
      }
    } else {
      // Grouped bars
      for (let dsIndex = 0; dsIndex < data.datasets.length; dsIndex++) {
        const dataset = data.datasets[dsIndex];
        const color = dataset.color || colorScheme.colors[dsIndex];

        for (let i = 0; i < dataset.data.length; i++) {
          const value = dataset.data[i];

          if (horizontal) {
            bars.push({
              x: padding.left,
              y: padding.top + i * (barSize * groupCount + gap) + dsIndex * barSize,
              width: value * scale,
              height: barSize - 2,
              color,
              value,
              label: data.labels?.[i] || `${i + 1}`,
              datasetLabel: dataset.label,
            });
          } else {
            bars.push({
              x: padding.left + i * (barSize * groupCount + gap) + dsIndex * barSize,
              y: padding.top + plotHeight - value * scale,
              width: barSize - 2,
              height: value * scale,
              color,
              value,
              label: data.labels?.[i] || `${i + 1}`,
              datasetLabel: dataset.label,
            });
          }
        }
      }
    }

    // Grid lines
    const gridCount = 5;
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
      const ratio = i / gridCount;
      return {
        position: horizontal
          ? padding.left + ratio * (plotWidth - 20)
          : padding.top + plotHeight - ratio * (plotHeight - 20),
        value: ratio * maxValue,
      };
    });

    // Axis labels
    const axisLabels = data.labels?.map((label, i) => ({
      position: horizontal
        ? padding.top + i * (barSize * groupCount + gap) + (barSize * groupCount) / 2
        : padding.left + i * (barSize * groupCount + gap) + (barSize * groupCount) / 2,
      label: label.length > 10 ? `${label.slice(0, 10)}...` : label,
    })) || [];

    // Value labels
    const valueLabels = gridLines.map((line) => ({
      position: line.position,
      label: formatNumber(line.value),
    }));

    return { bars, gridLines, axisLabels, valueLabels };
  }, [data, chartWidth, chartHeight, colorScheme.colors, horizontal, stacked]);

  return (
    <ChartWrapper config={config} className={`bar-chart ${horizontal ? 'horizontal' : 'vertical'}`}>
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {/* Grid lines */}
        {yAxis?.showGrid !== false && (
          <g className="grid-lines">
            {gridLines.map((line, i) =>
              horizontal ? (
                <line
                  key={i}
                  x1={line.position}
                  y1={20}
                  x2={line.position}
                  y2={chartHeight - 20}
                  stroke={colorScheme.gridColor || '#e5e7eb'}
                  strokeDasharray="4"
                />
              ) : (
                <line
                  key={i}
                  x1={50}
                  y1={line.position}
                  x2={chartWidth - 20}
                  y2={line.position}
                  stroke={colorScheme.gridColor || '#e5e7eb'}
                  strokeDasharray="4"
                />
              )
            )}
          </g>
        )}

        {/* Value axis labels */}
        <g className="value-labels">
          {valueLabels.map((label, i) =>
            horizontal ? (
              <text
                key={i}
                x={label.position}
                y={chartHeight - 5}
                textAnchor="middle"
                fontSize={style.axisFont.size}
                fill={style.axisFont.color}
              >
                {label.label}
              </text>
            ) : (
              <text
                key={i}
                x={45}
                y={label.position}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={style.axisFont.size}
                fill={style.axisFont.color}
              >
                {label.label}
              </text>
            )
          )}
        </g>

        {/* Category axis labels */}
        <g className="category-labels">
          {axisLabels.map((label, i) =>
            horizontal ? (
              <text
                key={i}
                x={75}
                y={label.position}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={style.axisFont.size}
                fill={style.axisFont.color}
              >
                {label.label}
              </text>
            ) : (
              <text
                key={i}
                x={label.position}
                y={chartHeight - 25}
                textAnchor="middle"
                fontSize={style.axisFont.size}
                fill={style.axisFont.color}
              >
                {label.label}
              </text>
            )
          )}
        </g>

        {/* Bars */}
        <g className="bars">
          {bars.map((bar, i) => (
            <g key={i} className="bar-group">
              <rect
                x={bar.x}
                y={bar.y}
                width={Math.max(0, bar.width)}
                height={Math.max(0, bar.height)}
                fill={bar.color}
                rx={style.borderRadius > 0 ? Math.min(style.borderRadius / 2, 4) : 0}
                className={style.animation ? 'animate-bar' : ''}
                style={{ animationDelay: `${i * 30}ms` }}
              />
              {tooltip?.enabled && (
                <title>{`${bar.datasetLabel}: ${bar.label} = ${formatNumber(bar.value)}`}</title>
              )}
              {showValues && bar.width > 30 && bar.height > 15 && (
                <text
                  x={horizontal ? bar.x + bar.width - 5 : bar.x + bar.width / 2}
                  y={horizontal ? bar.y + bar.height / 2 : bar.y + 15}
                  textAnchor={horizontal ? 'end' : 'middle'}
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#fff"
                >
                  {formatNumber(bar.value)}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Annotations */}
        {config.annotations?.map((annotation) => {
          if (annotation.type === 'line' && annotation.y !== undefined) {
            const maxVal = gridLines[gridLines.length - 1]?.value || 1;
            const ratio = Number(annotation.y) / maxVal;

            if (horizontal) {
              const xPos = 80 + ratio * (chartWidth - 100);
              return (
                <g key={annotation.id}>
                  <line
                    x1={xPos}
                    y1={20}
                    x2={xPos}
                    y2={chartHeight - 20}
                    stroke={annotation.color || '#f59e0b'}
                    strokeWidth={2}
                    strokeDasharray="6"
                  />
                  {annotation.label && (
                    <text
                      x={xPos + 5}
                      y={15}
                      fontSize={11}
                      fill={annotation.color || '#f59e0b'}
                    >
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            } else {
              const yPos = chartHeight - 40 - ratio * (chartHeight - 60);
              return (
                <g key={annotation.id}>
                  <line
                    x1={50}
                    y1={yPos}
                    x2={chartWidth - 20}
                    y2={yPos}
                    stroke={annotation.color || '#f59e0b'}
                    strokeWidth={2}
                    strokeDasharray="6"
                  />
                  {annotation.label && (
                    <text
                      x={chartWidth - 25}
                      y={yPos - 5}
                      textAnchor="end"
                      fontSize={11}
                      fill={annotation.color || '#f59e0b'}
                    >
                      {annotation.label}
                    </text>
                  )}
                </g>
              );
            }
          }
          return null;
        })}
      </svg>
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
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

export default BarChart;

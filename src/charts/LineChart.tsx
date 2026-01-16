// =============================================================================
// LINE CHART — Line chart component
// =============================================================================

import React, { useMemo } from 'react';
import type { ChartConfig } from '../autoviz/types';
import { ChartWrapper } from './ChartWrapper';

interface LineChartProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  showPoints?: boolean;
  showArea?: boolean;
  smooth?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  config,
  width = 400,
  height = 300,
  showPoints = true,
  showArea = false,
  smooth = false,
}) => {
  const { data, colorScheme, style, yAxis, tooltip } = config;

  const chartHeight = height - (config.title ? 60 : 0) - (config.legend?.show ? 40 : 0);
  const chartWidth = width - style.padding * 2;

  // Calculate scales
  const { paths, points, gridLines, xLabels, yLabels } = useMemo(() => {
    const allValues = data.datasets.flatMap((ds) => ds.data);
    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const xStep = plotWidth / Math.max(data.datasets[0]?.data.length - 1 || 1, 1);
    const yScale = plotHeight / range;

    // Calculate paths for each dataset
    const paths = data.datasets.map((dataset, dsIndex) => {
      const pts = dataset.data.map((value, i) => ({
        x: padding.left + i * xStep,
        y: padding.top + plotHeight - (value - minValue) * yScale,
        value,
        label: data.labels?.[i] || `${i + 1}`,
      }));

      let pathData: string;
      if (smooth && pts.length > 2) {
        // Smooth curve using bezier
        pathData = pts
          .map((pt, i) => {
            if (i === 0) return `M ${pt.x} ${pt.y}`;
            const prev = pts[i - 1];
            const cpx = (prev.x + pt.x) / 2;
            return `C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
          })
          .join(' ');
      } else {
        pathData = pts
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');
      }

      // Area path
      const areaPath = showArea
        ? `${pathData} L ${pts[pts.length - 1].x} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`
        : '';

      return {
        linePath: pathData,
        areaPath,
        color: dataset.color || colorScheme.colors[dsIndex],
        points: pts,
        label: dataset.label,
      };
    });

    // Grid lines
    const gridCount = 5;
    const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
      const ratio = i / gridCount;
      return {
        y: padding.top + plotHeight - ratio * plotHeight,
        value: minValue + ratio * range,
      };
    });

    // X labels
    const xLabels =
      data.labels?.map((label, i) => ({
        x: padding.left + i * xStep,
        label: label.length > 8 ? `${label.slice(0, 8)}...` : label,
      })) || [];

    // Y labels
    const yLabels = gridLines.map((line) => ({
      y: line.y,
      label: formatNumber(line.value),
    }));

    return { paths, points: paths.flatMap((p) => p.points), gridLines, xLabels, yLabels };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chartWidth, chartHeight, colorScheme.colors, smooth, showArea]);

  // `points` is computed for future use (tooltips, etc.)
  void points;

  return (
    <ChartWrapper config={config} className="line-chart">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {/* Grid lines */}
        {yAxis?.showGrid !== false && (
          <g className="grid-lines">
            {gridLines.map((line, i) => (
              <line
                key={i}
                x1={50}
                y1={line.y}
                x2={chartWidth - 20}
                y2={line.y}
                stroke={colorScheme.gridColor || '#e5e7eb'}
                strokeDasharray="4"
              />
            ))}
          </g>
        )}

        {/* Y axis labels */}
        <g className="y-labels">
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={45}
              y={label.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={style.axisFont.size}
              fill={style.axisFont.color}
            >
              {label.label}
            </text>
          ))}
        </g>

        {/* X axis labels */}
        <g className="x-labels">
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={chartHeight - 10}
              textAnchor="middle"
              fontSize={style.axisFont.size}
              fill={style.axisFont.color}
            >
              {label.label}
            </text>
          ))}
        </g>

        {/* Lines and areas */}
        {paths.map((path, i) => (
          <g key={i}>
            {showArea && (
              <path
                d={path.areaPath}
                fill={path.color}
                opacity={0.2}
                className={style.animation ? 'animate-area' : ''}
              />
            )}
            <path
              d={path.linePath}
              fill="none"
              stroke={path.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={style.animation ? 'animate-line' : ''}
            />
          </g>
        ))}

        {/* Points */}
        {showPoints &&
          paths.map((path, pathIndex) =>
            path.points.map((pt, i) => (
              <g key={`${pathIndex}-${i}`} className="data-point">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={4}
                  fill={path.color}
                  stroke="#fff"
                  strokeWidth={2}
                  className={style.animation ? 'animate-point' : ''}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
                {tooltip?.enabled && (
                  <title>{`${pt.label}: ${formatNumber(pt.value)}`}</title>
                )}
              </g>
            ))
          )}

        {/* Annotations */}
        {config.annotations?.map((annotation) => {
          if (annotation.type === 'line' && annotation.y !== undefined) {
            const yPos =
              chartHeight -
              30 -
              ((Number(annotation.y) - (gridLines[0]?.value || 0)) /
                ((gridLines[gridLines.length - 1]?.value || 1) - (gridLines[0]?.value || 0))) *
                (chartHeight - 50);

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

export default LineChart;

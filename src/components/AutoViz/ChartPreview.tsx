// =============================================================================
// CHART PREVIEW — Preview chart configuration
// =============================================================================

import React, { useMemo } from 'react';
import type { ChartConfig } from '../../autoviz/types';

interface ChartPreviewProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  showTitle?: boolean;
  interactive?: boolean;
}

export const ChartPreview: React.FC<ChartPreviewProps> = ({
  config,
  width = 400,
  height = 300,
  showTitle = true,
  interactive = false,
}) => {
  const { type, data, colorScheme, style } = config;

  // Calculate chart dimensions
  const padding = style.padding || 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2 - (showTitle ? 40 : 0);

  // Render chart based on type
  const chartContent = useMemo(() => {
    switch (type) {
      case 'line':
        return renderLineChart(data, chartWidth, chartHeight, colorScheme.colors);
      case 'bar':
        return renderBarChart(data, chartWidth, chartHeight, colorScheme.colors, true);
      case 'column':
        return renderBarChart(data, chartWidth, chartHeight, colorScheme.colors, false);
      case 'pie':
      case 'donut':
        return renderPieChart(data, chartWidth, chartHeight, colorScheme.colors, type === 'donut');
      case 'area':
        return renderAreaChart(data, chartWidth, chartHeight, colorScheme.colors);
      case 'scatter':
        return renderScatterChart(data, chartWidth, chartHeight, colorScheme.colors);
      default:
        return renderBarChart(data, chartWidth, chartHeight, colorScheme.colors, false);
    }
  }, [type, data, chartWidth, chartHeight, colorScheme.colors]);

  return (
    <div
      className={`chart-preview ${interactive ? 'interactive' : ''}`}
      style={{
        width,
        height,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding,
      }}
    >
      {showTitle && (
        <div className="chart-preview-title" style={{ color: style.titleFont.color }}>
          <h3 style={{ fontSize: style.titleFont.size, fontWeight: style.titleFont.weight }}>
            {config.title}
          </h3>
          {config.subtitle && (
            <p style={{ fontSize: style.subtitleFont.size, color: style.subtitleFont.color }}>
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="chart-preview-svg"
      >
        {chartContent}
      </svg>

      {/* Legend */}
      {config.legend?.show && data.datasets.length > 1 && (
        <div className="chart-preview-legend">
          {data.datasets.map((ds, i) => (
            <div key={i} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: ds.color || colorScheme.colors[i] }}
              />
              <span className="legend-label">{ds.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper render functions
function renderLineChart(
  data: ChartConfig['data'],
  width: number,
  height: number,
  colors: string[]
): React.ReactNode {
  if (!data.datasets.length || !data.datasets[0].data.length) return null;

  const maxValue = Math.max(...data.datasets.flatMap((ds) => ds.data));
  const minValue = Math.min(0, ...data.datasets.flatMap((ds) => ds.data));
  const range = maxValue - minValue || 1;

  const xStep = width / (data.datasets[0].data.length - 1 || 1);
  const yScale = (height - 20) / range;

  return (
    <g>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={0}
          y1={height - 10 - ratio * (height - 20)}
          x2={width}
          y2={height - 10 - ratio * (height - 20)}
          stroke="#e5e7eb"
          strokeDasharray="4"
        />
      ))}

      {/* Lines */}
      {data.datasets.map((dataset, dsIndex) => {
        const points = dataset.data.map((value, i) => ({
          x: i * xStep,
          y: height - 10 - (value - minValue) * yScale,
        }));

        const pathData = points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ');

        return (
          <g key={dsIndex}>
            <path
              d={pathData}
              fill="none"
              stroke={dataset.color || colors[dsIndex]}
              strokeWidth="2"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={dataset.color || colors[dsIndex]}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function renderBarChart(
  data: ChartConfig['data'],
  width: number,
  height: number,
  colors: string[],
  horizontal: boolean
): React.ReactNode {
  if (!data.datasets.length || !data.datasets[0].data.length) return null;

  const maxValue = Math.max(...data.datasets.flatMap((ds) => ds.data));
  const barCount = data.datasets[0].data.length;
  const groupCount = data.datasets.length;
  const gap = horizontal ? 10 : 8;

  if (horizontal) {
    const barHeight = (height - gap * (barCount - 1)) / barCount / groupCount;
    const scale = (width - 40) / (maxValue || 1);

    return (
      <g>
        {data.datasets.map((dataset, dsIndex) =>
          dataset.data.map((value, i) => (
            <g key={`${dsIndex}-${i}`}>
              <rect
                x={40}
                y={i * (barHeight * groupCount + gap) + dsIndex * barHeight}
                width={value * scale}
                height={barHeight - 2}
                fill={dataset.color || colors[dsIndex]}
                rx="2"
              />
              <text
                x={35}
                y={i * (barHeight * groupCount + gap) + dsIndex * barHeight + barHeight / 2}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {data.labels?.[i]?.substring(0, 8) || i + 1}
              </text>
            </g>
          ))
        )}
      </g>
    );
  } else {
    const barWidth = (width - gap * (barCount - 1)) / barCount / groupCount;
    const scale = (height - 30) / (maxValue || 1);

    return (
      <g>
        {data.datasets.map((dataset, dsIndex) =>
          dataset.data.map((value, i) => (
            <g key={`${dsIndex}-${i}`}>
              <rect
                x={i * (barWidth * groupCount + gap) + dsIndex * barWidth}
                y={height - 20 - value * scale}
                width={barWidth - 2}
                height={value * scale}
                fill={dataset.color || colors[dsIndex]}
                rx="2"
              />
              {dsIndex === 0 && (
                <text
                  x={i * (barWidth * groupCount + gap) + (barWidth * groupCount) / 2}
                  y={height - 5}
                  fontSize="9"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {data.labels?.[i]?.substring(0, 6) || i + 1}
                </text>
              )}
            </g>
          ))
        )}
      </g>
    );
  }
}

function renderPieChart(
  data: ChartConfig['data'],
  width: number,
  height: number,
  colors: string[],
  isDonut: boolean
): React.ReactNode {
  if (!data.datasets.length || !data.datasets[0].data.length) return null;

  const values = data.datasets[0].data;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const radius = Math.min(width, height) / 2 - 10;
  const innerRadius = isDonut ? radius * 0.6 : 0;
  const cx = width / 2;
  const cy = height / 2;

  let startAngle = -Math.PI / 2;
  const slices: React.ReactNode[] = [];

  values.forEach((value, i) => {
    const angle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const innerX1 = cx + innerRadius * Math.cos(startAngle);
    const innerY1 = cy + innerRadius * Math.sin(startAngle);
    const innerX2 = cx + innerRadius * Math.cos(endAngle);
    const innerY2 = cy + innerRadius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = isDonut
      ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    slices.push(
      <path
        key={i}
        d={pathData}
        fill={colors[i % colors.length]}
        stroke="#fff"
        strokeWidth="2"
      />
    );

    startAngle = endAngle;
  });

  return <g>{slices}</g>;
}

function renderAreaChart(
  data: ChartConfig['data'],
  width: number,
  height: number,
  colors: string[]
): React.ReactNode {
  if (!data.datasets.length || !data.datasets[0].data.length) return null;

  const maxValue = Math.max(...data.datasets.flatMap((ds) => ds.data));
  const minValue = Math.min(0, ...data.datasets.flatMap((ds) => ds.data));
  const range = maxValue - minValue || 1;

  const xStep = width / (data.datasets[0].data.length - 1 || 1);
  const yScale = (height - 20) / range;
  const baseline = height - 10;

  return (
    <g>
      {data.datasets.map((dataset, dsIndex) => {
        const points = dataset.data.map((value, i) => ({
          x: i * xStep,
          y: height - 10 - (value - minValue) * yScale,
        }));

        const areaPath =
          `M 0 ${baseline} ` +
          points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
          ` L ${width} ${baseline} Z`;

        const linePath = points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ');

        return (
          <g key={dsIndex}>
            <path
              d={areaPath}
              fill={dataset.color || colors[dsIndex]}
              opacity="0.3"
            />
            <path
              d={linePath}
              fill="none"
              stroke={dataset.color || colors[dsIndex]}
              strokeWidth="2"
            />
          </g>
        );
      })}
    </g>
  );
}

function renderScatterChart(
  data: ChartConfig['data'],
  width: number,
  height: number,
  colors: string[]
): React.ReactNode {
  if (!data.datasets.length || !data.datasets[0].data.length) return null;

  const allValues = data.datasets.flatMap((ds) => ds.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;

  const scale = (height - 20) / range;

  return (
    <g>
      {/* Grid */}
      {[0, 0.5, 1].map((ratio, i) => (
        <g key={i}>
          <line
            x1={0}
            y1={height - 10 - ratio * (height - 20)}
            x2={width}
            y2={height - 10 - ratio * (height - 20)}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
          <line
            x1={ratio * width}
            y1={0}
            x2={ratio * width}
            y2={height - 10}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
        </g>
      ))}

      {/* Points */}
      {data.datasets.map((dataset, dsIndex) =>
        dataset.data.map((value, i) => {
          const x = (i / (dataset.data.length - 1 || 1)) * width;
          const y = height - 10 - (value - minValue) * scale;

          return (
            <circle
              key={`${dsIndex}-${i}`}
              cx={x}
              cy={y}
              r="5"
              fill={dataset.color || colors[dsIndex]}
              opacity="0.7"
            />
          );
        })
      )}
    </g>
  );
}

export default ChartPreview;

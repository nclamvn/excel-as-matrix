// =============================================================================
// SPARKLINE — Compact inline chart component
// =============================================================================

import React, { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  showPoints?: boolean;
  showMinMax?: boolean;
  animated?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  showArea = false,
  showPoints = false,
  showMinMax = false,
  animated = true,
}) => {
  const { linePath, areaPath, points, minPoint, maxPoint } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: '', areaPath: '', points: [], minPoint: null, maxPoint: null };
    }

    const padding = 2;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    const xStep = plotWidth / Math.max(data.length - 1, 1);
    const yScale = plotHeight / range;

    const pts = data.map((value, i) => ({
      x: padding + i * xStep,
      y: padding + plotHeight - (value - minValue) * yScale,
      value,
      isMin: value === minValue,
      isMax: value === maxValue,
    }));

    // Line path
    const linePath = pts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');

    // Area path
    const areaPath = showArea
      ? `${linePath} L ${pts[pts.length - 1].x} ${padding + plotHeight} L ${padding} ${padding + plotHeight} Z`
      : '';

    // Find min/max points
    const minPtIndex = data.indexOf(minValue);
    const maxPtIndex = data.indexOf(maxValue);

    return {
      linePath,
      areaPath,
      points: pts,
      minPoint: pts[minPtIndex],
      maxPoint: pts[maxPtIndex],
    };
  }, [data, width, height, showArea]);

  if (!data || data.length === 0) {
    return <div className="sparkline-empty" style={{ width, height }} />;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`sparkline ${animated ? 'animated' : ''}`}
    >
      {/* Area fill */}
      {showArea && areaPath && (
        <path
          d={areaPath}
          fill={color}
          opacity={0.15}
          className={animated ? 'animate-area' : ''}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-line' : ''}
      />

      {/* Points */}
      {showPoints &&
        points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={2}
            fill={color}
            className={animated ? 'animate-point' : ''}
            style={{ animationDelay: `${i * 20}ms` }}
          />
        ))}

      {/* Min/Max markers */}
      {showMinMax && minPoint && minPoint !== maxPoint && (
        <>
          <circle
            cx={minPoint.x}
            cy={minPoint.y}
            r={3}
            fill="#ef4444"
          />
          {maxPoint && (
            <circle
              cx={maxPoint.x}
              cy={maxPoint.y}
              r={3}
              fill="#22c55e"
            />
          )}
        </>
      )}

      {/* End point marker */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1}
        />
      )}
    </svg>
  );
};

// Sparkline Bar variant
interface SparklineBarProps {
  data: number[];
  width?: number;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
  gap?: number;
}

export const SparklineBar: React.FC<SparklineBarProps> = ({
  data,
  width = 100,
  height = 30,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  gap = 1,
}) => {
  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];

    const padding = 2;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const maxAbsValue = Math.max(...data.map(Math.abs), 1);
    const barWidth = (plotWidth - gap * (data.length - 1)) / data.length;
    const yCenter = padding + plotHeight / 2;
    const yScale = (plotHeight / 2) / maxAbsValue;

    return data.map((value, i) => {
      const barHeight = Math.abs(value) * yScale;
      const isPositive = value >= 0;

      return {
        x: padding + i * (barWidth + gap),
        y: isPositive ? yCenter - barHeight : yCenter,
        width: barWidth,
        height: barHeight,
        color: isPositive ? positiveColor : negativeColor,
        value,
      };
    });
  }, [data, width, height, positiveColor, negativeColor, gap]);

  if (!data || data.length === 0) {
    return <div className="sparkline-bar-empty" style={{ width, height }} />;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline-bar"
    >
      {/* Center line */}
      <line
        x1={2}
        y1={height / 2}
        x2={width - 2}
        y2={height / 2}
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {/* Bars */}
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={Math.max(bar.height, 1)}
          fill={bar.color}
          rx={1}
        />
      ))}
    </svg>
  );
};

// Sparkline with reference line
interface SparklineWithReferenceProps extends SparklineProps {
  referenceValue?: number;
  referenceLabel?: string;
}

export const SparklineWithReference: React.FC<SparklineWithReferenceProps> = ({
  referenceValue,
  referenceLabel,
  ...props
}) => {
  const { data, height = 30, color = '#3b82f6' } = props;

  if (!data || data.length === 0 || referenceValue === undefined) {
    return <Sparkline {...props} />;
  }

  const minValue = Math.min(...data, referenceValue);
  const maxValue = Math.max(...data, referenceValue);
  const range = maxValue - minValue || 1;
  const padding = 2;
  const plotHeight = height - padding * 2;
  const refY = padding + plotHeight - ((referenceValue - minValue) / range) * plotHeight;

  return (
    <div className="sparkline-with-reference" style={{ position: 'relative' }}>
      <Sparkline {...props} />
      <svg
        style={{ position: 'absolute', top: 0, left: 0 }}
        width={props.width || 100}
        height={height}
      >
        <line
          x1={0}
          y1={refY}
          x2={props.width || 100}
          y2={refY}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2"
          opacity={0.5}
        />
        {referenceLabel && (
          <text
            x={2}
            y={refY - 3}
            fontSize={8}
            fill={color}
          >
            {referenceLabel}
          </text>
        )}
      </svg>
    </div>
  );
};

export default Sparkline;

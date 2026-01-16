// =============================================================================
// CALIBRATION CHART — Visualize AI calibration (Blueprint §5.5)
// =============================================================================

import React from 'react';
import type { CalibrationMetrics, CalibrationBucket } from '../../ai/trust/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CalibrationChartProps {
  calibration: CalibrationMetrics;
  width?: number;
  height?: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  calibration,
  width = 300,
  height = 200,
  className = '',
}) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (v: number) => padding.left + v * chartWidth;
  const yScale = (v: number) => padding.top + (1 - v) * chartHeight;

  return (
    <div className={`calibration-chart ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="calibration-chart__svg"
      >
        {/* Grid lines */}
        <g className="calibration-chart__grid">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={`h-${v}`}
              x1={padding.left}
              y1={yScale(v)}
              x2={width - padding.right}
              y2={yScale(v)}
              className="calibration-chart__grid-line"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={`v-${v}`}
              x1={xScale(v)}
              y1={padding.top}
              x2={xScale(v)}
              y2={height - padding.bottom}
              className="calibration-chart__grid-line"
            />
          ))}
        </g>

        {/* Perfect calibration line */}
        <line
          x1={xScale(0)}
          y1={yScale(0)}
          x2={xScale(1)}
          y2={yScale(1)}
          className="calibration-chart__perfect-line"
        />

        {/* Calibration buckets */}
        <g className="calibration-chart__buckets">
          {calibration.buckets.map((bucket, i) => {
            const x = xScale((bucket.range[0] + bucket.range[1]) / 2);
            const y = yScale(bucket.actualAccuracy);
            const color = bucket.isCalibrated ? '#22c55e' : '#f97316';

            if (bucket.sampleCount === 0) {
              return null;
            }

            return (
              <g key={i}>
                {/* Bucket bar */}
                <rect
                  x={xScale(bucket.range[0]) + 2}
                  y={yScale(bucket.actualAccuracy)}
                  width={chartWidth / 5 - 4}
                  height={Math.max(2, yScale(0) - yScale(bucket.actualAccuracy))}
                  fill={color}
                  opacity={0.3}
                  className="calibration-chart__bucket-bar"
                />

                {/* Bucket point */}
                <circle
                  cx={x}
                  cy={y}
                  r={Math.min(8, Math.max(4, bucket.sampleCount / 2))}
                  fill={color}
                  className="calibration-chart__bucket-point"
                />

                {/* Sample count label */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="calibration-chart__bucket-label"
                >
                  n={bucket.sampleCount}
                </text>
              </g>
            );
          })}
        </g>

        {/* Axes */}
        <g className="calibration-chart__axes">
          {/* X axis */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            className="calibration-chart__axis"
          />

          {/* Y axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            className="calibration-chart__axis"
          />

          {/* X axis labels */}
          {[0, 0.5, 1].map((v) => (
            <text
              key={`x-${v}`}
              x={xScale(v)}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="calibration-chart__axis-label"
            >
              {Math.round(v * 100)}%
            </text>
          ))}

          {/* Y axis labels */}
          {[0, 0.5, 1].map((v) => (
            <text
              key={`y-${v}`}
              x={padding.left - 10}
              y={yScale(v) + 4}
              textAnchor="end"
              className="calibration-chart__axis-label"
            >
              {Math.round(v * 100)}%
            </text>
          ))}

          {/* Axis titles */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="calibration-chart__axis-title"
          >
            Predicted Confidence
          </text>

          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
            className="calibration-chart__axis-title"
          >
            Actual Accuracy
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="calibration-chart__legend">
        <div className="calibration-chart__legend-item">
          <span
            className="calibration-chart__legend-line"
            style={{ backgroundColor: '#6b7280' }}
          />
          <span>Perfect Calibration</span>
        </div>
        <div className="calibration-chart__legend-item">
          <span
            className="calibration-chart__legend-dot"
            style={{ backgroundColor: '#22c55e' }}
          />
          <span>Well Calibrated</span>
        </div>
        <div className="calibration-chart__legend-item">
          <span
            className="calibration-chart__legend-dot"
            style={{ backgroundColor: '#f97316' }}
          />
          <span>Needs Adjustment</span>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Calibration Buckets Table
// -----------------------------------------------------------------------------

interface CalibrationBucketsTableProps {
  buckets: CalibrationBucket[];
  className?: string;
}

export const CalibrationBucketsTable: React.FC<CalibrationBucketsTableProps> = ({
  buckets,
  className = '',
}) => {
  return (
    <div className={`calibration-table ${className}`}>
      <table>
        <thead>
          <tr>
            <th>Range</th>
            <th>Predicted</th>
            <th>Actual</th>
            <th>Samples</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, i) => (
            <tr key={i} className={bucket.isCalibrated ? '' : 'calibration-table__row--warning'}>
              <td>
                {Math.round(bucket.range[0] * 100)}% - {Math.round(bucket.range[1] * 100)}%
              </td>
              <td>{Math.round(bucket.predictedAccuracy * 100)}%</td>
              <td>{Math.round(bucket.actualAccuracy * 100)}%</td>
              <td>{bucket.sampleCount}</td>
              <td>
                {bucket.sampleCount === 0 ? (
                  <span className="calibration-table__status calibration-table__status--empty">
                    No data
                  </span>
                ) : bucket.isCalibrated ? (
                  <span className="calibration-table__status calibration-table__status--good">
                    ✓ Calibrated
                  </span>
                ) : bucket.predictedAccuracy > bucket.actualAccuracy ? (
                  <span className="calibration-table__status calibration-table__status--over">
                    ↑ Overconfident
                  </span>
                ) : (
                  <span className="calibration-table__status calibration-table__status--under">
                    ↓ Underconfident
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mini Calibration Indicator
// -----------------------------------------------------------------------------

interface MiniCalibrationProps {
  calibration: number;
  trend: 'improving' | 'stable' | 'declining';
  className?: string;
}

export const MiniCalibration: React.FC<MiniCalibrationProps> = ({
  calibration,
  trend,
  className = '',
}) => {
  const color = calibration >= 0.8 ? '#22c55e' : calibration >= 0.6 ? '#eab308' : '#f97316';
  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';

  return (
    <div
      className={`mini-calibration ${className}`}
      style={{ '--cal-color': color } as React.CSSProperties}
    >
      <span className="mini-calibration__icon">🎯</span>
      <span className="mini-calibration__value">
        {Math.round(calibration * 100)}%
      </span>
      <span className="mini-calibration__trend">{trendIcon}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Calibration Status Bar
// -----------------------------------------------------------------------------

interface CalibrationStatusBarProps {
  metrics: CalibrationMetrics;
  className?: string;
}

export const CalibrationStatusBar: React.FC<CalibrationStatusBarProps> = ({
  metrics,
  className = '',
}) => {
  const calibrated = metrics.buckets.filter((b) => b.isCalibrated && b.sampleCount > 0).length;
  const total = metrics.buckets.filter((b) => b.sampleCount > 0).length;

  return (
    <div className={`calibration-status-bar ${className}`}>
      <div className="calibration-status-bar__header">
        <span className="calibration-status-bar__title">AI Calibration</span>
        <span className="calibration-status-bar__score">
          {calibrated}/{total} buckets calibrated
        </span>
      </div>

      <div className="calibration-status-bar__bar">
        {metrics.buckets.map((bucket, i) => (
          <div
            key={i}
            className="calibration-status-bar__segment"
            style={{
              backgroundColor: bucket.sampleCount === 0
                ? '#e5e7eb'
                : bucket.isCalibrated
                  ? '#22c55e'
                  : '#f97316',
            }}
            title={`${Math.round(bucket.range[0] * 100)}-${Math.round(bucket.range[1] * 100)}%: ${bucket.sampleCount} samples`}
          />
        ))}
      </div>

      <div className="calibration-status-bar__footer">
        <span>Recent: {Math.round(metrics.recentAccuracy * 100)}%</span>
        <span>Trend: {formatTrend(metrics.trend)}</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatTrend(trend: string): string {
  switch (trend) {
    case 'improving':
      return '📈';
    case 'declining':
      return '📉';
    default:
      return '➡️';
  }
}

export default CalibrationChart;

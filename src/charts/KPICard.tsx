// =============================================================================
// KPI CARD — KPI display card component
// =============================================================================

import React from 'react';
import type { ChartConfig } from '../autoviz/types';
import { Sparkline } from './Sparkline';

interface KPICardProps {
  config: ChartConfig;
  width?: number;
  height?: number;
  showTrend?: boolean;
  showSparkline?: boolean;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent';
  prefix?: string;
  suffix?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  config,
  width = 200,
  height = 120,
  showTrend = true,
  showSparkline = true,
  previousValue,
  format = 'number',
  prefix = '',
  suffix = '',
}) => {
  const { data, colorScheme, style, title } = config;

  // Get current value (last value in dataset)
  const values = data.datasets[0]?.data || [];
  const currentValue = values[values.length - 1] || 0;

  // Calculate change
  const prevValue = previousValue ?? (values.length > 1 ? values[values.length - 2] : currentValue);
  const change = prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
  const isPositive = change >= 0;

  // Format value
  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        if (Math.abs(value) >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(value) >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
  };

  const displayValue = `${prefix}${formatValue(currentValue)}${suffix}`;

  return (
    <div
      className="kpi-card"
      style={{
        width,
        height,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
        boxShadow: style.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      {/* Header */}
      <div className="kpi-header">
        <span
          className="kpi-title"
          style={{
            fontSize: style.labelFont.size,
            color: style.labelFont.color,
          }}
        >
          {title || 'KPI'}
        </span>
        {showTrend && (
          <span
            className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}
            style={{
              color: isPositive
                ? colorScheme.positive || '#22c55e'
                : colorScheme.negative || '#ef4444',
            }}
          >
            {isPositive ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className="kpi-value"
        style={{
          fontSize: Math.min(style.titleFont.size * 2, height * 0.35),
          fontWeight: 'bold',
          color: colorScheme.colors[0] || style.titleFont.color,
        }}
      >
        {displayValue}
      </div>

      {/* Sparkline */}
      {showSparkline && values.length > 2 && (
        <div className="kpi-sparkline">
          <Sparkline
            data={values}
            width={width - style.padding * 2}
            height={Math.min(30, height * 0.25)}
            color={colorScheme.colors[0]}
            showArea={true}
          />
        </div>
      )}

      {/* Previous value */}
      {previousValue !== undefined && (
        <div
          className="kpi-previous"
          style={{
            fontSize: style.subtitleFont.size,
            color: style.subtitleFont.color,
          }}
        >
          vs {formatValue(previousValue)} prev
        </div>
      )}
    </div>
  );
};

export default KPICard;

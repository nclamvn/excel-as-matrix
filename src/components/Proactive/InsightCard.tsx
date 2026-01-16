// =============================================================================
// INSIGHT CARD — Display for data insights
// =============================================================================

import React from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface InsightCardProps {
  insight: ProactiveSuggestion;
  onAction: (suggestionId: string, actionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

// -----------------------------------------------------------------------------
// Insight Card Component
// -----------------------------------------------------------------------------

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onAction,
  onDismiss,
}) => {
  const categoryConfig = getCategoryConfig(insight.category);
  const metadata = insight.metadata as InsightMetadata | undefined;

  return (
    <div className="insight-card">
      <div className="insight-card__header">
        <div className="insight-card__icon" style={{ backgroundColor: categoryConfig.bgColor }}>
          {categoryConfig.icon}
        </div>
        <div className="insight-card__category">{categoryConfig.label}</div>
        <button
          className="insight-card__dismiss"
          onClick={() => onDismiss(insight.id)}
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="insight-card__content">
        <h4 className="insight-card__title">{insight.title}</h4>
        <p className="insight-card__description">{insight.description}</p>

        {/* Trend visualization */}
        {insight.category === 'trend' && metadata?.trend && (
          <div className="insight-card__trend">
            <TrendIndicator
              direction={metadata.trend.direction}
              percentage={metadata.trend.percentage}
            />
            <div className="insight-card__trend-details">
              <span className="insight-card__trend-label">
                {metadata.trend.direction === 'up' ? 'Increasing' : 'Decreasing'}
              </span>
              <span className="insight-card__trend-value">
                R² = {metadata.trend.rSquared?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Correlation visualization */}
        {insight.category === 'correlation' && metadata?.correlation && (
          <div className="insight-card__correlation">
            <CorrelationBar value={metadata.correlation.coefficient} />
            <div className="insight-card__correlation-details">
              <span>{metadata.correlation.columnA}</span>
              <span className="insight-card__correlation-arrow">↔</span>
              <span>{metadata.correlation.columnB}</span>
            </div>
          </div>
        )}

        {/* Anomaly highlight */}
        {insight.category === 'anomaly' && metadata?.anomaly && (
          <div className="insight-card__anomaly">
            <div className="insight-card__anomaly-value">
              {metadata.anomaly.value}
            </div>
            <div className="insight-card__anomaly-expected">
              Expected: {metadata.anomaly.expected}
            </div>
          </div>
        )}

        {/* Confidence indicator */}
        <div className="insight-card__confidence">
          <div
            className="insight-card__confidence-bar"
            style={{ width: `${insight.confidence * 100}%` }}
          />
          <span className="insight-card__confidence-text">
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="insight-card__actions">
        {insight.actions.map(action => (
          <button
            key={action.id}
            className={`insight-card__action insight-card__action--${action.type}`}
            onClick={() => onAction(insight.id, action.id)}
          >
            {action.type === 'primary' && <ChartIcon />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  percentage?: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ direction, percentage }) => (
  <div className={`trend-indicator trend-indicator--${direction}`}>
    {direction === 'up' && <TrendUpIcon />}
    {direction === 'down' && <TrendDownIcon />}
    {direction === 'stable' && <TrendStableIcon />}
    {percentage !== undefined && (
      <span className="trend-indicator__value">
        {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
      </span>
    )}
  </div>
);

interface CorrelationBarProps {
  value: number;
}

const CorrelationBar: React.FC<CorrelationBarProps> = ({ value }) => {
  const isPositive = value >= 0;
  const width = Math.abs(value) * 50;
  const strength = Math.abs(value) > 0.7 ? 'strong' : Math.abs(value) > 0.4 ? 'moderate' : 'weak';

  return (
    <div className="correlation-bar">
      <div className="correlation-bar__track">
        <div className="correlation-bar__center" />
        <div
          className={`correlation-bar__fill correlation-bar__fill--${isPositive ? 'positive' : 'negative'}`}
          style={{
            width: `${width}%`,
            left: isPositive ? '50%' : `${50 - width}%`,
          }}
        />
      </div>
      <div className="correlation-bar__label">
        <span className={`correlation-bar__strength correlation-bar__strength--${strength}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)} {isPositive ? 'positive' : 'negative'}
        </span>
        <span className="correlation-bar__value">{value.toFixed(2)}</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface InsightMetadata {
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage?: number;
    rSquared?: number;
  };
  correlation?: {
    coefficient: number;
    columnA: string;
    columnB: string;
  };
  anomaly?: {
    value: string | number;
    expected: string | number;
  };
}

function getCategoryConfig(category?: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; bgColor: string }> = {
    trend: {
      label: 'Trend Detected',
      icon: <TrendIcon />,
      bgColor: '#dbeafe',
    },
    correlation: {
      label: 'Correlation Found',
      icon: <LinkIcon />,
      bgColor: '#dcfce7',
    },
    anomaly: {
      label: 'Anomaly Detected',
      icon: <AlertCircleIcon />,
      bgColor: '#fef3c7',
    },
    milestone: {
      label: 'Milestone Reached',
      icon: <FlagIcon />,
      bgColor: '#f3e8ff',
    },
    distribution: {
      label: 'Distribution Analysis',
      icon: <BarChartIcon />,
      bgColor: '#fce7f3',
    },
    summary: {
      label: 'Data Summary',
      icon: <FileTextIcon />,
      bgColor: '#e0e7ff',
    },
  };
  return configs[category || ''] || { label: 'Insight', icon: <LightbulbIcon />, bgColor: '#f3f4f6' };
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TrendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const TrendStableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FlagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

export default InsightCard;

// =============================================================================
// INSIGHT PANEL — Display data insights
// =============================================================================

import React from 'react';
import type { ChartInsight, InsightType } from '../../autoviz/types';

interface InsightPanelProps {
  insights: ChartInsight[];
  language?: 'en' | 'vi';
  maxItems?: number;
}

const INSIGHT_ICONS: Record<InsightType, React.ReactNode> = {
  peak: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8"/>
      <path d="M17 7h4v4"/>
    </svg>
  ),
  valley: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7l6 6 4-4 8 8"/>
      <path d="M17 17h4v-4"/>
    </svg>
  ),
  trend_up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 20l7-7 4 4 7-9"/>
      <path d="M17 8h6v6"/>
    </svg>
  ),
  trend_down: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4l7 7 4-4 7 9"/>
      <path d="M17 16h6v-6"/>
    </svg>
  ),
  anomaly: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
  milestone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <path d="M4 22v-7"/>
    </svg>
  ),
  correlation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="6" r="3"/>
      <path d="M8.5 15.5l7-7"/>
    </svg>
  ),
  seasonality: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12c0-3.87 3.13-7 7-7 1.93 0 3.68.78 4.95 2.05"/>
      <path d="M20 12c0 3.87-3.13 7-7 7-1.93 0-3.68-.78-4.95-2.05"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

const INSIGHT_COLORS: Record<InsightType, string> = {
  peak: '#22c55e',
  valley: '#ef4444',
  trend_up: '#22c55e',
  trend_down: '#ef4444',
  anomaly: '#f59e0b',
  milestone: '#8b5cf6',
  correlation: '#3b82f6',
  seasonality: '#06b6d4',
};

const IMPORTANCE_STYLES: Record<string, string> = {
  high: 'insight-importance-high',
  medium: 'insight-importance-medium',
  low: 'insight-importance-low',
};

export const InsightPanel: React.FC<InsightPanelProps> = ({
  insights,
  language = 'en',
  maxItems = 5,
}) => {
  const displayedInsights = insights.slice(0, maxItems);

  if (displayedInsights.length === 0) {
    return (
      <div className="insight-panel-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <p>
          {language === 'vi'
            ? 'Không phát hiện thông tin đáng chú ý'
            : 'No significant insights detected'}
        </p>
      </div>
    );
  }

  return (
    <div className="insight-panel">
      {displayedInsights.map((insight) => (
        <div
          key={insight.id}
          className={`insight-item ${IMPORTANCE_STYLES[insight.importance]}`}
        >
          <div
            className="insight-icon"
            style={{ color: INSIGHT_COLORS[insight.type] }}
          >
            {INSIGHT_ICONS[insight.type]}
          </div>

          <div className="insight-content">
            <div className="insight-header">
              <h4 className="insight-title">
                {language === 'vi' ? insight.titleVi : insight.title}
              </h4>
              <span
                className="insight-badge"
                style={{ backgroundColor: `${INSIGHT_COLORS[insight.type]}20` }}
              >
                {insight.type.replace('_', ' ')}
              </span>
            </div>

            <p className="insight-description">
              {language === 'vi' ? insight.descriptionVi : insight.description}
            </p>

            {insight.value !== undefined && (
              <div className="insight-value">
                <span className="value-label">
                  {language === 'vi' ? 'Giá trị:' : 'Value:'}
                </span>
                <span className="value-number">
                  {typeof insight.value === 'number'
                    ? insight.value.toLocaleString()
                    : insight.value}
                </span>
                {insight.changePercent !== undefined && (
                  <span
                    className={`value-change ${
                      insight.changePercent > 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {insight.changePercent > 0 ? '+' : ''}
                    {insight.changePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="insight-importance">
            <span className={`importance-dot importance-${insight.importance}`} />
          </div>
        </div>
      ))}

      {insights.length > maxItems && (
        <div className="insight-more">
          <span>
            {language === 'vi'
              ? `+${insights.length - maxItems} thông tin khác`
              : `+${insights.length - maxItems} more insights`}
          </span>
        </div>
      )}
    </div>
  );
};

export default InsightPanel;

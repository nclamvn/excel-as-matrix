// =============================================================================
// TRUST DASHBOARD — Overall AI trust metrics (Blueprint §5.5)
// =============================================================================

import React, { useState } from 'react';
import type {
  TrustScore,
  CalibrationMetrics,
  ConfidenceScore,
  UncertaintyInfo,
} from '../../ai/trust/types';
import { ConfidenceMeter } from './ConfidenceMeter';
import { ConfidenceDetails } from './ConfidenceTooltip';
import { UncertaintyList } from './UncertaintyBadge';
import { SourceTypeList } from './SourceAttribution';
import { CalibrationChart } from './CalibrationChart';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TrustDashboardProps {
  trustScore?: TrustScore;
  calibration?: CalibrationMetrics;
  className?: string;
}

type TabId = 'overview' | 'confidence' | 'uncertainty' | 'sources' | 'calibration';

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const TrustDashboard: React.FC<TrustDashboardProps> = ({
  trustScore,
  calibration,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'confidence', label: 'Confidence', icon: '🎯' },
    { id: 'uncertainty', label: 'Uncertainty', icon: '⚡' },
    { id: 'sources', label: 'Sources', icon: '🔗' },
    { id: 'calibration', label: 'Calibration', icon: '📈' },
  ];

  return (
    <div className={`trust-dashboard ${className}`}>
      {/* Header */}
      <div className="trust-dashboard__header">
        <h2 className="trust-dashboard__title">AI Trust Dashboard</h2>
        {trustScore && (
          <TrustScoreBadge score={trustScore.overall} />
        )}
      </div>

      {/* Tabs */}
      <div className="trust-dashboard__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`trust-dashboard__tab ${activeTab === tab.id ? 'trust-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="trust-dashboard__tab-icon">{tab.icon}</span>
            <span className="trust-dashboard__tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="trust-dashboard__content">
        {activeTab === 'overview' && (
          <OverviewTab trustScore={trustScore} calibration={calibration} />
        )}
        {activeTab === 'confidence' && trustScore && (
          <ConfidenceTab confidence={trustScore.confidence} />
        )}
        {activeTab === 'uncertainty' && trustScore && (
          <UncertaintyTab uncertainty={trustScore.uncertainty} />
        )}
        {activeTab === 'sources' && trustScore && (
          <SourcesTab sources={trustScore.sources} />
        )}
        {activeTab === 'calibration' && calibration && (
          <CalibrationTab calibration={calibration} />
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Trust Score Badge
// -----------------------------------------------------------------------------

interface TrustScoreBadgeProps {
  score: number;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({ score }) => {
  const color = getTrustColor(score);
  const label = getTrustLabel(score);

  return (
    <div className="trust-score-badge" style={{ '--trust-color': color } as React.CSSProperties}>
      <span className="trust-score-badge__value">{score}</span>
      <span className="trust-score-badge__label">{label}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Overview Tab
// -----------------------------------------------------------------------------

interface OverviewTabProps {
  trustScore?: TrustScore;
  calibration?: CalibrationMetrics;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ trustScore, calibration }) => {
  if (!trustScore) {
    return (
      <div className="trust-dashboard__empty">
        <span className="trust-dashboard__empty-icon">📊</span>
        <p>No trust data available yet.</p>
        <p className="trust-dashboard__empty-hint">
          Trust metrics are calculated as you interact with the AI.
        </p>
      </div>
    );
  }

  return (
    <div className="trust-overview">
      {/* Main metrics */}
      <div className="trust-overview__metrics">
        <MetricCard
          icon="🎯"
          label="Confidence"
          value={`${Math.round(trustScore.confidence.overall * 100)}%`}
          sublabel={trustScore.confidence.level.replace('_', ' ')}
          color={getConfidenceLevelColor(trustScore.confidence.level)}
        />
        <MetricCard
          icon="⚡"
          label="Uncertainties"
          value={String(trustScore.uncertainty.totalCount)}
          sublabel={trustScore.uncertainty.hasBlockingUncertainty ? 'Review needed' : 'All clear'}
          color={trustScore.uncertainty.hasBlockingUncertainty ? '#f97316' : '#22c55e'}
        />
        <MetricCard
          icon="🔗"
          label="Sources"
          value={String(trustScore.sources.citationCount)}
          sublabel={trustScore.sources.groundedInData ? 'Data grounded' : 'Knowledge based'}
          color={trustScore.sources.groundedInData ? '#22c55e' : '#3b82f6'}
        />
        {calibration && (
          <MetricCard
            icon="📈"
            label="Calibration"
            value={`${Math.round(calibration.overallCalibration * 100)}%`}
            sublabel={calibration.trend}
            color={getCalibrationColor(calibration.overallCalibration)}
          />
        )}
      </div>

      {/* Recommendation */}
      <div className="trust-overview__recommendation">
        <RecommendationCard recommendation={trustScore.recommendation} />
      </div>

      {/* Quick summary */}
      <div className="trust-overview__summary">
        <h4>Summary</h4>
        <p>{trustScore.confidence.explanation}</p>
        {trustScore.uncertainty.totalCount > 0 && (
          <p className="trust-overview__warning">
            {trustScore.uncertainty.summary}
          </p>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Metric Card
// -----------------------------------------------------------------------------

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  sublabel,
  color,
}) => {
  return (
    <div className="metric-card">
      <span className="metric-card__icon">{icon}</span>
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value" style={{ color }}>
        {value}
      </span>
      <span className="metric-card__sublabel">{sublabel}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Recommendation Card
// -----------------------------------------------------------------------------

interface RecommendationCardProps {
  recommendation: TrustScore['recommendation'];
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
}) => {
  const actionInfo = getActionInfo(recommendation.action);

  return (
    <div
      className="recommendation-card"
      style={{ '--rec-color': actionInfo.color } as React.CSSProperties}
    >
      <div className="recommendation-card__header">
        <span className="recommendation-card__icon">{actionInfo.icon}</span>
        <span className="recommendation-card__action">{actionInfo.label}</span>
      </div>
      <p className="recommendation-card__reason">{recommendation.reason}</p>
      {recommendation.riskFactors.length > 0 && (
        <div className="recommendation-card__risks">
          <span className="recommendation-card__risks-label">Risk factors:</span>
          <ul>
            {recommendation.riskFactors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Confidence Tab
// -----------------------------------------------------------------------------

interface ConfidenceTabProps {
  confidence: ConfidenceScore;
}

const ConfidenceTab: React.FC<ConfidenceTabProps> = ({ confidence }) => {
  return (
    <div className="trust-confidence-tab">
      <div className="trust-confidence-tab__meter">
        <ConfidenceMeter
          score={confidence}
          size="lg"
          showLabel
          showBreakdown
        />
      </div>

      <div className="trust-confidence-tab__details">
        <h4>Factor Breakdown</h4>
        <ConfidenceDetails breakdown={confidence.breakdown} />
      </div>

      <div className="trust-confidence-tab__explanation">
        <h4>Analysis</h4>
        <p>{confidence.explanation}</p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Uncertainty Tab
// -----------------------------------------------------------------------------

interface UncertaintyTabProps {
  uncertainty: UncertaintyInfo;
}

const UncertaintyTab: React.FC<UncertaintyTabProps> = ({ uncertainty }) => {
  return (
    <div className="trust-uncertainty-tab">
      <div className="trust-uncertainty-tab__header">
        <span className="trust-uncertainty-tab__count">
          {uncertainty.totalCount} uncertaint{uncertainty.totalCount !== 1 ? 'ies' : 'y'}
        </span>
        {uncertainty.hasBlockingUncertainty && (
          <span className="trust-uncertainty-tab__blocking">
            Review Required
          </span>
        )}
      </div>

      <div className="trust-uncertainty-tab__summary">
        {uncertainty.summary}
      </div>

      <UncertaintyList items={uncertainty.items} />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Sources Tab
// -----------------------------------------------------------------------------

interface SourcesTabProps {
  sources: TrustScore['sources'];
}

const SourcesTab: React.FC<SourcesTabProps> = ({ sources }) => {
  return (
    <div className="trust-sources-tab">
      <div className="trust-sources-tab__header">
        <span className="trust-sources-tab__count">
          {sources.citationCount} source{sources.citationCount !== 1 ? 's' : ''}
        </span>
        <span
          className={`trust-sources-tab__grounded ${sources.groundedInData ? 'trust-sources-tab__grounded--yes' : ''}`}
        >
          {sources.groundedInData ? '✓ Grounded in data' : '○ Knowledge-based'}
        </span>
      </div>

      {sources.primarySource && (
        <div className="trust-sources-tab__primary">
          <h4>Primary Source</h4>
          <div className="trust-sources-tab__primary-item">
            <span>{sources.primarySource.reference}</span>
            <span>{sources.primarySource.relevance}</span>
          </div>
        </div>
      )}

      <SourceTypeList sources={sources.sources} />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Calibration Tab
// -----------------------------------------------------------------------------

interface CalibrationTabProps {
  calibration: CalibrationMetrics;
}

const CalibrationTab: React.FC<CalibrationTabProps> = ({ calibration }) => {
  return (
    <div className="trust-calibration-tab">
      <div className="trust-calibration-tab__metrics">
        <div className="trust-calibration-tab__metric">
          <span className="trust-calibration-tab__metric-label">
            Overall Calibration
          </span>
          <span
            className="trust-calibration-tab__metric-value"
            style={{ color: getCalibrationColor(calibration.overallCalibration) }}
          >
            {Math.round(calibration.overallCalibration * 100)}%
          </span>
        </div>
        <div className="trust-calibration-tab__metric">
          <span className="trust-calibration-tab__metric-label">
            Brier Score
          </span>
          <span className="trust-calibration-tab__metric-value">
            {calibration.brier.toFixed(3)}
          </span>
        </div>
        <div className="trust-calibration-tab__metric">
          <span className="trust-calibration-tab__metric-label">
            Recent Accuracy
          </span>
          <span className="trust-calibration-tab__metric-value">
            {Math.round(calibration.recentAccuracy * 100)}%
          </span>
        </div>
        <div className="trust-calibration-tab__metric">
          <span className="trust-calibration-tab__metric-label">
            Trend
          </span>
          <span className="trust-calibration-tab__metric-value">
            {formatTrend(calibration.trend)}
          </span>
        </div>
      </div>

      <div className="trust-calibration-tab__chart">
        <h4>Calibration Chart</h4>
        <CalibrationChart calibration={calibration} />
      </div>

      <div className="trust-calibration-tab__stats">
        <p>
          Based on {calibration.totalPredictions} predictions
        </p>
        <p className="trust-calibration-tab__updated">
          Last updated: {calibration.lastUpdated.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getTrustColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getTrustLabel(score: number): string {
  if (score >= 80) return 'High Trust';
  if (score >= 60) return 'Good Trust';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low Trust';
  return 'Very Low';
}

function getConfidenceLevelColor(level: string): string {
  switch (level) {
    case 'very_high':
      return '#15803d';
    case 'high':
      return '#22c55e';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#f97316';
    default:
      return '#ef4444';
  }
}

function getCalibrationColor(calibration: number): string {
  if (calibration >= 0.9) return '#22c55e';
  if (calibration >= 0.75) return '#84cc16';
  if (calibration >= 0.5) return '#eab308';
  return '#f97316';
}

function getActionInfo(action: string): { icon: string; label: string; color: string } {
  switch (action) {
    case 'auto_apply':
      return { icon: '✓', label: 'Safe to Auto-Apply', color: '#22c55e' };
    case 'review_suggested':
      return { icon: '👁', label: 'Review Suggested', color: '#eab308' };
    case 'review_required':
      return { icon: '⚠️', label: 'Review Required', color: '#f97316' };
    case 'manual_only':
      return { icon: '✋', label: 'Manual Review Only', color: '#ef4444' };
    default:
      return { icon: '?', label: 'Unknown', color: '#6b7280' };
  }
}

function formatTrend(trend: string): string {
  switch (trend) {
    case 'improving':
      return '📈 Improving';
    case 'stable':
      return '➡️ Stable';
    case 'declining':
      return '📉 Declining';
    default:
      return trend;
  }
}

export default TrustDashboard;

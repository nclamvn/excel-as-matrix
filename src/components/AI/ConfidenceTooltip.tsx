// =============================================================================
// CONFIDENCE TOOLTIP — Detailed confidence breakdown (Blueprint §5.4.6)
// =============================================================================

import React from 'react';
import type { ConfidenceScore, ConfidenceBreakdown } from '../../ai/trust/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ConfidenceTooltipProps {
  score: ConfidenceScore;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ConfidenceTooltip: React.FC<ConfidenceTooltipProps> = ({
  score,
  className = '',
}) => {
  return (
    <div className={`trust-tooltip ${className}`}>
      <div className="trust-tooltip__header">
        <span className="trust-tooltip__title">Confidence Breakdown</span>
        <span className="trust-tooltip__score">
          {Math.round(score.overall * 100)}%
        </span>
      </div>

      <div className="trust-tooltip__factors">
        <FactorRow
          label="Data Quality"
          description="Reliability of source data"
          value={score.breakdown.dataQuality}
        />
        <FactorRow
          label="Intent Clarity"
          description="How clear the request is"
          value={score.breakdown.intentClarity}
        />
        <FactorRow
          label="Task Complexity"
          description="Simplicity of the task"
          value={score.breakdown.taskComplexity}
        />
        <FactorRow
          label="Historical Accuracy"
          description="Past performance"
          value={score.breakdown.historicalAccuracy}
        />
        <FactorRow
          label="Grounding"
          description="Data grounding strength"
          value={score.breakdown.groundingStrength}
        />
      </div>

      <div className="trust-tooltip__explanation">
        {score.explanation}
      </div>

      <div className="trust-tooltip__footer">
        <span className="trust-tooltip__time">
          Assessed {formatTime(score.assessedAt)}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface FactorRowProps {
  label: string;
  description: string;
  value: number;
}

const FactorRow: React.FC<FactorRowProps> = ({ label, description, value }) => {
  const percentage = Math.round(value * 100);
  const barColor = getFactorColor(value);

  return (
    <div className="trust-tooltip__factor">
      <div className="trust-tooltip__factor-header">
        <span className="trust-tooltip__factor-label">{label}</span>
        <span className="trust-tooltip__factor-value">{percentage}%</span>
      </div>
      <div className="trust-tooltip__factor-bar">
        <div
          className="trust-tooltip__factor-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="trust-tooltip__factor-desc">{description}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Inline Confidence Indicator
// -----------------------------------------------------------------------------

interface InlineConfidenceProps {
  score: ConfidenceScore;
  showExplanation?: boolean;
  className?: string;
}

export const InlineConfidence: React.FC<InlineConfidenceProps> = ({
  score,
  showExplanation = false,
  className = '',
}) => {
  const percentage = Math.round(score.overall * 100);
  const color = getFactorColor(score.overall);

  return (
    <span className={`trust-inline ${className}`}>
      <span
        className="trust-inline__indicator"
        style={{ backgroundColor: color }}
      />
      <span className="trust-inline__value">{percentage}%</span>
      {showExplanation && (
        <span className="trust-inline__explanation">{score.explanation}</span>
      )}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Confidence Factor Details Panel
// -----------------------------------------------------------------------------

interface ConfidenceDetailsProps {
  breakdown: ConfidenceBreakdown;
  className?: string;
}

export const ConfidenceDetails: React.FC<ConfidenceDetailsProps> = ({
  breakdown,
  className = '',
}) => {
  const factors = [
    {
      key: 'dataQuality',
      label: 'Data Quality',
      value: breakdown.dataQuality,
      icon: '📊',
      description: 'How reliable and complete the source data is',
    },
    {
      key: 'intentClarity',
      label: 'Intent Clarity',
      value: breakdown.intentClarity,
      icon: '🎯',
      description: 'How well we understood your request',
    },
    {
      key: 'taskComplexity',
      label: 'Task Simplicity',
      value: breakdown.taskComplexity,
      icon: '⚡',
      description: 'How straightforward the task is to complete',
    },
    {
      key: 'historicalAccuracy',
      label: 'Track Record',
      value: breakdown.historicalAccuracy,
      icon: '📈',
      description: 'Past accuracy on similar tasks',
    },
    {
      key: 'groundingStrength',
      label: 'Data Grounding',
      value: breakdown.groundingStrength,
      icon: '🔗',
      description: 'How well grounded in actual spreadsheet data',
    },
  ];

  return (
    <div className={`trust-details ${className}`}>
      {factors.map((factor) => (
        <div key={factor.key} className="trust-details__item">
          <div className="trust-details__item-header">
            <span className="trust-details__item-icon">{factor.icon}</span>
            <span className="trust-details__item-label">{factor.label}</span>
            <span
              className="trust-details__item-value"
              style={{ color: getFactorColor(factor.value) }}
            >
              {Math.round(factor.value * 100)}%
            </span>
          </div>
          <div className="trust-details__item-bar">
            <div
              className="trust-details__item-fill"
              style={{
                width: `${factor.value * 100}%`,
                backgroundColor: getFactorColor(factor.value),
              }}
            />
          </div>
          <p className="trust-details__item-desc">{factor.description}</p>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getFactorColor(value: number): string {
  if (value >= 0.8) return '#22c55e'; // green
  if (value >= 0.6) return '#84cc16'; // lime
  if (value >= 0.4) return '#eab308'; // yellow
  if (value >= 0.2) return '#f97316'; // orange
  return '#ef4444'; // red
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default ConfidenceTooltip;

// =============================================================================
// CONFIDENCE METER — Visual confidence indicator (Blueprint §5.4.6)
// =============================================================================

import React, { useState } from 'react';
import type { ConfidenceScore, ConfidenceLevel } from '../../ai/trust/types';
import { ConfidenceTooltip } from './ConfidenceTooltip';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ConfidenceMeterProps {
  score: ConfidenceScore;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBreakdown?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  score,
  size = 'md',
  showLabel = true,
  showBreakdown = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const percentage = Math.round(score.overall * 100);
  const color = getConfidenceColor(score.level);
  const icon = getConfidenceIcon(score.level);

  const sizeClasses = {
    sm: 'trust-meter--sm',
    md: 'trust-meter--md',
    lg: 'trust-meter--lg',
  };

  return (
    <div
      className={`trust-meter ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Circular Progress */}
      <div className="trust-meter__ring" style={{ '--confidence-color': color } as React.CSSProperties}>
        <svg viewBox="0 0 36 36" className="trust-meter__svg">
          {/* Background circle */}
          <path
            className="trust-meter__bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress circle */}
          <path
            className="trust-meter__progress"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            style={{ stroke: color }}
          />
        </svg>
        {/* Center content */}
        <div className="trust-meter__center">
          <span className="trust-meter__icon">{icon}</span>
          <span className="trust-meter__value">{percentage}%</span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="trust-meter__label">
          <span className="trust-meter__label-text" style={{ color }}>
            {formatLevel(score.level)}
          </span>
        </div>
      )}

      {/* Breakdown bars */}
      {showBreakdown && (
        <div className="trust-meter__breakdown">
          <BreakdownBar
            label="Data"
            value={score.breakdown.dataQuality}
            color={color}
          />
          <BreakdownBar
            label="Intent"
            value={score.breakdown.intentClarity}
            color={color}
          />
          <BreakdownBar
            label="Complexity"
            value={score.breakdown.taskComplexity}
            color={color}
          />
          <BreakdownBar
            label="History"
            value={score.breakdown.historicalAccuracy}
            color={color}
          />
          <BreakdownBar
            label="Grounding"
            value={score.breakdown.groundingStrength}
            color={color}
          />
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <ConfidenceTooltip score={score} />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface BreakdownBarProps {
  label: string;
  value: number;
  color: string;
}

const BreakdownBar: React.FC<BreakdownBarProps> = ({ label, value, color }) => {
  const percentage = Math.round(value * 100);

  return (
    <div className="trust-breakdown-bar">
      <span className="trust-breakdown-bar__label">{label}</span>
      <div className="trust-breakdown-bar__track">
        <div
          className="trust-breakdown-bar__fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="trust-breakdown-bar__value">{percentage}%</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Confidence Badge
// -----------------------------------------------------------------------------

interface ConfidenceBadgeProps {
  score: ConfidenceScore;
  onClick?: () => void;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  onClick,
  className = '',
}) => {
  const percentage = Math.round(score.overall * 100);
  const color = getConfidenceColor(score.level);
  const icon = getConfidenceIcon(score.level);

  return (
    <button
      className={`trust-badge ${className}`}
      onClick={onClick}
      style={{ '--badge-color': color } as React.CSSProperties}
    >
      <span className="trust-badge__icon">{icon}</span>
      <span className="trust-badge__value">{percentage}%</span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'very_high':
      return '#15803d'; // green-700
    case 'high':
      return '#22c55e'; // green-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#f97316'; // orange-500
    case 'very_low':
      return '#ef4444'; // red-500
  }
}

function getConfidenceIcon(level: ConfidenceLevel): string {
  switch (level) {
    case 'very_high':
      return '✓✓';
    case 'high':
      return '✓';
    case 'medium':
      return '~';
    case 'low':
      return '?';
    case 'very_low':
      return '!';
  }
}

function formatLevel(level: ConfidenceLevel): string {
  switch (level) {
    case 'very_high':
      return 'Very High';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    case 'very_low':
      return 'Very Low';
  }
}

export default ConfidenceMeter;

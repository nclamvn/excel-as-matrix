// =============================================================================
// RISK BADGE — Visual risk level indicator (Blueprint §2.2.3)
// =============================================================================

import React from 'react';
import type { RiskLevel, DetectedRisk } from '../../ai/sandbox/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface RiskDetailsProps {
  risks: DetectedRisk[];
  compact?: boolean;
}

// -----------------------------------------------------------------------------
// Risk Badge Component
// -----------------------------------------------------------------------------

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  size = 'medium',
}) => {
  const getIcon = () => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
    }
  };

  return (
    <div className={`risk-badge risk-badge--${level} risk-badge--${size}`}>
      <span className="risk-badge-icon">{getIcon()}</span>
      <span className="risk-badge-label">{getLabel()}</span>
      {showScore && score !== undefined && (
        <span className="risk-badge-score">{score}/100</span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Risk Details Component
// -----------------------------------------------------------------------------

export const RiskDetails: React.FC<RiskDetailsProps> = ({
  risks,
  compact = false,
}) => {
  if (risks.length === 0) {
    return (
      <div className="risk-details risk-details--empty">
        <span className="risk-details-icon">✓</span>
        <span>No significant risks detected</span>
      </div>
    );
  }

  const getSeverityIcon = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
    }
  };

  const formatFactor = (factor: string) => {
    return factor
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (compact) {
    return (
      <div className="risk-details risk-details--compact">
        {risks.map((risk, index) => (
          <span key={index} className="risk-tag" title={risk.description}>
            {getSeverityIcon(risk.severity)} {formatFactor(risk.factor)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="risk-details">
      <div className="risk-details-header">Detected Risks</div>
      <ul className="risk-details-list">
        {risks.map((risk, index) => (
          <li key={index} className={`risk-item risk-item--${risk.severity}`}>
            <div className="risk-item-header">
              <span className="risk-item-icon">
                {getSeverityIcon(risk.severity)}
              </span>
              <span className="risk-item-factor">{formatFactor(risk.factor)}</span>
            </div>
            <p className="risk-item-description">{risk.description}</p>
            {risk.suggestion && (
              <p className="risk-item-suggestion">
                <strong>Suggestion:</strong> {risk.suggestion}
              </p>
            )}
            {risk.affectedCells && risk.affectedCells.length > 0 && (
              <div className="risk-item-cells">
                <span className="risk-item-cells-label">Affected:</span>
                {risk.affectedCells.slice(0, 5).map((cell) => (
                  <span key={cell} className="risk-item-cell">
                    {cell}
                  </span>
                ))}
                {risk.affectedCells.length > 5 && (
                  <span className="risk-item-cell-more">
                    +{risk.affectedCells.length - 5} more
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Risk Summary Component
// -----------------------------------------------------------------------------

interface RiskSummaryProps {
  level: RiskLevel;
  score: number;
  requiresApproval: boolean;
  canAutoApply: boolean;
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({
  level,
  score,
  requiresApproval,
  canAutoApply,
}) => {
  return (
    <div className={`risk-summary risk-summary--${level}`}>
      <RiskBadge level={level} score={score} showScore />
      <div className="risk-summary-status">
        {canAutoApply && (
          <span className="risk-status-tag risk-status-tag--auto">
            Can Auto-Apply
          </span>
        )}
        {requiresApproval && (
          <span className="risk-status-tag risk-status-tag--approval">
            Requires Approval
          </span>
        )}
      </div>
    </div>
  );
};

export default RiskBadge;

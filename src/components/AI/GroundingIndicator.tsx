// =============================================================================
// GROUNDING INDICATOR — Visual display of AI claim grounding (Blueprint §5.4)
// =============================================================================

import React, { useMemo } from 'react';
import type { GroundingReport, GroundedClaim } from '../../ai/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface GroundingIndicatorProps {
  report: GroundingReport;
  compact?: boolean;
  showDetails?: boolean;
}

interface ClaimBadgeProps {
  claim: GroundedClaim;
  onClick?: () => void;
}

// -----------------------------------------------------------------------------
// Icons (inline SVG for simplicity)
// -----------------------------------------------------------------------------

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const HelpCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// -----------------------------------------------------------------------------
// Claim Badge Component
// -----------------------------------------------------------------------------

const ClaimBadge: React.FC<ClaimBadgeProps> = ({ claim, onClick }) => {
  const getIcon = () => {
    switch (claim.groundingType) {
      case 'direct_read':
        return <span className="grounding-icon direct">📍</span>;
      case 'computed':
        return <span className="grounding-icon computed">🔢</span>;
      case 'inferred':
        return <span className="grounding-icon inferred">🤔</span>;
    }
  };

  const getConfidenceClass = () => {
    if (claim.confidence >= 0.8) return 'high';
    if (claim.confidence >= 0.5) return 'medium';
    return 'low';
  };

  return (
    <div
      className={`claim-badge ${claim.groundingType} ${getConfidenceClass()}`}
      onClick={onClick}
      title={`${claim.statement}\nConfidence: ${Math.round(claim.confidence * 100)}%`}
    >
      {getIcon()}
      <span className="claim-ref">{claim.source.ref}</span>
      {claim.verified && <CheckCircleIcon className="verified-icon" />}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const GroundingIndicator: React.FC<GroundingIndicatorProps> = ({
  report,
  compact = false,
  showDetails = false,
}) => {
  // Calculate stats
  const stats = useMemo(() => {
    const direct = report.claims.filter((c) => c.groundingType === 'direct_read').length;
    const computed = report.claims.filter((c) => c.groundingType === 'computed').length;
    const inferred = report.claims.filter((c) => c.groundingType === 'inferred').length;
    const verified = report.claims.filter((c) => c.verified).length;
    const total = report.claims.length;

    return { direct, computed, inferred, verified, total };
  }, [report.claims]);

  // Get status icon
  const StatusIcon = useMemo(() => {
    switch (report.verificationStatus) {
      case 'verified':
        return <CheckCircleIcon className="status-icon verified" />;
      case 'partial':
        return <AlertCircleIcon className="status-icon partial" />;
      case 'unverified':
        return <HelpCircleIcon className="status-icon unverified" />;
    }
  }, [report.verificationStatus]);

  // Compact view
  if (compact) {
    return (
      <div className="grounding-indicator compact">
        {StatusIcon}
        <span className="confidence-value">
          {Math.round(report.overallConfidence * 100)}%
        </span>
        <span className="claim-counts">
          {stats.direct > 0 && <span className="count direct">📍{stats.direct}</span>}
          {stats.computed > 0 && <span className="count computed">🔢{stats.computed}</span>}
          {stats.inferred > 0 && <span className="count inferred">🤔{stats.inferred}</span>}
        </span>
      </div>
    );
  }

  // Full view
  return (
    <div className="grounding-indicator">
      {/* Header */}
      <div className="grounding-header">
        {StatusIcon}
        <span className="status-label">
          {report.verificationStatus === 'verified' && 'All Claims Verified'}
          {report.verificationStatus === 'partial' && 'Partially Verified'}
          {report.verificationStatus === 'unverified' && 'Unverified'}
        </span>
        <span className="confidence-badge">
          {Math.round(report.overallConfidence * 100)}% confident
        </span>
      </div>

      {/* Stats */}
      <div className="grounding-stats">
        <div className="stat-item">
          <span className="stat-icon">📍</span>
          <span className="stat-label">Direct Reads</span>
          <span className="stat-value">{stats.direct}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🔢</span>
          <span className="stat-label">Computed</span>
          <span className="stat-value">{stats.computed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🤔</span>
          <span className="stat-label">Inferred</span>
          <span className="stat-value">{stats.inferred}</span>
        </div>
        <div className="stat-item verified">
          <CheckCircleIcon className="stat-icon-svg" />
          <span className="stat-label">Verified</span>
          <span className="stat-value">
            {stats.verified}/{stats.total}
          </span>
        </div>
      </div>

      {/* Claim Details */}
      {showDetails && report.claims.length > 0 && (
        <div className="grounding-details">
          <div className="details-header">Claims</div>
          <div className="claims-list">
            {report.claims.map((claim) => (
              <ClaimBadge key={claim.id} claim={claim} />
            ))}
          </div>
        </div>
      )}

      {/* Ungrounded Warnings */}
      {report.ungroundedStatements.length > 0 && (
        <div className="ungrounded-warnings">
          <div className="warning-header">
            <AlertCircleIcon className="warning-icon" />
            <span>Ungrounded Statements</span>
          </div>
          <ul className="warning-list">
            {report.ungroundedStatements.map((statement, i) => (
              <li key={i}>{statement}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence */}
      {showDetails && report.evidence.length > 0 && (
        <div className="evidence-section">
          <div className="evidence-header">Supporting Evidence</div>
          <div className="evidence-list">
            {report.evidence.map((ev) => (
              <div key={ev.id} className={`evidence-item ${ev.type}`}>
                <span className="evidence-type">{ev.type.replace('_', ' ')}</span>
                <span className="evidence-source">{ev.source}</span>
                {ev.quote && <blockquote className="evidence-quote">"{ev.quote}"</blockquote>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Inline Grounding Marker Component
// -----------------------------------------------------------------------------

interface GroundingMarkerProps {
  type: 'direct_read' | 'computed' | 'inferred';
  ref: string;
  value?: unknown;
  confidence?: number;
}

export const GroundingMarker: React.FC<GroundingMarkerProps> = ({
  type,
  ref,
  value,
  confidence = 1,
}) => {
  const icon = type === 'direct_read' ? '📍' : type === 'computed' ? '🔢' : '🤔';
  const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';

  return (
    <span
      className={`grounding-marker ${type} ${confidenceClass}`}
      title={`Source: ${ref}${value !== undefined ? `\nValue: ${value}` : ''}\nConfidence: ${Math.round(confidence * 100)}%`}
    >
      [{icon}{ref}]
    </span>
  );
};

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export default GroundingIndicator;

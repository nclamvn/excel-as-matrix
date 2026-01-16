// =============================================================================
// UNCERTAINTY BADGE — Display uncertainties and warnings (Blueprint §5.4.6)
// =============================================================================

import React, { useState } from 'react';
import type {
  UncertaintyInfo,
  UncertaintyItem,
  UncertaintySeverity,
  UncertaintyType,
} from '../../ai/trust/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface UncertaintyBadgeProps {
  info: UncertaintyInfo;
  onResolve?: (id: string) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const UncertaintyBadge: React.FC<UncertaintyBadgeProps> = ({
  info,
  onResolve,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (info.totalCount === 0) {
    return null;
  }

  const highestSeverity = getHighestSeverity(info.items);
  const color = getSeverityColor(highestSeverity);

  return (
    <div className={`uncertainty-badge ${className}`}>
      <button
        className="uncertainty-badge__trigger"
        onClick={() => setExpanded(!expanded)}
        style={{ '--severity-color': color } as React.CSSProperties}
      >
        <span className="uncertainty-badge__icon">
          {getSeverityIcon(highestSeverity)}
        </span>
        <span className="uncertainty-badge__count">{info.totalCount}</span>
        <span className="uncertainty-badge__label">
          {info.totalCount === 1 ? 'Uncertainty' : 'Uncertainties'}
        </span>
        <span className="uncertainty-badge__arrow">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="uncertainty-badge__dropdown">
          <div className="uncertainty-badge__header">
            <span>{info.summary}</span>
            {info.hasBlockingUncertainty && (
              <span className="uncertainty-badge__blocking">
                Review Required
              </span>
            )}
          </div>

          <div className="uncertainty-badge__list">
            {info.items.map((item) => (
              <UncertaintyItemRow
                key={item.id}
                item={item}
                onResolve={onResolve}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Uncertainty Item Row
// -----------------------------------------------------------------------------

interface UncertaintyItemRowProps {
  item: UncertaintyItem;
  onResolve?: (id: string) => void;
}

const UncertaintyItemRow: React.FC<UncertaintyItemRowProps> = ({
  item,
  onResolve,
}) => {
  const color = getSeverityColor(item.severity);
  const isResolved = !!item.resolvedAt;

  return (
    <div
      className={`uncertainty-item ${isResolved ? 'uncertainty-item--resolved' : ''}`}
      style={{ '--item-color': color } as React.CSSProperties}
    >
      <div className="uncertainty-item__header">
        <span className="uncertainty-item__icon">
          {getSeverityIcon(item.severity)}
        </span>
        <span className="uncertainty-item__type">
          {formatUncertaintyType(item.type)}
        </span>
        <span
          className="uncertainty-item__severity"
          style={{ color }}
        >
          {item.severity}
        </span>
      </div>

      <p className="uncertainty-item__description">{item.description}</p>

      {item.suggestion && (
        <p className="uncertainty-item__suggestion">
          <strong>Suggestion:</strong> {item.suggestion}
        </p>
      )}

      {item.affectedCells && item.affectedCells.length > 0 && (
        <div className="uncertainty-item__cells">
          <span>Affected:</span>
          {item.affectedCells.slice(0, 5).map((cell) => (
            <span key={cell} className="uncertainty-item__cell">
              {cell}
            </span>
          ))}
          {item.affectedCells.length > 5 && (
            <span className="uncertainty-item__more">
              +{item.affectedCells.length - 5} more
            </span>
          )}
        </div>
      )}

      {!isResolved && onResolve && (
        <button
          className="uncertainty-item__resolve"
          onClick={() => onResolve(item.id)}
        >
          Mark Resolved
        </button>
      )}

      {isResolved && (
        <span className="uncertainty-item__resolved-label">
          ✓ Resolved
        </span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Uncertainty Indicator
// -----------------------------------------------------------------------------

interface UncertaintyIndicatorProps {
  info: UncertaintyInfo;
  onClick?: () => void;
  className?: string;
}

export const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({
  info,
  onClick,
  className = '',
}) => {
  if (info.totalCount === 0) {
    return null;
  }

  const severity = getHighestSeverity(info.items);
  const color = getSeverityColor(severity);

  return (
    <button
      className={`uncertainty-indicator ${className}`}
      onClick={onClick}
      style={{ '--indicator-color': color } as React.CSSProperties}
      title={info.summary}
    >
      <span className="uncertainty-indicator__icon">
        {getSeverityIcon(severity)}
      </span>
      {info.criticalCount > 0 && (
        <span className="uncertainty-indicator__critical">
          {info.criticalCount}
        </span>
      )}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Uncertainty List Panel
// -----------------------------------------------------------------------------

interface UncertaintyListProps {
  items: UncertaintyItem[];
  onResolve?: (id: string) => void;
  className?: string;
}

export const UncertaintyList: React.FC<UncertaintyListProps> = ({
  items,
  onResolve,
  className = '',
}) => {
  if (items.length === 0) {
    return (
      <div className={`uncertainty-list uncertainty-list--empty ${className}`}>
        <span className="uncertainty-list__empty-icon">✓</span>
        <span className="uncertainty-list__empty-text">
          No uncertainties detected
        </span>
      </div>
    );
  }

  // Group by severity
  const critical = items.filter((i) => i.severity === 'critical');
  const high = items.filter((i) => i.severity === 'high');
  const medium = items.filter((i) => i.severity === 'medium');
  const low = items.filter((i) => i.severity === 'low');

  return (
    <div className={`uncertainty-list ${className}`}>
      {critical.length > 0 && (
        <UncertaintySeverityGroup
          severity="critical"
          items={critical}
          onResolve={onResolve}
        />
      )}
      {high.length > 0 && (
        <UncertaintySeverityGroup
          severity="high"
          items={high}
          onResolve={onResolve}
        />
      )}
      {medium.length > 0 && (
        <UncertaintySeverityGroup
          severity="medium"
          items={medium}
          onResolve={onResolve}
        />
      )}
      {low.length > 0 && (
        <UncertaintySeverityGroup
          severity="low"
          items={low}
          onResolve={onResolve}
        />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Severity Group
// -----------------------------------------------------------------------------

interface UncertaintySeverityGroupProps {
  severity: UncertaintySeverity;
  items: UncertaintyItem[];
  onResolve?: (id: string) => void;
}

const UncertaintySeverityGroup: React.FC<UncertaintySeverityGroupProps> = ({
  severity,
  items,
  onResolve,
}) => {
  const color = getSeverityColor(severity);

  return (
    <div className="uncertainty-group">
      <div
        className="uncertainty-group__header"
        style={{ borderLeftColor: color }}
      >
        <span className="uncertainty-group__icon">
          {getSeverityIcon(severity)}
        </span>
        <span className="uncertainty-group__title">
          {formatSeverity(severity)}
        </span>
        <span className="uncertainty-group__count">{items.length}</span>
      </div>
      <div className="uncertainty-group__items">
        {items.map((item) => (
          <UncertaintyItemRow
            key={item.id}
            item={item}
            onResolve={onResolve}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getHighestSeverity(items: UncertaintyItem[]): UncertaintySeverity {
  if (items.some((i) => i.severity === 'critical')) return 'critical';
  if (items.some((i) => i.severity === 'high')) return 'high';
  if (items.some((i) => i.severity === 'medium')) return 'medium';
  return 'low';
}

function getSeverityColor(severity: UncertaintySeverity): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'; // red-500
    case 'high':
      return '#f97316'; // orange-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'low':
      return '#3b82f6'; // blue-500
  }
}

function getSeverityIcon(severity: UncertaintySeverity): string {
  switch (severity) {
    case 'critical':
      return '⛔';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
  }
}

function formatSeverity(severity: UncertaintySeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function formatUncertaintyType(type: UncertaintyType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default UncertaintyBadge;

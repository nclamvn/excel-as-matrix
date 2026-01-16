// =============================================================================
// ISSUE ALERT — Prominent alert for critical data issues
// =============================================================================

import React from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface IssueAlertProps {
  issue: ProactiveSuggestion;
  onAction: (suggestionId: string, actionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

// -----------------------------------------------------------------------------
// Issue Alert Component
// -----------------------------------------------------------------------------

export const IssueAlert: React.FC<IssueAlertProps> = ({
  issue,
  onAction,
  onDismiss,
}) => {
  const severity = getSeverityConfig(issue.priority);
  const categoryConfig = getCategoryConfig(issue.category);

  const primaryAction = issue.actions.find(a => a.type === 'primary');
  const secondaryAction = issue.actions.find(a => a.type === 'secondary');

  return (
    <div
      className={`issue-alert issue-alert--${issue.priority}`}
      style={{ borderLeftColor: severity.color }}
    >
      <div className="issue-alert__icon" style={{ color: severity.color }}>
        <AlertIcon />
      </div>

      <div className="issue-alert__content">
        <div className="issue-alert__header">
          <span className="issue-alert__category" style={{ backgroundColor: categoryConfig.bgColor }}>
            {categoryConfig.icon}
            {categoryConfig.label}
          </span>
          <span className="issue-alert__priority" style={{ color: severity.color }}>
            {severity.label}
          </span>
        </div>

        <h4 className="issue-alert__title">{issue.title}</h4>
        <p className="issue-alert__description">{issue.description}</p>

        {issue.impact && (
          <div className="issue-alert__impact">
            <span className="issue-alert__impact-icon"><CellIcon /></span>
            <span>
              {issue.impact.cellCount} cell{issue.impact.cellCount !== 1 ? 's' : ''} affected
              {issue.affectedCells.length <= 5 && (
                <span className="issue-alert__cells">
                  : {issue.affectedCells.join(', ')}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="issue-alert__actions">
          {primaryAction && (
            <button
              className="issue-alert__action issue-alert__action--primary"
              onClick={() => onAction(issue.id, primaryAction.id)}
            >
              <CheckIcon />
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className="issue-alert__action issue-alert__action--secondary"
              onClick={() => onAction(issue.id, secondaryAction.id)}
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            className="issue-alert__action issue-alert__action--dismiss"
            onClick={() => onDismiss(issue.id)}
          >
            Dismiss
          </button>
        </div>
      </div>

      <button
        className="issue-alert__close"
        onClick={() => onDismiss(issue.id)}
        title="Dismiss"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getSeverityConfig(priority: ProactiveSuggestion['priority']) {
  const configs = {
    critical: { label: 'CRITICAL', color: '#dc2626' },
    high: { label: 'HIGH', color: '#ea580c' },
    medium: { label: 'MEDIUM', color: '#ca8a04' },
    low: { label: 'LOW', color: '#65a30d' },
  };
  return configs[priority];
}

function getCategoryConfig(category?: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; bgColor: string }> = {
    duplicates: {
      label: 'Duplicates',
      icon: <DuplicateIcon />,
      bgColor: '#fef3c7',
    },
    missing_values: {
      label: 'Missing Values',
      icon: <MissingIcon />,
      bgColor: '#fee2e2',
    },
    invalid_format: {
      label: 'Invalid Format',
      icon: <FormatIcon />,
      bgColor: '#dbeafe',
    },
    outliers: {
      label: 'Outliers',
      icon: <OutlierIcon />,
      bgColor: '#f3e8ff',
    },
    inconsistent_data: {
      label: 'Inconsistent Data',
      icon: <InconsistentIcon />,
      bgColor: '#fce7f3',
    },
    trailing_spaces: {
      label: 'Trailing Spaces',
      icon: <SpaceIcon />,
      bgColor: '#e0e7ff',
    },
    mixed_types: {
      label: 'Mixed Types',
      icon: <MixedIcon />,
      bgColor: '#ccfbf1',
    },
    empty_rows: {
      label: 'Empty Rows',
      icon: <EmptyRowIcon />,
      bgColor: '#f5f5f4',
    },
  };
  return configs[category || ''] || { label: 'Data Issue', icon: <AlertIcon />, bgColor: '#f3f4f6' };
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CellIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const MissingIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const FormatIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 7 4 4 20 4 20 7" />
    <line x1="9" y1="20" x2="15" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const OutlierIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InconsistentIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

const SpaceIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
);

const MixedIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const EmptyRowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

export default IssueAlert;

// =============================================================================
// QUICK ACTIONS — Batch actions for issues
// =============================================================================

import React from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface QuickActionsProps {
  issues: ProactiveSuggestion[];
  onAction: (suggestionId: string, actionId: string) => void;
}

// -----------------------------------------------------------------------------
// Quick Actions Component
// -----------------------------------------------------------------------------

export const QuickActions: React.FC<QuickActionsProps> = ({
  issues,
  onAction,
}) => {
  if (issues.length === 0) return null;

  // Group issues by category
  const duplicates = issues.filter(i => i.category === 'duplicates');
  const missingValues = issues.filter(i => i.category === 'missing_values');
  const formatIssues = issues.filter(i => i.category === 'invalid_format' || i.category === 'trailing_spaces');

  // Get total affected cells
  const totalAffected = issues.reduce(
    (sum, issue) => sum + (issue.impact?.cellCount || 0),
    0
  );

  const handleFixAll = (issueList: ProactiveSuggestion[]) => {
    for (const issue of issueList) {
      const primaryAction = issue.actions.find(a => a.type === 'primary');
      if (primaryAction) {
        onAction(issue.id, primaryAction.id);
      }
    }
  };

  return (
    <div className="quick-actions">
      <div className="quick-actions__header">
        <ZapIcon />
        <span className="quick-actions__title">Quick Actions</span>
        <span className="quick-actions__count">{totalAffected} cells affected</span>
      </div>

      <div className="quick-actions__buttons">
        {duplicates.length > 0 && (
          <QuickActionButton
            label="Remove Duplicates"
            count={duplicates.length}
            icon={<DuplicateIcon />}
            onClick={() => handleFixAll(duplicates)}
          />
        )}

        {missingValues.length > 0 && (
          <QuickActionButton
            label="Fill Missing"
            count={missingValues.length}
            icon={<FillIcon />}
            onClick={() => handleFixAll(missingValues)}
          />
        )}

        {formatIssues.length > 0 && (
          <QuickActionButton
            label="Fix Formatting"
            count={formatIssues.length}
            icon={<FormatIcon />}
            onClick={() => handleFixAll(formatIssues)}
          />
        )}

        {issues.length > 0 && (
          <QuickActionButton
            label="Fix All Issues"
            count={issues.length}
            icon={<CheckAllIcon />}
            onClick={() => handleFixAll(issues)}
            variant="primary"
          />
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Quick Action Button Component
// -----------------------------------------------------------------------------

interface QuickActionButtonProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  count,
  icon,
  onClick,
  variant = 'default',
}) => (
  <button
    className={`quick-actions__button quick-actions__button--${variant}`}
    onClick={onClick}
  >
    {icon}
    <span className="quick-actions__button-label">{label}</span>
    <span className="quick-actions__button-count">{count}</span>
  </button>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const FillIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const FormatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckAllIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export default QuickActions;

// =============================================================================
// ISSUES LIST — Display list of data quality issues
// =============================================================================

import React, { useState } from 'react';
import type { QualityIssue, IssueSeverity, IssueType } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface IssuesListProps {
  issues: QualityIssue[];
  onIssueClick?: (issue: QualityIssue) => void;
  onFixIssue?: (issue: QualityIssue) => void;
}

// -----------------------------------------------------------------------------
// Issues List Component
// -----------------------------------------------------------------------------

export const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  onIssueClick,
  onFixIssue,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<IssueType | 'all'>('all');

  const filteredIssues = filter === 'all'
    ? issues
    : issues.filter(i => i.type === filter);

  // Group by severity
  const critical = filteredIssues.filter(i => i.severity === 'critical');
  const warning = filteredIssues.filter(i => i.severity === 'warning');
  const info = filteredIssues.filter(i => i.severity === 'info');

  return (
    <div className="issues-list">
      {/* Filter */}
      <div className="issues-list__filter">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as IssueType | 'all')}
          className="issues-list__select"
        >
          <option value="all">All Issues ({issues.length})</option>
          <option value="duplicate">Duplicates</option>
          <option value="missing">Missing Values</option>
          <option value="invalid_format">Invalid Format</option>
          <option value="inconsistent">Inconsistent</option>
          <option value="outlier">Outliers</option>
          <option value="whitespace">Whitespace</option>
        </select>
      </div>

      {/* Critical Issues */}
      {critical.length > 0 && (
        <IssueGroup
          title="Critical"
          severity="critical"
          issues={critical}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onIssueClick={onIssueClick}
          onFixIssue={onFixIssue}
        />
      )}

      {/* Warning Issues */}
      {warning.length > 0 && (
        <IssueGroup
          title="Warnings"
          severity="warning"
          issues={warning}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onIssueClick={onIssueClick}
          onFixIssue={onFixIssue}
        />
      )}

      {/* Info Issues */}
      {info.length > 0 && (
        <IssueGroup
          title="Info"
          severity="info"
          issues={info}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onIssueClick={onIssueClick}
          onFixIssue={onFixIssue}
        />
      )}

      {/* Empty State */}
      {filteredIssues.length === 0 && (
        <div className="issues-list__empty">
          <CheckIcon />
          <p>No issues found</p>
          <span>Your data looks clean!</span>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Issue Group Component
// -----------------------------------------------------------------------------

interface IssueGroupProps {
  title: string;
  severity: IssueSeverity;
  issues: QualityIssue[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  onIssueClick?: (issue: QualityIssue) => void;
  onFixIssue?: (issue: QualityIssue) => void;
}

const IssueGroup: React.FC<IssueGroupProps> = ({
  title,
  severity,
  issues,
  expandedId,
  onToggle,
  onIssueClick,
  onFixIssue,
}) => (
  <div className={`issues-list__group issues-list__group--${severity}`}>
    <div className="issues-list__group-header">
      <SeverityIcon severity={severity} />
      <span className="issues-list__group-title">{title}</span>
      <span className="issues-list__group-count">{issues.length}</span>
    </div>
    <div className="issues-list__group-items">
      {issues.map(issue => (
        <IssueItem
          key={issue.id}
          issue={issue}
          isExpanded={expandedId === issue.id}
          onToggle={() => onToggle(expandedId === issue.id ? null : issue.id)}
          onClick={onIssueClick}
          onFix={onFixIssue}
        />
      ))}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Issue Item Component
// -----------------------------------------------------------------------------

interface IssueItemProps {
  issue: QualityIssue;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: (issue: QualityIssue) => void;
  onFix?: (issue: QualityIssue) => void;
}

const IssueItem: React.FC<IssueItemProps> = ({
  issue,
  isExpanded,
  onToggle,
  onClick,
  onFix,
}) => (
  <div className={`issue-item issue-item--${issue.severity}`}>
    <div className="issue-item__header" onClick={onToggle}>
      <IssueTypeIcon type={issue.type} />
      <div className="issue-item__info">
        <span className="issue-item__title">{issue.title}</span>
        <span className="issue-item__count">{issue.count} affected</span>
      </div>
      {issue.autoFixable && (
        <span className="issue-item__auto-fix-badge">Auto-fixable</span>
      )}
      <ChevronIcon expanded={isExpanded} />
    </div>

    {isExpanded && (
      <div className="issue-item__details">
        <p className="issue-item__description">{issue.description}</p>

        {/* Examples */}
        {issue.examples.length > 0 && (
          <div className="issue-item__examples">
            <span className="issue-item__examples-label">Examples:</span>
            {issue.examples.slice(0, 3).map((example, i) => (
              <div key={i} className="issue-item__example">
                <span className="issue-item__example-cell">{example.cell}</span>
                <span className="issue-item__example-value">
                  {String(example.currentValue)}
                </span>
                {example.suggestedValue !== undefined && (
                  <>
                    <span className="issue-item__example-arrow">→</span>
                    <span className="issue-item__example-suggested">
                      {String(example.suggestedValue)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="issue-item__actions">
          <button
            className="issue-item__action"
            onClick={() => onClick?.(issue)}
          >
            View Details
          </button>
          {issue.autoFixable && (
            <button
              className="issue-item__action issue-item__action--primary"
              onClick={() => onFix?.(issue)}
            >
              <ZapIcon />
              Fix Issue
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const SeverityIcon: React.FC<{ severity: IssueSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" stroke="white" />
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

const IssueTypeIcon: React.FC<{ type: IssueType }> = ({ type }) => {
  switch (type) {
    case 'duplicate':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'missing':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'invalid_format':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case 'inconsistent':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    case 'outlier':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <circle cx="18" cy="4" r="2" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ZapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default IssuesList;

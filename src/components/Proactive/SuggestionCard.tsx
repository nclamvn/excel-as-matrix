// =============================================================================
// SUGGESTION CARD — Individual suggestion display
// =============================================================================

import React, { useState } from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: ProactiveSuggestion;
  onAction: (suggestionId: string, actionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  expanded?: boolean;
}

// -----------------------------------------------------------------------------
// Suggestion Card Component
// -----------------------------------------------------------------------------

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  onDismiss,
  expanded: defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const typeConfig = getTypeConfig(suggestion.type);
  const priorityConfig = getPriorityConfig(suggestion.priority);

  return (
    <div className={`suggestion-card suggestion-card--${suggestion.type}`}>
      {/* Header */}
      <div className="suggestion-card__header">
        <div className="suggestion-card__type-icon" style={{ color: typeConfig.color }}>
          {typeConfig.icon}
        </div>
        <div className="suggestion-card__title-section">
          <div className="suggestion-card__label">
            {typeConfig.label}
          </div>
          <div className={`suggestion-card__priority suggestion-card__priority--${suggestion.priority}`}>
            {priorityConfig.label}
          </div>
        </div>
        <button
          className="suggestion-card__dismiss"
          onClick={() => onDismiss(suggestion.id)}
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div className="suggestion-card__content">
        <h4 className="suggestion-card__title">{suggestion.title}</h4>
        <p className="suggestion-card__description">{suggestion.description}</p>

        {/* Impact */}
        {suggestion.impact && (
          <div className="suggestion-card__impact">
            <span className="suggestion-card__impact-label">Impact:</span>
            <span className="suggestion-card__impact-value">
              {suggestion.impact.cellCount} cell{suggestion.impact.cellCount !== 1 ? 's' : ''} affected
            </span>
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && suggestion.details && (
          <div className="suggestion-card__details">
            {suggestion.details}
          </div>
        )}

        {/* Confidence bar */}
        <div className="suggestion-card__confidence">
          <div
            className="suggestion-card__confidence-bar"
            style={{ width: `${suggestion.confidence * 100}%` }}
          />
          <span className="suggestion-card__confidence-text">
            {Math.round(suggestion.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="suggestion-card__actions">
        {suggestion.actions.slice(0, 2).map(action => (
          <button
            key={action.id}
            className={`suggestion-card__action suggestion-card__action--${action.type}`}
            onClick={() => onAction(suggestion.id, action.id)}
          >
            {action.type === 'primary' && <CheckIcon />}
            {action.label}
          </button>
        ))}
        {suggestion.actions.length > 2 && (
          <button
            className="suggestion-card__action suggestion-card__action--more"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getTypeConfig(type: ProactiveSuggestion['type']) {
  const configs = {
    issue: {
      label: 'DATA ISSUE',
      color: '#ef4444',
      icon: <IssueIcon />,
    },
    insight: {
      label: 'INSIGHT',
      color: '#3b82f6',
      icon: <InsightIcon />,
    },
    optimization: {
      label: 'OPTIMIZATION',
      color: '#f59e0b',
      icon: <OptimizeIcon />,
    },
    pattern: {
      label: 'PATTERN',
      color: '#8b5cf6',
      icon: <PatternIcon />,
    },
  };
  return configs[type];
}

function getPriorityConfig(priority: ProactiveSuggestion['priority']) {
  const configs = {
    critical: { label: 'CRITICAL', color: '#dc2626' },
    high: { label: 'HIGH', color: '#ea580c' },
    medium: { label: 'MEDIUM', color: '#ca8a04' },
    low: { label: 'LOW', color: '#65a30d' },
  };
  return configs[priority];
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IssueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InsightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
    <polyline points="7.5 19.79 7.5 14.6 3 12" />
    <polyline points="21 12 16.5 14.6 16.5 19.79" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const OptimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PatternIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default SuggestionCard;

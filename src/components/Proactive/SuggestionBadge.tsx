// =============================================================================
// SUGGESTION BADGE — Compact badge for toolbar/status bar
// =============================================================================

import React from 'react';
import type { SuggestionType } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface SuggestionBadgeProps {
  count: number;
  type?: SuggestionType | 'all';
  onClick?: () => void;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

// -----------------------------------------------------------------------------
// Suggestion Badge Component
// -----------------------------------------------------------------------------

export const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({
  count,
  type = 'all',
  onClick,
  showIcon = true,
  size = 'medium',
  animated = true,
}) => {
  if (count === 0) return null;

  const config = getTypeConfig(type);

  return (
    <button
      className={`suggestion-badge suggestion-badge--${size} ${animated && count > 0 ? 'suggestion-badge--animated' : ''}`}
      onClick={onClick}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderColor: config.borderColor,
      }}
      title={`${count} ${config.label}`}
    >
      {showIcon && <span className="suggestion-badge__icon">{config.icon}</span>}
      <span className="suggestion-badge__count">{count > 99 ? '99+' : count}</span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Multi Badge — Shows counts for multiple types
// -----------------------------------------------------------------------------

interface MultiBadgeProps {
  counts: {
    issue?: number;
    insight?: number;
    optimization?: number;
    pattern?: number;
  };
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const MultiBadge: React.FC<MultiBadgeProps> = ({
  counts,
  onClick,
  size = 'medium',
}) => {
  const total = Object.values(counts).reduce((sum, c) => sum + (c || 0), 0);

  if (total === 0) return null;

  return (
    <button
      className={`multi-badge multi-badge--${size}`}
      onClick={onClick}
      title={`${total} suggestions`}
    >
      <SparklesIcon />
      <span className="multi-badge__total">{total > 99 ? '99+' : total}</span>
      <div className="multi-badge__breakdown">
        {counts.issue ? (
          <span className="multi-badge__item multi-badge__item--issue" title={`${counts.issue} issues`}>
            {counts.issue}
          </span>
        ) : null}
        {counts.insight ? (
          <span className="multi-badge__item multi-badge__item--insight" title={`${counts.insight} insights`}>
            {counts.insight}
          </span>
        ) : null}
        {counts.optimization ? (
          <span className="multi-badge__item multi-badge__item--optimization" title={`${counts.optimization} optimizations`}>
            {counts.optimization}
          </span>
        ) : null}
        {counts.pattern ? (
          <span className="multi-badge__item multi-badge__item--pattern" title={`${counts.pattern} patterns`}>
            {counts.pattern}
          </span>
        ) : null}
      </div>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Inline Badge — For use in text/headers
// -----------------------------------------------------------------------------

interface InlineBadgeProps {
  count: number;
  type?: SuggestionType;
  variant?: 'filled' | 'outlined' | 'subtle';
}

export const InlineBadge: React.FC<InlineBadgeProps> = ({
  count,
  type = 'issue',
  variant = 'filled',
}) => {
  if (count === 0) return null;

  const config = getTypeConfig(type);

  const styles = {
    filled: {
      backgroundColor: config.bgColor,
      color: config.textColor,
      border: 'none',
    },
    outlined: {
      backgroundColor: 'transparent',
      color: config.textColor,
      border: `1px solid ${config.borderColor}`,
    },
    subtle: {
      backgroundColor: `${config.bgColor}50`,
      color: config.textColor,
      border: 'none',
    },
  };

  return (
    <span
      className={`inline-badge inline-badge--${variant}`}
      style={styles[variant]}
    >
      {count}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Dot Indicator — Minimal indicator
// -----------------------------------------------------------------------------

interface DotIndicatorProps {
  hasItems: boolean;
  type?: SuggestionType | 'all';
  size?: 'small' | 'medium' | 'large';
  pulse?: boolean;
}

export const DotIndicator: React.FC<DotIndicatorProps> = ({
  hasItems,
  type = 'all',
  size = 'small',
  pulse = true,
}) => {
  if (!hasItems) return null;

  const config = getTypeConfig(type);

  return (
    <span
      className={`dot-indicator dot-indicator--${size} ${pulse ? 'dot-indicator--pulse' : ''}`}
      style={{ backgroundColor: config.bgColor }}
    />
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getTypeConfig(type: SuggestionType | 'all') {
  const configs = {
    all: {
      label: 'suggestions',
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      borderColor: '#2563eb',
      icon: <SparklesIcon />,
    },
    issue: {
      label: 'issues',
      bgColor: '#ef4444',
      textColor: '#ffffff',
      borderColor: '#dc2626',
      icon: <IssueIcon />,
    },
    insight: {
      label: 'insights',
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      borderColor: '#2563eb',
      icon: <InsightIcon />,
    },
    optimization: {
      label: 'optimizations',
      bgColor: '#f59e0b',
      textColor: '#ffffff',
      borderColor: '#d97706',
      icon: <OptimizeIcon />,
    },
    pattern: {
      label: 'patterns',
      bgColor: '#8b5cf6',
      textColor: '#ffffff',
      borderColor: '#7c3aed',
      icon: <PatternIcon />,
    },
  };
  return configs[type];
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const SparklesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
  </svg>
);

const IssueIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InsightIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const OptimizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PatternIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default SuggestionBadge;

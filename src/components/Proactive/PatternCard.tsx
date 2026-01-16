// =============================================================================
// PATTERN CARD — Display for detected user patterns
// =============================================================================

import React from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface PatternCardProps {
  pattern: ProactiveSuggestion;
  onAction: (suggestionId: string, actionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

// -----------------------------------------------------------------------------
// Pattern Card Component
// -----------------------------------------------------------------------------

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  onAction,
  onDismiss,
}) => {
  const metadata = pattern.metadata as PatternMetadata | undefined;
  const categoryConfig = getCategoryConfig(pattern.category);

  return (
    <div className="pattern-card">
      <div className="pattern-card__header">
        <div className="pattern-card__icon" style={{ backgroundColor: categoryConfig.bgColor }}>
          {categoryConfig.icon}
        </div>
        <div className="pattern-card__title-area">
          <div className="pattern-card__category">{categoryConfig.label}</div>
          {metadata?.frequency && (
            <div className="pattern-card__frequency">
              <RepeatIcon />
              <span>{metadata.frequency} times detected</span>
            </div>
          )}
        </div>
        <button
          className="pattern-card__dismiss"
          onClick={() => onDismiss(pattern.id)}
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="pattern-card__content">
        <h4 className="pattern-card__title">{pattern.title}</h4>
        <p className="pattern-card__description">{pattern.description}</p>

        {/* Action sequence visualization */}
        {metadata?.sequence && (
          <div className="pattern-card__sequence">
            <div className="pattern-card__sequence-label">Detected Pattern:</div>
            <div className="pattern-card__sequence-steps">
              {metadata.sequence.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="pattern-card__step">
                    <span className="pattern-card__step-icon">{getActionIcon(step.action)}</span>
                    <span className="pattern-card__step-label">{step.action}</span>
                  </div>
                  {index < metadata.sequence!.length - 1 && (
                    <div className="pattern-card__step-arrow">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Time savings estimation */}
        {metadata?.timeSaved && (
          <div className="pattern-card__savings">
            <ClockIcon />
            <span>
              Estimated time saved: <strong>{metadata.timeSaved}</strong>
            </span>
          </div>
        )}

        {/* Suggested automation */}
        {metadata?.suggestedAutomation && (
          <div className="pattern-card__automation">
            <div className="pattern-card__automation-label">Suggested Automation:</div>
            <code className="pattern-card__automation-code">
              {metadata.suggestedAutomation}
            </code>
          </div>
        )}

        {/* Confidence */}
        <div className="pattern-card__confidence">
          <div
            className="pattern-card__confidence-bar"
            style={{ width: `${pattern.confidence * 100}%` }}
          />
          <span className="pattern-card__confidence-text">
            {Math.round(pattern.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="pattern-card__actions">
        {pattern.actions.map(action => (
          <button
            key={action.id}
            className={`pattern-card__action pattern-card__action--${action.type}`}
            onClick={() => onAction(pattern.id, action.id)}
          >
            {action.type === 'primary' && <PlayIcon />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface PatternMetadata {
  frequency?: number;
  timeSaved?: string;
  suggestedAutomation?: string;
  sequence?: Array<{
    action: string;
    target?: string;
  }>;
}

function getCategoryConfig(category?: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; bgColor: string }> = {
    repetitive_sequence: {
      label: 'Repetitive Sequence',
      icon: <RepeatIcon />,
      bgColor: '#f3e8ff',
    },
    copy_paste_pattern: {
      label: 'Copy-Paste Pattern',
      icon: <CopyIcon />,
      bgColor: '#dbeafe',
    },
    manual_calculation: {
      label: 'Manual Calculation',
      icon: <CalculatorIcon />,
      bgColor: '#dcfce7',
    },
    workflow_automation: {
      label: 'Workflow Automation',
      icon: <WorkflowIcon />,
      bgColor: '#fef3c7',
    },
  };
  return configs[category || ''] || { label: 'Pattern', icon: <PatternIcon />, bgColor: '#f3f4f6' };
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    edit: '✏️',
    copy: '📋',
    paste: '📄',
    format: '🎨',
    delete: '🗑️',
    select: '👆',
    formula: '🔢',
    sort: '↕️',
    filter: '🔍',
  };
  return icons[action.toLowerCase()] || '•';
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

const RepeatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CalculatorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="8" y2="10.01" />
    <line x1="12" y1="10" x2="12" y2="10.01" />
    <line x1="16" y1="10" x2="16" y2="10.01" />
    <line x1="8" y1="14" x2="8" y2="14.01" />
    <line x1="12" y1="14" x2="12" y2="14.01" />
    <line x1="16" y1="14" x2="16" y2="14.01" />
    <line x1="8" y1="18" x2="8" y2="18.01" />
    <line x1="12" y1="18" x2="12" y2="18.01" />
    <line x1="16" y1="18" x2="16" y2="18.01" />
  </svg>
);

const WorkflowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="6" height="6" />
    <rect x="15" y="3" width="6" height="6" />
    <rect x="9" y="15" width="6" height="6" />
    <line x1="6" y1="9" x2="6" y2="12" />
    <line x1="18" y1="9" x2="18" y2="12" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="12" y1="12" x2="12" y2="15" />
  </svg>
);

const PatternIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default PatternCard;

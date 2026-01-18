// =============================================================================
// FORMULA PREVIEW — Preview interpreted formula with enhanced UI
// =============================================================================

import React, { useState, useEffect } from 'react';
import type { InterpretationResult } from '../../nlformula/types';

// -----------------------------------------------------------------------------
// Formula History (in-memory storage for session)
// -----------------------------------------------------------------------------

interface FormulaHistoryItem {
  input: string;
  formula: string;
  confidence: number;
  timestamp: number;
  accepted: boolean;
}

const formulaHistory: FormulaHistoryItem[] = [];
const MAX_HISTORY = 20;

export const addToHistory = (
  input: string,
  formula: string,
  confidence: number,
  accepted: boolean
) => {
  formulaHistory.unshift({
    input,
    formula,
    confidence,
    timestamp: Date.now(),
    accepted,
  });
  if (formulaHistory.length > MAX_HISTORY) {
    formulaHistory.pop();
  }
};

export const getHistory = () => [...formulaHistory];
export const clearHistory = () => {
  formulaHistory.length = 0;
};

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaPreviewProps {
  interpretation: InterpretationResult;
  onAccept: () => void;
  onDismiss: () => void;
  showAlternatives?: boolean;
  originalInput?: string;
}

// -----------------------------------------------------------------------------
// Formula Preview Component
// -----------------------------------------------------------------------------

export const FormulaPreview: React.FC<FormulaPreviewProps> = ({
  interpretation,
  onAccept,
  onDismiss,
  showAlternatives = true,
  originalInput = '',
}) => {
  const { success, formula, confidence, explanation, alternatives, warnings } =
    interpretation;
  const [showDetails, setShowDetails] = useState(false);

  // Handle accept with history tracking
  const handleAccept = () => {
    if (formula) {
      addToHistory(originalInput, formula, confidence, true);
    }
    onAccept();
  };

  // Handle dismiss with history tracking
  const handleDismiss = () => {
    if (formula) {
      addToHistory(originalInput, formula, confidence, false);
    }
    onDismiss();
  };

  if (!success) {
    return (
      <div className="formula-preview formula-preview--error">
        <div className="formula-preview__header">
          <span className="formula-preview__icon formula-preview__icon--error">!</span>
          <span className="formula-preview__title">Could not interpret</span>
        </div>
        <p className="formula-preview__message">{interpretation.error}</p>
        {interpretation.suggestions && interpretation.suggestions.length > 0 && (
          <div className="formula-preview__suggestions">
            <span className="formula-preview__suggestions-label">Try:</span>
            <ul>
              {interpretation.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <button className="formula-preview__dismiss" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="formula-preview">
      {/* Header with confidence ring */}
      <div className="formula-preview__header">
        <ConfidenceRing confidence={confidence} />
        <div className="formula-preview__header-text">
          <span className="formula-preview__title">Interpreted Formula</span>
          <ConfidenceLabel confidence={confidence} />
        </div>
        <button
          className="formula-preview__details-toggle"
          onClick={() => setShowDetails(!showDetails)}
          title={showDetails ? 'Hide details' : 'Show details'}
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {/* Formula with syntax highlighting */}
      <div className="formula-preview__formula">
        <FormulaHighlight formula={formula || ''} />
        <button
          className="formula-preview__copy"
          onClick={() => navigator.clipboard.writeText(formula || '')}
          title="Copy formula"
        >
          <CopyIcon />
        </button>
      </div>

      {/* Explanation */}
      <p className="formula-preview__explanation">{explanation}</p>

      {/* Confidence Details (expandable) */}
      {showDetails && (
        <div className="formula-preview__confidence-details">
          <ConfidenceExplanation confidence={confidence} />
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="formula-preview__warnings">
          {warnings.map((w, i) => (
            <div key={i} className="formula-preview__warning">
              <span className="formula-preview__warning-icon">⚠</span>
              <span>{w.message}</span>
              {w.suggestion && (
                <span className="formula-preview__warning-suggestion">
                  Suggestion: {w.suggestion}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alternatives */}
      {showAlternatives && alternatives && alternatives.length > 0 && (
        <div className="formula-preview__alternatives">
          <span className="formula-preview__alternatives-label">
            Alternative formulas:
          </span>
          {alternatives.map((alt, i) => (
            <div key={i} className="formula-preview__alternative">
              <code>{alt.formula}</code>
              <span className="formula-preview__alternative-explanation">
                {alt.explanation}
              </span>
              <ConfidenceLabel confidence={alt.confidence} mini />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="formula-preview__actions">
        <button
          className="formula-preview__action formula-preview__action--primary"
          onClick={handleAccept}
        >
          <CheckIcon /> Use this formula
        </button>
        <button
          className="formula-preview__action formula-preview__action--secondary"
          onClick={handleDismiss}
        >
          Cancel
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="formula-preview__hint">
        <kbd>Enter</kbd> accept • <kbd>Tab</kbd> insert • <kbd>Esc</kbd> cancel
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Confidence Ring (Visual gauge)
// -----------------------------------------------------------------------------

interface ConfidenceRingProps {
  confidence: number;
  size?: number;
}

const ConfidenceRing: React.FC<ConfidenceRingProps> = ({ confidence, size = 48 }) => {
  const percent = Math.round(confidence * 100);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence * circumference);

  const getColor = () => {
    if (percent >= 85) return 'var(--green-accent, #22c55e)';
    if (percent >= 70) return 'var(--yellow-accent, #eab308)';
    return 'var(--red-accent, #ef4444)';
  };

  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3, #404040)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <span className="confidence-ring__value">{percent}%</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Confidence Label
// -----------------------------------------------------------------------------

interface ConfidenceLabelProps {
  confidence: number;
  mini?: boolean;
}

const ConfidenceLabel: React.FC<ConfidenceLabelProps> = ({ confidence, mini = false }) => {
  const percent = Math.round(confidence * 100);

  const getLevel = (): { level: string; label: string } => {
    if (percent >= 90) return { level: 'excellent', label: 'Excellent match' };
    if (percent >= 80) return { level: 'high', label: 'High confidence' };
    if (percent >= 70) return { level: 'medium', label: 'Good match' };
    if (percent >= 50) return { level: 'low', label: 'Possible match' };
    return { level: 'uncertain', label: 'Uncertain' };
  };

  const { level, label } = getLevel();

  if (mini) {
    return (
      <span className={`confidence-label confidence-label--mini confidence-label--${level}`}>
        {percent}%
      </span>
    );
  }

  return (
    <span className={`confidence-label confidence-label--${level}`}>
      {label}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Confidence Explanation
// -----------------------------------------------------------------------------

interface ConfidenceExplanationProps {
  confidence: number;
}

const ConfidenceExplanation: React.FC<ConfidenceExplanationProps> = ({ confidence }) => {
  const percent = Math.round(confidence * 100);

  const getFactors = () => {
    const factors: { factor: string; impact: 'positive' | 'neutral' | 'negative' }[] = [];

    if (percent >= 85) {
      factors.push({ factor: 'Clear intent recognized', impact: 'positive' });
      factors.push({ factor: 'All entities identified', impact: 'positive' });
    } else if (percent >= 70) {
      factors.push({ factor: 'Intent recognized', impact: 'positive' });
      factors.push({ factor: 'Some entities may need verification', impact: 'neutral' });
    } else {
      factors.push({ factor: 'Intent partially recognized', impact: 'neutral' });
      factors.push({ factor: 'Consider rephrasing for better results', impact: 'negative' });
    }

    return factors;
  };

  return (
    <div className="confidence-explanation">
      <div className="confidence-explanation__header">
        Why {percent}% confidence?
      </div>
      <ul className="confidence-explanation__factors">
        {getFactors().map((f, i) => (
          <li key={i} className={`confidence-explanation__factor confidence-explanation__factor--${f.impact}`}>
            <span className="confidence-explanation__icon">
              {f.impact === 'positive' ? '✓' : f.impact === 'negative' ? '!' : '•'}
            </span>
            {f.factor}
          </li>
        ))}
      </ul>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Formula Syntax Highlighting
// -----------------------------------------------------------------------------

interface FormulaHighlightProps {
  formula: string;
}

const FormulaHighlight: React.FC<FormulaHighlightProps> = ({ formula }) => {
  // Simple syntax highlighting for Excel formulas
  const highlightFormula = (f: string) => {
    if (!f) return null;

    const parts: React.ReactNode[] = [];
    let remaining = f;
    let key = 0;

    // Patterns for highlighting
    const patterns = [
      { regex: /^=/, className: 'formula-hl--equals' },
      { regex: /^[A-Z]+(?=\()/, className: 'formula-hl--function' },
      { regex: /^\(|\)/, className: 'formula-hl--paren' },
      { regex: /^,/, className: 'formula-hl--comma' },
      { regex: /^[A-Z]+\d+(?::[A-Z]+\d+)?/i, className: 'formula-hl--reference' },
      { regex: /^"[^"]*"/, className: 'formula-hl--string' },
      { regex: /^\d+(?:\.\d+)?/, className: 'formula-hl--number' },
      { regex: /^[+\-*/^<>=]+/, className: 'formula-hl--operator' },
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const { regex, className } of patterns) {
        const match = remaining.match(regex);
        if (match) {
          parts.push(
            <span key={key++} className={className}>
              {match[0]}
            </span>
          );
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Add single character as plain text
        parts.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return <code className="formula-highlight">{parts}</code>;
  };

  return highlightFormula(formula);
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// -----------------------------------------------------------------------------
// Formula History Component (for use in other parts of the app)
// -----------------------------------------------------------------------------

interface FormulaHistoryPanelProps {
  onSelect: (formula: string) => void;
  onClose: () => void;
}

export const FormulaHistoryPanel: React.FC<FormulaHistoryPanelProps> = ({
  onSelect,
  onClose,
}) => {
  const [history, setHistory] = useState<FormulaHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  if (history.length === 0) {
    return (
      <div className="formula-history-panel formula-history-panel--empty">
        <p>No formula history yet</p>
        <p className="formula-history-panel__hint">
          Interpreted formulas will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="formula-history-panel">
      <div className="formula-history-panel__header">
        <h3>Recent Formulas</h3>
        <button onClick={onClose} className="formula-history-panel__close">×</button>
      </div>
      <ul className="formula-history-panel__list">
        {history.map((item, i) => (
          <li
            key={i}
            className={`formula-history-panel__item ${item.accepted ? 'formula-history-panel__item--accepted' : ''}`}
            onClick={() => onSelect(item.formula)}
          >
            <div className="formula-history-panel__item-input">{item.input}</div>
            <code className="formula-history-panel__item-formula">{item.formula}</code>
            <div className="formula-history-panel__item-meta">
              <ConfidenceLabel confidence={item.confidence} mini />
              <span className="formula-history-panel__item-time">
                {formatTimeAgo(item.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <button
        className="formula-history-panel__clear"
        onClick={() => {
          clearHistory();
          setHistory([]);
        }}
      >
        Clear history
      </button>
    </div>
  );
};

// Helper for time formatting
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default FormulaPreview;

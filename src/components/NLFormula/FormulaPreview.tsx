// =============================================================================
// FORMULA PREVIEW — Preview interpreted formula
// =============================================================================

import React from 'react';
import type { InterpretationResult } from '../../nlformula/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaPreviewProps {
  interpretation: InterpretationResult;
  onAccept: () => void;
  onDismiss: () => void;
  showAlternatives?: boolean;
}

// -----------------------------------------------------------------------------
// Formula Preview Component
// -----------------------------------------------------------------------------

export const FormulaPreview: React.FC<FormulaPreviewProps> = ({
  interpretation,
  onAccept,
  onDismiss,
  showAlternatives = true,
}) => {
  const { success, formula, confidence, explanation, alternatives, warnings } =
    interpretation;

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
        <button className="formula-preview__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="formula-preview">
      {/* Header */}
      <div className="formula-preview__header">
        <span className="formula-preview__icon">✓</span>
        <span className="formula-preview__title">Interpreted Formula</span>
        <ConfidenceBadge confidence={confidence} />
      </div>

      {/* Formula */}
      <div className="formula-preview__formula">
        <code>{formula}</code>
      </div>

      {/* Explanation */}
      <p className="formula-preview__explanation">{explanation}</p>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="formula-preview__warnings">
          {warnings.map((w, i) => (
            <div key={i} className="formula-preview__warning">
              <span className="formula-preview__warning-icon">⚠</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives */}
      {showAlternatives && alternatives && alternatives.length > 0 && (
        <div className="formula-preview__alternatives">
          <span className="formula-preview__alternatives-label">
            Alternatives:
          </span>
          {alternatives.map((alt, i) => (
            <div key={i} className="formula-preview__alternative">
              <code>{alt.formula}</code>
              <span>{alt.explanation}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="formula-preview__actions">
        <button
          className="formula-preview__action formula-preview__action--primary"
          onClick={onAccept}
        >
          Use this formula
        </button>
        <button
          className="formula-preview__action formula-preview__action--secondary"
          onClick={onDismiss}
        >
          Cancel
        </button>
      </div>

      {/* Hint */}
      <div className="formula-preview__hint">
        Press <kbd>Enter</kbd> to accept or <kbd>Esc</kbd> to cancel
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Confidence Badge
// -----------------------------------------------------------------------------

interface ConfidenceBadgeProps {
  confidence: number;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const percent = Math.round(confidence * 100);
  let level: 'high' | 'medium' | 'low' = 'high';

  if (percent < 70) level = 'low';
  else if (percent < 85) level = 'medium';

  return (
    <span className={`confidence-badge confidence-badge--${level}`}>
      {percent}% confident
    </span>
  );
};

export default FormulaPreview;

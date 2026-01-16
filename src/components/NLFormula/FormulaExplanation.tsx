// =============================================================================
// FORMULA EXPLANATION — Explain formula in natural language
// =============================================================================

import React, { useState, useEffect } from 'react';
import { nlFormulaEngine } from '../../nlformula';
import type { FormulaExplanation as FormulaExplanationType, CellContext } from '../../nlformula/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaExplanationProps {
  formula: string;
  context?: CellContext;
  language?: 'en' | 'vi';
  expanded?: boolean;
  onClose?: () => void;
}

// -----------------------------------------------------------------------------
// Formula Explanation Component
// -----------------------------------------------------------------------------

export const FormulaExplanation: React.FC<FormulaExplanationProps> = ({
  formula,
  context,
  language = 'en',
  expanded = false,
  onClose,
}) => {
  const [explanation, setExplanation] = useState<FormulaExplanationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(expanded);

  // Fetch explanation
  useEffect(() => {
    const fetchExplanation = async () => {
      if (!formula || formula.length === 0) {
        setExplanation(null);
        return;
      }

      setIsLoading(true);
      try {
        const result = await nlFormulaEngine.explain(formula, context, language);
        setExplanation(result);
      } catch {
        setExplanation(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [formula, context, language]);

  if (!formula) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="formula-explanation formula-explanation--loading">
        <div className="formula-explanation__spinner" />
        <span>Analyzing formula...</span>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="formula-explanation">
      {/* Header */}
      <div className="formula-explanation__header">
        <h4 className="formula-explanation__title">
          <InfoIcon /> Formula Explanation
        </h4>
        {onClose && (
          <button className="formula-explanation__close" onClick={onClose}>
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Formula */}
      <div className="formula-explanation__formula">
        <code>{explanation.formula}</code>
      </div>

      {/* Summary */}
      <p className="formula-explanation__summary">{explanation.summary}</p>

      {/* Steps toggle */}
      <button
        className="formula-explanation__toggle"
        onClick={() => setShowSteps(!showSteps)}
      >
        {showSteps ? '▼' : '▶'} Step-by-step breakdown
      </button>

      {/* Steps */}
      {showSteps && (
        <ol className="formula-explanation__steps">
          {explanation.steps.map((step) => (
            <li key={step.order} className="formula-explanation__step">
              <span className="formula-explanation__step-part">
                <code>{step.part}</code>
              </span>
              <span className="formula-explanation__step-text">
                {step.explanation}
              </span>
              {step.result !== undefined && (
                <span className="formula-explanation__step-result">
                  → {String(step.result)}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Functions used */}
      {explanation.functions.length > 0 && (
        <div className="formula-explanation__functions">
          <h5>Functions used:</h5>
          <div className="formula-explanation__function-list">
            {explanation.functions.map((func) => (
              <div key={func.name} className="formula-explanation__function">
                <span className="formula-explanation__function-name">
                  {func.name}
                </span>
                <span className="formula-explanation__function-desc">
                  {language === 'vi' ? func.descriptionVi || func.description : func.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Explanation (for tooltip)
// -----------------------------------------------------------------------------

interface CompactExplanationProps {
  formula: string;
  context?: CellContext;
}

export const CompactExplanation: React.FC<CompactExplanationProps> = ({
  formula,
  context,
}) => {
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      if (!formula) return;
      try {
        const result = await nlFormulaEngine.explain(formula, context);
        setSummary(result.summary);
      } catch {
        setSummary('');
      }
    };
    fetchSummary();
  }, [formula, context]);

  if (!summary) return null;

  return <span className="compact-explanation">{summary}</span>;
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default FormulaExplanation;

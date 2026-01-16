// =============================================================================
// FORMULA DEBUG PANEL — Debug interface for formula errors
// =============================================================================

import React, { useState, useEffect } from 'react';
import { nlFormulaEngine } from '../../nlformula';
import type { DebugResult } from '../../nlformula/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaDebugPanelProps {
  formula: string;
  errorValue?: string;
  onApplyFix: (fixedFormula: string) => void;
  onClose?: () => void;
}

// -----------------------------------------------------------------------------
// Formula Debug Panel Component
// -----------------------------------------------------------------------------

export const FormulaDebugPanel: React.FC<FormulaDebugPanelProps> = ({
  formula,
  errorValue,
  onApplyFix,
  onClose,
}) => {
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFix, setSelectedFix] = useState(0);

  // Debug the formula
  useEffect(() => {
    const debugFormula = async () => {
      if (!formula || !formula.startsWith('=')) {
        setDebugResult(null);
        return;
      }

      setIsLoading(true);
      try {
        const result = await nlFormulaEngine.debug(formula, errorValue || '');
        setDebugResult(result);
        setSelectedFix(0);
      } catch {
        setDebugResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    debugFormula();
  }, [formula, errorValue]);

  if (isLoading) {
    return (
      <div className="formula-debug-panel formula-debug-panel--loading">
        <div className="formula-debug-panel__spinner" />
        <span>Analyzing formula...</span>
      </div>
    );
  }

  if (!debugResult) {
    return null;
  }

  // No errors found
  if (!debugResult.hasError) {
    return (
      <div className="formula-debug-panel formula-debug-panel--success">
        <div className="formula-debug-panel__header">
          <span className="formula-debug-panel__icon formula-debug-panel__icon--success">
            ✓
          </span>
          <span className="formula-debug-panel__title">No Issues Found</span>
          {onClose && (
            <button className="formula-debug-panel__close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <p className="formula-debug-panel__message">
          This formula appears to be correct.
        </p>
      </div>
    );
  }

  const suggestedFixes = debugResult.suggestedFixes || [];

  return (
    <div className="formula-debug-panel">
      {/* Header */}
      <div className="formula-debug-panel__header">
        <span className="formula-debug-panel__icon formula-debug-panel__icon--error">
          !
        </span>
        <span className="formula-debug-panel__title">Issue Found</span>
        {onClose && (
          <button className="formula-debug-panel__close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {/* Original Formula */}
      <div className="formula-debug-panel__formula">
        <span className="formula-debug-panel__label">Formula:</span>
        <code>{formula}</code>
      </div>

      {/* Error */}
      {debugResult.errorType && (
        <div className="formula-debug-panel__errors">
          <div className="formula-debug-panel__error">
            <div className="formula-debug-panel__error-header">
              <span className={`formula-debug-panel__error-type formula-debug-panel__error-type--${debugResult.errorType.toLowerCase()}`}>
                {getErrorTypeLabel(debugResult.errorType)}
              </span>
              {debugResult.errorLocation && (
                <span className="formula-debug-panel__error-position">
                  Position: {debugResult.errorLocation.start}
                </span>
              )}
            </div>
            {debugResult.errorMessage && (
              <p className="formula-debug-panel__error-message">{debugResult.errorMessage}</p>
            )}
            {debugResult.rootCause && (
              <p className="formula-debug-panel__root-cause">
                <strong>Root cause:</strong> {debugResult.rootCause}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Suggested Fixes */}
      {suggestedFixes.length > 0 && (
        <div className="formula-debug-panel__fixes">
          <h4 className="formula-debug-panel__fixes-title">
            <LightbulbIcon /> Suggested Fixes
          </h4>
          <div className="formula-debug-panel__fix-list">
            {suggestedFixes.map((fix, index) => (
              <div
                key={index}
                className={`formula-debug-panel__fix ${
                  index === selectedFix ? 'formula-debug-panel__fix--selected' : ''
                }`}
                onClick={() => setSelectedFix(index)}
              >
                <div className="formula-debug-panel__fix-header">
                  <span className="formula-debug-panel__fix-confidence">
                    {Math.round(fix.confidence * 100)}% match
                  </span>
                </div>
                <code className="formula-debug-panel__fix-formula">
                  {fix.fix}
                </code>
                <p className="formula-debug-panel__fix-explanation">
                  {fix.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Apply Fix Button */}
          <div className="formula-debug-panel__actions">
            <button
              className="formula-debug-panel__action formula-debug-panel__action--primary"
              onClick={() => {
                if (suggestedFixes[selectedFix]) {
                  onApplyFix(suggestedFixes[selectedFix].fix);
                }
              }}
            >
              Apply Fix
            </button>
            {onClose && (
              <button
                className="formula-debug-panel__action formula-debug-panel__action--secondary"
                onClick={onClose}
              >
                Ignore
              </button>
            )}
          </div>
        </div>
      )}

      {/* No fixes available */}
      {suggestedFixes.length === 0 && (
        <div className="formula-debug-panel__no-fixes">
          <p>No automatic fixes available for this error.</p>
          <p>Please review the formula manually.</p>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getErrorTypeLabel(type: string): string {
  switch (type) {
    case 'SYNTAX':
      return 'Syntax Error';
    case 'REFERENCE':
      return 'Reference Error';
    case 'VALUE':
      return 'Value Error';
    case 'NAME':
      return 'Name Error';
    case 'DIV_ZERO':
      return 'Division by Zero';
    case 'NULL':
      return 'Null Error';
    case 'NUM':
      return 'Number Error';
    case 'NA':
      return 'N/A Error';
    case 'CIRCULAR':
      return 'Circular Reference';
    default:
      return 'Error';
  }
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const LightbulbIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

export default FormulaDebugPanel;

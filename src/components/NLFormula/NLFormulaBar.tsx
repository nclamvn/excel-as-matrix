// =============================================================================
// NL FORMULA BAR — Enhanced formula bar with NL support
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { nlFormulaEngine } from '../../nlformula';
import type { CellContext, InterpretationResult } from '../../nlformula/types';
import { FormulaSuggestions } from './FormulaSuggestions';
import { FormulaPreview } from './FormulaPreview';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface NLFormulaBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (formula: string) => void;
  cellRef: string;
  context: CellContext;
  placeholder?: string;
  disabled?: boolean;
}

// -----------------------------------------------------------------------------
// NL Formula Bar Component
// -----------------------------------------------------------------------------

export const NLFormulaBar: React.FC<NLFormulaBarProps> = ({
  value,
  onChange,
  onSubmit,
  cellRef,
  context,
  placeholder = 'Enter formula or describe what you want...',
  disabled = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Determine if input is NL
  const isNaturalLanguage = nlFormulaEngine.isNaturalLanguage(value);
  const isFormula = value.startsWith('=');

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setCursorPosition(e.target.selectionStart || 0);
      setShowSuggestions(true);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Debounce NL interpretation
      if (nlFormulaEngine.isNaturalLanguage(newValue)) {
        setIsInterpreting(true);
        debounceTimer.current = setTimeout(async () => {
          try {
            const result = await nlFormulaEngine.interpret({
              text: newValue,
              language: 'auto',
              context,
            });
            setInterpretation(result);
          } catch {
            setInterpretation(null);
          } finally {
            setIsInterpreting(false);
          }
        }, 300);
      } else {
        setInterpretation(null);
        setIsInterpreting(false);
      }
    },
    [onChange, context]
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // If we have an interpretation, use the formula
        if (interpretation?.success && interpretation.formula) {
          onSubmit(interpretation.formula);
          setInterpretation(null);
        } else if (value.startsWith('=')) {
          onSubmit(value);
        }
        setShowSuggestions(false);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setInterpretation(null);
      } else if (e.key === 'Tab' && interpretation?.success) {
        e.preventDefault();
        // Accept the interpretation
        onChange(interpretation.formula || value);
        setInterpretation(null);
      }
    },
    [value, interpretation, onSubmit, onChange]
  );

  // Handle suggestion select
  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  // Accept interpretation
  const handleAcceptInterpretation = useCallback(() => {
    if (interpretation?.formula) {
      onSubmit(interpretation.formula);
      setInterpretation(null);
      setShowSuggestions(false);
    }
  }, [interpretation, onSubmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="nl-formula-bar">
      {/* Cell reference */}
      <div className="nl-formula-bar__cell-ref">{cellRef}</div>

      {/* Mode indicator */}
      <div className={`nl-formula-bar__mode ${isNaturalLanguage ? 'nl-formula-bar__mode--nl' : isFormula ? 'nl-formula-bar__mode--formula' : ''}`}>
        {isNaturalLanguage ? (
          <span title="Natural language mode">NL</span>
        ) : isFormula ? (
          <span title="Formula mode">fx</span>
        ) : null}
      </div>

      {/* Input container */}
      <div className="nl-formula-bar__input-container">
        <input
          ref={inputRef}
          type="text"
          className="nl-formula-bar__input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Loading indicator */}
        {isInterpreting && (
          <div className="nl-formula-bar__loading">
            <span className="nl-formula-bar__spinner" />
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && !interpretation && (
          <FormulaSuggestions
            input={value}
            cursorPosition={cursorPosition}
            context={context}
            onSelect={handleSuggestionSelect}
          />
        )}

        {/* Formula preview */}
        {interpretation && (
          <FormulaPreview
            interpretation={interpretation}
            onAccept={handleAcceptInterpretation}
            onDismiss={() => setInterpretation(null)}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="nl-formula-bar__actions">
        {interpretation?.success && (
          <button
            className="nl-formula-bar__action nl-formula-bar__action--accept"
            onClick={handleAcceptInterpretation}
            title="Accept formula (Enter)"
          >
            <CheckIcon />
          </button>
        )}
        <button
          className="nl-formula-bar__action"
          onClick={() => {
            onChange('');
            setInterpretation(null);
            inputRef.current?.focus();
          }}
          title="Clear"
        >
          <ClearIcon />
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default NLFormulaBar;

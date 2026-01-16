// =============================================================================
// FORMULA SUGGESTIONS — Dropdown suggestions component
// =============================================================================

import React, { useState, useEffect } from 'react';
import { nlFormulaEngine } from '../../nlformula';
import type { CellContext, Suggestion } from '../../nlformula/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaSuggestionsProps {
  input: string;
  cursorPosition: number;
  context: CellContext;
  onSelect: (value: string) => void;
  maxSuggestions?: number;
}

// -----------------------------------------------------------------------------
// Formula Suggestions Component
// -----------------------------------------------------------------------------

export const FormulaSuggestions: React.FC<FormulaSuggestionsProps> = ({
  input,
  cursorPosition,
  context,
  onSelect,
  maxSuggestions = 6,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const result = await nlFormulaEngine.suggest(
          input,
          cursorPosition,
          context
        );
        setSuggestions(result.suggestions.slice(0, maxSuggestions));
        setSelectedIndex(0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [input, cursorPosition, context, maxSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Tab' || (e.key === 'Enter' && suggestions.length > 0)) {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          onSelect(suggestions[selectedIndex].insert);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onSelect]);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="formula-suggestions">
      {isLoading ? (
        <div className="formula-suggestions__loading">
          Loading suggestions...
        </div>
      ) : (
        <ul className="formula-suggestions__list">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.display}-${index}`}
              className={`formula-suggestions__item ${
                index === selectedIndex ? 'formula-suggestions__item--selected' : ''
              }`}
              onClick={() => onSelect(suggestion.insert)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={`formula-suggestions__icon formula-suggestions__icon--${suggestion.type}`}>
                {getIcon(suggestion.type)}
              </span>
              <span className="formula-suggestions__text">
                <span className="formula-suggestions__display">
                  {suggestion.display}
                </span>
                {suggestion.description && (
                  <span className="formula-suggestions__description">
                    {suggestion.description}
                  </span>
                )}
              </span>
              {suggestion.type === 'function' && (
                <span className="formula-suggestions__badge">fx</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="formula-suggestions__hint">
        <span>↑↓ Navigate</span>
        <span>Tab Accept</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helper
// -----------------------------------------------------------------------------

function getIcon(type: string): string {
  switch (type) {
    case 'function':
      return 'ƒ';
    case 'reference':
      return '⊞';
    case 'template':
      return '☆';
    case 'recent':
      return '↻';
    case 'nl_formula':
      return '💬';
    default:
      return '•';
  }
}

export default FormulaSuggestions;

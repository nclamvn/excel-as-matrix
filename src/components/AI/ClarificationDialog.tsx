// =============================================================================
// CLARIFICATION DIALOG — Ask clarifying questions (Blueprint §5.6)
// =============================================================================

import React, { useState } from 'react';
import type {
  ClarificationRequest,
  ClarificationOption,
  ClarificationType,
} from '../../ai/conversation/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ClarificationDialogProps {
  request: ClarificationRequest;
  onRespond: (response: {
    selectedOptionId?: string;
    freeTextResponse?: string;
  }) => void;
  onSkip?: () => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const ClarificationDialog: React.FC<ClarificationDialogProps> = ({
  request,
  onRespond,
  onSkip,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [showFreeText, setShowFreeText] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowFreeText(false);
  };

  const handleSubmit = () => {
    if (showFreeText && freeText) {
      onRespond({ freeTextResponse: freeText });
    } else if (selectedOption) {
      onRespond({ selectedOptionId: selectedOption });
    }
  };

  const canSubmit =
    (showFreeText && freeText.length > 0) || selectedOption !== null;

  return (
    <div className={`clarification-dialog ${className}`}>
      {/* Header */}
      <div className="clarification-dialog__header">
        <span className="clarification-dialog__icon">
          {getTypeIcon(request.type)}
        </span>
        <span className="clarification-dialog__type">
          {formatType(request.type)}
        </span>
      </div>

      {/* Question */}
      <h3 className="clarification-dialog__question">{request.question}</h3>

      {/* Context */}
      {request.context && (
        <p className="clarification-dialog__context">{request.context}</p>
      )}

      {/* Options */}
      {request.options && request.options.length > 0 && (
        <div className="clarification-dialog__options">
          {request.options.map((option) => (
            <ClarificationOptionButton
              key={option.id}
              option={option}
              selected={selectedOption === option.id}
              onSelect={() => handleOptionSelect(option.id)}
            />
          ))}

          {/* Other option */}
          {request.allowFreeText && (
            <button
              className={`clarification-option ${
                showFreeText ? 'clarification-option--selected' : ''
              }`}
              onClick={() => {
                setShowFreeText(true);
                setSelectedOption(null);
              }}
            >
              <span className="clarification-option__label">Other...</span>
              <span className="clarification-option__description">
                Type a custom response
              </span>
            </button>
          )}
        </div>
      )}

      {/* Free text input */}
      {(showFreeText || (!request.options && request.allowFreeText)) && (
        <div className="clarification-dialog__freetext">
          <textarea
            className="clarification-dialog__textarea"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your response..."
            rows={3}
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="clarification-dialog__actions">
        {onSkip && !request.required && (
          <button
            className="clarification-dialog__skip"
            onClick={onSkip}
          >
            Skip
          </button>
        )}
        <button
          className="clarification-dialog__submit"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Option Button
// -----------------------------------------------------------------------------

interface ClarificationOptionButtonProps {
  option: ClarificationOption;
  selected: boolean;
  onSelect: () => void;
}

const ClarificationOptionButton: React.FC<ClarificationOptionButtonProps> = ({
  option,
  selected,
  onSelect,
}) => {
  return (
    <button
      className={`clarification-option ${
        selected ? 'clarification-option--selected' : ''
      }`}
      onClick={onSelect}
    >
      <span className="clarification-option__radio">
        {selected ? '●' : '○'}
      </span>
      <span className="clarification-option__label">{option.label}</span>
      {option.description && (
        <span className="clarification-option__description">
          {option.description}
        </span>
      )}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Inline Clarification
// -----------------------------------------------------------------------------

interface InlineClarificationProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
  className?: string;
}

export const InlineClarification: React.FC<InlineClarificationProps> = ({
  question,
  options,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`inline-clarification ${className}`}>
      <span className="inline-clarification__question">{question}</span>
      <div className="inline-clarification__options">
        {options.map((option, index) => (
          <button
            key={index}
            className="inline-clarification__option"
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Quick Suggestions
// -----------------------------------------------------------------------------

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({
  suggestions,
  onSelect,
  className = '',
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className={`quick-suggestions ${className}`}>
      <span className="quick-suggestions__label">Suggestions:</span>
      <div className="quick-suggestions__list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="quick-suggestions__item"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getTypeIcon(type: ClarificationType): string {
  switch (type) {
    case 'target_selection':
      return '📍';
    case 'action_confirmation':
      return '✓';
    case 'parameter_value':
      return '🔢';
    case 'ambiguity_resolution':
      return '❓';
    case 'scope_definition':
      return '📊';
    case 'format_preference':
      return '🎨';
  }
}

function formatType(type: ClarificationType): string {
  switch (type) {
    case 'target_selection':
      return 'Select Target';
    case 'action_confirmation':
      return 'Confirm Action';
    case 'parameter_value':
      return 'Enter Value';
    case 'ambiguity_resolution':
      return 'Clarify Intent';
    case 'scope_definition':
      return 'Define Scope';
    case 'format_preference':
      return 'Choose Format';
  }
}

export default ClarificationDialog;

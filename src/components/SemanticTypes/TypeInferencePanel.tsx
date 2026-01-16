// =============================================================================
// TYPE INFERENCE PANEL — Show AI type suggestions
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { typeInference, type TypeInferenceResult } from '../../types/semantic/TypeInference';
import { type SemanticType } from '../../types/semantic/types';
import { TypeBadge } from './TypeBadge';

// -----------------------------------------------------------------------------
// Type Inference Panel Props
// -----------------------------------------------------------------------------

interface TypeInferencePanelProps {
  header?: string;
  samples?: unknown[];
  currentType?: string;
  onApply: (type: SemanticType) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Type Inference Panel Component
// -----------------------------------------------------------------------------

export const TypeInferencePanel: React.FC<TypeInferencePanelProps> = ({
  header,
  samples = [],
  currentType,
  onApply,
  className = '',
}) => {
  const [inference, setInference] = useState<TypeInferenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternates, setShowAlternates] = useState(false);

  // Run inference when inputs change
  useEffect(() => {
    if (!header && samples.length === 0) {
      setInference(null);
      return;
    }

    setIsLoading(true);

    // Simulate async inference (in real app this might be server-side)
    const timer = setTimeout(() => {
      let result: TypeInferenceResult;

      if (header && samples.length > 0) {
        result = typeInference.infer(header, samples);
      } else if (header) {
        result = typeInference.inferFromHeader(header);
      } else {
        result = typeInference.inferFromSamples(samples);
      }

      setInference(result);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [header, samples]);

  // Don't show if already using suggested type
  const isSameType = inference?.type.id === currentType;

  if (!inference || isLoading) {
    return (
      <div className={`type-inference-panel loading ${className}`}>
        <div className="type-inference-loading">
          <RefreshCw size={14} className="spinning" />
          <span>Analyzing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`type-inference-panel ${className}`}>
      {/* Header */}
      <div className="type-inference-header">
        <Sparkles size={14} className="type-inference-icon" />
        <span className="type-inference-title">Type Suggestion</span>
      </div>

      {/* Main suggestion */}
      <div className={`type-inference-suggestion ${isSameType ? 'current' : ''}`}>
        <div className="type-inference-suggestion-main">
          <TypeBadge type={inference.type} size="medium" />
          <span className="type-inference-confidence">
            {Math.round(inference.confidence * 100)}% confidence
          </span>
        </div>

        <div className="type-inference-reason">{inference.reason}</div>

        {!isSameType && (
          <button
            className="type-inference-apply-btn"
            onClick={() => onApply(inference.type)}
          >
            <Check size={14} />
            <span>Apply</span>
          </button>
        )}

        {isSameType && (
          <span className="type-inference-current-label">
            <Check size={12} />
            Current type
          </span>
        )}
      </div>

      {/* Alternates */}
      {inference.alternates && inference.alternates.length > 0 && (
        <div className="type-inference-alternates">
          <button
            className="type-inference-alternates-toggle"
            onClick={() => setShowAlternates(!showAlternates)}
          >
            {showAlternates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>
              {showAlternates ? 'Hide' : 'Show'} {inference.alternates.length} alternatives
            </span>
          </button>

          {showAlternates && (
            <div className="type-inference-alternates-list">
              {inference.alternates.map((alt, i) => (
                <div key={i} className="type-inference-alternate">
                  <TypeBadge type={alt.type} size="small" />
                  <span className="type-inference-alt-confidence">
                    {Math.round(alt.confidence * 100)}%
                  </span>
                  <button
                    className="type-inference-alt-apply"
                    onClick={() => onApply(alt.type)}
                    title="Apply this type"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Type Suggestion (single line)
// -----------------------------------------------------------------------------

interface CompactTypeSuggestionProps {
  header?: string;
  samples?: unknown[];
  currentType?: string;
  onApply: (type: SemanticType) => void;
  className?: string;
}

export const CompactTypeSuggestion: React.FC<CompactTypeSuggestionProps> = ({
  header,
  samples = [],
  currentType,
  onApply,
  className = '',
}) => {
  const [inference, setInference] = useState<TypeInferenceResult | null>(null);

  useEffect(() => {
    if (!header && samples.length === 0) {
      setInference(null);
      return;
    }

    let result: TypeInferenceResult;
    if (header && samples.length > 0) {
      result = typeInference.infer(header, samples);
    } else if (header) {
      result = typeInference.inferFromHeader(header);
    } else {
      result = typeInference.inferFromSamples(samples);
    }

    setInference(result);
  }, [header, samples]);

  if (!inference || inference.type.id === currentType) {
    return null;
  }

  return (
    <div className={`compact-type-suggestion ${className}`}>
      <Sparkles size={12} />
      <span>Suggest:</span>
      <TypeBadge type={inference.type} size="small" onClick={() => onApply(inference.type)} />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Type Inference Tooltip
// -----------------------------------------------------------------------------

interface TypeInferenceTooltipProps {
  inference: TypeInferenceResult;
  onApply: (type: SemanticType) => void;
}

export const TypeInferenceTooltip: React.FC<TypeInferenceTooltipProps> = ({
  inference,
  onApply,
}) => {
  return (
    <div className="type-inference-tooltip">
      <div className="type-inference-tooltip-header">
        <Sparkles size={12} />
        <span>Suggested Type</span>
      </div>
      <div className="type-inference-tooltip-content">
        <TypeBadge type={inference.type} size="small" />
        <span>{Math.round(inference.confidence * 100)}%</span>
      </div>
      <button className="type-inference-tooltip-apply" onClick={() => onApply(inference.type)}>
        Apply
      </button>
    </div>
  );
};

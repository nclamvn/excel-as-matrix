// =============================================================================
// VALIDATION INDICATOR — Show validation status
// =============================================================================

import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationResult, ValidationError } from '../../types/validation/ValidationEngine';

// -----------------------------------------------------------------------------
// Validation Indicator Props
// -----------------------------------------------------------------------------

interface ValidationIndicatorProps {
  result: ValidationResult;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// -----------------------------------------------------------------------------
// Validation Indicator Component
// -----------------------------------------------------------------------------

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  result,
  showDetails = false,
  size = 'medium',
  className = '',
}) => {
  const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  if (result.valid && result.warnings.length === 0) {
    return (
      <span className={`validation-indicator valid ${size} ${className}`}>
        <CheckCircle size={iconSize} className="validation-icon-valid" />
        {showDetails && <span className="validation-text">Valid</span>}
      </span>
    );
  }

  if (result.valid && result.warnings.length > 0) {
    return (
      <div className={`validation-indicator warning ${size} ${className}`}>
        <AlertTriangle size={iconSize} className="validation-icon-warning" />
        {showDetails && (
          <div className="validation-details">
            {result.warnings.map((w, i) => (
              <span key={i} className="validation-message warning">
                {w.message}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`validation-indicator error ${size} ${className}`}>
      <AlertCircle size={iconSize} className="validation-icon-error" />
      {showDetails && (
        <div className="validation-details">
          {result.errors.map((e, i) => (
            <span key={i} className="validation-message error">
              {e.message}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Simple Valid/Invalid Icon
// -----------------------------------------------------------------------------

interface ValidationIconProps {
  valid: boolean;
  size?: number;
  className?: string;
}

export const ValidationIcon: React.FC<ValidationIconProps> = ({
  valid,
  size = 14,
  className = '',
}) => {
  if (valid) {
    return <CheckCircle size={size} className={`validation-icon-valid ${className}`} />;
  }
  return <AlertCircle size={size} className={`validation-icon-error ${className}`} />;
};

// -----------------------------------------------------------------------------
// Validation Message Component
// -----------------------------------------------------------------------------

interface ValidationMessageProps {
  errors?: ValidationError[];
  warnings?: ValidationError[];
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  errors = [],
  warnings = [],
  className = '',
}) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`validation-messages ${className}`}>
      {errors.map((error, i) => (
        <div key={`error-${i}`} className="validation-message-item error">
          <AlertCircle size={12} />
          <span>{error.message}</span>
        </div>
      ))}
      {warnings.map((warning, i) => (
        <div key={`warning-${i}`} className="validation-message-item warning">
          <AlertTriangle size={12} />
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Validation Tooltip Component
// -----------------------------------------------------------------------------

interface ValidationTooltipProps {
  result: ValidationResult;
  children: React.ReactNode;
  className?: string;
}

export const ValidationTooltip: React.FC<ValidationTooltipProps> = ({
  result,
  children,
  className = '',
}) => {
  const hasIssues = !result.valid || result.warnings.length > 0;

  if (!hasIssues) {
    return <>{children}</>;
  }

  return (
    <div className={`validation-tooltip-wrapper ${className}`}>
      {children}
      <div className="validation-tooltip">
        <ValidationMessage errors={result.errors} warnings={result.warnings} />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Validation Summary Component
// -----------------------------------------------------------------------------

interface ValidationSummaryProps {
  results: ValidationResult[];
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  results,
  className = '',
}) => {
  const valid = results.filter((r) => r.valid && r.warnings.length === 0).length;
  const warnings = results.filter((r) => r.valid && r.warnings.length > 0).length;
  const errors = results.filter((r) => !r.valid).length;

  return (
    <div className={`validation-summary ${className}`}>
      {valid > 0 && (
        <span className="validation-summary-item valid">
          <CheckCircle size={14} />
          <span>{valid} valid</span>
        </span>
      )}
      {warnings > 0 && (
        <span className="validation-summary-item warning">
          <AlertTriangle size={14} />
          <span>{warnings} warnings</span>
        </span>
      )}
      {errors > 0 && (
        <span className="validation-summary-item error">
          <AlertCircle size={14} />
          <span>{errors} errors</span>
        </span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Cell Validation Badge (compact for cell corner)
// -----------------------------------------------------------------------------

interface CellValidationBadgeProps {
  valid: boolean;
  errorCount?: number;
  className?: string;
}

export const CellValidationBadge: React.FC<CellValidationBadgeProps> = ({
  valid,
  errorCount = 0,
  className = '',
}) => {
  if (valid) return null;

  return (
    <span className={`cell-validation-badge ${className}`} title={`${errorCount} validation error(s)`}>
      <AlertCircle size={10} />
    </span>
  );
};

// =============================================================================
// VALIDATION REPORT — Display validation results
// =============================================================================

import React, { useState } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ValidationStatus = 'passed' | 'failed' | 'warning';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  column?: string;
  type: 'required' | 'unique' | 'range' | 'regex' | 'enum' | 'type' | 'custom';
}

interface ValidationResult {
  rule: ValidationRule;
  status: ValidationStatus;
  passCount: number;
  failCount: number;
  failedCells: ValidationFailure[];
}

interface ValidationFailure {
  cell: string;
  row: number;
  column: string;
  value: unknown;
  message: string;
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface ValidationReportProps {
  results: ValidationResult[];
  onFixFailure?: (failure: ValidationFailure) => void;
  onRerunValidation?: () => void;
}

// -----------------------------------------------------------------------------
// Validation Report Component
// -----------------------------------------------------------------------------

export const ValidationReport: React.FC<ValidationReportProps> = ({
  results,
  onFixFailure,
  onRerunValidation,
}) => {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ValidationStatus | 'all'>('all');

  const passed = results.filter(r => r.status === 'passed');
  const failed = results.filter(r => r.status === 'failed');
  const warnings = results.filter(r => r.status === 'warning');

  const filteredResults = filterStatus === 'all'
    ? results
    : results.filter(r => r.status === filterStatus);

  const totalFailures = results.reduce((sum, r) => sum + r.failCount, 0);

  return (
    <div className="validation-report">
      {/* Summary Header */}
      <div className="validation-report__header">
        <div className="validation-report__summary">
          <div className="validation-report__stat validation-report__stat--passed">
            <CheckIcon />
            <span>{passed.length} passed</span>
          </div>
          <div className="validation-report__stat validation-report__stat--failed">
            <XIcon />
            <span>{failed.length} failed</span>
          </div>
          <div className="validation-report__stat validation-report__stat--warning">
            <WarningIcon />
            <span>{warnings.length} warnings</span>
          </div>
        </div>
        <div className="validation-report__actions">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ValidationStatus | 'all')}
            className="validation-report__filter"
          >
            <option value="all">All Rules ({results.length})</option>
            <option value="passed">Passed ({passed.length})</option>
            <option value="failed">Failed ({failed.length})</option>
            <option value="warning">Warnings ({warnings.length})</option>
          </select>
          {onRerunValidation && (
            <button
              className="validation-report__rerun"
              onClick={onRerunValidation}
            >
              <RefreshIcon />
              Rerun
            </button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <div className={`validation-report__status validation-report__status--${failed.length > 0 ? 'failed' : 'passed'}`}>
        {failed.length > 0 ? (
          <>
            <XCircleIcon />
            <span>{totalFailures} validation failures found</span>
          </>
        ) : (
          <>
            <CheckCircleIcon />
            <span>All validations passed</span>
          </>
        )}
      </div>

      {/* Results List */}
      <div className="validation-report__results">
        {filteredResults.map((result) => (
          <ValidationResultCard
            key={result.rule.id}
            result={result}
            isExpanded={expandedRule === result.rule.id}
            onToggle={() => setExpandedRule(
              expandedRule === result.rule.id ? null : result.rule.id
            )}
            onFixFailure={onFixFailure}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Validation Result Card Component
// -----------------------------------------------------------------------------

interface ValidationResultCardProps {
  result: ValidationResult;
  isExpanded: boolean;
  onToggle: () => void;
  onFixFailure?: (failure: ValidationFailure) => void;
}

const ValidationResultCard: React.FC<ValidationResultCardProps> = ({
  result,
  isExpanded,
  onToggle,
  onFixFailure,
}) => {
  const typeLabel = getRuleTypeLabel(result.rule.type);

  return (
    <div className={`validation-result validation-result--${result.status}`}>
      {/* Result Header */}
      <div className="validation-result__header" onClick={onToggle}>
        <div className="validation-result__status-icon">
          {result.status === 'passed' && <CheckIcon small />}
          {result.status === 'failed' && <XIcon small />}
          {result.status === 'warning' && <WarningIcon small />}
        </div>
        <div className="validation-result__info">
          <span className="validation-result__name">{result.rule.name}</span>
          <span className="validation-result__description">{result.rule.description}</span>
        </div>
        <div className="validation-result__meta">
          <span className="validation-result__type">{typeLabel}</span>
          {result.rule.column && (
            <span className="validation-result__column">{result.rule.column}</span>
          )}
        </div>
        <div className="validation-result__counts">
          <span className="validation-result__pass-count">
            <CheckIcon tiny /> {result.passCount}
          </span>
          {result.failCount > 0 && (
            <span className="validation-result__fail-count">
              <XIcon tiny /> {result.failCount}
            </span>
          )}
        </div>
        {result.failedCells.length > 0 && (
          <ChevronIcon expanded={isExpanded} />
        )}
      </div>

      {/* Failures List */}
      {isExpanded && result.failedCells.length > 0 && (
        <div className="validation-result__failures">
          <div className="validation-result__failures-header">
            <span>Cell</span>
            <span>Value</span>
            <span>Issue</span>
            <span></span>
          </div>
          {result.failedCells.slice(0, 20).map((failure, i) => (
            <div key={i} className="validation-failure">
              <span className="validation-failure__cell">{failure.cell}</span>
              <span className="validation-failure__value">
                {String(failure.value ?? '(empty)')}
              </span>
              <span className="validation-failure__message">{failure.message}</span>
              {onFixFailure && (
                <button
                  className="validation-failure__fix"
                  onClick={() => onFixFailure(failure)}
                >
                  Fix
                </button>
              )}
            </div>
          ))}
          {result.failedCells.length > 20 && (
            <div className="validation-result__more">
              +{result.failedCells.length - 20} more failures
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Rule Builder Component
// -----------------------------------------------------------------------------

interface RuleBuilderProps {
  onAddRule: (rule: Omit<ValidationRule, 'id'>) => void;
  columns: string[];
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  onAddRule,
  columns,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ValidationRule['type']>('required');
  const [column, setColumn] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name) return;

    onAddRule({
      name,
      type,
      column: column || undefined,
      description: description || getDefaultDescription(type),
    });

    setName('');
    setDescription('');
  };

  return (
    <div className="rule-builder">
      <h4 className="rule-builder__title">Add Validation Rule</h4>
      <div className="rule-builder__form">
        <input
          type="text"
          placeholder="Rule name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rule-builder__input"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ValidationRule['type'])}
          className="rule-builder__select"
        >
          <option value="required">Required</option>
          <option value="unique">Unique</option>
          <option value="range">Range</option>
          <option value="regex">Pattern (Regex)</option>
          <option value="enum">Allowed Values</option>
          <option value="type">Data Type</option>
        </select>
        <select
          value={column}
          onChange={(e) => setColumn(e.target.value)}
          className="rule-builder__select"
        >
          <option value="">All Columns</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={!name}
          className="rule-builder__add"
        >
          Add Rule
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getRuleTypeLabel(type: ValidationRule['type']): string {
  const labels: Record<ValidationRule['type'], string> = {
    required: 'Required',
    unique: 'Unique',
    range: 'Range',
    regex: 'Pattern',
    enum: 'Allowed',
    type: 'Type',
    custom: 'Custom',
  };
  return labels[type];
}

function getDefaultDescription(type: ValidationRule['type']): string {
  const descriptions: Record<ValidationRule['type'], string> = {
    required: 'Value must not be empty',
    unique: 'Value must be unique in column',
    range: 'Value must be within specified range',
    regex: 'Value must match pattern',
    enum: 'Value must be one of allowed values',
    type: 'Value must be of specified type',
    custom: 'Custom validation rule',
  };
  return descriptions[type];
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon: React.FC<{ small?: boolean; tiny?: boolean }> = ({ small, tiny }) => (
  <svg
    width={tiny ? 10 : small ? 14 : 16}
    height={tiny ? 10 : small ? 14 : 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#22c55e"
    strokeWidth="2"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon: React.FC<{ small?: boolean; tiny?: boolean }> = ({ small, tiny }) => (
  <svg
    width={tiny ? 10 : small ? 14 : 16}
    height={tiny ? 10 : small ? 14 : 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const WarningIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 14 : 16}
    height={small ? 14 : 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="2"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default ValidationReport;

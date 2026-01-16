// =============================================================================
// FORMAT PREVIEW — Preview format standardization changes
// =============================================================================

import React, { useState } from 'react';
import type { FormatType } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FormatChange {
  cell: string;
  column: string;
  row: number;
  originalValue: string;
  standardizedValue: string;
  formatType: FormatType;
}

interface FormatSummary {
  type: FormatType;
  count: number;
  examples: FormatChange[];
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormatPreviewProps {
  changes: FormatChange[];
  onApply?: (changes: FormatChange[]) => void;
  onApplyByType?: (type: FormatType) => void;
  onReject?: (change: FormatChange) => void;
}

// -----------------------------------------------------------------------------
// Format Preview Component
// -----------------------------------------------------------------------------

export const FormatPreview: React.FC<FormatPreviewProps> = ({
  changes,
  onApply,
  onApplyByType,
  onReject,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<FormatType>>(new Set());
  const [expandedType, setExpandedType] = useState<FormatType | null>(null);

  // Group changes by format type
  const summaries = React.useMemo(() => {
    const grouped = new Map<FormatType, FormatChange[]>();

    for (const change of changes) {
      const existing = grouped.get(change.formatType) || [];
      existing.push(change);
      grouped.set(change.formatType, existing);
    }

    return Array.from(grouped.entries()).map(([type, items]): FormatSummary => ({
      type,
      count: items.length,
      examples: items.slice(0, 5),
    }));
  }, [changes]);

  const toggleType = (type: FormatType) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const selectedChanges = changes.filter(c => selectedTypes.has(c.formatType));

  if (changes.length === 0) {
    return (
      <div className="format-preview format-preview--empty">
        <CheckIcon />
        <p>No format issues detected</p>
        <span>All values are properly formatted</span>
      </div>
    );
  }

  return (
    <div className="format-preview">
      {/* Header */}
      <div className="format-preview__header">
        <div className="format-preview__summary">
          <span className="format-preview__count">{changes.length} values</span>
          <span className="format-preview__label">can be standardized</span>
        </div>
        {onApply && selectedChanges.length > 0 && (
          <button
            className="format-preview__apply-selected"
            onClick={() => onApply(selectedChanges)}
          >
            Apply Selected ({selectedChanges.length})
          </button>
        )}
      </div>

      {/* Format Type Cards */}
      <div className="format-preview__types">
        {summaries.map((summary) => (
          <FormatTypeCard
            key={summary.type}
            summary={summary}
            isSelected={selectedTypes.has(summary.type)}
            isExpanded={expandedType === summary.type}
            onToggleSelect={() => toggleType(summary.type)}
            onToggleExpand={() => setExpandedType(
              expandedType === summary.type ? null : summary.type
            )}
            onApply={onApplyByType}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Format Type Card Component
// -----------------------------------------------------------------------------

interface FormatTypeCardProps {
  summary: FormatSummary;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onApply?: (type: FormatType) => void;
  onReject?: (change: FormatChange) => void;
}

const FormatTypeCard: React.FC<FormatTypeCardProps> = ({
  summary,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onApply,
  onReject,
}) => {
  const typeConfig = getFormatTypeConfig(summary.type);

  return (
    <div className={`format-type-card ${isSelected ? 'format-type-card--selected' : ''}`}>
      {/* Card Header */}
      <div className="format-type-card__header">
        <div className="format-type-card__select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
          />
        </div>
        <div className="format-type-card__icon" style={{ color: typeConfig.color }}>
          {typeConfig.icon}
        </div>
        <div className="format-type-card__info" onClick={onToggleExpand}>
          <span className="format-type-card__name">{typeConfig.label}</span>
          <span className="format-type-card__count">{summary.count} values</span>
        </div>
        <div className="format-type-card__actions">
          {onApply && (
            <button
              className="format-type-card__apply"
              onClick={() => onApply(summary.type)}
            >
              Apply All
            </button>
          )}
          <button className="format-type-card__expand" onClick={onToggleExpand}>
            <ChevronIcon expanded={isExpanded} />
          </button>
        </div>
      </div>

      {/* Examples */}
      {isExpanded && (
        <div className="format-type-card__examples">
          <div className="format-type-card__examples-header">
            <span>Original</span>
            <span></span>
            <span>Standardized</span>
            <span></span>
          </div>
          {summary.examples.map((example, i) => (
            <div key={i} className="format-type-card__example">
              <span className="format-type-card__cell-ref">{example.cell}</span>
              <span className="format-type-card__original">{example.originalValue}</span>
              <span className="format-type-card__arrow">→</span>
              <span className="format-type-card__standardized">{example.standardizedValue}</span>
              {onReject && (
                <button
                  className="format-type-card__reject"
                  onClick={() => onReject(example)}
                  title="Reject this change"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}
          {summary.count > 5 && (
            <div className="format-type-card__more">
              +{summary.count - 5} more values
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Format Settings Component
// -----------------------------------------------------------------------------

interface FormatSettingsProps {
  type: FormatType;
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

export const FormatSettings: React.FC<FormatSettingsProps> = ({
  type,
  settings,
  onChange,
}) => {
  switch (type) {
    case 'date':
      return (
        <div className="format-settings">
          <label className="format-settings__label">
            Target Format
            <select
              value={settings.targetFormat as string || 'YYYY-MM-DD'}
              onChange={(e) => onChange({ ...settings, targetFormat: e.target.value })}
              className="format-settings__select"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</option>
              <option value="MMM DD, YYYY">MMM DD, YYYY (Jan 15, 2024)</option>
            </select>
          </label>
        </div>
      );

    case 'phone':
      return (
        <div className="format-settings">
          <label className="format-settings__label">
            Phone Format
            <select
              value={settings.phoneFormat as string || 'national'}
              onChange={(e) => onChange({ ...settings, phoneFormat: e.target.value })}
              className="format-settings__select"
            >
              <option value="national">(123) 456-7890</option>
              <option value="international">+1 123-456-7890</option>
              <option value="compact">1234567890</option>
            </select>
          </label>
        </div>
      );

    case 'name':
      return (
        <div className="format-settings">
          <label className="format-settings__label">
            Name Capitalization
            <select
              value={settings.nameCase as string || 'title'}
              onChange={(e) => onChange({ ...settings, nameCase: e.target.value })}
              className="format-settings__select"
            >
              <option value="title">Title Case (John Smith)</option>
              <option value="upper">UPPERCASE (JOHN SMITH)</option>
              <option value="lower">lowercase (john smith)</option>
            </select>
          </label>
        </div>
      );

    default:
      return null;
  }
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getFormatTypeConfig(type: FormatType): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  const configs: Record<FormatType, { label: string; color: string; icon: React.ReactNode }> = {
    date: {
      label: 'Dates',
      color: '#3b82f6',
      icon: <CalendarIcon />,
    },
    phone: {
      label: 'Phone Numbers',
      color: '#8b5cf6',
      icon: <PhoneIcon />,
    },
    email: {
      label: 'Email Addresses',
      color: '#06b6d4',
      icon: <EmailIcon />,
    },
    name: {
      label: 'Names',
      color: '#10b981',
      icon: <UserIcon />,
    },
    currency: {
      label: 'Currency',
      color: '#f59e0b',
      icon: <CurrencyIcon />,
    },
    number: {
      label: 'Numbers',
      color: '#6366f1',
      icon: <NumberIcon />,
    },
    text: {
      label: 'Text',
      color: '#64748b',
      icon: <CustomIcon />,
    },
  };

  return configs[type] || configs.text;
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
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

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CurrencyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const NumberIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const CustomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default FormatPreview;

// =============================================================================
// MISSING VALUES VIEW — Display and handle missing values
// =============================================================================

import React, { useState } from 'react';
import type { FillStrategy } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MissingValueColumn {
  column: string;
  columnIndex: number;
  missingCount: number;
  totalCount: number;
  percentage: number;
  missingRows: number[];
  suggestedStrategy: FillStrategy;
  previewValues?: Map<number, unknown>;
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface MissingValuesViewProps {
  columns: MissingValueColumn[];
  onFillColumn?: (column: string, strategy: FillStrategy) => void;
  onFillAll?: (strategy: FillStrategy) => void;
  onDeleteRows?: (rows: number[]) => void;
}

// -----------------------------------------------------------------------------
// Missing Values View Component
// -----------------------------------------------------------------------------

export const MissingValuesView: React.FC<MissingValuesViewProps> = ({
  columns,
  onFillColumn,
  onFillAll,
  onDeleteRows,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<FillStrategy>('mode');
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const totalMissing = columns.reduce((sum, c) => sum + c.missingCount, 0);
  const allMissingRows = Array.from(
    new Set(columns.flatMap(c => c.missingRows))
  ).sort((a, b) => a - b);

  if (columns.length === 0) {
    return (
      <div className="missing-values missing-values--empty">
        <CheckIcon />
        <p>No missing values</p>
        <span>All cells contain data</span>
      </div>
    );
  }

  return (
    <div className="missing-values">
      {/* Header */}
      <div className="missing-values__header">
        <div className="missing-values__summary">
          <span className="missing-values__count">{totalMissing} missing</span>
          <span className="missing-values__columns">across {columns.length} columns</span>
        </div>
        <div className="missing-values__actions">
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as FillStrategy)}
            className="missing-values__strategy-select"
          >
            <option value="mean">Fill with Mean</option>
            <option value="median">Fill with Median</option>
            <option value="mode">Fill with Mode</option>
            <option value="forward_fill">Forward Fill</option>
            <option value="backward_fill">Backward Fill</option>
            <option value="interpolate">Interpolate</option>
            <option value="constant">Fill with Constant</option>
          </select>
          {onFillAll && (
            <button
              className="missing-values__fill-all"
              onClick={() => onFillAll(selectedStrategy)}
            >
              Fill All
            </button>
          )}
        </div>
      </div>

      {/* Column Cards */}
      <div className="missing-values__columns-list">
        {columns.map((column) => (
          <MissingColumnCard
            key={column.column}
            column={column}
            isExpanded={expandedColumn === column.column}
            onToggle={() => setExpandedColumn(
              expandedColumn === column.column ? null : column.column
            )}
            onFill={onFillColumn}
          />
        ))}
      </div>

      {/* Delete Rows Option */}
      {onDeleteRows && allMissingRows.length > 0 && (
        <div className="missing-values__delete-option">
          <span>Or delete {allMissingRows.length} rows with missing values</span>
          <button
            className="missing-values__delete-btn"
            onClick={() => onDeleteRows(allMissingRows)}
          >
            <TrashIcon />
            Delete Rows
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Missing Column Card Component
// -----------------------------------------------------------------------------

interface MissingColumnCardProps {
  column: MissingValueColumn;
  isExpanded: boolean;
  onToggle: () => void;
  onFill?: (column: string, strategy: FillStrategy) => void;
}

const MissingColumnCard: React.FC<MissingColumnCardProps> = ({
  column,
  isExpanded,
  onToggle,
  onFill,
}) => {
  const [strategy, setStrategy] = useState<FillStrategy>(column.suggestedStrategy);

  return (
    <div className={`missing-column ${isExpanded ? 'missing-column--expanded' : ''}`}>
      {/* Card Header */}
      <div className="missing-column__header" onClick={onToggle}>
        <div className="missing-column__info">
          <span className="missing-column__name">{column.column}</span>
          <span className="missing-column__stats">
            {column.missingCount} of {column.totalCount} ({column.percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="missing-column__bar">
          <div
            className="missing-column__bar-fill"
            style={{ width: `${column.percentage}%` }}
          />
        </div>
        <ChevronIcon expanded={isExpanded} />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="missing-column__content">
          {/* Strategy Selection */}
          <div className="missing-column__strategy">
            <label>Fill Strategy:</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as FillStrategy)}
              className="missing-column__strategy-select"
            >
              <option value="mean">Mean (avg)</option>
              <option value="median">Median</option>
              <option value="mode">Mode (most common)</option>
              <option value="forward_fill">Forward Fill</option>
              <option value="backward_fill">Backward Fill</option>
              <option value="interpolate">Interpolate</option>
              <option value="constant">Constant Value</option>
              <option value="delete_row">Delete Rows</option>
            </select>
            {onFill && (
              <button
                className="missing-column__fill-btn"
                onClick={() => onFill(column.column, strategy)}
              >
                Apply
              </button>
            )}
          </div>

          {/* Preview */}
          {column.previewValues && column.previewValues.size > 0 && (
            <div className="missing-column__preview">
              <span className="missing-column__preview-label">Preview:</span>
              <div className="missing-column__preview-items">
                {Array.from(column.previewValues.entries()).slice(0, 5).map(([row, value]) => (
                  <div key={row} className="missing-column__preview-item">
                    <span className="missing-column__preview-row">Row {row + 1}</span>
                    <span className="missing-column__preview-arrow">→</span>
                    <span className="missing-column__preview-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Rows List */}
          <div className="missing-column__rows">
            <span className="missing-column__rows-label">Missing in rows:</span>
            <div className="missing-column__rows-list">
              {column.missingRows.slice(0, 20).map((row) => (
                <span key={row} className="missing-column__row-badge">{row + 1}</span>
              ))}
              {column.missingRows.length > 20 && (
                <span className="missing-column__row-more">
                  +{column.missingRows.length - 20} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Strategy Info Component
// -----------------------------------------------------------------------------

interface StrategyInfoProps {
  strategy: FillStrategy;
}

export const StrategyInfo: React.FC<StrategyInfoProps> = ({ strategy }) => {
  const info = getStrategyInfo(strategy);

  return (
    <div className="strategy-info">
      <div className="strategy-info__icon">{info.icon}</div>
      <div className="strategy-info__content">
        <span className="strategy-info__name">{info.name}</span>
        <span className="strategy-info__description">{info.description}</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getStrategyInfo(strategy: FillStrategy): {
  name: string;
  description: string;
  icon: React.ReactNode;
} {
  const infos: Record<FillStrategy, { name: string; description: string; icon: React.ReactNode }> = {
    mean: {
      name: 'Mean',
      description: 'Fill with the average value of the column',
      icon: <AvgIcon />,
    },
    median: {
      name: 'Median',
      description: 'Fill with the middle value when sorted',
      icon: <MedianIcon />,
    },
    mode: {
      name: 'Mode',
      description: 'Fill with the most common value',
      icon: <ModeIcon />,
    },
    forward_fill: {
      name: 'Forward Fill',
      description: 'Copy the previous non-empty value',
      icon: <ForwardIcon />,
    },
    backward_fill: {
      name: 'Backward Fill',
      description: 'Copy the next non-empty value',
      icon: <BackwardIcon />,
    },
    interpolate: {
      name: 'Interpolate',
      description: 'Calculate value based on neighbors',
      icon: <InterpolateIcon />,
    },
    constant: {
      name: 'Constant',
      description: 'Fill with a specific value',
      icon: <ConstantIcon />,
    },
    delete_row: {
      name: 'Delete',
      description: 'Remove rows with missing values',
      icon: <TrashIcon />,
    },
  };

  return infos[strategy];
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

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const AvgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const MedianIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="4" height="8" />
    <rect x="10" y="4" width="4" height="16" />
    <rect x="17" y="8" width="4" height="8" />
  </svg>
);

const ModeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="12" width="4" height="8" />
    <rect x="10" y="4" width="4" height="16" />
    <rect x="17" y="8" width="4" height="12" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const BackwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const InterpolateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="4" cy="16" r="2" />
    <circle cx="20" cy="8" r="2" />
    <line x1="6" y1="15" x2="18" y2="9" />
    <circle cx="12" cy="12" r="2" strokeDasharray="2 2" />
  </svg>
);

const ConstantIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">C</text>
  </svg>
);

export default MissingValuesView;

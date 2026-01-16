// =============================================================================
// DIFF VIEWER — Before/after table view of changes (Blueprint §2.2.3)
// =============================================================================

import React, { useState, useMemo } from 'react';
import type { SandboxDiff, CellChange, ChangeType } from '../../ai/sandbox/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface DiffViewerProps {
  diff: SandboxDiff;
  maxRows?: number;
  showSummary?: boolean;
  compact?: boolean;
}

interface DiffRowProps {
  change: CellChange;
  compact?: boolean;
}

// -----------------------------------------------------------------------------
// Change Type Icons
// -----------------------------------------------------------------------------

const getChangeTypeIcon = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return '+';
    case 'modified':
      return '~';
    case 'deleted':
      return '-';
  }
};

const getChangeTypeLabel = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return 'added';
    case 'modified':
      return 'modified';
    case 'deleted':
      return 'deleted';
  }
};

// -----------------------------------------------------------------------------
// Format Cell Value
// -----------------------------------------------------------------------------

const formatCellValue = (
  value: unknown,
  formula: string | null
): string => {
  if (formula) {
    return formula.length > 30 ? formula.substring(0, 27) + '...' : formula;
  }

  if (value === null || value === undefined) {
    return '(empty)';
  }

  const str = String(value);
  return str.length > 30 ? str.substring(0, 27) + '...' : str;
};

// -----------------------------------------------------------------------------
// Diff Row Component
// -----------------------------------------------------------------------------

const DiffRow: React.FC<DiffRowProps> = ({ change, compact }) => {
  const beforeValue = change.before
    ? formatCellValue(change.before.value, change.before.formula)
    : '(empty)';
  const afterValue = change.after
    ? formatCellValue(change.after.value, change.after.formula)
    : '(empty)';

  const isFormulaBefore = !!change.before?.formula;
  const isFormulaAfter = !!change.after?.formula;

  if (compact) {
    return (
      <tr className={`diff-row diff-row--${change.changeType}`}>
        <td className="diff-cell diff-cell--ref">{change.ref}</td>
        <td className="diff-cell diff-cell--type">
          <span className={`diff-type-badge diff-type-badge--${change.changeType}`}>
            {getChangeTypeIcon(change.changeType)}
          </span>
        </td>
        <td className="diff-cell diff-cell--value" title={afterValue}>
          {afterValue}
        </td>
      </tr>
    );
  }

  return (
    <tr className={`diff-row diff-row--${change.changeType}`}>
      <td className="diff-cell diff-cell--ref">
        <span className="diff-cell-ref">{change.ref}</span>
        {change.sheetName && (
          <span className="diff-cell-sheet">{change.sheetName}</span>
        )}
      </td>
      <td
        className={`diff-cell diff-cell--before ${isFormulaBefore ? 'diff-cell--formula' : ''}`}
        title={change.before?.formula || String(change.before?.value || '')}
      >
        {beforeValue}
      </td>
      <td
        className={`diff-cell diff-cell--after ${isFormulaAfter ? 'diff-cell--formula' : ''}`}
        title={change.after?.formula || String(change.after?.value || '')}
      >
        {afterValue}
      </td>
      <td className="diff-cell diff-cell--type">
        <span className={`diff-type-badge diff-type-badge--${change.changeType}`}>
          {getChangeTypeIcon(change.changeType)} {getChangeTypeLabel(change.changeType)}
        </span>
      </td>
    </tr>
  );
};

// -----------------------------------------------------------------------------
// Diff Summary Component
// -----------------------------------------------------------------------------

interface DiffSummaryProps {
  summary: SandboxDiff['summary'];
}

const DiffSummaryView: React.FC<DiffSummaryProps> = ({ summary }) => {
  return (
    <div className="diff-summary">
      <div className="diff-summary-item diff-summary-item--total">
        <span className="diff-summary-value">{summary.totalChanges}</span>
        <span className="diff-summary-label">Total Changes</span>
      </div>
      <div className="diff-summary-item diff-summary-item--added">
        <span className="diff-summary-value">+{summary.added}</span>
        <span className="diff-summary-label">Added</span>
      </div>
      <div className="diff-summary-item diff-summary-item--modified">
        <span className="diff-summary-value">~{summary.modified}</span>
        <span className="diff-summary-label">Modified</span>
      </div>
      <div className="diff-summary-item diff-summary-item--deleted">
        <span className="diff-summary-value">-{summary.deleted}</span>
        <span className="diff-summary-label">Deleted</span>
      </div>
      {summary.formulaChanges > 0 && (
        <div className="diff-summary-item diff-summary-item--formulas">
          <span className="diff-summary-value">{summary.formulaChanges}</span>
          <span className="diff-summary-label">Formulas</span>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Diff Viewer Component
// -----------------------------------------------------------------------------

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  maxRows = 50,
  showSummary = true,
  compact = false,
}) => {
  const [filter, setFilter] = useState<ChangeType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'ref' | 'type'>('ref');

  // Filter and sort changes
  const displayChanges = useMemo(() => {
    let changes = [...diff.changes];

    // Filter
    if (filter !== 'all') {
      changes = changes.filter((c) => c.changeType === filter);
    }

    // Sort
    if (sortBy === 'ref') {
      changes.sort((a, b) => {
        // Sort by sheet, then by cell reference
        if (a.sheetName !== b.sheetName) {
          return (a.sheetName || '').localeCompare(b.sheetName || '');
        }
        return a.ref.localeCompare(b.ref, undefined, { numeric: true });
      });
    } else {
      changes.sort((a, b) => {
        const typeOrder = { added: 0, modified: 1, deleted: 2 };
        return typeOrder[a.changeType] - typeOrder[b.changeType];
      });
    }

    return changes;
  }, [diff.changes, filter, sortBy]);

  const hasMore = displayChanges.length > maxRows;
  const visibleChanges = displayChanges.slice(0, maxRows);

  if (diff.changes.length === 0) {
    return (
      <div className="diff-viewer diff-viewer--empty">
        <div className="diff-empty-state">
          <span className="diff-empty-icon">📝</span>
          <p>No changes to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`diff-viewer ${compact ? 'diff-viewer--compact' : ''}`}>
      {/* Summary */}
      {showSummary && <DiffSummaryView summary={diff.summary} />}

      {/* Controls */}
      {!compact && (
        <div className="diff-controls">
          <div className="diff-filter">
            <label>Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ChangeType | 'all')}
            >
              <option value="all">All Changes</option>
              <option value="added">Added Only</option>
              <option value="modified">Modified Only</option>
              <option value="deleted">Deleted Only</option>
            </select>
          </div>
          <div className="diff-sort">
            <label>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'ref' | 'type')}
            >
              <option value="ref">By Cell Reference</option>
              <option value="type">By Change Type</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="diff-table-wrapper">
        <table className="diff-table">
          <thead>
            <tr>
              <th className="diff-header diff-header--ref">Cell</th>
              {!compact && <th className="diff-header diff-header--before">Before</th>}
              {!compact && <th className="diff-header diff-header--after">After</th>}
              {compact && <th className="diff-header diff-header--value">Value</th>}
              <th className="diff-header diff-header--type">Type</th>
            </tr>
          </thead>
          <tbody>
            {visibleChanges.map((change, index) => (
              <DiffRow
                key={`${change.sheetId}-${change.ref}-${index}`}
                change={change}
                compact={compact}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* More indicator */}
      {hasMore && (
        <div className="diff-more">
          <span>
            Showing {maxRows} of {displayChanges.length} changes
          </span>
        </div>
      )}

      {/* Sheets affected */}
      {diff.summary.sheetsAffected.length > 1 && (
        <div className="diff-sheets">
          <span className="diff-sheets-label">Sheets affected:</span>
          {diff.summary.sheetsAffected.map((sheet) => (
            <span key={sheet} className="diff-sheet-tag">
              {sheet}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiffViewer;

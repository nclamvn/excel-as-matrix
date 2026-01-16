// =============================================================================
// BEFORE/AFTER PREVIEW — Side-by-side comparison of changes
// =============================================================================

import React, { useState, useMemo } from 'react';
import type { CellChange } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface BeforeAfterPreviewProps {
  changes: CellChange[];
  onAcceptChange?: (change: CellChange) => void;
  onRejectChange?: (change: CellChange) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

// -----------------------------------------------------------------------------
// Before/After Preview Component
// -----------------------------------------------------------------------------

export const BeforeAfterPreview: React.FC<BeforeAfterPreviewProps> = ({
  changes,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());

  // Group changes by type
  const groupedChanges = useMemo(() => {
    const groups = new Map<string, CellChange[]>();
    for (const change of changes) {
      const key = change.changeType;
      const existing = groups.get(key) || [];
      existing.push(change);
      groups.set(key, existing);
    }
    return groups;
  }, [changes]);

  const changeTypes = Array.from(groupedChanges.keys());

  const filteredChanges = filterType === 'all'
    ? changes
    : changes.filter(c => c.changeType === filterType);

  const toggleChange = (ref: string) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(ref)) {
      newSelected.delete(ref);
    } else {
      newSelected.add(ref);
    }
    setSelectedChanges(newSelected);
  };

  const selectAll = () => {
    setSelectedChanges(new Set(filteredChanges.map(c => c.ref)));
  };

  const deselectAll = () => {
    setSelectedChanges(new Set());
  };

  if (changes.length === 0) {
    return (
      <div className="before-after before-after--empty">
        <EmptyIcon />
        <p>No changes to preview</p>
        <span>Run cleaning operations to see a preview</span>
      </div>
    );
  }

  return (
    <div className="before-after">
      {/* Header */}
      <div className="before-after__header">
        <div className="before-after__summary">
          <span className="before-after__count">{changes.length} changes</span>
          {selectedChanges.size > 0 && (
            <span className="before-after__selected">
              {selectedChanges.size} selected
            </span>
          )}
        </div>
        <div className="before-after__controls">
          {/* View Mode Toggle */}
          <div className="before-after__view-toggle">
            <button
              className={`before-after__view-btn ${viewMode === 'list' ? 'before-after__view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon />
            </button>
            <button
              className={`before-after__view-btn ${viewMode === 'grouped' ? 'before-after__view-btn--active' : ''}`}
              onClick={() => setViewMode('grouped')}
            >
              <GridIcon />
            </button>
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="before-after__filter"
          >
            <option value="all">All Types ({changes.length})</option>
            {changeTypes.map(type => (
              <option key={type} value={type}>
                {formatChangeType(type)} ({groupedChanges.get(type)?.length || 0})
              </option>
            ))}
          </select>

          {/* Selection Controls */}
          <button className="before-after__select-all" onClick={selectAll}>
            Select All
          </button>
          <button className="before-after__deselect-all" onClick={deselectAll}>
            Clear
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="before-after__actions">
        {onAcceptAll && (
          <button className="before-after__accept-all" onClick={onAcceptAll}>
            <CheckIcon />
            Accept All Changes
          </button>
        )}
        {onRejectAll && (
          <button className="before-after__reject-all" onClick={onRejectAll}>
            <XIcon />
            Reject All
          </button>
        )}
      </div>

      {/* Content */}
      <div className="before-after__content">
        {viewMode === 'list' ? (
          <ChangesList
            changes={filteredChanges}
            selectedChanges={selectedChanges}
            onToggle={toggleChange}
            onAccept={onAcceptChange}
            onReject={onRejectChange}
          />
        ) : (
          <ChangesGrouped
            groups={groupedChanges}
            filterType={filterType}
            selectedChanges={selectedChanges}
            onToggle={toggleChange}
            onAccept={onAcceptChange}
            onReject={onRejectChange}
          />
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Changes List Component
// -----------------------------------------------------------------------------

interface ChangesListProps {
  changes: CellChange[];
  selectedChanges: Set<string>;
  onToggle: (ref: string) => void;
  onAccept?: (change: CellChange) => void;
  onReject?: (change: CellChange) => void;
}

const ChangesList: React.FC<ChangesListProps> = ({
  changes,
  selectedChanges,
  onToggle,
  onAccept,
  onReject,
}) => (
  <div className="changes-list">
    <div className="changes-list__header">
      <span className="changes-list__col-select">Select</span>
      <span className="changes-list__col-cell">Cell</span>
      <span className="changes-list__col-type">Type</span>
      <span className="changes-list__col-before">Before</span>
      <span className="changes-list__col-arrow"></span>
      <span className="changes-list__col-after">After</span>
      <span className="changes-list__col-actions">Actions</span>
    </div>
    <div className="changes-list__items">
      {changes.slice(0, 100).map((change) => (
        <div
          key={change.ref}
          className={`change-item ${selectedChanges.has(change.ref) ? 'change-item--selected' : ''}`}
        >
          <div className="change-item__select">
            <input
              type="checkbox"
              checked={selectedChanges.has(change.ref)}
              onChange={() => onToggle(change.ref)}
            />
          </div>
          <div className="change-item__cell">{change.ref}</div>
          <div className="change-item__type">
            <span className={`change-type-badge change-type-badge--${change.changeType}`}>
              {formatChangeType(change.changeType)}
            </span>
          </div>
          <div className="change-item__before">{formatValue(change.before)}</div>
          <div className="change-item__arrow">→</div>
          <div className="change-item__after">{formatValue(change.after)}</div>
          <div className="change-item__actions">
            {onAccept && (
              <button
                className="change-item__accept"
                onClick={() => onAccept(change)}
                title="Accept"
              >
                <CheckIcon small />
              </button>
            )}
            {onReject && (
              <button
                className="change-item__reject"
                onClick={() => onReject(change)}
                title="Reject"
              >
                <XIcon small />
              </button>
            )}
          </div>
        </div>
      ))}
      {changes.length > 100 && (
        <div className="changes-list__more">
          +{changes.length - 100} more changes
        </div>
      )}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Changes Grouped Component
// -----------------------------------------------------------------------------

interface ChangesGroupedProps {
  groups: Map<string, CellChange[]>;
  filterType: string;
  selectedChanges: Set<string>;
  onToggle: (ref: string) => void;
  onAccept?: (change: CellChange) => void;
  onReject?: (change: CellChange) => void;
}

const ChangesGrouped: React.FC<ChangesGroupedProps> = ({
  groups,
  filterType,
  selectedChanges,
  onToggle,
  onAccept,
  onReject,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.keys()));

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = filterType === 'all'
    ? Array.from(groups.entries())
    : Array.from(groups.entries()).filter(([type]) => type === filterType);

  return (
    <div className="changes-grouped">
      {filteredGroups.map(([type, changes]) => (
        <div key={type} className="change-group">
          <div
            className="change-group__header"
            onClick={() => toggleGroup(type)}
          >
            <span className={`change-type-badge change-type-badge--${type}`}>
              {formatChangeType(type)}
            </span>
            <span className="change-group__count">{changes.length} changes</span>
            <ChevronIcon expanded={expandedGroups.has(type)} />
          </div>
          {expandedGroups.has(type) && (
            <div className="change-group__items">
              {changes.slice(0, 50).map((change) => (
                <div
                  key={change.ref}
                  className={`change-item change-item--compact ${selectedChanges.has(change.ref) ? 'change-item--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChanges.has(change.ref)}
                    onChange={() => onToggle(change.ref)}
                  />
                  <span className="change-item__cell">{change.ref}</span>
                  <span className="change-item__before">{formatValue(change.before)}</span>
                  <span className="change-item__arrow">→</span>
                  <span className="change-item__after">{formatValue(change.after)}</span>
                  <div className="change-item__actions">
                    {onAccept && (
                      <button onClick={() => onAccept(change)} title="Accept">
                        <CheckIcon small />
                      </button>
                    )}
                    {onReject && (
                      <button onClick={() => onReject(change)} title="Reject">
                        <XIcon small />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {changes.length > 50 && (
                <div className="change-group__more">
                  +{changes.length - 50} more
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Diff View Component
// -----------------------------------------------------------------------------

interface DiffViewProps {
  before: string;
  after: string;
}

export const DiffView: React.FC<DiffViewProps> = ({ before, after }) => {
  const beforeChars = before.split('');
  const afterChars = after.split('');

  // Simple char-level diff
  const diffs: Array<{ type: 'same' | 'removed' | 'added'; char: string }> = [];

  let i = 0, j = 0;
  while (i < beforeChars.length || j < afterChars.length) {
    if (i < beforeChars.length && j < afterChars.length && beforeChars[i] === afterChars[j]) {
      diffs.push({ type: 'same', char: beforeChars[i] });
      i++;
      j++;
    } else if (i < beforeChars.length) {
      diffs.push({ type: 'removed', char: beforeChars[i] });
      i++;
    } else {
      diffs.push({ type: 'added', char: afterChars[j] });
      j++;
    }
  }

  return (
    <div className="diff-view">
      {diffs.map((d, idx) => (
        <span key={idx} className={`diff-view__char diff-view__char--${d.type}`}>
          {d.char}
        </span>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatChangeType(type: string): string {
  const labels: Record<string, string> = {
    format: 'Format',
    duplicate: 'Duplicate',
    missing: 'Missing',
    inconsistency: 'Inconsistency',
    whitespace: 'Whitespace',
    outlier: 'Outlier',
    validation: 'Validation',
  };
  return labels[type] || type;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (value === '') return '(blank)';
  return String(value);
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

const CheckIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 12 : 14}
    height={small ? 12 : 14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 12 : 14}
    height={small ? 12 : 14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
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

export default BeforeAfterPreview;

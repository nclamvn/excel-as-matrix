// =============================================================================
// DUPLICATES VIEW — Display and manage duplicate rows
// =============================================================================

import React, { useState } from 'react';
import type { DuplicateGroup, DuplicateRow } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface DuplicatesViewProps {
  groups: DuplicateGroup[];
  onKeepRow?: (groupId: string, rowIndex: number) => void;
  onRemoveRow?: (groupId: string, rowIndex: number) => void;
  onMergeGroup?: (groupId: string) => void;
  onRemoveAllDuplicates?: () => void;
}

// -----------------------------------------------------------------------------
// Duplicates View Component
// -----------------------------------------------------------------------------

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  groups,
  onKeepRow,
  onRemoveRow,
  onMergeGroup,
  onRemoveAllDuplicates,
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalDuplicates = groups.reduce((sum, g) => sum + g.rows.length - 1, 0);

  const toggleRowSelection = (groupId: string, rowIndex: number) => {
    const key = `${groupId}-${rowIndex}`;
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  };

  if (groups.length === 0) {
    return (
      <div className="duplicates-view duplicates-view--empty">
        <CheckIcon />
        <p>No duplicates found</p>
        <span>Your data has no duplicate rows</span>
      </div>
    );
  }

  return (
    <div className="duplicates-view">
      {/* Header */}
      <div className="duplicates-view__header">
        <div className="duplicates-view__summary">
          <span className="duplicates-view__count">{groups.length} groups</span>
          <span className="duplicates-view__total">{totalDuplicates} duplicates</span>
        </div>
        {onRemoveAllDuplicates && totalDuplicates > 0 && (
          <button
            className="duplicates-view__remove-all"
            onClick={onRemoveAllDuplicates}
          >
            <TrashIcon />
            Remove All Duplicates
          </button>
        )}
      </div>

      {/* Groups List */}
      <div className="duplicates-view__groups">
        {groups.map((group) => (
          <DuplicateGroupCard
            key={group.id}
            group={group}
            isExpanded={expandedGroup === group.id}
            onToggle={() => setExpandedGroup(
              expandedGroup === group.id ? null : group.id
            )}
            selectedRows={selectedRows}
            onToggleRow={(rowIndex) => toggleRowSelection(group.id, rowIndex)}
            onKeepRow={onKeepRow}
            onRemoveRow={onRemoveRow}
            onMerge={onMergeGroup}
          />
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Duplicate Group Card Component
// -----------------------------------------------------------------------------

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  isExpanded: boolean;
  onToggle: () => void;
  selectedRows: Set<string>;
  onToggleRow: (rowIndex: number) => void;
  onKeepRow?: (groupId: string, rowIndex: number) => void;
  onRemoveRow?: (groupId: string, rowIndex: number) => void;
  onMerge?: (groupId: string) => void;
}

const DuplicateGroupCard: React.FC<DuplicateGroupCardProps> = ({
  group,
  isExpanded,
  onToggle,
  selectedRows,
  onToggleRow,
  onKeepRow,
  onRemoveRow,
  onMerge,
}) => {
  const matchTypeLabel = group.type === 'exact' ? 'Exact Match' : 'Similar';

  return (
    <div className={`duplicate-group ${isExpanded ? 'duplicate-group--expanded' : ''}`}>
      {/* Group Header */}
      <div className="duplicate-group__header" onClick={onToggle}>
        <div className="duplicate-group__info">
          <span className="duplicate-group__badge">
            {group.rows.length} rows
          </span>
          <span className={`duplicate-group__type duplicate-group__type--${group.type}`}>
            {matchTypeLabel}
          </span>
          {group.type === 'fuzzy' && group.similarity && (
            <span className="duplicate-group__similarity">
              {Math.round(group.similarity * 100)}% similar
            </span>
          )}
        </div>
        <div className="duplicate-group__actions">
          {onMerge && (
            <button
              className="duplicate-group__action"
              onClick={(e) => {
                e.stopPropagation();
                onMerge(group.id);
              }}
              title="Merge rows"
            >
              <MergeIcon />
            </button>
          )}
          <ChevronIcon expanded={isExpanded} />
        </div>
      </div>

      {/* Group Content */}
      {isExpanded && (
        <div className="duplicate-group__content">
          {/* Column Headers */}
          {group.columns && group.columns.length > 0 && (
            <div className="duplicate-group__columns">
              <div className="duplicate-group__col-header duplicate-group__col-header--select">
                Select
              </div>
              <div className="duplicate-group__col-header duplicate-group__col-header--row">
                Row
              </div>
              {group.columns.map((col, i) => (
                <div key={i} className="duplicate-group__col-header">
                  {col}
                </div>
              ))}
              <div className="duplicate-group__col-header duplicate-group__col-header--actions">
                Actions
              </div>
            </div>
          )}

          {/* Rows */}
          <div className="duplicate-group__rows">
            {group.rows.map((row, index) => (
              <DuplicateRowItem
                key={row.rowIndex}
                row={row}
                isFirst={index === 0}
                isSelected={selectedRows.has(`${group.id}-${index}`)}
                onToggle={() => onToggleRow(index)}
                onKeep={() => onKeepRow?.(group.id, row.rowIndex)}
                onRemove={() => onRemoveRow?.(group.id, row.rowIndex)}
              />
            ))}
          </div>

          {/* Differences Highlight */}
          {group.type === 'fuzzy' && group.similarity < 1 && (
            <div className="duplicate-group__differences">
              <span className="duplicate-group__diff-label">Similarity:</span>
              <span className="duplicate-group__diff-col">{Math.round(group.similarity * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Duplicate Row Item Component
// -----------------------------------------------------------------------------

interface DuplicateRowItemProps {
  row: DuplicateRow;
  isFirst: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onKeep?: () => void;
  onRemove?: () => void;
}

const DuplicateRowItem: React.FC<DuplicateRowItemProps> = ({
  row,
  isFirst,
  isSelected,
  onToggle,
  onKeep,
  onRemove,
}) => (
  <div className={`duplicate-row ${isFirst ? 'duplicate-row--original' : ''} ${isSelected ? 'duplicate-row--selected' : ''}`}>
    <div className="duplicate-row__select">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
      />
    </div>
    <div className="duplicate-row__index">
      {row.rowIndex + 1}
      {isFirst && <span className="duplicate-row__original-badge">Original</span>}
    </div>
    {row.values.map((value, i) => (
      <div key={i} className="duplicate-row__cell">
        {String(value ?? '')}
      </div>
    ))}
    <div className="duplicate-row__actions">
      {onKeep && (
        <button
          className="duplicate-row__action duplicate-row__action--keep"
          onClick={onKeep}
          title="Keep this row"
        >
          <CheckIcon small />
        </button>
      )}
      {onRemove && !isFirst && (
        <button
          className="duplicate-row__action duplicate-row__action--remove"
          onClick={onRemove}
          title="Remove this row"
        >
          <TrashIcon small />
        </button>
      )}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 12 : 48}
    height={small ? 12 : 48}
    viewBox="0 0 24 24"
    fill="none"
    stroke={small ? 'currentColor' : '#22c55e'}
    strokeWidth={small ? 2 : 1.5}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const TrashIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 12 : 14}
    height={small ? 12 : 14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const MergeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 6l4 4 4-4" />
    <path d="M12 2v8" />
    <path d="M8 18l4-4 4 4" />
    <path d="M12 22v-8" />
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

export default DuplicatesView;

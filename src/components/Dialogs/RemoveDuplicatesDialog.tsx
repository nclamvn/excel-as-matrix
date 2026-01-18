import React, { useState, useMemo } from 'react';
import { X, GitCompare, Check, AlertTriangle } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { colToLetter, getCellKey } from '../../types/cell';

interface RemoveDuplicatesDialogProps {
  onClose: () => void;
}

export const RemoveDuplicatesDialog: React.FC<RemoveDuplicatesDialogProps> = ({ onClose }) => {
  const { activeSheetId, sheets, selectionRange, selectedCell, batchUpdateCells } = useWorkbookStore();
  const { showToast } = useUIStore();

  const sheet = activeSheetId ? sheets[activeSheetId] : null;

  // Determine the range to work with
  const range = useMemo(() => {
    if (selectionRange) {
      return selectionRange;
    }
    if (selectedCell) {
      // Auto-detect data region from selected cell
      return { start: selectedCell, end: selectedCell };
    }
    return null;
  }, [selectionRange, selectedCell]);

  // Get columns in the selection
  const columns = useMemo(() => {
    if (!range) return [];
    const cols: { index: number; letter: string; hasHeader: boolean }[] = [];
    for (let col = range.start.col; col <= range.end.col; col++) {
      const headerKey = getCellKey(range.start.row, col);
      const headerCell = sheet?.cells[headerKey];
      const headerValue = headerCell?.displayValue || headerCell?.value;
      cols.push({
        index: col,
        letter: colToLetter(col),
        hasHeader: !!headerValue && typeof headerValue === 'string' && headerValue.length > 0,
      });
    }
    return cols;
  }, [range, sheet]);

  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(() => {
    return new Set(columns.map((c) => c.index));
  });
  const [hasHeaders, setHasHeaders] = useState(true);

  // Preview duplicates
  const duplicateInfo = useMemo(() => {
    if (!range || !sheet || selectedColumns.size === 0) {
      return { duplicateCount: 0, uniqueCount: 0, duplicateRows: [] as number[] };
    }

    const startRow = hasHeaders ? range.start.row + 1 : range.start.row;
    const endRow = range.end.row;

    const seen = new Map<string, number>();
    const duplicateRows: number[] = [];

    for (let row = startRow; row <= endRow; row++) {
      // Build key from selected columns
      const key = Array.from(selectedColumns)
        .sort((a, b) => a - b)
        .map((col) => {
          const cellKey = getCellKey(row, col);
          const cell = sheet.cells[cellKey];
          return String(cell?.value ?? '');
        })
        .join('|');

      if (seen.has(key)) {
        duplicateRows.push(row);
      } else {
        seen.set(key, row);
      }
    }

    return {
      duplicateCount: duplicateRows.length,
      uniqueCount: seen.size,
      duplicateRows,
    };
  }, [range, sheet, selectedColumns, hasHeaders]);

  const handleColumnToggle = (colIndex: number) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(colIndex)) {
      newSelected.delete(colIndex);
    } else {
      newSelected.add(colIndex);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedColumns(new Set(columns.map((c) => c.index)));
  };

  const handleDeselectAll = () => {
    setSelectedColumns(new Set());
  };

  const handleRemoveDuplicates = () => {
    if (!range || !sheet || !activeSheetId) {
      showToast('No data range selected', 'warning');
      return;
    }

    if (selectedColumns.size === 0) {
      showToast('Select at least one column', 'warning');
      return;
    }

    if (duplicateInfo.duplicateCount === 0) {
      showToast('No duplicates found', 'info');
      onClose();
      return;
    }

    // Remove duplicate rows by clearing their cells
    const updates: Array<{ row: number; col: number; data: { value: null; displayValue: string; formula: null } }> = [];

    // Sort duplicate rows in descending order to remove from bottom first
    const rowsToRemove = [...duplicateInfo.duplicateRows].sort((a, b) => b - a);

    // For now, we'll just clear the duplicate rows
    // A more sophisticated approach would shift rows up
    for (const row of rowsToRemove) {
      for (let col = range.start.col; col <= range.end.col; col++) {
        updates.push({
          row,
          col,
          data: { value: null, displayValue: '', formula: null },
        });
      }
    }

    if (updates.length > 0) {
      batchUpdateCells(activeSheetId, updates);
    }

    showToast(
      `Removed ${duplicateInfo.duplicateCount} duplicate rows. ${duplicateInfo.uniqueCount} unique values remain.`,
      'success'
    );
    onClose();
  };

  if (!range) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog remove-duplicates-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>
              <GitCompare className="w-4 h-4" />
              Remove Duplicates
            </h3>
            <button className="dialog-close" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="dialog-content">
            <div className="warning-message">
              <AlertTriangle className="w-5 h-5" />
              <p>Please select a data range first.</p>
            </div>
          </div>
          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog remove-duplicates-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <GitCompare className="w-4 h-4" />
            Remove Duplicates
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          <div className="range-info">
            <span>
              Range: {colToLetter(range.start.col)}
              {range.start.row + 1}:{colToLetter(range.end.col)}
              {range.end.row + 1}
            </span>
          </div>

          <div className="header-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasHeaders}
                onChange={(e) => setHasHeaders(e.target.checked)}
              />
              <span>My data has headers</span>
            </label>
          </div>

          <div className="columns-section">
            <div className="columns-header">
              <label className="field-label">Select columns to compare:</label>
              <div className="columns-actions">
                <button className="btn-link" onClick={handleSelectAll}>
                  Select All
                </button>
                <span className="separator">|</span>
                <button className="btn-link" onClick={handleDeselectAll}>
                  Deselect All
                </button>
              </div>
            </div>

            <div className="columns-list">
              {columns.map((col) => {
                const headerKey = getCellKey(range.start.row, col.index);
                const headerCell = sheet?.cells[headerKey];
                const headerValue = hasHeaders
                  ? headerCell?.displayValue || headerCell?.value || `Column ${col.letter}`
                  : `Column ${col.letter}`;

                return (
                  <label key={col.index} className="column-item">
                    <input
                      type="checkbox"
                      checked={selectedColumns.has(col.index)}
                      onChange={() => handleColumnToggle(col.index)}
                    />
                    <span className="column-letter">{col.letter}</span>
                    <span className="column-name">{String(headerValue)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="preview-section">
            <div className="preview-stats">
              {duplicateInfo.duplicateCount > 0 ? (
                <>
                  <div className="stat stat-warning">
                    <span className="stat-value">{duplicateInfo.duplicateCount}</span>
                    <span className="stat-label">duplicate rows found</span>
                  </div>
                  <div className="stat stat-success">
                    <span className="stat-value">{duplicateInfo.uniqueCount}</span>
                    <span className="stat-label">unique values will remain</span>
                  </div>
                </>
              ) : (
                <div className="stat stat-success">
                  <Check className="w-4 h-4" />
                  <span>No duplicates found in selected columns</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRemoveDuplicates}
            disabled={selectedColumns.size === 0}
          >
            Remove Duplicates
          </button>
        </div>
      </div>
    </div>
  );
};

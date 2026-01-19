import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useTableStore } from '../../stores/tableStore';
import { useUIStore } from '../../stores/uiStore';
import { Table, TableColumn, TableStyle } from '../../types/cell';

interface InsertTableDialogProps {
  onClose: () => void;
}

export const InsertTableDialog: React.FC<InsertTableDialogProps> = ({ onClose }) => {
  const [hasHeaders, setHasHeaders] = useState(true);
  const [tableName, setTableName] = useState('Table1');
  const { selectionRange, activeSheetId, sheets, applyFormatToRange } = useWorkbookStore();
  const { addTable, getTableByName } = useTableStore();
  const { showToast } = useUIStore();

  const colToLetter = (col: number): string => {
    let result = '';
    let num = col + 1;
    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }
    return result;
  };

  const getRangeString = () => {
    if (!selectionRange) return 'A1:D10';
    const start = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
    const end = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
    return start === end ? `${start}:${colToLetter(selectionRange.start.col + 3)}${selectionRange.start.row + 10}` : `${start}:${end}`;
  };

  const handleCreate = () => {
    if (!activeSheetId || !selectionRange) {
      showToast('Please select a range first', 'error');
      return;
    }

    // Check if table name already exists
    if (getTableByName(tableName)) {
      showToast(`Table "${tableName}" already exists`, 'error');
      return;
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) return;

    // Calculate columns from selection
    const numCols = selectionRange.end.col - selectionRange.start.col + 1;
    const columns: TableColumn[] = [];

    for (let i = 0; i < numCols; i++) {
      const colIndex = selectionRange.start.col + i;
      let columnName = `Column${i + 1}`;

      // If has headers, get the header name from the first row
      if (hasHeaders) {
        const headerKey = `${selectionRange.start.row}:${colIndex}`;
        const headerCell = sheet.cells[headerKey];
        if (headerCell && headerCell.value) {
          columnName = String(headerCell.value);
        }
      }

      columns.push({
        id: `col-${Date.now()}-${i}`,
        name: columnName,
        index: i,
        hidden: false,
      });
    }

    // Calculate row count (excluding header if present)
    const totalRows = selectionRange.end.row - selectionRange.start.row + 1;
    const dataRows = hasHeaders ? totalRows - 1 : totalRows;

    // Create default table style
    const style: TableStyle = {
      name: 'TableStyleMedium2',
      headerBackgroundColor: '#4472C4',
      headerTextColor: '#FFFFFF',
      alternateRowColor: '#D6DCE5',
    };

    // Create the table
    const table: Table = {
      id: `table-${Date.now()}`,
      name: tableName,
      sheetId: activeSheetId,
      startRow: selectionRange.start.row,
      startCol: selectionRange.start.col,
      columns,
      rowCount: dataRows,
      hasHeaderRow: hasHeaders,
      hasTotalRow: false,
      style,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add table to store
    addTable(table);

    // Apply formatting to the table
    // Header row formatting
    if (hasHeaders) {
      applyFormatToRange(
        {
          start: { row: selectionRange.start.row, col: selectionRange.start.col },
          end: { row: selectionRange.start.row, col: selectionRange.end.col }
        },
        {
          bold: true,
          backgroundColor: style.headerBackgroundColor,
          textColor: style.headerTextColor,
        }
      );
    }

    // Apply alternate row colors
    const dataStartRow = hasHeaders ? selectionRange.start.row + 1 : selectionRange.start.row;
    for (let row = dataStartRow; row <= selectionRange.end.row; row++) {
      if ((row - dataStartRow) % 2 === 1) {
        applyFormatToRange(
          {
            start: { row, col: selectionRange.start.col },
            end: { row, col: selectionRange.end.col }
          },
          { backgroundColor: style.alternateRowColor }
        );
      }
    }

    showToast(`Table "${tableName}" created with ${columns.length} columns and ${dataRows} data rows`, 'success');
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <div className="dialog-header">
          <h2>Create Table</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Data Range */}
          <div className="dialog-field">
            <label>Data Range</label>
            <input
              type="text"
              value={getRangeString()}
              readOnly
              className="dialog-input"
            />
          </div>

          {/* Table Name */}
          <div className="dialog-field">
            <label>Table Name</label>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="dialog-input"
            />
          </div>

          {/* Has Headers */}
          <label className="dialog-checkbox">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={e => setHasHeaders(e.target.checked)}
            />
            My table has headers
          </label>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleCreate}>
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
};

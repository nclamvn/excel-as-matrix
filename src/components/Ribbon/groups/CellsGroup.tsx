import React, { useState } from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { Plus, Trash2, Settings, Rows, Columns, Sheet, EyeOff, Eye, Grid3X3 } from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { InsertCellsDialog } from '../../Dialogs/InsertCellsDialog';
import { DeleteCellsDialog } from '../../Dialogs/DeleteCellsDialog';

export const CellsGroup: React.FC = () => {
  const {
    insertRow, insertColumn, deleteRow, deleteColumn,
    addSheet, deleteSheet, activeSheetId, sheetOrder,
    hideRow, unhideRow, hideColumn, unhideColumn,
    autoFitRow, autoFitColumn, setRowHeight, setColumnWidth,
    selectedCell, selectionRange
  } = useWorkbookStore();
  const { showToast } = useUIStore();
  const [showInsertCellsDialog, setShowInsertCellsDialog] = useState(false);
  const [showDeleteCellsDialog, setShowDeleteCellsDialog] = useState(false);

  const handleInsertRow = () => {
    insertRow();
    showToast('Row inserted', 'success');
  };

  const handleInsertColumn = () => {
    insertColumn();
    showToast('Column inserted', 'success');
  };

  const handleDeleteRow = () => {
    deleteRow();
    showToast('Row deleted', 'success');
  };

  const handleDeleteColumn = () => {
    deleteColumn();
    showToast('Column deleted', 'success');
  };

  const handleInsertSheet = () => {
    const newId = `sheet-${Date.now()}`;
    addSheet({
      id: newId,
      name: `Sheet${sheetOrder.length + 1}`,
      index: sheetOrder.length,
      cells: {},
    });
    showToast('Sheet added', 'success');
  };

  const handleDeleteSheet = () => {
    if (sheetOrder.length <= 1) {
      showToast('Cannot delete the only sheet', 'warning');
      return;
    }
    if (activeSheetId) {
      deleteSheet(activeSheetId);
      showToast('Sheet deleted', 'success');
    }
  };

  const handleHideRows = () => {
    if (!selectedCell && !selectionRange) {
      showToast('Select rows first', 'warning');
      return;
    }
    hideRow();
    showToast('Rows hidden', 'success');
  };

  const handleHideColumns = () => {
    if (!selectedCell && !selectionRange) {
      showToast('Select columns first', 'warning');
      return;
    }
    hideColumn();
    showToast('Columns hidden', 'success');
  };

  const handleUnhideRows = () => {
    unhideRow();
    showToast('Rows unhidden', 'success');
  };

  const handleUnhideColumns = () => {
    unhideColumn();
    showToast('Columns unhidden', 'success');
  };

  const handleAutoFitRow = () => {
    if (!selectedCell && !selectionRange) {
      showToast('Select a row first', 'warning');
      return;
    }
    autoFitRow();
    showToast('Row height auto-fitted', 'success');
  };

  const handleAutoFitColumn = () => {
    if (!selectedCell && !selectionRange) {
      showToast('Select a column first', 'warning');
      return;
    }
    autoFitColumn();
    showToast('Column width auto-fitted', 'success');
  };

  const handleRowHeight = () => {
    const height = prompt('Enter row height (pixels):', '24');
    if (height && !isNaN(Number(height))) {
      const row = selectionRange?.start.row ?? selectedCell?.row;
      if (row !== undefined) {
        setRowHeight(row, Number(height));
        showToast(`Row height set to ${height}px`, 'success');
      }
    }
  };

  const handleColumnWidth = () => {
    const width = prompt('Enter column width (pixels):', '100');
    if (width && !isNaN(Number(width))) {
      const col = selectionRange?.start.col ?? selectedCell?.col;
      if (col !== undefined) {
        setColumnWidth(col, Number(width));
        showToast(`Column width set to ${width}px`, 'success');
      }
    }
  };

  return (
    <RibbonGroup label="Cells">
      <div className="cells-group-layout">
        <RibbonDropdown
          icon={Plus}
          label="Insert"
          size="large"
          options={[
            { id: 'insert-cells', label: 'Insert Cells...', icon: Grid3X3, onClick: () => setShowInsertCellsDialog(true) },
            { id: 'insert-rows', label: 'Insert Sheet Rows', icon: Rows, onClick: handleInsertRow },
            { id: 'insert-cols', label: 'Insert Sheet Columns', icon: Columns, onClick: handleInsertColumn },
            { id: 'insert-sheet', label: 'Insert Sheet', icon: Sheet, onClick: handleInsertSheet },
          ]}
        />
        <RibbonDropdown
          icon={Trash2}
          label="Delete"
          size="large"
          options={[
            { id: 'delete-cells', label: 'Delete Cells...', icon: Grid3X3, onClick: () => setShowDeleteCellsDialog(true) },
            { id: 'delete-rows', label: 'Delete Sheet Rows', icon: Rows, onClick: handleDeleteRow },
            { id: 'delete-cols', label: 'Delete Sheet Columns', icon: Columns, onClick: handleDeleteColumn },
            { id: 'delete-sheet', label: 'Delete Sheet', icon: Sheet, onClick: handleDeleteSheet },
          ]}
        />
        <RibbonDropdown
          icon={Settings}
          label="Format"
          size="large"
          options={[
            { id: 'row-height', label: 'Row Height...', icon: Rows, onClick: handleRowHeight },
            { id: 'autofit-row', label: 'AutoFit Row Height', icon: Rows, onClick: handleAutoFitRow },
            { id: 'col-width', label: 'Column Width...', icon: Columns, onClick: handleColumnWidth },
            { id: 'autofit-col', label: 'AutoFit Column Width', icon: Columns, onClick: handleAutoFitColumn },
            { id: 'divider1', label: '', onClick: () => {}, divider: true },
            { id: 'hide-rows', label: 'Hide Rows', icon: EyeOff, onClick: handleHideRows },
            { id: 'hide-cols', label: 'Hide Columns', icon: EyeOff, onClick: handleHideColumns },
            { id: 'unhide-rows', label: 'Unhide Rows', icon: Eye, onClick: handleUnhideRows },
            { id: 'unhide-cols', label: 'Unhide Columns', icon: Eye, onClick: handleUnhideColumns },
          ]}
        />
      </div>

      {/* Insert Cells Dialog */}
      {showInsertCellsDialog && (
        <InsertCellsDialog onClose={() => setShowInsertCellsDialog(false)} />
      )}

      {/* Delete Cells Dialog */}
      {showDeleteCellsDialog && (
        <DeleteCellsDialog onClose={() => setShowDeleteCellsDialog(false)} />
      )}
    </RibbonGroup>
  );
};

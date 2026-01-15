import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { Plus, Trash2, Settings, Rows, Columns, Sheet } from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';

export const CellsGroup: React.FC = () => {
  const { insertRow, insertColumn, deleteRow, deleteColumn, addSheet, deleteSheet, activeSheetId, sheetOrder } = useWorkbookStore();
  const { showToast } = useUIStore();

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

  return (
    <RibbonGroup label="Cells">
      <div className="cells-group-layout">
        <RibbonDropdown
          icon={Plus}
          label="Insert"
          size="large"
          options={[
            { id: 'insert-cells', label: 'Insert Cells...', icon: Plus, onClick: () => showToast('Insert cells dialog coming soon', 'info') },
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
            { id: 'delete-cells', label: 'Delete Cells...', icon: Trash2, onClick: () => showToast('Delete cells dialog coming soon', 'info') },
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
            { id: 'row-height', label: 'Row Height...', onClick: () => showToast('Row height dialog coming soon', 'info') },
            { id: 'autofit-row', label: 'AutoFit Row Height', onClick: () => showToast('AutoFit row coming soon', 'info') },
            { id: 'col-width', label: 'Column Width...', onClick: () => showToast('Column width dialog coming soon', 'info') },
            { id: 'autofit-col', label: 'AutoFit Column Width', onClick: () => showToast('AutoFit column coming soon', 'info') },
            { id: 'divider1', label: '', onClick: () => {}, divider: true },
            { id: 'hide-rows', label: 'Hide Rows', onClick: () => showToast('Hide rows coming soon', 'info') },
            { id: 'hide-cols', label: 'Hide Columns', onClick: () => showToast('Hide columns coming soon', 'info') },
            { id: 'unhide-rows', label: 'Unhide Rows', onClick: () => showToast('Unhide rows coming soon', 'info') },
            { id: 'unhide-cols', label: 'Unhide Columns', onClick: () => showToast('Unhide columns coming soon', 'info') },
          ]}
        />
      </div>
    </RibbonGroup>
  );
};

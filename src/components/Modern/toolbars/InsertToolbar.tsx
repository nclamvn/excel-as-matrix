import React, { useState } from 'react';
import {
  Table, BarChart3, LineChart, PieChart,
  Image, Shapes, Link, MessageSquare,
  Plus, Minus, Rows, Columns
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { InsertChartDialog } from '../../Dialogs/InsertChartDialog';
import { InsertTableDialog } from '../../Dialogs/InsertTableDialog';

export const InsertToolbar: React.FC = () => {
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const { insertRow, insertColumn, deleteRow, deleteColumn, selectedCell } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleInsertRow = () => {
    if (selectedCell) {
      insertRow(selectedCell.row);
      showToast('Row inserted above', 'success');
    } else {
      insertRow(0);
      showToast('Row inserted at top', 'success');
    }
  };

  const handleInsertColumn = () => {
    if (selectedCell) {
      insertColumn(selectedCell.col);
      showToast('Column inserted left', 'success');
    } else {
      insertColumn(0);
      showToast('Column inserted at start', 'success');
    }
  };

  const handleDeleteRow = () => {
    if (selectedCell) {
      deleteRow(selectedCell.row);
      showToast('Row deleted', 'success');
    } else {
      showToast('Select a row first', 'warning');
    }
  };

  const handleDeleteColumn = () => {
    if (selectedCell) {
      deleteColumn(selectedCell.col);
      showToast('Column deleted', 'success');
    } else {
      showToast('Select a column first', 'warning');
    }
  };

  const handleInsertChart = (type: 'bar' | 'line' | 'pie') => {
    setChartType(type);
    setShowChartDialog(true);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL:');
    if (url && selectedCell) {
      const { setCellValue, activeSheetId } = useWorkbookStore.getState();
      if (activeSheetId) {
        setCellValue(activeSheetId, selectedCell.row, selectedCell.col, url);
        showToast('Link inserted', 'success');
      }
    }
  };

  return (
    <>
      <div className="toolbar-2026">
        {/* Rows & Columns */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={handleInsertRow}
            title="Insert Row Above"
          >
            <Plus size={12} />
            <Rows size={16} />
            <span>Row</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={handleInsertColumn}
            title="Insert Column Left"
          >
            <Plus size={12} />
            <Columns size={16} />
            <span>Col</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={handleDeleteRow}
            title="Delete Row"
          >
            <Minus size={12} />
            <Rows size={16} />
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={handleDeleteColumn}
            title="Delete Column"
          >
            <Minus size={12} />
            <Columns size={16} />
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Tables */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => setShowTableDialog(true)}
            title="Insert Table"
          >
            <Table size={20} />
            <span>Table</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Charts */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => handleInsertChart('bar')}
            title="Bar Chart"
          >
            <BarChart3 size={20} />
            <span>Bar</span>
          </button>
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => handleInsertChart('line')}
            title="Line Chart"
          >
            <LineChart size={20} />
            <span>Line</span>
          </button>
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => handleInsertChart('pie')}
            title="Pie Chart"
          >
            <PieChart size={20} />
            <span>Pie</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Media */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => showToast('Image insert coming soon', 'info')}
            title="Insert Image"
          >
            <Image size={20} />
            <span>Image</span>
          </button>
          <button
            className="toolbar-2026__btn-lg"
            onClick={() => showToast('Shapes coming soon', 'info')}
            title="Insert Shape"
          >
            <Shapes size={20} />
            <span>Shape</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Links */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={handleInsertLink}
            title="Insert Hyperlink"
          >
            <Link size={16} />
            <span>Link</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => showToast('Comments coming soon', 'info')}
            title="Insert Comment"
          >
            <MessageSquare size={16} />
            <span>Comment</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      {showChartDialog && (
        <InsertChartDialog
          type={chartType}
          onClose={() => setShowChartDialog(false)}
        />
      )}

      {showTableDialog && (
        <InsertTableDialog
          onClose={() => setShowTableDialog(false)}
        />
      )}
    </>
  );
};

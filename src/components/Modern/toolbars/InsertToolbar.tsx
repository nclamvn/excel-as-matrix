import React, { useState } from 'react';
import {
  Table, BarChart3, LineChart, PieChart,
  Image, Link, MessageSquare,
  Plus, Minus, Rows, Columns,
  TrendingUp, Activity, Table2
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { InsertChartDialog } from '../../Dialogs/InsertChartDialog';
import { InsertTableDialog } from '../../Dialogs/InsertTableDialog';
import { CommentDialog } from '../../Dialogs/CommentDialog';
import { ShapesDropdown } from '../../Shapes';
import { PictureInsertDialog } from '../../Pictures';
import { SparklineDialog } from '../../Sparklines';
import { SparklineType } from '../../../types/sparkline';
import { CreatePivotDialog } from '../../PivotTable';

export const InsertToolbar: React.FC = () => {
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showPictureDialog, setShowPictureDialog] = useState(false);
  const [showSparklineDialog, setShowSparklineDialog] = useState(false);
  const [showPivotDialog, setShowPivotDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [sparklineType, setSparklineType] = useState<SparklineType>('line');

  const { insertRow, insertColumn, deleteRow, deleteColumn, selectedCell, activeSheetId, getComment } = useWorkbookStore();
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

  const handleInsertComment = () => {
    if (!selectedCell) {
      showToast('Select a cell first', 'warning');
      return;
    }

    // Check if cell already has a comment
    const existingComment = getComment(selectedCell.row, selectedCell.col);
    if (existingComment) {
      const editComment = confirm('This cell already has a comment. Do you want to edit it?');
      if (editComment) {
        setShowCommentDialog(true);
      }
      return;
    }

    setShowCommentDialog(true);
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
            className="toolbar-2026__btn"
            onClick={() => setShowTableDialog(true)}
            title="Insert Table"
          >
            <Table size={16} />
            <span>Table</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => setShowPivotDialog(true)}
            title="Insert PivotTable"
          >
            <Table2 size={16} />
            <span>Pivot</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Charts */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => handleInsertChart('bar')}
            title="Bar Chart"
          >
            <BarChart3 size={16} />
            <span>Bar</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => handleInsertChart('line')}
            title="Line Chart"
          >
            <LineChart size={16} />
            <span>Line</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => handleInsertChart('pie')}
            title="Pie Chart"
          >
            <PieChart size={16} />
            <span>Pie</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Sparklines */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => { setSparklineType('line'); setShowSparklineDialog(true); }}
            title="Line Sparkline"
          >
            <TrendingUp size={16} />
            <span>Spark</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => { setSparklineType('column'); setShowSparklineDialog(true); }}
            title="Column Sparkline"
          >
            <BarChart3 size={16} />
            <span>Col</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => { setSparklineType('winloss'); setShowSparklineDialog(true); }}
            title="Win/Loss Sparkline"
          >
            <Activity size={16} />
            <span>W/L</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Media */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => setShowPictureDialog(true)}
            title="Insert Picture"
          >
            <Image size={16} />
            <span>Picture</span>
          </button>
          {activeSheetId && <ShapesDropdown sheetId={activeSheetId} />}
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
            onClick={handleInsertComment}
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

      {activeSheetId && (
        <PictureInsertDialog
          sheetId={activeSheetId}
          isOpen={showPictureDialog}
          onClose={() => setShowPictureDialog(false)}
        />
      )}

      {activeSheetId && (
        <SparklineDialog
          sheetId={activeSheetId}
          isOpen={showSparklineDialog}
          onClose={() => setShowSparklineDialog(false)}
          initialType={sparklineType}
        />
      )}

      <CreatePivotDialog
        isOpen={showPivotDialog}
        onClose={() => setShowPivotDialog(false)}
      />

      {showCommentDialog && selectedCell && (
        <CommentDialog
          row={selectedCell.row}
          col={selectedCell.col}
          onClose={() => setShowCommentDialog(false)}
        />
      )}
    </>
  );
};

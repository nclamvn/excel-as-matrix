import React, { useState } from 'react';
import {
  ArrowDownAZ, ArrowUpZA, Filter, FilterX,
  RefreshCw, GitCompare, FileSpreadsheet, Upload,
  SplitSquareHorizontal, Zap
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { RemoveDuplicatesDialog } from '../../Dialogs/RemoveDuplicatesDialog';
import { TextToColumnsDialog } from '../../Dialogs/TextToColumnsDialog';
import { FlashFillDialog } from '../../Dialogs/FlashFillDialog';
import { ImportDialog } from '../../FileIO/ImportDialog';

export const DataToolbar: React.FC = () => {
  const { sort, selectedCell, filterEnabled, toggleFilter } = useWorkbookStore();
  const { showToast, openDialog } = useUIStore();

  const [showRemoveDuplicates, setShowRemoveDuplicates] = useState(false);
  const [showTextToColumns, setShowTextToColumns] = useState(false);
  const [showFlashFill, setShowFlashFill] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleSortAZ = () => {
    if (selectedCell) {
      sort({ column: selectedCell.col, direction: 'asc' });
      showToast('Sorted A → Z', 'success');
    } else {
      showToast('Select a column first', 'warning');
    }
  };

  const handleSortZA = () => {
    if (selectedCell) {
      sort({ column: selectedCell.col, direction: 'desc' });
      showToast('Sorted Z → A', 'success');
    } else {
      showToast('Select a column first', 'warning');
    }
  };

  const handleToggleFilter = () => {
    toggleFilter();
    showToast(filterEnabled ? 'Filter disabled' : 'Filter enabled', 'info');
  };

  return (
    <div className="toolbar-2026">
      {/* Sort */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={handleSortAZ}
          title="Sort A to Z"
        >
          <ArrowDownAZ size={16} />
          <span>A→Z</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={handleSortZA}
          title="Sort Z to A"
        >
          <ArrowUpZA size={16} />
          <span>Z→A</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => openDialog('sortRange')}
          title="Custom Sort"
        >
          <span>Sort...</span>
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Filter */}
      <div className="toolbar-2026__group">
        <button
          className={`toolbar-2026__btn ${filterEnabled ? 'toolbar-2026__btn--active' : ''}`}
          onClick={handleToggleFilter}
          title="Toggle Filter"
        >
          <Filter size={16} />
          <span>Filter</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => {
            toggleFilter();
            showToast('Filters cleared', 'info');
          }}
          title="Clear All Filters"
        >
          <FilterX size={16} />
          <span>Clear</span>
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Data Tools */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={() => setShowRemoveDuplicates(true)}
          title="Remove Duplicates"
        >
          <GitCompare size={16} />
          <span>Duplicates</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => setShowTextToColumns(true)}
          title="Text to Columns"
        >
          <SplitSquareHorizontal size={16} />
          <span>Split</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => setShowFlashFill(true)}
          title="Flash Fill"
        >
          <Zap size={16} />
          <span>Flash</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => openDialog('dataValidation')}
          title="Data Validation"
        >
          <FileSpreadsheet size={16} />
          <span>Validation</span>
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Import/Refresh */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={() => setShowImportDialog(true)}
          title="Import Data"
        >
          <Upload size={16} />
          <span>Import</span>
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => showToast('Data refreshed', 'success')}
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Dialogs */}
      {showRemoveDuplicates && (
        <RemoveDuplicatesDialog onClose={() => setShowRemoveDuplicates(false)} />
      )}

      {showTextToColumns && (
        <TextToColumnsDialog onClose={() => setShowTextToColumns(false)} />
      )}

      {showFlashFill && (
        <FlashFillDialog onClose={() => setShowFlashFill(false)} />
      )}

      {showImportDialog && (
        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={() => {
            // Handle import data
            showToast('Data imported successfully', 'success');
            setShowImportDialog(false);
          }}
        />
      )}
    </div>
  );
};

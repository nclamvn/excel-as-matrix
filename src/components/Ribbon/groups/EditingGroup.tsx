import React, { useState } from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { RibbonButton } from '../RibbonButton';
import {
  Calculator, PaintBucket, ArrowDownAZ, ArrowUpZA,
  Filter, Search, Replace, Eraser, Navigation, Target
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { FillSeriesDialog } from '../../Dialogs/FillSeriesDialog';
import { GoToDialog } from '../../Dialogs/GoToDialog';
import { GoToSpecialDialog } from '../../Dialogs/GoToSpecialDialog';
import { CustomSortDialog } from '../../Dialogs/CustomSortDialog';

export const EditingGroup: React.FC = () => {
  const { setCellValue, activeSheetId, selectedCell, selectionRange, sort, toggleFilter, clearFormat, fillDown, fillRight, fillUp, fillLeft } = useWorkbookStore();
  const { showToast, openDialog } = useUIStore();
  const [showFillSeriesDialog, setShowFillSeriesDialog] = useState(false);
  const [showGoToDialog, setShowGoToDialog] = useState(false);
  const [showGoToSpecialDialog, setShowGoToSpecialDialog] = useState(false);
  const [showCustomSortDialog, setShowCustomSortDialog] = useState(false);

  // Helper to convert column number to letter
  const colToLetter = (col: number): string => {
    let result = '';
    let c = col;
    while (c >= 0) {
      result = String.fromCharCode((c % 26) + 65) + result;
      c = Math.floor(c / 26) - 1;
    }
    return result;
  };

  const getRangeRef = (): string => {
    if (!selectionRange) {
      if (selectedCell) {
        return `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`;
      }
      return 'A1';
    }
    const start = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
    const end = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
    return start === end ? start : `${start}:${end}`;
  };

  const insertFunction = (funcName: string) => {
    if (!selectedCell || !activeSheetId) {
      showToast('Select a cell first', 'warning');
      return;
    }
    const rangeRef = getRangeRef();
    setCellValue(activeSheetId, selectedCell.row, selectedCell.col, `=${funcName}(${rangeRef})`);
    showToast(`Inserted ${funcName}`, 'success');
  };

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

  const handleClear = () => {
    clearFormat();
    showToast('Format cleared', 'success');
  };

  const handleFillDown = () => {
    if (!selectionRange) {
      showToast('Select a range of cells first', 'warning');
      return;
    }
    fillDown();
    showToast('Fill down applied', 'success');
  };

  const handleFillRight = () => {
    if (!selectionRange) {
      showToast('Select a range of cells first', 'warning');
      return;
    }
    fillRight();
    showToast('Fill right applied', 'success');
  };

  const handleFillUp = () => {
    if (!selectionRange) {
      showToast('Select a range of cells first', 'warning');
      return;
    }
    fillUp();
    showToast('Fill up applied', 'success');
  };

  const handleFillLeft = () => {
    if (!selectionRange) {
      showToast('Select a range of cells first', 'warning');
      return;
    }
    fillLeft();
    showToast('Fill left applied', 'success');
  };

  return (
    <RibbonGroup label="Editing">
      <div className="editing-group-layout">
        <RibbonDropdown
          icon={Calculator}
          label="AutoSum"
          options={[
            { id: 'sum', label: 'Sum', onClick: () => insertFunction('SUM') },
            { id: 'average', label: 'Average', onClick: () => insertFunction('AVERAGE') },
            { id: 'count', label: 'Count Numbers', onClick: () => insertFunction('COUNT') },
            { id: 'max', label: 'Max', onClick: () => insertFunction('MAX') },
            { id: 'min', label: 'Min', onClick: () => insertFunction('MIN') },
          ]}
        />
        <RibbonDropdown
          icon={PaintBucket}
          label="Fill"
          options={[
            { id: 'fill-down', label: 'Down (Ctrl+D)', onClick: handleFillDown },
            { id: 'fill-right', label: 'Right (Ctrl+R)', onClick: handleFillRight },
            { id: 'fill-up', label: 'Up', onClick: handleFillUp },
            { id: 'fill-left', label: 'Left', onClick: handleFillLeft },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'fill-series', label: 'Series...', onClick: () => setShowFillSeriesDialog(true) },
          ]}
        />
        <RibbonButton icon={Eraser} label="Clear" onClick={handleClear} />
        <RibbonDropdown
          icon={ArrowDownAZ}
          label="Sort & Filter"
          options={[
            { id: 'sort-az', label: 'Sort A to Z', icon: ArrowDownAZ, onClick: handleSortAZ },
            { id: 'sort-za', label: 'Sort Z to A', icon: ArrowUpZA, onClick: handleSortZA },
            { id: 'custom-sort', label: 'Custom Sort...', onClick: () => setShowCustomSortDialog(true) },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'filter', label: 'Filter', icon: Filter, onClick: () => { toggleFilter(); showToast('Filter toggled', 'info'); } },
            { id: 'clear-filter', label: 'Clear', onClick: () => { toggleFilter(); showToast('Filter cleared', 'info'); } },
          ]}
        />
        <RibbonDropdown
          icon={Search}
          label="Find & Select"
          options={[
            { id: 'find', label: 'Find... (Ctrl+F)', icon: Search, onClick: () => openDialog('findReplace') },
            { id: 'replace', label: 'Replace... (Ctrl+H)', icon: Replace, onClick: () => openDialog('findReplace') },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'goto', label: 'Go To... (Ctrl+G)', icon: Navigation, onClick: () => setShowGoToDialog(true) },
            { id: 'goto-special', label: 'Go To Special...', icon: Target, onClick: () => setShowGoToSpecialDialog(true) },
          ]}
        />
      </div>

      {/* Fill Series Dialog */}
      {showFillSeriesDialog && (
        <FillSeriesDialog onClose={() => setShowFillSeriesDialog(false)} />
      )}

      {/* Go To Dialog */}
      {showGoToDialog && (
        <GoToDialog onClose={() => setShowGoToDialog(false)} />
      )}

      {/* Go To Special Dialog */}
      {showGoToSpecialDialog && (
        <GoToSpecialDialog onClose={() => setShowGoToSpecialDialog(false)} />
      )}

      {/* Custom Sort Dialog */}
      {showCustomSortDialog && (
        <CustomSortDialog onClose={() => setShowCustomSortDialog(false)} />
      )}
    </RibbonGroup>
  );
};

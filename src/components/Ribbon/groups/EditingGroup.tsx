import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { RibbonButton } from '../RibbonButton';
import {
  Calculator, PaintBucket, ArrowDownAZ, ArrowUpZA,
  Filter, Search, Replace, Eraser
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';

export const EditingGroup: React.FC = () => {
  const { setCellValue, activeSheetId, selectedCell, selectionRange, sort, toggleFilter, clearFormat } = useWorkbookStore();
  const { showToast, openDialog } = useUIStore();

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
            { id: 'fill-down', label: 'Down', onClick: () => showToast('Fill down coming soon', 'info') },
            { id: 'fill-right', label: 'Right', onClick: () => showToast('Fill right coming soon', 'info') },
            { id: 'fill-up', label: 'Up', onClick: () => showToast('Fill up coming soon', 'info') },
            { id: 'fill-left', label: 'Left', onClick: () => showToast('Fill left coming soon', 'info') },
            { id: 'fill-series', label: 'Series...', onClick: () => showToast('Fill series coming soon', 'info') },
          ]}
        />
        <RibbonButton icon={Eraser} label="Clear" onClick={handleClear} />
        <RibbonDropdown
          icon={ArrowDownAZ}
          label="Sort & Filter"
          options={[
            { id: 'sort-az', label: 'Sort A to Z', icon: ArrowDownAZ, onClick: handleSortAZ },
            { id: 'sort-za', label: 'Sort Z to A', icon: ArrowUpZA, onClick: handleSortZA },
            { id: 'custom-sort', label: 'Custom Sort...', onClick: () => showToast('Custom sort coming soon', 'info') },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'filter', label: 'Filter', icon: Filter, onClick: () => { toggleFilter(); showToast('Filter toggled', 'info'); } },
            { id: 'clear-filter', label: 'Clear', onClick: () => { toggleFilter(); showToast('Filter cleared', 'info'); } },
          ]}
        />
        <RibbonDropdown
          icon={Search}
          label="Find & Select"
          options={[
            { id: 'find', label: 'Find...', icon: Search, onClick: () => openDialog('findReplace') },
            { id: 'replace', label: 'Replace...', icon: Replace, onClick: () => openDialog('findReplace') },
            { id: 'goto', label: 'Go To...', onClick: () => showToast('Go To coming soon', 'info') },
            { id: 'goto-special', label: 'Go To Special...', onClick: () => showToast('Go To Special coming soon', 'info') },
          ]}
        />
      </div>
    </RibbonGroup>
  );
};

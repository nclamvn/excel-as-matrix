import React from 'react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useSelectionStore } from '../../../stores/selectionStore';
import { ReviewTab } from '../../Review';

export const ReviewToolbar: React.FC = () => {
  const { activeSheetId } = useWorkbookStore();
  const { selectedCell } = useSelectionStore();

  if (!activeSheetId) return null;

  return (
    <ReviewTab
      sheetId={activeSheetId}
      selectedCell={selectedCell}
    />
  );
};

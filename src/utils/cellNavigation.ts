// ============================================================
// CELL NAVIGATION — Navigate to a specific cell from anywhere
// ============================================================

import { useWorkbookStore } from '@/stores/workbookStore';
import { useCommentsStore } from '@/stores/commentsStore';

export interface CellLocation {
  workbookId: string;
  sheetId: string;
  cellId: string; // format: "row:col" e.g. "5:2"
}

export function parseCellId(cellId: string): { row: number; col: number } {
  const [row, col] = cellId.split(':').map(Number);
  return { row: row || 0, col: col || 0 };
}

/**
 * Navigate to a cell: switch sheet, select cell, scroll into view, flash highlight.
 * Uses CustomEvent 'scrollToCell' which CanvasGrid listens to.
 */
export function navigateToCell(location: CellLocation): void {
  const { setActiveSheet, setSelectedCell } = useWorkbookStore.getState();
  const { row, col } = parseCellId(location.cellId);

  // 1. Switch to correct sheet
  if (location.sheetId) {
    setActiveSheet(location.sheetId);
  }

  // 2. Select the cell (slight delay to let sheet switch render)
  setTimeout(() => {
    setSelectedCell({ row, col });

    // 3. Scroll to cell via CustomEvent (CanvasGrid picks this up)
    window.dispatchEvent(new CustomEvent('scrollToCell', { detail: { row, col } }));

    // 4. Flash highlight after scroll settles
    setTimeout(() => highlightCell(row, col), 100);
  }, 50);

  // 5. Open comments panel to show the comment
  const commentsStore = useCommentsStore.getState();
  commentsStore.toggleCommentsPanel();
}

function highlightCell(row: number, col: number): void {
  const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

  if (cellElement) {
    cellElement.classList.add('cell-highlight-flash');
    setTimeout(() => {
      cellElement.classList.remove('cell-highlight-flash');
    }, 2000);
  }
}

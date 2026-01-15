import { create } from 'zustand';
import { CellPosition, CellRange } from '../types/cell';

interface SelectionState {
  selectedCell: CellPosition | null;
  selectionRange: CellRange | null;
  isEditing: boolean;
  editValue: string;

  // Actions
  setSelectedCell: (cell: CellPosition | null) => void;
  setSelectionRange: (range: CellRange | null) => void;
  setIsEditing: (editing: boolean) => void;
  setEditValue: (value: string) => void;
  startEditing: (initialValue?: string) => void;
  stopEditing: () => void;
  moveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  expandSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  selectRange: (start: CellPosition, end: CellPosition) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedCell: null,
  selectionRange: null,
  isEditing: false,
  editValue: '',

  setSelectedCell: (cell) => {
    set({
      selectedCell: cell,
      selectionRange: null,
    });
  },

  setSelectionRange: (range) => {
    set({ selectionRange: range });
  },

  setIsEditing: (editing) => {
    set({ isEditing: editing });
  },

  setEditValue: (value) => {
    set({ editValue: value });
  },

  startEditing: (initialValue = '') => {
    set({
      isEditing: true,
      editValue: initialValue,
    });
  },

  stopEditing: () => {
    set({
      isEditing: false,
      editValue: '',
    });
  },

  moveSelection: (direction) => {
    const { selectedCell } = get();
    if (!selectedCell) return;

    let { row, col } = selectedCell;

    switch (direction) {
      case 'up':
        row = Math.max(0, row - 1);
        break;
      case 'down':
        row = row + 1;
        break;
      case 'left':
        col = Math.max(0, col - 1);
        break;
      case 'right':
        col = col + 1;
        break;
    }

    set({
      selectedCell: { row, col },
      selectionRange: null,
    });
  },

  expandSelection: (direction) => {
    const { selectedCell, selectionRange } = get();
    if (!selectedCell) return;

    const start = selectionRange?.start ?? selectedCell;
    const end = selectionRange?.end ?? selectedCell;

    let newEnd = { ...end };

    switch (direction) {
      case 'up':
        newEnd.row = Math.max(0, newEnd.row - 1);
        break;
      case 'down':
        newEnd.row = newEnd.row + 1;
        break;
      case 'left':
        newEnd.col = Math.max(0, newEnd.col - 1);
        break;
      case 'right':
        newEnd.col = newEnd.col + 1;
        break;
    }

    set({
      selectionRange: { start, end: newEnd },
    });
  },

  selectRange: (start, end) => {
    set({
      selectedCell: start,
      selectionRange: { start, end },
    });
  },

  clearSelection: () => {
    set({
      selectedCell: null,
      selectionRange: null,
      isEditing: false,
      editValue: '',
    });
  },
}));

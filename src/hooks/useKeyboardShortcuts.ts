import { useEffect, useCallback } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';

type DialogType =
  | 'findReplace'
  | 'print'
  | 'goTo'
  | 'insertFunction'
  | 'formatCells'
  | 'dataValidation'
  | 'conditionalFormatting'
  | 'customSort';

interface UseKeyboardShortcutsOptions {
  onOpenDialog?: (dialog: DialogType) => void;
  onSave?: () => void;
  onExport?: () => void;
  onPasteSpecial?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const { onOpenDialog, onSave, onExport, onPasteSpecial, enabled = true } = options;

  const {
    undo,
    redo,
    copy,
    cut,
    paste,
    applyFormat,
    deleteRow,
    deleteColumn,
    insertRow,
    insertColumn,
    fillDown,
    fillRight,
  } = useWorkbookStore();

  const { moveSelection, isEditing } = useSelectionStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if in editing mode (typing in cell) unless it's a navigation key
      if (isEditing && !['Escape', 'Tab', 'Enter'].includes(e.key)) {
        return;
      }

      // Skip if in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to close dialogs
        if (e.key !== 'Escape') {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // ═══════════════════════════════════════════════════════════════════
      // CTRL/CMD SHORTCUTS
      // ═══════════════════════════════════════════════════════════════════

      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          // Undo/Redo
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;

          case 'y':
            e.preventDefault();
            redo();
            break;

          // Clipboard
          case 'c':
            e.preventDefault();
            copy();
            break;

          case 'x':
            e.preventDefault();
            cut();
            break;

          case 'v':
            e.preventDefault();
            if (e.shiftKey) {
              onPasteSpecial?.();
            } else {
              paste();
            }
            break;

          // Formatting
          case 'b':
            e.preventDefault();
            applyFormat({ bold: true });
            break;

          case 'i':
            e.preventDefault();
            applyFormat({ italic: true });
            break;

          case 'u':
            e.preventDefault();
            applyFormat({ underline: true });
            break;

          // Fill operations
          case 'd':
            e.preventDefault();
            fillDown();
            break;

          case 'r':
            e.preventDefault();
            fillRight();
            break;

          // Dialogs
          case 'f':
            e.preventDefault();
            onOpenDialog?.('findReplace');
            break;

          case 'h':
            e.preventDefault();
            onOpenDialog?.('findReplace');
            break;

          case 'p':
            e.preventDefault();
            onOpenDialog?.('print');
            break;

          case 'g':
            e.preventDefault();
            onOpenDialog?.('goTo');
            break;

          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              onExport?.();
            } else {
              onSave?.();
            }
            break;

          // Select All
          case 'a':
            e.preventDefault();
            // Select all - would need to implement selectAll in store
            break;

          // Insert row/column
          case '+':
          case '=':
            e.preventDefault();
            if (e.shiftKey) {
              insertColumn();
            } else {
              insertRow();
            }
            break;

          // Delete row/column
          case '-':
            e.preventDefault();
            if (e.shiftKey) {
              deleteColumn();
            } else {
              deleteRow();
            }
            break;
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // F-KEY SHORTCUTS
      // ═══════════════════════════════════════════════════════════════════

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          // Help
          break;

        case 'F2':
          e.preventDefault();
          // Start editing current cell
          break;

        case 'F4':
          e.preventDefault();
          // Toggle absolute/relative reference in formula
          break;

        case 'F5':
          e.preventDefault();
          onOpenDialog?.('goTo');
          break;

        case 'F7':
          e.preventDefault();
          // Spell check
          break;

        case 'F11':
          e.preventDefault();
          // Insert chart
          break;

        case 'F12':
          e.preventDefault();
          onExport?.();
          break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // NAVIGATION & EDITING
      // ═══════════════════════════════════════════════════════════════════

      if (!ctrlKey && !e.altKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            moveSelection('up');
            break;

          case 'ArrowDown':
            e.preventDefault();
            moveSelection('down');
            break;

          case 'ArrowLeft':
            e.preventDefault();
            moveSelection('left');
            break;

          case 'ArrowRight':
            e.preventDefault();
            moveSelection('right');
            break;

          case 'Tab':
            e.preventDefault();
            if (e.shiftKey) {
              moveSelection('left');
            } else {
              moveSelection('right');
            }
            break;

          case 'Enter':
            e.preventDefault();
            if (e.shiftKey) {
              moveSelection('up');
            } else {
              moveSelection('down');
            }
            break;

          case 'Delete':
          case 'Backspace':
            // Clear cell content - handled by grid
            break;

          case 'Escape':
            // Cancel editing - handled by grid
            break;
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // ALT SHORTCUTS
      // ═══════════════════════════════════════════════════════════════════

      if (e.altKey && !ctrlKey) {
        switch (e.key) {
          case '=':
            e.preventDefault();
            // AutoSum
            break;

          case 'Enter':
            e.preventDefault();
            // Insert line break in cell
            break;
        }
      }
    },
    [
      undo,
      redo,
      copy,
      cut,
      paste,
      applyFormat,
      moveSelection,
      insertRow,
      insertColumn,
      deleteRow,
      deleteColumn,
      fillDown,
      fillRight,
      onOpenDialog,
      onSave,
      onExport,
      onPasteSpecial,
      isEditing,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

// ═══════════════════════════════════════════════════════════════════════════
// SHORTCUT REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'C'], description: 'Copy' },
  { keys: ['Ctrl', 'X'], description: 'Cut' },
  { keys: ['Ctrl', 'V'], description: 'Paste' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste Special' },
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Y'], description: 'Redo' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'B'], description: 'Bold' },
  { keys: ['Ctrl', 'I'], description: 'Italic' },
  { keys: ['Ctrl', 'U'], description: 'Underline' },
  { keys: ['Ctrl', 'D'], description: 'Fill Down' },
  { keys: ['Ctrl', 'R'], description: 'Fill Right' },
  { keys: ['Ctrl', 'F'], description: 'Find' },
  { keys: ['Ctrl', 'H'], description: 'Find & Replace' },
  { keys: ['Ctrl', 'P'], description: 'Print' },
  { keys: ['Ctrl', 'S'], description: 'Save' },
  { keys: ['Ctrl', 'G'], description: 'Go To' },
  { keys: ['F5'], description: 'Go To' },
  { keys: ['F12'], description: 'Save As / Export' },
  { keys: ['Tab'], description: 'Move right' },
  { keys: ['Shift', 'Tab'], description: 'Move left' },
  { keys: ['Enter'], description: 'Move down' },
  { keys: ['Shift', 'Enter'], description: 'Move up' },
  { keys: ['Arrow keys'], description: 'Navigate cells' },
  { keys: ['Delete'], description: 'Clear cell' },
  { keys: ['Ctrl', '+'], description: 'Insert row' },
  { keys: ['Ctrl', '-'], description: 'Delete row' },
];

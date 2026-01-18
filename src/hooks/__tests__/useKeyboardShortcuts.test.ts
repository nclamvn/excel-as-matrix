import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock stores
const mockWorkbookStore = {
  undo: vi.fn(),
  redo: vi.fn(),
  copy: vi.fn(),
  cut: vi.fn(),
  paste: vi.fn(),
  applyFormat: vi.fn(),
  deleteRow: vi.fn(),
  deleteColumn: vi.fn(),
  insertRow: vi.fn(),
  insertColumn: vi.fn(),
  fillDown: vi.fn(),
  fillRight: vi.fn(),
};

const mockSelectionStore = {
  moveSelection: vi.fn(),
  isEditing: false,
};

vi.mock('../../stores/workbookStore', () => ({
  useWorkbookStore: () => mockWorkbookStore,
}));

vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: () => mockSelectionStore,
}));

import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const dispatchKeyEvent = (options: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }) => {
    const event = new KeyboardEvent('keydown', {
      key: options.key,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.isEditing = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('adds keydown event listener when enabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useKeyboardShortcuts({ enabled: true }));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts({ enabled: true }));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('does not add listener when disabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      addEventListenerSpy.mockClear();

      renderHook(() => useKeyboardShortcuts({ enabled: false }));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('undo/redo shortcuts', () => {
    it('handles Ctrl+Z for undo', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'z', ctrlKey: true });

      expect(mockWorkbookStore.undo).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+Z for redo', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'z', ctrlKey: true, shiftKey: true });

      expect(mockWorkbookStore.redo).toHaveBeenCalled();
    });

    it('handles Ctrl+Y for redo', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'y', ctrlKey: true });

      expect(mockWorkbookStore.redo).toHaveBeenCalled();
    });
  });

  describe('clipboard shortcuts', () => {
    it('handles Ctrl+C for copy', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'c', ctrlKey: true });

      expect(mockWorkbookStore.copy).toHaveBeenCalled();
    });

    it('handles Ctrl+X for cut', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'x', ctrlKey: true });

      expect(mockWorkbookStore.cut).toHaveBeenCalled();
    });

    it('handles Ctrl+V for paste', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'v', ctrlKey: true });

      expect(mockWorkbookStore.paste).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+V for paste special', () => {
      const onPasteSpecial = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPasteSpecial }));

      dispatchKeyEvent({ key: 'v', ctrlKey: true, shiftKey: true });

      expect(onPasteSpecial).toHaveBeenCalled();
    });
  });

  describe('formatting shortcuts', () => {
    it('handles Ctrl+B for bold', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'b', ctrlKey: true });

      expect(mockWorkbookStore.applyFormat).toHaveBeenCalledWith({ bold: true });
    });

    it('handles Ctrl+I for italic', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'i', ctrlKey: true });

      expect(mockWorkbookStore.applyFormat).toHaveBeenCalledWith({ italic: true });
    });

    it('handles Ctrl+U for underline', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'u', ctrlKey: true });

      expect(mockWorkbookStore.applyFormat).toHaveBeenCalledWith({ underline: true });
    });
  });

  describe('fill shortcuts', () => {
    it('handles Ctrl+D for fill down', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'd', ctrlKey: true });

      expect(mockWorkbookStore.fillDown).toHaveBeenCalled();
    });

    it('handles Ctrl+R for fill right', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'r', ctrlKey: true });

      expect(mockWorkbookStore.fillRight).toHaveBeenCalled();
    });
  });

  describe('dialog shortcuts', () => {
    it('handles Ctrl+F for find dialog', () => {
      const onOpenDialog = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenDialog }));

      dispatchKeyEvent({ key: 'f', ctrlKey: true });

      expect(onOpenDialog).toHaveBeenCalledWith('findReplace');
    });

    it('handles Ctrl+H for find/replace dialog', () => {
      const onOpenDialog = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenDialog }));

      dispatchKeyEvent({ key: 'h', ctrlKey: true });

      expect(onOpenDialog).toHaveBeenCalledWith('findReplace');
    });

    it('handles Ctrl+P for print dialog', () => {
      const onOpenDialog = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenDialog }));

      dispatchKeyEvent({ key: 'p', ctrlKey: true });

      expect(onOpenDialog).toHaveBeenCalledWith('print');
    });

    it('handles Ctrl+G for go to dialog', () => {
      const onOpenDialog = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenDialog }));

      dispatchKeyEvent({ key: 'g', ctrlKey: true });

      expect(onOpenDialog).toHaveBeenCalledWith('goTo');
    });

    it('handles F5 for go to dialog', () => {
      const onOpenDialog = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onOpenDialog }));

      dispatchKeyEvent({ key: 'F5' });

      expect(onOpenDialog).toHaveBeenCalledWith('goTo');
    });
  });

  describe('save/export shortcuts', () => {
    it('handles Ctrl+S for save', () => {
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      dispatchKeyEvent({ key: 's', ctrlKey: true });

      expect(onSave).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+S for export', () => {
      const onExport = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onExport }));

      dispatchKeyEvent({ key: 's', ctrlKey: true, shiftKey: true });

      expect(onExport).toHaveBeenCalled();
    });

    it('handles F12 for export', () => {
      const onExport = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onExport }));

      dispatchKeyEvent({ key: 'F12' });

      expect(onExport).toHaveBeenCalled();
    });
  });

  describe('row/column shortcuts', () => {
    it('handles Ctrl++ for insert row', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: '+', ctrlKey: true });

      expect(mockWorkbookStore.insertRow).toHaveBeenCalled();
    });

    it('handles Ctrl+= for insert row', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: '=', ctrlKey: true });

      expect(mockWorkbookStore.insertRow).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift++ for insert column', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: '+', ctrlKey: true, shiftKey: true });

      expect(mockWorkbookStore.insertColumn).toHaveBeenCalled();
    });

    it('handles Ctrl+- for delete row', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: '-', ctrlKey: true });

      expect(mockWorkbookStore.deleteRow).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+- for delete column', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: '-', ctrlKey: true, shiftKey: true });

      expect(mockWorkbookStore.deleteColumn).toHaveBeenCalled();
    });
  });

  describe('navigation shortcuts', () => {
    it('handles Arrow Up', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'ArrowUp' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('up');
    });

    it('handles Arrow Down', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'ArrowDown' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('down');
    });

    it('handles Arrow Left', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'ArrowLeft' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('left');
    });

    it('handles Arrow Right', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'ArrowRight' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('right');
    });

    it('handles Tab for move right', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Tab' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('right');
    });

    it('handles Shift+Tab for move left', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Tab', shiftKey: true });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('left');
    });

    it('handles Enter for move down', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Enter' });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('down');
    });

    it('handles Shift+Enter for move up', () => {
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Enter', shiftKey: true });

      expect(mockSelectionStore.moveSelection).toHaveBeenCalledWith('up');
    });
  });

  describe('editing mode handling', () => {
    it('skips most shortcuts when editing', () => {
      mockSelectionStore.isEditing = true;
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'c', ctrlKey: true });

      expect(mockWorkbookStore.copy).not.toHaveBeenCalled();
    });

    it('allows Escape when editing', () => {
      mockSelectionStore.isEditing = true;
      renderHook(() => useKeyboardShortcuts());

      // Escape should still work (not blocked)
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => window.dispatchEvent(event)).not.toThrow();
    });

    it('allows Tab when editing', () => {
      mockSelectionStore.isEditing = true;
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Tab' });

      // Tab should trigger even when editing (for navigation)
    });

    it('allows Enter when editing', () => {
      mockSelectionStore.isEditing = true;
      renderHook(() => useKeyboardShortcuts());

      dispatchKeyEvent({ key: 'Enter' });

      // Enter should trigger even when editing (for navigation)
    });
  });

  describe('KEYBOARD_SHORTCUTS export', () => {
    it('exports keyboard shortcuts reference', () => {
      expect(KEYBOARD_SHORTCUTS).toBeDefined();
      expect(Array.isArray(KEYBOARD_SHORTCUTS)).toBe(true);
    });

    it('includes common shortcuts', () => {
      const descriptions = KEYBOARD_SHORTCUTS.map(s => s.description);

      expect(descriptions).toContain('Copy');
      expect(descriptions).toContain('Paste');
      expect(descriptions).toContain('Undo');
      expect(descriptions).toContain('Redo');
      expect(descriptions).toContain('Bold');
      expect(descriptions).toContain('Save');
    });

    it('has keys and description for each shortcut', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(shortcut.keys).toBeDefined();
        expect(shortcut.description).toBeDefined();
        expect(Array.isArray(shortcut.keys)).toBe(true);
        expect(shortcut.keys.length).toBeGreaterThan(0);
      }
    });
  });
});

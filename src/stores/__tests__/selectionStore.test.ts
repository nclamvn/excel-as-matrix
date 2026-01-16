import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSelectionStore.setState({
      selectedCell: null,
      selectionRange: null,
      isEditing: false,
      editValue: '',
    });
  });

  describe('setSelectedCell', () => {
    it('should set selected cell', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 5, col: 3 });
    });

    it('should clear selection range when selecting cell', () => {
      const store = useSelectionStore.getState();
      store.setSelectionRange({
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
      });
      store.setSelectedCell({ row: 10, col: 10 });

      const state = useSelectionStore.getState();
      expect(state.selectionRange).toBeNull();
    });
  });

  describe('moveSelection', () => {
    it('should move selection down', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.moveSelection('down');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 6, col: 3 });
    });

    it('should move selection up', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.moveSelection('up');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 4, col: 3 });
    });

    it('should move selection right', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.moveSelection('right');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 5, col: 4 });
    });

    it('should move selection left', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.moveSelection('left');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 5, col: 2 });
    });

    it('should not move above row 0', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 0, col: 0 });
      store.moveSelection('up');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    });

    it('should not move before column 0', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 0, col: 0 });
      store.moveSelection('left');

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    });
  });

  describe('selectRange', () => {
    it('should set selection range', () => {
      const store = useSelectionStore.getState();
      store.selectRange({ row: 0, col: 0 }, { row: 5, col: 5 });

      const state = useSelectionStore.getState();
      expect(state.selectionRange).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
      });
    });
  });

  describe('expandSelection', () => {
    it('should expand selection down', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.expandSelection('down');

      const state = useSelectionStore.getState();
      expect(state.selectionRange).toEqual({
        start: { row: 5, col: 3 },
        end: { row: 6, col: 3 },
      });
    });

    it('should expand selection right', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.expandSelection('right');

      const state = useSelectionStore.getState();
      expect(state.selectionRange).toEqual({
        start: { row: 5, col: 3 },
        end: { row: 5, col: 4 },
      });
    });
  });

  describe('isEditing', () => {
    it('should toggle editing state', () => {
      const store = useSelectionStore.getState();
      store.setIsEditing(true);

      expect(useSelectionStore.getState().isEditing).toBe(true);

      store.setIsEditing(false);
      expect(useSelectionStore.getState().isEditing).toBe(false);
    });
  });

  describe('editValue', () => {
    it('should set edit value', () => {
      const store = useSelectionStore.getState();
      store.setEditValue('Hello World');

      const state = useSelectionStore.getState();
      expect(state.editValue).toBe('Hello World');
    });

    it('should start editing with initial value', () => {
      const store = useSelectionStore.getState();
      store.startEditing('Initial');

      const state = useSelectionStore.getState();
      expect(state.isEditing).toBe(true);
      expect(state.editValue).toBe('Initial');
    });

    it('should stop editing and clear value', () => {
      const store = useSelectionStore.getState();
      store.startEditing('Test');
      store.stopEditing();

      const state = useSelectionStore.getState();
      expect(state.isEditing).toBe(false);
      expect(state.editValue).toBe('');
    });
  });

  describe('clearSelection', () => {
    it('should clear all selection state', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 5, col: 5 });
      store.selectRange({ row: 0, col: 0 }, { row: 10, col: 10 });
      store.startEditing('Test');

      store.clearSelection();

      const state = useSelectionStore.getState();
      expect(state.selectedCell).toBeNull();
      expect(state.selectionRange).toBeNull();
      expect(state.isEditing).toBe(false);
      expect(state.editValue).toBe('');
    });
  });
});

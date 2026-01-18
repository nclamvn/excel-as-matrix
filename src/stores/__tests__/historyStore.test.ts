import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '../historyStore';
import { act } from '@testing-library/react';

describe('historyStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const store = useHistoryStore.getState();
    store.clear();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initial State Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('should start with empty entries', () => {
      const state = useHistoryStore.getState();
      expect(state.entries).toEqual([]);
    });

    it('should start with currentIndex at -1', () => {
      const state = useHistoryStore.getState();
      expect(state.currentIndex).toBe(-1);
    });

    it('should not be able to undo initially', () => {
      const state = useHistoryStore.getState();
      expect(state.canUndo()).toBe(false);
    });

    it('should not be able to redo initially', () => {
      const state = useHistoryStore.getState();
      expect(state.canRedo()).toBe(false);
    });

    it('should return null for undo description initially', () => {
      const state = useHistoryStore.getState();
      expect(state.getUndoDescription()).toBeNull();
    });

    it('should return null for redo description initially', () => {
      const state = useHistoryStore.getState();
      expect(state.getRedoDescription()).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // addEntry Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('addEntry', () => {
    it('should add a single entry', () => {
      const { addEntry } = useHistoryStore.getState();

      addEntry({
        eventId: 'event-1',
        description: 'Set cell A1',
        canUndo: true,
      });

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(1);
      expect(state.entries[0].eventId).toBe('event-1');
      expect(state.entries[0].description).toBe('Set cell A1');
      expect(state.entries[0].canUndo).toBe(true);
    });

    it('should add timestamp automatically', () => {
      const before = Date.now();

      const { addEntry } = useHistoryStore.getState();
      addEntry({
        eventId: 'event-1',
        description: 'Test',
        canUndo: true,
      });

      const after = Date.now();
      const state = useHistoryStore.getState();

      expect(state.entries[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(state.entries[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should update currentIndex to point to new entry', () => {
      const { addEntry } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      expect(useHistoryStore.getState().currentIndex).toBe(0);

      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      expect(useHistoryStore.getState().currentIndex).toBe(1);

      addEntry({ eventId: '3', description: 'Third', canUndo: true });
      expect(useHistoryStore.getState().currentIndex).toBe(2);
    });

    it('should add multiple entries in sequence', () => {
      const { addEntry } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(3);
      expect(state.entries.map(e => e.eventId)).toEqual(['1', '2', '3']);
    });

    it('should clear redo stack when adding after undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      // Undo twice to go back to first entry
      undo();
      undo();

      // Now add a new entry - should clear entries 2 and 3
      addEntry({ eventId: '4', description: 'New', canUndo: true });

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(2);
      expect(state.entries.map(e => e.eventId)).toEqual(['1', '4']);
    });

    it('should handle canUndo false', () => {
      const { addEntry } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'Non-undoable', canUndo: false });

      const state = useHistoryStore.getState();
      expect(state.entries[0].canUndo).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // undo Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('undo', () => {
    it('should return null when no entries', () => {
      const { undo } = useHistoryStore.getState();
      expect(undo()).toBeNull();
    });

    it('should return the current entry and decrement index', () => {
      const { addEntry, undo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      const result = undo();

      expect(result?.eventId).toBe('2');
      expect(result?.description).toBe('Second');
      expect(useHistoryStore.getState().currentIndex).toBe(0);
    });

    it('should undo all entries sequentially', () => {
      const { addEntry, undo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      expect(undo()?.eventId).toBe('3');
      expect(undo()?.eventId).toBe('2');
      expect(undo()?.eventId).toBe('1');
      expect(undo()).toBeNull();
    });

    it('should not remove entries when undoing', () => {
      const { addEntry, undo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      undo();
      undo();

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(2);
      expect(state.currentIndex).toBe(-1);
    });

    it('should enable redo after undo', () => {
      const { addEntry, undo, canRedo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });

      expect(canRedo()).toBe(false);
      undo();
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // redo Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('redo', () => {
    it('should return null when nothing to redo', () => {
      const { redo } = useHistoryStore.getState();
      expect(redo()).toBeNull();
    });

    it('should return null when at latest entry', () => {
      const { addEntry, redo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });

      expect(redo()).toBeNull();
    });

    it('should return next entry and increment index', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      undo();

      const result = redo();
      expect(result?.eventId).toBe('2');
      expect(useHistoryStore.getState().currentIndex).toBe(1);
    });

    it('should redo all undone entries sequentially', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      undo();
      undo();
      undo();

      expect(redo()?.eventId).toBe('1');
      expect(redo()?.eventId).toBe('2');
      expect(redo()?.eventId).toBe('3');
      expect(redo()).toBeNull();
    });

    it('should work with interleaved undo/redo', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      undo(); // at 2
      undo(); // at 1
      redo(); // at 2
      undo(); // at 1
      redo(); // at 2
      redo(); // at 3

      expect(useHistoryStore.getState().currentIndex).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // clear Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('clear', () => {
    it('should remove all entries', () => {
      const { addEntry, clear } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      clear();

      const state = useHistoryStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });

    it('should reset canUndo/canRedo', () => {
      const { addEntry, clear, canUndo, canRedo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      clear();

      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // canUndo/canRedo Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('canUndo', () => {
    it('should return false when empty', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('should return true after adding entry', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });

      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });

    it('should return false after undoing all', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });
      undo();

      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('should return true after partial undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      undo();

      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false when empty', () => {
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should return false when at latest', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });

      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });
      undo();

      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });

    it('should return false after redo to latest', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });
      undo();
      redo();

      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getUndoDescription/getRedoDescription Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getUndoDescription', () => {
    it('should return null when empty', () => {
      expect(useHistoryStore.getState().getUndoDescription()).toBeNull();
    });

    it('should return current entry description', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First action', canUndo: true });
      addEntry({ eventId: '2', description: 'Second action', canUndo: true });

      expect(useHistoryStore.getState().getUndoDescription()).toBe('Second action');
    });

    it('should update after undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First action', canUndo: true });
      addEntry({ eventId: '2', description: 'Second action', canUndo: true });

      undo();

      expect(useHistoryStore.getState().getUndoDescription()).toBe('First action');
    });

    it('should return null after undoing all', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First action', canUndo: true });
      undo();

      expect(useHistoryStore.getState().getUndoDescription()).toBeNull();
    });
  });

  describe('getRedoDescription', () => {
    it('should return null when empty', () => {
      expect(useHistoryStore.getState().getRedoDescription()).toBeNull();
    });

    it('should return null when at latest', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First action', canUndo: true });

      expect(useHistoryStore.getState().getRedoDescription()).toBeNull();
    });

    it('should return next entry description after undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First action', canUndo: true });
      addEntry({ eventId: '2', description: 'Second action', canUndo: true });

      undo();

      expect(useHistoryStore.getState().getRedoDescription()).toBe('Second action');
    });

    it('should update after redo', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });
      addEntry({ eventId: '3', description: 'Third', canUndo: true });

      undo();
      undo();
      redo();

      expect(useHistoryStore.getState().getRedoDescription()).toBe('Third');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge Cases and Complex Scenarios
  // ═══════════════════════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('should handle rapid adds', () => {
      const { addEntry } = useHistoryStore.getState();

      for (let i = 0; i < 100; i++) {
        addEntry({ eventId: `event-${i}`, description: `Action ${i}`, canUndo: true });
      }

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(100);
      expect(state.currentIndex).toBe(99);
    });

    it('should handle rapid undo/redo cycles', () => {
      const { addEntry, undo, redo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      for (let i = 0; i < 50; i++) {
        undo();
        undo();
        redo();
        redo();
      }

      const state = useHistoryStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.entries.length).toBe(2);
    });

    it('should handle empty description', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: '', canUndo: true });

      expect(useHistoryStore.getState().getUndoDescription()).toBe('');
    });

    it('should preserve entry order', () => {
      const { addEntry } = useHistoryStore.getState();

      const ids = ['a', 'b', 'c', 'd', 'e'];
      ids.forEach(id => addEntry({ eventId: id, description: id, canUndo: true }));

      const state = useHistoryStore.getState();
      expect(state.entries.map(e => e.eventId)).toEqual(ids);
    });

    it('should handle add after full undo', () => {
      const { addEntry, undo } = useHistoryStore.getState();

      addEntry({ eventId: '1', description: 'First', canUndo: true });
      addEntry({ eventId: '2', description: 'Second', canUndo: true });

      undo();
      undo();

      addEntry({ eventId: '3', description: 'New', canUndo: true });

      const state = useHistoryStore.getState();
      expect(state.entries.length).toBe(1);
      expect(state.entries[0].eventId).toBe('3');
      expect(state.currentIndex).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Store Subscription Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('subscriptions', () => {
    it('should notify subscribers on addEntry', () => {
      const listener = vi.fn();
      const unsubscribe = useHistoryStore.subscribe(listener);

      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'Test', canUndo: true });

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should notify subscribers on undo', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'Test', canUndo: true });

      const listener = vi.fn();
      const unsubscribe = useHistoryStore.subscribe(listener);

      const { undo } = useHistoryStore.getState();
      undo();

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should notify subscribers on redo', () => {
      const { addEntry, undo } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'Test', canUndo: true });
      undo();

      const listener = vi.fn();
      const unsubscribe = useHistoryStore.subscribe(listener);

      const { redo } = useHistoryStore.getState();
      redo();

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should notify subscribers on clear', () => {
      const { addEntry } = useHistoryStore.getState();
      addEntry({ eventId: '1', description: 'Test', canUndo: true });

      const listener = vi.fn();
      const unsubscribe = useHistoryStore.subscribe(listener);

      const { clear } = useHistoryStore.getState();
      clear();

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });
});

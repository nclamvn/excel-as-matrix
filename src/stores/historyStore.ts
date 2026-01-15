import { create } from 'zustand';

interface HistoryEntry {
  eventId: string;
  timestamp: number;
  description: string;
  canUndo: boolean;
}

interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;

  // Actions
  addEntry: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  clear: () => void;

  // Getters
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  currentIndex: -1,

  addEntry: (entry) => {
    set((state) => {
      // Remove any entries after current index (redo stack cleared)
      const newEntries = state.entries.slice(0, state.currentIndex + 1);
      newEntries.push({
        ...entry,
        timestamp: Date.now(),
      });

      return {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.currentIndex < 0) return null;

    const entry = state.entries[state.currentIndex];
    set({ currentIndex: state.currentIndex - 1 });
    return entry;
  },

  redo: () => {
    const state = get();
    if (state.currentIndex >= state.entries.length - 1) return null;

    const newIndex = state.currentIndex + 1;
    set({ currentIndex: newIndex });
    return state.entries[newIndex];
  },

  clear: () => {
    set({
      entries: [],
      currentIndex: -1,
    });
  },

  canUndo: () => get().currentIndex >= 0,

  canRedo: () => {
    const state = get();
    return state.currentIndex < state.entries.length - 1;
  },

  getUndoDescription: () => {
    const state = get();
    if (state.currentIndex < 0) return null;
    return state.entries[state.currentIndex]?.description ?? null;
  },

  getRedoDescription: () => {
    const state = get();
    if (state.currentIndex >= state.entries.length - 1) return null;
    return state.entries[state.currentIndex + 1]?.description ?? null;
  },
}));

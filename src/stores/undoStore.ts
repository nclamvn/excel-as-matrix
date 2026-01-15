import { create } from 'zustand';

export interface UndoAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
  data?: unknown;
}

interface UndoState {
  past: UndoAction[];
  future: UndoAction[];
  maxHistory: number;

  push: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  getHistory: () => UndoAction[];
  jumpTo: (actionId: string) => void;
}

export const useUndoStore = create<UndoState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 100,

  push: (action) => {
    const newAction: UndoAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => {
      const past = [...state.past, newAction];

      while (past.length > state.maxHistory) {
        past.shift();
      }

      return {
        past,
        future: [],
      };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const action = past[past.length - 1];
    action.undo();

    set({
      past: past.slice(0, -1),
      future: [action, ...future],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const action = future[0];
    action.redo();

    set({
      past: [...past, action],
      future: future.slice(1),
    });
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),

  getHistory: () => get().past,

  jumpTo: (actionId: string) => {
    const { past, future } = get();

    const targetIndex = past.findIndex((a) => a.id === actionId);
    if (targetIndex === -1) return;

    const toUndo = past.slice(targetIndex + 1).reverse();
    for (const action of toUndo) {
      action.undo();
    }

    set({
      past: past.slice(0, targetIndex + 1),
      future: [...toUndo.reverse(), ...future],
    });
  },
}));

export function createUndoableAction<T>(
  type: string,
  description: string,
  doFn: () => T,
  undoFn: () => void,
  redoFn?: () => T
): T {
  const result = doFn();

  useUndoStore.getState().push({
    type,
    description,
    undo: undoFn,
    redo: redoFn || doFn,
  });

  return result;
}

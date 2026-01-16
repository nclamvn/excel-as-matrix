// ============================================================
// TRACK CHANGES STORE
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CellChange,
  TrackChangesSettings,
  DEFAULT_TRACK_SETTINGS,
} from '../types/trackChanges';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 10);

interface TrackChangesStore {
  settings: TrackChangesSettings;
  changes: Record<string, CellChange[]>;
  showChangesPanel: boolean;
  selectedChangeId: string | null;

  // Settings
  updateSettings: (settings: Partial<TrackChangesSettings>) => void;
  toggleTrackChanges: () => void;

  // Recording
  recordChange: (change: Omit<CellChange, 'id' | 'timestamp' | 'status'>) => string;

  // Review
  acceptChange: (changeId: string, sheetId: string) => void;
  rejectChange: (changeId: string, sheetId: string) => void;
  acceptAllChanges: (sheetId: string) => void;
  rejectAllChanges: (sheetId: string) => void;

  // UI
  toggleChangesPanel: () => void;
  setSelectedChange: (changeId: string | null) => void;

  // Getters
  getChangesForSheet: (sheetId: string) => CellChange[];
  getPendingChanges: (sheetId: string) => CellChange[];
  getChangeById: (changeId: string, sheetId: string) => CellChange | undefined;

  // Navigation
  goToNextChange: (sheetId: string) => void;
  goToPrevChange: (sheetId: string) => void;

  // Cleanup
  clearAllChanges: (sheetId: string) => void;
}

export const useTrackChangesStore = create<TrackChangesStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_TRACK_SETTINGS,
      changes: {},
      showChangesPanel: false,
      selectedChangeId: null,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      toggleTrackChanges: () => {
        set((state) => ({
          settings: { ...state.settings, enabled: !state.settings.enabled },
        }));
      },

      recordChange: (change) => {
        const { settings } = get();
        if (!settings.enabled) return '';

        const id = generateId();
        const newChange: CellChange = {
          ...change,
          id,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        set((state) => ({
          changes: {
            ...state.changes,
            [change.sheetId]: [...(state.changes[change.sheetId] || []), newChange],
          },
        }));

        return id;
      },

      acceptChange: (changeId, sheetId) => {
        set((state) => ({
          changes: {
            ...state.changes,
            [sheetId]: (state.changes[sheetId] || []).map(c =>
              c.id === changeId
                ? { ...c, status: 'accepted' as const, reviewedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      rejectChange: (changeId, sheetId) => {
        set((state) => ({
          changes: {
            ...state.changes,
            [sheetId]: (state.changes[sheetId] || []).map(c =>
              c.id === changeId
                ? { ...c, status: 'rejected' as const, reviewedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      acceptAllChanges: (sheetId) => {
        set((state) => ({
          changes: {
            ...state.changes,
            [sheetId]: (state.changes[sheetId] || []).map(c =>
              c.status === 'pending'
                ? { ...c, status: 'accepted' as const, reviewedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      rejectAllChanges: (sheetId) => {
        set((state) => ({
          changes: {
            ...state.changes,
            [sheetId]: (state.changes[sheetId] || []).map(c =>
              c.status === 'pending'
                ? { ...c, status: 'rejected' as const, reviewedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      toggleChangesPanel: () => {
        set((state) => ({ showChangesPanel: !state.showChangesPanel }));
      },

      setSelectedChange: (changeId) => set({ selectedChangeId: changeId }),

      getChangesForSheet: (sheetId) => {
        return (get().changes[sheetId] || []).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      getPendingChanges: (sheetId) => {
        return (get().changes[sheetId] || []).filter(c => c.status === 'pending');
      },

      getChangeById: (changeId, sheetId) => {
        return (get().changes[sheetId] || []).find(c => c.id === changeId);
      },

      goToNextChange: (sheetId) => {
        const pendingChanges = get().getPendingChanges(sheetId);
        if (pendingChanges.length === 0) return;

        const { selectedChangeId } = get();
        const currentIndex = pendingChanges.findIndex(c => c.id === selectedChangeId);
        const nextIndex = (currentIndex + 1) % pendingChanges.length;
        set({ selectedChangeId: pendingChanges[nextIndex].id });
      },

      goToPrevChange: (sheetId) => {
        const pendingChanges = get().getPendingChanges(sheetId);
        if (pendingChanges.length === 0) return;

        const { selectedChangeId } = get();
        const currentIndex = pendingChanges.findIndex(c => c.id === selectedChangeId);
        const prevIndex = currentIndex <= 0 ? pendingChanges.length - 1 : currentIndex - 1;
        set({ selectedChangeId: pendingChanges[prevIndex].id });
      },

      clearAllChanges: (sheetId) => {
        set((state) => ({
          changes: { ...state.changes, [sheetId]: [] },
        }));
      },
    }),
    {
      name: 'excelai-track-changes',
      partialize: (state) => ({
        settings: state.settings,
        changes: state.changes,
      }),
    }
  )
);

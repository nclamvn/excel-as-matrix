import { create } from 'zustand';
import { loggers } from '@/utils/logger';

// ===== Types =====

export interface Sandbox {
  id: string;
  actionId: string;
  state: 'Active' | 'Reviewing' | 'Approved' | 'Merged' | 'Abandoned';
  description: string;
  diffCount: number;
  createdAt: string;
}

export interface DiffEntry {
  sheetId: string;
  row: number;
  col: number;
  cellRef: string;
  changeType: 'ValueChange' | 'FormulaChange' | 'FormatChange' | 'CellAdded' | 'CellRemoved';
  oldValue: string | null;
  newValue: string | null;
  oldFormula: string | null;
  newFormula: string | null;
}

// API response format for diff entries (snake_case from backend)
interface ApiDiffEntry {
  sheet_id: string;
  row: number;
  col: number;
  cell_ref: string;
  change_type: DiffEntry['changeType'];
  old_value: string | null;
  new_value: string | null;
  old_formula: string | null;
  new_formula: string | null;
}

export interface PullRequest {
  id: string;
  sandboxId: string;
  title: string;
  description: string;
  status: 'Open' | 'Approved' | 'Merged' | 'Rejected';
  confidence: number;
  createdAt: string;
}

// ===== Store State =====

interface SandboxState {
  // Current sandbox being viewed
  currentSandbox: Sandbox | null;
  currentDiffs: DiffEntry[];
  currentPR: PullRequest | null;

  // All sandboxes for the session
  sandboxes: Sandbox[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Preview state
  isPreviewMode: boolean;
  previewChanges: Map<string, DiffEntry>;

  // Actions
  loadSandbox: (sandboxId: string) => Promise<void>;
  loadDiffs: (sandboxId: string) => Promise<void>;
  createPR: (sandboxId: string) => Promise<void>;
  mergeSandbox: (sandboxId: string) => Promise<void>;
  abandonSandbox: (sandboxId: string) => Promise<void>;
  togglePreview: () => void;
  setCurrentSandbox: (sandbox: Sandbox | null) => void;
  clearSandbox: () => void;
  reset: () => void;
}

// ===== Initial State =====

const initialState = {
  currentSandbox: null as Sandbox | null,
  currentDiffs: [] as DiffEntry[],
  currentPR: null as PullRequest | null,
  sandboxes: [] as Sandbox[],
  isLoading: false,
  error: null as string | null,
  isPreviewMode: false,
  previewChanges: new Map<string, DiffEntry>(),
};

// ===== Store =====

export const useSandboxStore = create<SandboxState>()((set, get) => ({
  ...initialState,

  loadSandbox: async (sandboxId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/ai/sandboxes/${sandboxId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load sandbox');
      }

      const data = await response.json();
      const sandbox: Sandbox = {
        id: data.id,
        actionId: data.action_id,
        state: data.state,
        description: data.description,
        diffCount: data.diff_count,
        createdAt: data.created_at,
      };

      set({ currentSandbox: sandbox, isLoading: false });

      // Also load diffs
      await get().loadDiffs(sandboxId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  loadDiffs: async (sandboxId) => {
    try {
      const response = await fetch(`/api/ai/sandboxes/${sandboxId}/diffs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load diffs');
      }

      const data: ApiDiffEntry[] = await response.json();
      const diffs: DiffEntry[] = data.map((d) => ({
        sheetId: d.sheet_id,
        row: d.row,
        col: d.col,
        cellRef: d.cell_ref,
        changeType: d.change_type,
        oldValue: d.old_value,
        newValue: d.new_value,
        oldFormula: d.old_formula,
        newFormula: d.new_formula,
      }));

      // Build preview changes map
      const previewChanges = new Map<string, DiffEntry>();
      diffs.forEach((diff) => {
        const key = `${diff.sheetId}:${diff.row}:${diff.col}`;
        previewChanges.set(key, diff);
      });

      set({ currentDiffs: diffs, previewChanges });
    } catch (error) {
      loggers.store.error('Failed to load diffs:', error);
    }
  },

  createPR: async (sandboxId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/ai/sandboxes/${sandboxId}/pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create PR');
      }

      const data = await response.json();
      const pr: PullRequest = {
        id: data.id,
        sandboxId: data.sandbox_id,
        title: data.title,
        description: data.description,
        status: data.status,
        confidence: data.confidence,
        createdAt: data.created_at,
      };

      set({ currentPR: pr, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  mergeSandbox: async (sandboxId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/ai/sandboxes/${sandboxId}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge sandbox');
      }

      // Update sandbox state
      set((state) => ({
        currentSandbox: state.currentSandbox
          ? { ...state.currentSandbox, state: 'Merged' }
          : null,
        isLoading: false,
        isPreviewMode: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  abandonSandbox: async (_sandboxId) => {
    set((state) => ({
      currentSandbox: state.currentSandbox
        ? { ...state.currentSandbox, state: 'Abandoned' }
        : null,
      isPreviewMode: false,
      currentDiffs: [],
      previewChanges: new Map(),
    }));
  },

  togglePreview: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },

  setCurrentSandbox: (sandbox) => {
    set({ currentSandbox: sandbox });
  },

  clearSandbox: () => {
    set({
      currentSandbox: null,
      currentDiffs: [],
      currentPR: null,
      isPreviewMode: false,
      previewChanges: new Map(),
    });
  },

  reset: () => {
    set(initialState);
  },
}));

// ===== Helper Functions =====

export function getDiffKey(sheetId: string, row: number, col: number): string {
  return `${sheetId}:${row}:${col}`;
}

export function getChangeTypeColor(changeType: DiffEntry['changeType']): string {
  switch (changeType) {
    case 'ValueChange':
      return 'bg-yellow-100 border-yellow-400';
    case 'FormulaChange':
      return 'bg-blue-100 border-blue-400';
    case 'CellAdded':
      return 'bg-green-100 border-green-400';
    case 'CellRemoved':
      return 'bg-red-100 border-red-400';
    case 'FormatChange':
      return 'bg-purple-100 border-purple-400';
    default:
      return 'bg-gray-100 border-gray-400';
  }
}

export function getChangeTypeLabel(changeType: DiffEntry['changeType']): string {
  switch (changeType) {
    case 'ValueChange':
      return 'Value';
    case 'FormulaChange':
      return 'Formula';
    case 'CellAdded':
      return 'Added';
    case 'CellRemoved':
      return 'Removed';
    case 'FormatChange':
      return 'Format';
    default:
      return 'Unknown';
  }
}

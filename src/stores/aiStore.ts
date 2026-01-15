import { create } from 'zustand';

// ===== Types =====

export interface AISession {
  id: string;
  workbookId: string;
  sheetId: string;
  budgetLimit: string;
  createdAt: string;
  expiresAt: string;
}

export interface AIAction {
  id: string;
  sessionId: string;
  state: 'Proposed' | 'InPreview' | 'Approved' | 'Executing' | 'Completed' | 'Rejected';
  description: string;
  reasoning: string;
  confidence: number;
  evidenceCount: number;
  testsCount: number;
  testsPassed: boolean;
  trustScore: number;
  affectedCells: number;
  createsFormulas: boolean;
  structuralChanges: boolean;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: number;
  proposedAction?: AIActionSummary;
  sandboxId?: string;
  tokensUsed?: number;
  confidence?: number;
}

export interface AIActionSummary {
  id: string;
  description: string;
  state: string;
  affectedCells: number;
  confidence: number;
  createsFormulas: boolean;
}

export interface SelectedRange {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface AIStats {
  activeSessions: number;
  totalSessions: number;
  totalActions: number;
  pendingActions: number;
}

// ===== Store State =====

interface AIState {
  // Session
  session: AISession | null;
  isConnecting: boolean;
  sessionError: string | null;

  // Chat
  messages: AIMessage[];
  isProcessing: boolean;
  currentInput: string;

  // Actions
  pendingActions: AIAction[];
  selectedAction: AIAction | null;
  actionHistory: AIAction[];

  // UI State
  isPanelOpen: boolean;
  activeTab: 'chat' | 'actions' | 'history';

  // Stats
  stats: AIStats | null;

  // Actions
  createSession: (workbookId: string, sheetId: string, budgetLimit?: string) => Promise<void>;
  endSession: () => void;
  sendMessage: (message: string, selectedRange?: SelectedRange, autoExecute?: boolean) => Promise<void>;
  setCurrentInput: (input: string) => void;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string, reason: string) => Promise<void>;
  selectAction: (action: AIAction | null) => void;
  togglePanel: () => void;
  setActiveTab: (tab: 'chat' | 'actions' | 'history') => void;
  clearMessages: () => void;
  loadStats: () => Promise<void>;
  reset: () => void;
}

// ===== Initial State =====

const initialState = {
  session: null as AISession | null,
  isConnecting: false,
  sessionError: null as string | null,
  messages: [] as AIMessage[],
  isProcessing: false,
  currentInput: '',
  pendingActions: [] as AIAction[],
  selectedAction: null as AIAction | null,
  actionHistory: [] as AIAction[],
  isPanelOpen: false,
  activeTab: 'chat' as const,
  stats: null as AIStats | null,
};

// ===== Store =====

export const useAIStore = create<AIState>()((set, get) => ({
  ...initialState,

  createSession: async (workbookId, sheetId, budgetLimit = 'standard') => {
    set({ isConnecting: true, sessionError: null });

    try {
      const response = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workbook_id: workbookId,
          sheet_id: sheetId,
          budget_limit: budgetLimit,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const session = await response.json();
      set({
        session: {
          id: session.id,
          workbookId: session.workbook_id,
          sheetId: session.sheet_id,
          budgetLimit: session.budget_limit,
          createdAt: session.created_at,
          expiresAt: session.expires_at,
        },
        isConnecting: false,
        isPanelOpen: true,
      });
    } catch (error) {
      set({
        isConnecting: false,
        sessionError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  endSession: () => {
    set({
      session: null,
      messages: [],
      pendingActions: [],
      selectedAction: null,
    });
  },

  sendMessage: async (message, selectedRange, autoExecute = false) => {
    const { session } = get();
    if (!session) return;

    // Add user message
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isProcessing: true,
      currentInput: '',
    }));

    try {
      const response = await fetch(`/api/ai/sessions/${session.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          selected_range: selectedRange ? {
            sheet_id: selectedRange.sheetId,
            start_row: selectedRange.startRow,
            start_col: selectedRange.startCol,
            end_row: selectedRange.endRow,
            end_col: selectedRange.endCol,
          } : undefined,
          auto_execute: autoExecute,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await response.json();

      // Add assistant message
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
        toolCalls: result.tool_calls_count,
        proposedAction: result.proposed_action ? {
          id: result.proposed_action.id,
          description: result.proposed_action.description,
          state: result.proposed_action.state,
          affectedCells: result.proposed_action.affected_cells,
          confidence: result.proposed_action.confidence,
          createsFormulas: result.proposed_action.creates_formulas,
        } : undefined,
        sandboxId: result.sandbox_id,
        tokensUsed: result.tokens_used,
        confidence: result.confidence,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isProcessing: false,
      }));

      // If there's a proposed action, fetch its details
      if (result.proposed_action) {
        const actionResponse = await fetch(`/api/ai/actions/${result.proposed_action.id}`);
        if (actionResponse.ok) {
          const actionData = await actionResponse.json();
          const action: AIAction = {
            id: actionData.id,
            sessionId: actionData.session_id,
            state: actionData.state,
            description: actionData.description,
            reasoning: actionData.reasoning,
            confidence: actionData.confidence,
            evidenceCount: actionData.evidence_count,
            testsCount: actionData.tests_count,
            testsPassed: actionData.tests_passed,
            trustScore: actionData.trust_score,
            affectedCells: actionData.affected_cells,
            createsFormulas: actionData.creates_formulas,
            structuralChanges: actionData.structural_changes,
            createdAt: actionData.created_at,
          };

          set((state) => ({
            pendingActions: [...state.pendingActions.filter(a => a.id !== action.id), action],
            selectedAction: action,
            activeTab: 'actions',
          }));
        }
      }
    } catch (error) {
      // Add error message
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isProcessing: false,
      }));
    }
  },

  setCurrentInput: (input) => {
    set({ currentInput: input });
  },

  approveAction: async (actionId) => {
    try {
      const response = await fetch(`/api/ai/actions/${actionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: crypto.randomUUID() }), // TODO: Real user ID
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve action');
      }

      // Move action to history
      set((state) => {
        const action = state.pendingActions.find(a => a.id === actionId);
        if (!action) return {};

        const updatedAction = { ...action, state: 'Completed' as const };
        return {
          pendingActions: state.pendingActions.filter(a => a.id !== actionId),
          actionHistory: [...state.actionHistory, updatedAction],
          selectedAction: null,
        };
      });
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  },

  rejectAction: async (actionId, reason) => {
    try {
      const response = await fetch(`/api/ai/actions/${actionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject action');
      }

      // Move action to history
      set((state) => {
        const action = state.pendingActions.find(a => a.id === actionId);
        if (!action) return {};

        const updatedAction = { ...action, state: 'Rejected' as const };
        return {
          pendingActions: state.pendingActions.filter(a => a.id !== actionId),
          actionHistory: [...state.actionHistory, updatedAction],
          selectedAction: null,
        };
      });
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  },

  selectAction: (action) => {
    set({ selectedAction: action });
  },

  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  loadStats: async () => {
    try {
      const response = await fetch('/api/ai/stats');
      if (response.ok) {
        const data = await response.json();
        set({
          stats: {
            activeSessions: data.active_sessions,
            totalSessions: data.total_sessions,
            totalActions: data.total_actions,
            pendingActions: data.pending_actions,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    }
  },

  reset: () => {
    set(initialState);
  },
}));

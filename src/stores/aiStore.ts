// ═══════════════════════════════════════════════════════════════════════════
// AI COPILOT STORE — State Management for AI Features
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AIMessage,
  AIProposedAction,
  AIActionHistory,
  AIConfig,
  AIContext,
  AICopilotTab,
} from '../ai/types';
import { DEFAULT_AI_CONFIG } from '../ai/types';
import { getAIRuntime } from '../ai/AIRuntime';

// ─────────────────────────────────────────────────────────────────────────────
// Store State Interface
// ─────────────────────────────────────────────────────────────────────────────

interface AIState {
  // UI State
  isOpen: boolean;
  isDocked: boolean;
  activeTab: AICopilotTab;

  // Chat State
  messages: AIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  currentInput: string;
  error: string | null;

  // Actions State
  pendingActions: AIProposedAction[];
  selectedAction: AIProposedAction | null;
  actionHistory: AIActionHistory[];

  // Context
  context: AIContext | null;

  // Config
  config: AIConfig;

  // Actions
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setDocked: (docked: boolean) => void;
  setActiveTab: (tab: AICopilotTab) => void;

  // Chat Actions
  setCurrentInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;

  // Action Management
  selectAction: (action: AIProposedAction | null) => void;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;

  // Config
  setApiKey: (key: string) => void;
  updateConfig: (config: Partial<AIConfig>) => void;

  // Reset
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  isOpen: false,
  isDocked: true,
  activeTab: 'chat' as AICopilotTab,
  messages: [] as AIMessage[],
  isLoading: false,
  isStreaming: false,
  streamingText: '',
  currentInput: '',
  error: null as string | null,
  pendingActions: [] as AIProposedAction[],
  selectedAction: null as AIProposedAction | null,
  actionHistory: [] as AIActionHistory[],
  context: null as AIContext | null,
  config: DEFAULT_AI_CONFIG,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAIStore = create<AIState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      // ─────────────────────────────────────────────────────────────────────
      // Panel Controls
      // ─────────────────────────────────────────────────────────────────────

      togglePanel: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openPanel: () => {
        set({ isOpen: true });
      },

      closePanel: () => {
        set({ isOpen: false });
      },

      setDocked: (docked) => {
        set({ isDocked: docked });
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Chat Actions
      // ─────────────────────────────────────────────────────────────────────

      setCurrentInput: (input) => {
        set({ currentInput: input });
      },

      sendMessage: async (content) => {
        if (!content.trim()) return;

        set({ isLoading: true, error: null, currentInput: '' });

        try {
          const runtime = getAIRuntime();
          await runtime.sendMessage(content);

          // Get all messages from runtime conversation
          const conversation = runtime.getConversation();
          if (conversation) {
            set({
              messages: [...conversation.messages],
              pendingActions: [...conversation.pendingActions],
              actionHistory: [...conversation.history],
              context: conversation.context,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to send message',
          });
        }
      },

      streamMessage: async (content) => {
        if (!content.trim()) return;

        set({
          isLoading: true,
          isStreaming: true,
          streamingText: '',
          error: null,
          currentInput: '',
        });

        try {
          const runtime = getAIRuntime();

          for await (const chunk of runtime.streamMessage(content)) {
            if (chunk.type === 'text') {
              set((state) => ({
                streamingText: state.streamingText + chunk.content,
              }));
            } else if (chunk.type === 'done') {
              // Get final state from runtime
              const conversation = runtime.getConversation();
              if (conversation) {
                set({
                  messages: [...conversation.messages],
                  pendingActions: [...conversation.pendingActions],
                  actionHistory: [...conversation.history],
                  context: conversation.context,
                  isLoading: false,
                  isStreaming: false,
                  streamingText: '',
                });
              }
            }
          }
        } catch (error) {
          set({
            isLoading: false,
            isStreaming: false,
            streamingText: '',
            error: error instanceof Error ? error.message : 'Failed to stream message',
          });
        }
      },

      clearMessages: () => {
        const runtime = getAIRuntime();
        runtime.clearConversation();
        set({
          messages: [],
          pendingActions: [],
          actionHistory: [],
          context: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      // ─────────────────────────────────────────────────────────────────────
      // Action Management
      // ─────────────────────────────────────────────────────────────────────

      selectAction: (action) => {
        set({ selectedAction: action });
      },

      approveAction: async (actionId) => {
        const runtime = getAIRuntime();
        const success = await runtime.approveAction(actionId);

        if (success) {
          const conversation = runtime.getConversation();
          if (conversation) {
            set({
              pendingActions: [...conversation.pendingActions],
              actionHistory: [...conversation.history],
              selectedAction: null,
            });
          }
        }
      },

      rejectAction: async (actionId) => {
        const runtime = getAIRuntime();
        const success = await runtime.rejectAction(actionId);

        if (success) {
          const conversation = runtime.getConversation();
          if (conversation) {
            set({
              pendingActions: [...conversation.pendingActions],
              selectedAction: null,
            });
          }
        }
      },

      // ─────────────────────────────────────────────────────────────────────
      // Configuration
      // ─────────────────────────────────────────────────────────────────────

      setApiKey: (key) => {
        const runtime = getAIRuntime();
        runtime.setApiKey(key);
        set((state) => ({
          config: { ...state.config, apiKey: key, mockMode: false },
        }));
      },

      updateConfig: (newConfig) => {
        const runtime = getAIRuntime();
        runtime.updateConfig(newConfig);
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },

      // ─────────────────────────────────────────────────────────────────────
      // Reset
      // ─────────────────────────────────────────────────────────────────────

      reset: () => {
        const runtime = getAIRuntime();
        runtime.clearConversation();
        set(initialState);
      },
    }),
    {
      name: 'ai-copilot-storage',
      partialize: (state) => ({
        // Only persist these fields
        isDocked: state.isDocked,
        config: {
          ...state.config,
          apiKey: undefined, // Never persist API key
        },
      }),
    }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────

export const selectIsAIOpen = (state: AIState) => state.isOpen;
export const selectAIMessages = (state: AIState) => state.messages;
export const selectIsAILoading = (state: AIState) => state.isLoading;
export const selectAIPendingActions = (state: AIState) => state.pendingActions;
export const selectAIConfig = (state: AIState) => state.config;

// ============================================================
// TABS STORE - Zustand State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileTab, DragState, TabCloseResult } from '../types/tabs';
import { loggers } from '@/utils/logger';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 10);

interface TabsStore {
  // State
  tabs: FileTab[];
  activeTabId: string;
  maxTabs: number;
  showHomeTab: boolean;
  dragState: DragState;
  onBeforeClose?: (tabId: string) => Promise<boolean>;

  // Tab Management
  addTab: (tab: Partial<FileTab>) => string;
  removeTab: (tabId: string) => Promise<TabCloseResult>;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<FileTab>) => void;

  // Tab Operations
  closeOtherTabs: (tabId: string) => Promise<void>;
  closeTabsToRight: (tabId: string) => Promise<void>;
  closeAllTabs: () => Promise<void>;
  duplicateTab: (tabId: string) => string;

  // Tab Ordering
  moveTab: (tabId: string, newIndex: number) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;

  // Drag & Drop
  startDrag: (tabId: string) => void;
  updateDragTarget: (targetId: string, position: 'before' | 'after') => void;
  endDrag: () => void;

  // Navigation
  goToNextTab: () => void;
  goToPrevTab: () => void;
  goToTab: (index: number) => void;

  // Utility
  getTabById: (tabId: string) => FileTab | undefined;
  getActiveTab: () => FileTab | undefined;
  getTabIndex: (tabId: string) => number;
  hasUnsavedChanges: () => boolean;
  setOnBeforeClose: (handler: (tabId: string) => Promise<boolean>) => void;
}

const HOME_TAB: FileTab = {
  id: 'home',
  name: 'Home',
  type: 'home',
  workbookId: null,
  isModified: false,
  isPinned: true,
  icon: '🏠',
  createdAt: Date.now(),
  lastAccessedAt: Date.now(),
};

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
      // Initial State
      tabs: [HOME_TAB],
      activeTabId: 'home',
      maxTabs: 20,
      showHomeTab: true,
      dragState: {
        isDragging: false,
        draggedTabId: null,
        dropTargetId: null,
        dropPosition: null,
      },
      onBeforeClose: undefined,

      // ========== Tab Management ==========

      addTab: (tabData) => {
        const state = get();

        if (state.tabs.length >= state.maxTabs) {
          loggers.store.warn('Maximum tabs reached');
          return '';
        }

        const newTab: FileTab = {
          id: generateId(),
          name: tabData.name || 'Untitled',
          path: tabData.path,
          type: tabData.type || 'workbook',
          workbookId: tabData.workbookId || generateId(),
          isModified: false,
          isPinned: false,
          icon: tabData.icon,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          ...tabData,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));

        return newTab.id;
      },

      removeTab: async (tabId) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);

        if (!tab || tab.type === 'home') {
          return 'cancelled';
        }

        if (tab.isModified && state.onBeforeClose) {
          const canClose = await state.onBeforeClose(tabId);
          if (!canClose) {
            return 'cancelled';
          }
        }

        const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
        const isActive = state.activeTabId === tabId;

        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== tabId);

          let newActiveId = state.activeTabId;
          if (isActive) {
            const nextTab = state.tabs[tabIndex + 1];
            const prevTab = state.tabs[tabIndex - 1];
            newActiveId = nextTab?.id || prevTab?.id || 'home';
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveId,
          };
        });

        return 'closed';
      },

      setActiveTab: (tabId) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (tab) {
          set({ activeTabId: tabId });
          get().updateTab(tabId, { lastAccessedAt: Date.now() });
        }
      },

      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          ),
        }));
      },

      // ========== Tab Operations ==========

      closeOtherTabs: async (tabId) => {
        const state = get();
        const tabsToClose = state.tabs.filter(
          (t) => t.id !== tabId && t.type !== 'home' && !t.isPinned
        );

        for (const tab of tabsToClose) {
          await state.removeTab(tab.id);
        }
      },

      closeTabsToRight: async (tabId) => {
        const state = get();
        const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
        const tabsToClose = state.tabs.filter(
          (t, i) => i > tabIndex && t.type !== 'home' && !t.isPinned
        );

        for (const tab of tabsToClose) {
          await state.removeTab(tab.id);
        }
      },

      closeAllTabs: async () => {
        const state = get();
        const tabsToClose = state.tabs.filter(
          (t) => t.type !== 'home' && !t.isPinned
        );

        for (const tab of tabsToClose) {
          await state.removeTab(tab.id);
        }
      },

      duplicateTab: (tabId) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (!tab || tab.type === 'home') return '';

        return get().addTab({
          name: `${tab.name} (Copy)`,
          type: tab.type,
          path: tab.path,
          icon: tab.icon,
        });
      },

      // ========== Tab Ordering ==========

      moveTab: (tabId, newIndex) => {
        set((state) => {
          const tabs = [...state.tabs];
          const currentIndex = tabs.findIndex((t) => t.id === tabId);

          if (currentIndex === -1 || currentIndex === newIndex) return state;

          if (newIndex === 0 && state.showHomeTab) {
            newIndex = 1;
          }

          const [movedTab] = tabs.splice(currentIndex, 1);
          tabs.splice(newIndex, 0, movedTab);

          return { tabs };
        });
      },

      pinTab: (tabId) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);
        if (!tab || tab.type === 'home') return;

        const lastPinnedIndex = state.tabs.reduce(
          (acc, t, i) => (t.isPinned ? i : acc),
          0
        );

        state.updateTab(tabId, { isPinned: true });
        state.moveTab(tabId, lastPinnedIndex + 1);
      },

      unpinTab: (tabId) => {
        get().updateTab(tabId, { isPinned: false });
      },

      // ========== Drag & Drop ==========

      startDrag: (tabId) => {
        set({
          dragState: {
            isDragging: true,
            draggedTabId: tabId,
            dropTargetId: null,
            dropPosition: null,
          },
        });
      },

      updateDragTarget: (targetId, position) => {
        set((state) => ({
          dragState: {
            ...state.dragState,
            dropTargetId: targetId,
            dropPosition: position,
          },
        }));
      },

      endDrag: () => {
        const { dragState, moveTab, tabs } = get();

        if (
          dragState.draggedTabId &&
          dragState.dropTargetId &&
          dragState.dropPosition
        ) {
          const targetIndex = tabs.findIndex(
            (t) => t.id === dragState.dropTargetId
          );
          const newIndex =
            dragState.dropPosition === 'after' ? targetIndex + 1 : targetIndex;
          moveTab(dragState.draggedTabId, newIndex);
        }

        set({
          dragState: {
            isDragging: false,
            draggedTabId: null,
            dropTargetId: null,
            dropPosition: null,
          },
        });
      },

      // ========== Navigation ==========

      goToNextTab: () => {
        const state = get();
        const currentIndex = state.tabs.findIndex(
          (t) => t.id === state.activeTabId
        );
        const nextIndex = (currentIndex + 1) % state.tabs.length;
        state.setActiveTab(state.tabs[nextIndex].id);
      },

      goToPrevTab: () => {
        const state = get();
        const currentIndex = state.tabs.findIndex(
          (t) => t.id === state.activeTabId
        );
        const prevIndex =
          (currentIndex - 1 + state.tabs.length) % state.tabs.length;
        state.setActiveTab(state.tabs[prevIndex].id);
      },

      goToTab: (index) => {
        const tabs = get().tabs;
        if (index >= 0 && index < tabs.length) {
          get().setActiveTab(tabs[index].id);
        }
      },

      // ========== Utility ==========

      getTabById: (tabId) => get().tabs.find((t) => t.id === tabId),

      getActiveTab: () => {
        const state = get();
        return state.tabs.find((t) => t.id === state.activeTabId);
      },

      getTabIndex: (tabId) => get().tabs.findIndex((t) => t.id === tabId),

      hasUnsavedChanges: () => get().tabs.some((t) => t.isModified),

      setOnBeforeClose: (handler) => {
        set({ onBeforeClose: handler });
      },
    }),
    {
      name: 'excelai-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        showHomeTab: state.showHomeTab,
      }),
    }
  )
);

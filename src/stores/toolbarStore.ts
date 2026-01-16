import { create } from 'zustand';

export type TabId = 'home' | 'insert' | 'page-layout' | 'formulas' | 'data' | 'review' | 'view';

interface ToolbarState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

// Selector hooks
export const useActiveTab = () => useToolbarStore((state) => state.activeTab);

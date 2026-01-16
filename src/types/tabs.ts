// ============================================================
// FILE TAB TYPES
// ============================================================

export interface FileTab {
  id: string;
  name: string;
  path?: string;
  type: 'home' | 'workbook' | 'new';
  workbookId: string | null;
  isModified: boolean;
  isPinned: boolean;
  icon?: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface TabsState {
  tabs: FileTab[];
  activeTabId: string;
  maxTabs: number;
  showHomeTab: boolean;
}

export interface TabContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  action: (tabId: string) => void;
}

export interface DragState {
  isDragging: boolean;
  draggedTabId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | null;
}

export type TabCloseResult = 'closed' | 'cancelled' | 'saved';

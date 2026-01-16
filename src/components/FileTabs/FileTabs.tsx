// ============================================================
// FILE TABS - Main Container Component
// ============================================================

import React, { useCallback, useRef, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { FileTab } from './FileTab';
import { HomeTab } from './HomeTab';
import { NewTabButton } from './NewTabButton';
import { TabContextMenu } from './TabContextMenu';
import './FileTabs.css';

interface FileTabsProps {
  onTabChange?: (tabId: string, workbookId: string | null) => void;
  onNewTab?: () => void;
}

export const FileTabs: React.FC<FileTabsProps> = ({
  onTabChange,
  onNewTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);

  const {
    tabs,
    activeTabId,
    dragState,
    showHomeTab,
    setActiveTab,
    addTab,
    removeTab,
    startDrag,
    updateDragTarget,
    endDrag,
    goToNextTab,
    goToPrevTab,
    goToTab,
  } = useTabsStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        goToNextTab();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        goToPrevTab();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        removeTab(activeTabId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        goToTab(parseInt(e.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextTab, goToPrevTab, goToTab, removeTab, activeTabId]);

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      onTabChange?.(tabId, tab?.workbookId || null);
    },
    [setActiveTab, tabs, onTabChange]
  );

  const handleTabClose = useCallback(
    async (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await removeTab(tabId);
    },
    [removeTab]
  );

  const handleNewTab = useCallback(() => {
    const newTabId = addTab({
      name: 'New Workbook',
      type: 'workbook',
    });
    onNewTab?.();
    onTabChange?.(newTabId, null);
  }, [addTab, onNewTab, onTabChange]);

  const handleContextMenu = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        tabId,
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDragStart = useCallback(
    (tabId: string) => {
      startDrag(tabId);
    },
    [startDrag]
  );

  const handleDragOver = useCallback(
    (tabId: string, e: React.DragEvent) => {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const position =
        e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
      updateDragTarget(tabId, position);
    },
    [updateDragTarget]
  );

  const handleDrop = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const scrollToTab = useCallback((tabId: string) => {
    const container = containerRef.current;
    const tabElement = container?.querySelector(`[data-tab-id="${tabId}"]`);
    tabElement?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  }, []);

  useEffect(() => {
    scrollToTab(activeTabId);
  }, [activeTabId, scrollToTab]);

  return (
    <div className="file-tabs-container">
      <div className="file-tabs-scroll" ref={containerRef}>
        <div className="file-tabs-list">
          {showHomeTab && (
            <HomeTab
              isActive={activeTabId === 'home'}
              onClick={() => handleTabClick('home')}
            />
          )}

          {tabs
            .filter((tab) => tab.type !== 'home')
            .map((tab) => (
              <FileTab
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
                isDragging={dragState.draggedTabId === tab.id}
                isDropTarget={dragState.dropTargetId === tab.id}
                dropPosition={
                  dragState.dropTargetId === tab.id
                    ? dragState.dropPosition
                    : null
                }
                onClick={() => handleTabClick(tab.id)}
                onClose={(e) => handleTabClose(tab.id, e)}
                onContextMenu={(e) => handleContextMenu(tab.id, e)}
                onDragStart={() => handleDragStart(tab.id)}
                onDragOver={(e) => handleDragOver(tab.id, e)}
                onDrop={handleDrop}
              />
            ))}

          <NewTabButton onClick={handleNewTab} />
        </div>
      </div>

      {contextMenu && (
        <TabContextMenu
          tabId={contextMenu.tabId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default FileTabs;

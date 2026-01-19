// ============================================================
// TAB CONTEXT MENU - Right-click Menu
// ============================================================

import React, { useEffect, useRef } from 'react';
import { useTabsStore } from '../../stores/tabsStore';
import { X, Copy, Pin, PinOff, ExternalLink, Clipboard } from 'lucide-react';

interface TabContextMenuProps {
  tabId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  tabId,
  x,
  y,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    tabs,
    removeTab,
    closeOtherTabs,
    closeTabsToRight,
    duplicateTab,
    pinTab,
    unpinTab,
    getTabById,
  } = useTabsStore();

  const tab = getTabById(tabId);
  const tabIndex = tabs.findIndex((t) => t.id === tabId);
  const hasTabsToRight = tabs
    .slice(tabIndex + 1)
    .some((t) => t.type !== 'home' && !t.isPinned);
  const hasOtherTabs =
    tabs.filter((t) => t.id !== tabId && t.type !== 'home' && !t.isPinned)
      .length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  const handleAction = (action: () => unknown) => {
    action();
    onClose();
  };

  if (!tab || tab.type === 'home') {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="tab-context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <button
        className="context-menu-item"
        onClick={() => handleAction(() => removeTab(tabId))}
      >
        <X size={14} className="menu-icon" />
        <span className="menu-label">Close</span>
        <span className="menu-shortcut">Ctrl+W</span>
      </button>

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => closeOtherTabs(tabId))}
        disabled={!hasOtherTabs}
      >
        <X size={14} className="menu-icon" />
        <span className="menu-label">Close Others</span>
      </button>

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => closeTabsToRight(tabId))}
        disabled={!hasTabsToRight}
      >
        <X size={14} className="menu-icon" />
        <span className="menu-label">Close to the Right</span>
      </button>

      <div className="context-menu-divider" />

      {tab.isPinned ? (
        <button
          className="context-menu-item"
          onClick={() => handleAction(() => unpinTab(tabId))}
        >
          <PinOff size={14} className="menu-icon" />
          <span className="menu-label">Unpin Tab</span>
        </button>
      ) : (
        <button
          className="context-menu-item"
          onClick={() => handleAction(() => pinTab(tabId))}
        >
          <Pin size={14} className="menu-icon" />
          <span className="menu-label">Pin Tab</span>
        </button>
      )}

      <button
        className="context-menu-item"
        onClick={() => handleAction(() => duplicateTab(tabId))}
      >
        <Copy size={14} className="menu-icon" />
        <span className="menu-label">Duplicate Tab</span>
      </button>

      <div className="context-menu-divider" />

      {tab.path && (
        <button
          className="context-menu-item"
          onClick={() =>
            handleAction(() => {
              navigator.clipboard.writeText(tab.path!);
            })
          }
        >
          <Clipboard size={14} className="menu-icon" />
          <span className="menu-label">Copy Path</span>
        </button>
      )}

      <button
        className="context-menu-item"
        onClick={() =>
          handleAction(() => {
            // Open the tab in a new browser window
            window.open(`${window.location.pathname}?tab=${tabId}`, '_blank');
          })
        }
      >
        <ExternalLink size={14} className="menu-icon" />
        <span className="menu-label">Open in New Window</span>
      </button>
    </div>
  );
};

export default TabContextMenu;

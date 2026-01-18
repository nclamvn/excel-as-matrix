import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Copy, Trash2, Edit3, Eye, EyeOff,
  Palette, ArrowLeft, ArrowRight, Lock
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { UnhideSheetDialog } from '../Dialogs/UnhideSheetDialog';
import { ProtectSheetDialog } from '../Dialogs/ProtectSheetDialog';

interface SheetContextMenuProps {
  x: number;
  y: number;
  sheetId: string;
  onClose: () => void;
}

export const SheetContextMenu: React.FC<SheetContextMenuProps> = ({
  x,
  y,
  sheetId,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [showUnhideDialog, setShowUnhideDialog] = useState(false);
  const [showProtectDialog, setShowProtectDialog] = useState(false);

  const {
    addSheet, deleteSheet, renameSheet, duplicateSheet,
    moveSheet, setTabColor, hideSheet, sheets, sheetOrder
  } = useWorkbookStore();
  const { showToast } = useUIStore();

  const currentSheet = sheets[sheetId];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleInsert = () => {
    const newId = `sheet-${Date.now()}`;
    addSheet({
      id: newId,
      name: `Sheet${sheetOrder.length + 1}`,
      index: sheetOrder.length,
      cells: {},
    });
    showToast('New sheet added', 'success');
  };

  const handleDelete = () => {
    if (sheetOrder.length <= 1) {
      showToast('Cannot delete the only sheet', 'warning');
      return;
    }
    deleteSheet(sheetId);
    showToast('Sheet deleted', 'success');
  };

  const handleRename = () => {
    setNewName(currentSheet?.name || '');
    setIsRenaming(true);
  };

  const submitRename = () => {
    if (newName.trim()) {
      renameSheet(sheetId, newName.trim());
      showToast('Sheet renamed', 'success');
    }
    setIsRenaming(false);
  };

  const handleDuplicate = () => {
    duplicateSheet(sheetId);
    showToast('Sheet duplicated', 'success');
  };

  const handleMoveLeft = () => {
    moveSheet(sheetId, 'left');
  };

  const handleMoveRight = () => {
    moveSheet(sheetId, 'right');
  };

  const handleSetColor = () => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setTabColor(sheetId, randomColor);
    showToast('Tab color changed', 'success');
  };

  const handleHide = () => {
    // Check if there are other visible sheets
    const visibleSheets = Object.values(sheets).filter((s) => !s.hidden);
    if (visibleSheets.length <= 1) {
      showToast('Cannot hide the only visible sheet', 'warning');
      return;
    }
    hideSheet(sheetId);
    showToast('Sheet hidden', 'success');
    onClose();
  };

  const handleUnhide = () => {
    const hiddenSheets = Object.values(sheets).filter((s) => s.hidden);
    if (hiddenSheets.length === 0) {
      showToast('No hidden sheets', 'info');
      return;
    }
    setShowUnhideDialog(true);
  };

  const handleProtect = () => {
    setShowProtectDialog(true);
  };

  const menuItems = [
    { id: 'insert', label: 'Insert...', icon: Plus, action: handleInsert },
    { id: 'delete', label: 'Delete', icon: Trash2, action: handleDelete },
    { id: 'rename', label: 'Rename', icon: Edit3, action: handleRename },
    { id: 'divider1', divider: true },
    { id: 'move-left', label: 'Move Left', icon: ArrowLeft, action: handleMoveLeft },
    { id: 'move-right', label: 'Move Right', icon: ArrowRight, action: handleMoveRight },
    { id: 'divider2', divider: true },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, action: handleDuplicate },
    { id: 'hide', label: 'Hide', icon: EyeOff, action: handleHide },
    { id: 'unhide', label: 'Unhide...', icon: Eye, action: handleUnhide },
    { id: 'divider3', divider: true },
    { id: 'tab-color', label: 'Tab Color', icon: Palette, action: handleSetColor },
    { id: 'protect', label: 'Protect Sheet...', icon: Lock, action: handleProtect },
  ];

  if (isRenaming) {
    return (
      <div ref={ref} className="sheet-context-menu" style={{ left: x, top: y }}>
        <div style={{ padding: '8px' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <button onClick={submitRename} style={{ flex: 1, padding: '4px 8px' }}>OK</button>
            <button onClick={onClose} style={{ flex: 1, padding: '4px 8px' }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={ref}
        className="sheet-context-menu"
        style={{ left: x, top: y }}
      >
        {menuItems.map((item) =>
          item.divider ? (
            <div key={item.id} className="menu-divider" />
          ) : (
            <button
              key={item.id}
              className="menu-item"
              onClick={() => {
                // For hide, don't close immediately (handler will close)
                if (item.id === 'hide') {
                  item.action?.();
                } else if (item.id === 'unhide' || item.id === 'protect') {
                  // Don't close - dialog will handle it
                  item.action?.();
                } else {
                  item.action?.();
                  onClose();
                }
              }}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </button>
          )
        )}
      </div>

      {/* Unhide Sheet Dialog */}
      {showUnhideDialog && (
        <UnhideSheetDialog
          onClose={() => {
            setShowUnhideDialog(false);
            onClose();
          }}
        />
      )}

      {/* Protect Sheet Dialog */}
      {showProtectDialog && (
        <ProtectSheetDialog
          sheetId={sheetId}
          onClose={() => {
            setShowProtectDialog(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

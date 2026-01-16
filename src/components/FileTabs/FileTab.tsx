// ============================================================
// FILE TAB - Individual Tab Component
// ============================================================

import React from 'react';
import { FileTab as FileTabType } from '../../types/tabs';
import { X, Pin } from 'lucide-react';

interface FileTabProps {
  tab: FileTabType;
  isActive: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after' | null;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

export const FileTab: React.FC<FileTabProps> = ({
  tab,
  isActive,
  isDragging,
  isDropTarget,
  dropPosition,
  onClick,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const getFileIcon = () => {
    if (tab.icon) return <span className="tab-emoji-icon">{tab.icon}</span>;

    const ext = tab.path?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'xls':
        return (
          <svg
            className="tab-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z" />
          </svg>
        );
      case 'csv':
        return (
          <svg
            className="tab-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
        );
      default:
        return (
          <svg
            className="tab-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        file-tab
        ${isActive ? 'file-tab--active' : ''}
        ${isDragging ? 'file-tab--dragging' : ''}
        ${isDropTarget ? 'file-tab--drop-target' : ''}
        ${dropPosition ? `file-tab--drop-${dropPosition}` : ''}
        ${tab.isPinned ? 'file-tab--pinned' : ''}
        ${tab.isModified ? 'file-tab--modified' : ''}
      `}
      data-tab-id={tab.id}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={!tab.isPinned}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {tab.isPinned && (
        <span className="tab-pin">
          <Pin size={10} />
        </span>
      )}

      <span className="tab-icon-wrapper">{getFileIcon()}</span>

      <span className="tab-name" title={tab.path || tab.name}>
        {tab.name}
      </span>

      {tab.isModified && (
        <span className="tab-modified-dot" title="Unsaved changes">
          •
        </span>
      )}

      {!tab.isPinned && (
        <button
          className="tab-close-btn"
          onClick={onClose}
          title="Close (Ctrl+W)"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default FileTab;

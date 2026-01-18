import React, { useState } from 'react';

interface SheetTabProps {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRename?: (id: string, newName: string) => void;
}

export const SheetTab: React.FC<SheetTabProps> = ({
  id,
  name,
  color,
  isActive,
  onClick,
  onContextMenu,
  onRename,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditName(name);
  };

  const handleSaveName = () => {
    setEditing(false);
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== name) {
      onRename?.(id, trimmedName);
    }
  };

  const handleBlur = () => {
    handleSaveName();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setEditName(name);
    }
  };

  return (
    <div
      className={`sheet-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={handleDoubleClick}
      style={{ borderBottomColor: color }}
    >
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="sheet-tab-input"
          autoFocus
        />
      ) : (
        <span className="sheet-tab-name">{name}</span>
      )}
    </div>
  );
};

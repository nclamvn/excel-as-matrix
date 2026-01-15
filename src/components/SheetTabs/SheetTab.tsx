import React, { useState } from 'react';

interface SheetTabProps {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const SheetTab: React.FC<SheetTabProps> = ({
  id: _id,
  name,
  color,
  isActive,
  onClick,
  onContextMenu,
}) => {
  const [isEditing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditName(name);
  };

  const handleBlur = () => {
    setEditing(false);
    // TODO: Save name change via workbookStore
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditing(false);
      // TODO: Save name change
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

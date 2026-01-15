import React from 'react';
import { useSelectionStore } from '../../stores/selectionStore';

export const ModeIndicator: React.FC = () => {
  const { isEditing } = useSelectionStore();

  const mode = isEditing ? 'Edit' : 'Ready';

  return (
    <div className="mode-indicator">
      <span className={`mode-text ${isEditing ? 'editing' : ''}`}>
        {mode}
      </span>
    </div>
  );
};

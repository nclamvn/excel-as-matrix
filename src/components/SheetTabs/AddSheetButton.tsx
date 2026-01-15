import React from 'react';
import { Plus } from 'lucide-react';

interface AddSheetButtonProps {
  onClick: () => void;
}

export const AddSheetButton: React.FC<AddSheetButtonProps> = ({ onClick }) => {
  return (
    <button
      className="add-sheet-button"
      onClick={onClick}
      title="New Sheet (Shift+F11)"
    >
      <Plus className="w-4 h-4" />
    </button>
  );
};

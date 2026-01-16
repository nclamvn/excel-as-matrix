// ============================================================
// NEW TAB BUTTON - Add New Tab Component
// ============================================================

import React from 'react';
import { Plus } from 'lucide-react';

interface NewTabButtonProps {
  onClick: () => void;
}

export const NewTabButton: React.FC<NewTabButtonProps> = ({ onClick }) => {
  return (
    <button
      className="new-tab-btn"
      onClick={onClick}
      title="New Workbook (Ctrl+N)"
    >
      <Plus size={18} />
      <span className="new-tab-text">New</span>
    </button>
  );
};

export default NewTabButton;

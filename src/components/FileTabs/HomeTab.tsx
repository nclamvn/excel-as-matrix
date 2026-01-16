// ============================================================
// HOME TAB - Fixed Home Tab Component
// ============================================================

import React from 'react';
import { Home } from 'lucide-react';

interface HomeTabProps {
  isActive: boolean;
  onClick: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ isActive, onClick }) => {
  return (
    <div
      className={`file-tab file-tab--home ${isActive ? 'file-tab--active' : ''}`}
      onClick={onClick}
    >
      <span className="tab-icon-wrapper">
        <Home size={16} className="tab-icon home-icon" />
      </span>
      <span className="tab-name">Home</span>
    </div>
  );
};

export default HomeTab;

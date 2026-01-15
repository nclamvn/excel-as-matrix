import React from 'react';

interface RibbonTabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const RibbonTab: React.FC<RibbonTabProps> = ({
  id,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`ribbon-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-tab={id}
    >
      {label}
    </button>
  );
};

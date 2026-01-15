import React from 'react';
import { LucideIcon } from 'lucide-react';

interface RibbonButtonProps {
  icon: LucideIcon;
  label: string;
  size?: 'small' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}

export const RibbonButton: React.FC<RibbonButtonProps> = ({
  icon: Icon,
  label,
  size = 'small',
  onClick,
  disabled = false,
  active = false,
  title,
}) => {
  return (
    <button
      className={`ribbon-button ${size} ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
    >
      <Icon className={size === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />
      {size === 'large' && <span className="ribbon-button-label">{label}</span>}
    </button>
  );
};

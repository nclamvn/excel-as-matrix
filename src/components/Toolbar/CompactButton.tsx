import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { PremiumTooltip } from '../Premium/PremiumTooltip';

interface CompactButtonProps {
  icon?: React.ElementType;
  label?: string;
  tooltip?: string;
  shortcut?: string;
  description?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'active';
  hasDropdown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CompactButton: React.FC<CompactButtonProps> = ({
  icon: Icon,
  label,
  tooltip,
  shortcut,
  description,
  size = 'sm',
  variant = 'default',
  hasDropdown = false,
  onClick,
  disabled = false,
  className = '',
  children,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClass = size !== 'sm' ? `compact-btn--${size}` : '';
  const variantClass = variant !== 'default' ? `compact-btn--${variant}` : '';
  const dropdownClass = hasDropdown ? 'compact-btn--dropdown' : '';

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        className={`compact-btn ${sizeClass} ${variantClass} ${dropdownClass} ${className}`}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {Icon && <Icon />}
        {label && <span className="compact-btn__label">{label}</span>}
        {children}
        {hasDropdown && <ChevronDown className="compact-btn__arrow" />}
      </button>

      {showTooltip && tooltip && buttonRef.current && (
        <PremiumTooltip
          title={tooltip}
          shortcut={shortcut}
          description={description}
          anchorEl={buttonRef.current}
        />
      )}
    </div>
  );
};

interface CompactSplitButtonProps {
  icon?: React.ElementType;
  label?: string;
  tooltip?: string;
  shortcut?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary';
  onMainClick?: () => void;
  onDropdownClick?: () => void;
  disabled?: boolean;
}

export const CompactSplitButton: React.FC<CompactSplitButtonProps> = ({
  icon: Icon,
  label,
  tooltip,
  shortcut,
  size = 'sm',
  variant = 'default',
  onMainClick,
  onDropdownClick,
  disabled = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const sizeClass = size !== 'sm' ? `compact-btn--${size}` : '';
  const variantClass = variant !== 'default' ? `compact-btn--${variant}` : '';

  return (
    <div
      ref={buttonRef}
      className="compact-split-btn"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`compact-btn compact-split-btn__main ${sizeClass} ${variantClass}`}
        onClick={onMainClick}
        disabled={disabled}
      >
        {Icon && <Icon />}
        {label && <span className="compact-btn__label">{label}</span>}
      </button>
      <button
        className="compact-split-btn__dropdown"
        onClick={onDropdownClick}
        disabled={disabled}
      >
        <ChevronDown />
      </button>

      {showTooltip && tooltip && buttonRef.current && (
        <PremiumTooltip
          title={tooltip}
          shortcut={shortcut}
          anchorEl={buttonRef.current}
        />
      )}
    </div>
  );
};

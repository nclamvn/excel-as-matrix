import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface DropdownOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  divider?: boolean;
}

interface RibbonDropdownProps {
  icon?: LucideIcon;
  label: string;
  options: DropdownOption[];
  size?: 'small' | 'large';
}

export const RibbonDropdown: React.FC<RibbonDropdownProps> = ({
  icon: Icon,
  label,
  options,
  size = 'small',
}) => {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`ribbon-dropdown ${size}`} ref={ref}>
      <button
        className={`ribbon-dropdown-trigger ${size}`}
        onClick={() => setOpen(!isOpen)}
      >
        {Icon && <Icon className={size === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />}
        {size === 'large' && <span>{label}</span>}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="ribbon-dropdown-menu">
          {options.map((option, index) => (
            option.divider ? (
              <div key={index} className="dropdown-divider" />
            ) : (
              <button
                key={option.id}
                className="dropdown-item"
                onClick={() => {
                  option.onClick();
                  setOpen(false);
                }}
              >
                {option.icon && <option.icon className="w-4 h-4" />}
                <span>{option.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

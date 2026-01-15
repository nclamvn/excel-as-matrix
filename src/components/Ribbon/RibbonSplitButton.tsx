import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface SplitButtonOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface RibbonSplitButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  options: SplitButtonOption[];
  size?: 'small' | 'large';
}

export const RibbonSplitButton: React.FC<RibbonSplitButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  options,
  size = 'large',
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
    <div className={`ribbon-split-button ${size}`} ref={ref}>
      <button className="split-main" onClick={onClick} title={label}>
        <Icon className={size === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />
        {size === 'large' && <span>{label}</span>}
      </button>
      <button className="split-dropdown" onClick={() => setOpen(!isOpen)}>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="split-menu">
          {options.map(option => (
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
          ))}
        </div>
      )}
    </div>
  );
};

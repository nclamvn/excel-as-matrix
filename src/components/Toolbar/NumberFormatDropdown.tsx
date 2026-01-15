import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface NumberFormatOption {
  id: string;
  label: string;
}

interface NumberFormatDropdownProps {
  value: string;
  onChange: (format: string) => void;
  options: NumberFormatOption[];
}

export const NumberFormatDropdown: React.FC<NumberFormatDropdownProps> = ({
  value,
  onChange,
  options,
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

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="number-format-dropdown" ref={ref}>
      <button
        className="number-format-trigger"
        onClick={() => setOpen(!isOpen)}
      >
        <span>{selectedOption?.label || 'General'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="number-format-menu">
          {options.map(option => (
            <button
              key={option.id}
              className={`number-format-option ${value === option.id ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

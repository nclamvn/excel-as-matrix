import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Grid3X3 } from 'lucide-react';

const BORDER_OPTIONS = [
  { id: 'none', label: 'No Border', icon: 'none' },
  { id: 'all', label: 'All Borders', icon: 'all' },
  { id: 'outside', label: 'Outside Borders', icon: 'outside' },
  { id: 'thick-outside', label: 'Thick Outside Borders', icon: 'thick' },
  { id: 'bottom', label: 'Bottom Border', icon: 'bottom' },
  { id: 'top', label: 'Top Border', icon: 'top' },
  { id: 'left', label: 'Left Border', icon: 'left' },
  { id: 'right', label: 'Right Border', icon: 'right' },
  { id: 'top-bottom', label: 'Top and Bottom Border', icon: 'top-bottom' },
];

interface BorderSelectorProps {
  value?: string;
  onChange?: (border: string) => void;
}

export const BorderSelector: React.FC<BorderSelectorProps> = ({ value, onChange }) => {
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
    <div className="border-selector" ref={ref}>
      <button
        className="border-selector-trigger"
        onClick={() => setOpen(!isOpen)}
        title="Borders"
      >
        <Grid3X3 className="w-4 h-4" />
        <ChevronDown className="w-2 h-2" />
      </button>

      {isOpen && (
        <div className="border-selector-dropdown">
          {BORDER_OPTIONS.map(option => (
            <button
              key={option.id}
              className={`border-option ${value === option.id ? 'selected' : ''}`}
              onClick={() => {
                onChange?.(option.id);
                setOpen(false);
              }}
            >
              <BorderIcon type={option.icon} />
              <span>{option.label}</span>
            </button>
          ))}
          <div className="border-divider" />
          <button className="border-option">
            <span>Draw Borders</span>
          </button>
          <button className="border-option">
            <span>Line Color</span>
          </button>
          <button className="border-option">
            <span>Line Style</span>
          </button>
        </div>
      )}
    </div>
  );
};

const BorderIcon: React.FC<{ type: string }> = ({ type }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="border-icon">
      <rect x="2" y="2" width="12" height="12" fill="none" stroke="#ccc" strokeWidth="1" />
      {type === 'all' && (
        <>
          <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1" />
          <line x1="2" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1" />
          <line x1="6" y1="2" x2="6" y2="14" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="2" x2="10" y2="14" stroke="currentColor" strokeWidth="1" />
          <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {type === 'outside' && (
        <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
      )}
      {type === 'bottom' && (
        <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2" />
      )}
      {type === 'top' && (
        <line x1="2" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
};

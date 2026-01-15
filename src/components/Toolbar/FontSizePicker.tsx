import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

interface FontSizePickerProps {
  value: number;
  onChange: (size: number) => void;
}

export const FontSizePicker: React.FC<FontSizePickerProps> = ({ value, onChange }) => {
  const [isOpen, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const size = parseInt(inputValue, 10);
    if (!isNaN(size) && size > 0 && size <= 409) {
      onChange(size);
    } else {
      setInputValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="font-size-picker" ref={ref}>
      <div className="font-size-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="font-size-input"
        />
        <button
          className="font-size-dropdown-trigger"
          onClick={() => setOpen(!isOpen)}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div className="font-size-dropdown">
          {FONT_SIZES.map(size => (
            <button
              key={size}
              className={`font-size-option ${size === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(size);
                setOpen(false);
              }}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

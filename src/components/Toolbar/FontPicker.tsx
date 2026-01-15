import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FONTS = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Century Gothic',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Palatino Linotype',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange }) => {
  const [isOpen, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredFonts = FONTS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="font-picker" ref={ref}>
      <button
        className="font-picker-trigger"
        onClick={() => setOpen(!isOpen)}
      >
        <span style={{ fontFamily: value }}>{value}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="font-picker-dropdown">
          <input
            type="text"
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-search"
            autoFocus
          />
          <div className="font-list">
            {filteredFonts.map(font => (
              <button
                key={font}
                className={`font-option ${font === value ? 'selected' : ''}`}
                style={{ fontFamily: font }}
                onClick={() => {
                  onChange(font);
                  setOpen(false);
                }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

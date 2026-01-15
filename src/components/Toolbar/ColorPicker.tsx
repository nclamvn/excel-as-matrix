import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

const COLORS = [
  // Row 1 - Theme colors
  '#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47',
  // Row 2 - Tints 80%
  '#F2F2F2', '#7F7F7F', '#D0CECE', '#D6DCE5', '#D9E2F3', '#FCE4D6', '#EDEDED', '#FFF2CC', '#DEEBF7', '#E2EFDA',
  // Row 3 - Tints 60%
  '#D9D9D9', '#595959', '#AEAAAA', '#ADB9CA', '#B4C7E7', '#F8CBAD', '#DBDBDB', '#FFE699', '#BDD7EE', '#C5E0B4',
  // Row 4 - Tints 40%
  '#BFBFBF', '#404040', '#757171', '#8497B0', '#8FAADC', '#F4B183', '#C9C9C9', '#FFD966', '#9CC3E6', '#A9D18E',
  // Row 5 - Standard colors
  '#FF0000', '#FF6600', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9900FF', '#FF00FF', '#FF99CC', '#996633',
];

interface ColorPickerProps {
  icon: LucideIcon;
  value: string;
  onChange: (color: string) => void;
  title?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  icon: Icon,
  value,
  onChange,
  title
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
    <div className="color-picker" ref={ref}>
      <button
        className="color-picker-trigger"
        onClick={() => setOpen(!isOpen)}
        title={title}
      >
        <Icon className="w-4 h-4" />
        <div
          className="color-indicator"
          style={{ backgroundColor: value }}
        />
        <ChevronDown className="w-2 h-2" />
      </button>

      {isOpen && (
        <div className="color-picker-dropdown">
          <div className="color-grid">
            {COLORS.map((color, index) => (
              <button
                key={index}
                className={`color-cell ${color === value ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                title={color}
              />
            ))}
          </div>
          <div className="color-picker-footer">
            <button className="more-colors-btn">
              More Colors...
            </button>
            <button
              className="no-color-btn"
              onClick={() => {
                onChange('transparent');
                setOpen(false);
              }}
            >
              No Color
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

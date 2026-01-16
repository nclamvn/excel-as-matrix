// ============================================================
// TEXT ORIENTATION DROPDOWN
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  RotateCw,
  Type,
  ArrowUp,
  ArrowDown,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useFormatStore } from '../../stores/formatStore';
import { TextOrientationDialog } from './TextOrientationDialog';
import './TextOrientation.css';

interface TextOrientationOption {
  id: string;
  label: string;
  angle: number;
  vertical?: boolean;
  icon: React.ReactNode;
}

const ORIENTATION_OPTIONS: TextOrientationOption[] = [
  { id: 'horizontal', label: 'Horizontal', angle: 0, icon: <Type size={16} /> },
  { id: 'angle-ccw', label: 'Angle Counterclockwise', angle: 45, icon: <RotateCcw size={16} /> },
  { id: 'angle-cw', label: 'Angle Clockwise', angle: -45, icon: <RotateCw size={16} /> },
  { id: 'vertical', label: 'Vertical Text', angle: 0, vertical: true, icon: <Type size={16} style={{ writingMode: 'vertical-rl' }} /> },
  { id: 'rotate-up', label: 'Rotate Text Up', angle: 90, icon: <ArrowUp size={16} /> },
  { id: 'rotate-down', label: 'Rotate Text Down', angle: -90, icon: <ArrowDown size={16} /> },
];

export const TextOrientationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { setTextRotation } = useFormatStore();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: TextOrientationOption) => {
    setTextRotation(option.angle, option.vertical || false);
    setIsOpen(false);
  };

  const handleCustomAngle = (angle: number) => {
    setTextRotation(angle, false);
    setShowCustomDialog(false);
  };

  return (
    <div className="text-orientation-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn toolbar-2026__btn--dropdown"
        onClick={() => setIsOpen(!isOpen)}
        title="Text Orientation"
      >
        <div className="orientation-icon">
          <Type size={14} />
          <span className="rotation-indicator">ab</span>
        </div>
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div className="orientation-menu">
          {ORIENTATION_OPTIONS.map((option) => (
            <button
              key={option.id}
              className="orientation-item"
              onClick={() => handleSelect(option)}
            >
              <span className="item-icon">{option.icon}</span>
              <span className="item-label">{option.label}</span>
              <span
                className="item-preview"
                style={{
                  transform: option.vertical
                    ? 'none'
                    : `rotate(${-option.angle}deg)`,
                  writingMode: option.vertical ? 'vertical-rl' : 'horizontal-tb',
                }}
              >
                Ab
              </span>
            </button>
          ))}

          <div className="orientation-menu-divider" />

          <button
            className="orientation-item"
            onClick={() => { setShowCustomDialog(true); setIsOpen(false); }}
          >
            <span className="item-icon"><Settings size={16} /></span>
            <span className="item-label">Custom Angle...</span>
          </button>
        </div>
      )}

      {showCustomDialog && (
        <TextOrientationDialog
          onClose={() => setShowCustomDialog(false)}
          onApply={handleCustomAngle}
        />
      )}
    </div>
  );
};

export default TextOrientationDropdown;

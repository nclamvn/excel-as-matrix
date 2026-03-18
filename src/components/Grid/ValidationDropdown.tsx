// =============================================================================
// VALIDATION DROPDOWN — Dropdown popup for list validation cells
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ValidationDropdownProps {
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  position: { x: number; y: number; w: number };
  theme: 'light' | 'dark';
}

export const ValidationDropdown: React.FC<ValidationDropdownProps> = ({
  options,
  onSelect,
  onClose,
  position,
  theme,
}) => {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < options.length) {
            onSelect(options[highlightIndex]);
          }
          break;
        case 'Escape':
        case 'Tab':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [highlightIndex, options, onSelect, onClose]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: Math.max(position.w, 120),
        maxHeight: 200,
        overflowY: 'auto',
        background: isDark ? '#262626' : 'white',
        border: `1px solid ${isDark ? '#525252' : '#d4d4d4'}`,
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 50,
        outline: 'none',
      }}
    >
      {options.map((opt, i) => (
        <div
          key={i}
          onClick={() => onSelect(opt)}
          style={{
            padding: '4px 8px',
            fontSize: 13,
            cursor: 'pointer',
            color: isDark ? '#e5e5e5' : '#171717',
            background: i === highlightIndex
              ? (isDark ? '#404040' : '#f0f0f0')
              : 'transparent',
          }}
          onMouseEnter={() => setHighlightIndex(i)}
        >
          {opt}
        </div>
      ))}
    </div>
  );
};

export default ValidationDropdown;

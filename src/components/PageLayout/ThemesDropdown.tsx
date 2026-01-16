// ============================================================
// THEMES DROPDOWN
// ============================================================

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import './PageLayout.css';

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent1: string;
    accent2: string;
    accent3: string;
    accent4: string;
  };
}

const THEMES: Theme[] = [
  {
    id: 'office',
    name: 'Office',
    colors: {
      primary: '#4472C4',
      secondary: '#ED7D31',
      accent1: '#A5A5A5',
      accent2: '#FFC000',
      accent3: '#5B9BD5',
      accent4: '#70AD47',
    },
  },
  {
    id: 'excel-green',
    name: 'Excel Green',
    colors: {
      primary: '#217346',
      secondary: '#33A852',
      accent1: '#93C47D',
      accent2: '#76A5AF',
      accent3: '#6FA8DC',
      accent4: '#8E7CC3',
    },
  },
  {
    id: 'blue-warm',
    name: 'Blue Warm',
    colors: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      accent1: '#60A5FA',
      accent2: '#93C5FD',
      accent3: '#BFDBFE',
      accent4: '#1E40AF',
    },
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    colors: {
      primary: '#374151',
      secondary: '#6B7280',
      accent1: '#9CA3AF',
      accent2: '#D1D5DB',
      accent3: '#E5E7EB',
      accent4: '#1F2937',
    },
  },
  {
    id: 'colorful',
    name: 'Colorful',
    colors: {
      primary: '#DC2626',
      secondary: '#F59E0B',
      accent1: '#10B981',
      accent2: '#3B82F6',
      accent3: '#8B5CF6',
      accent4: '#EC4899',
    },
  },
];

interface ThemesDropdownProps {
  sheetId: string;
}

export const ThemesDropdown: React.FC<ThemesDropdownProps> = ({ sheetId: _sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('office');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    setIsOpen(false);
  };

  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="themes-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="theme-preview-mini">
          {Object.values(currentTheme.colors).slice(0, 4).map((color, i) => (
            <div key={i} className="color-dot" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>Themes</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="themes-menu">
          <div className="menu-title">Office Themes</div>
          <div className="themes-grid">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                className={`theme-item ${selectedTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleSelectTheme(theme.id)}
              >
                <div className="theme-colors">
                  {Object.values(theme.colors).map((color, i) => (
                    <div key={i} className="color-block" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemesDropdown;

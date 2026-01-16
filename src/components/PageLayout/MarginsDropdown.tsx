// ============================================================
// MARGINS DROPDOWN
// ============================================================

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { usePrintStore } from '../../stores/printStore';
import { MARGIN_PRESETS, PageMargins } from '../../types/print';
import './PageLayout.css';

interface MarginPreset {
  id: string;
  name: string;
  margins: PageMargins;
  description: string;
}

const MARGIN_OPTIONS: MarginPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    margins: MARGIN_PRESETS.normal,
    description: 'Top: 0.75" Bottom: 0.75" Left: 0.7" Right: 0.7"',
  },
  {
    id: 'wide',
    name: 'Wide',
    margins: MARGIN_PRESETS.wide,
    description: 'Top: 1" Bottom: 1" Left: 1" Right: 1"',
  },
  {
    id: 'narrow',
    name: 'Narrow',
    margins: MARGIN_PRESETS.narrow,
    description: 'Top: 0.5" Bottom: 0.5" Left: 0.5" Right: 0.5"',
  },
];

interface MarginsDropdownProps {
  sheetId: string;
}

export const MarginsDropdown: React.FC<MarginsDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getSettings, setMargins } = usePrintStore();
  const settings = getSettings(sheetId);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelectMargin = (margins: PageMargins) => {
    setMargins(sheetId, margins);
    setIsOpen(false);
  };

  const currentPreset = MARGIN_OPTIONS.find(
    opt => JSON.stringify(opt.margins) === JSON.stringify(settings.margins)
  )?.name || 'Custom';

  return (
    <div className="margins-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="margin-icon">
          <div className="margin-box">
            <div className="margin-inner" />
          </div>
        </div>
        <span>Margins</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="margins-menu">
          <div className="menu-title">Page Margins</div>
          {MARGIN_OPTIONS.map(option => (
            <button
              key={option.id}
              className={`margin-item ${currentPreset === option.name ? 'active' : ''}`}
              onClick={() => handleSelectMargin(option.margins)}
            >
              <div className="margin-preview">
                <div className="page-preview">
                  <div
                    className="content-preview"
                    style={{
                      top: `${option.margins.top / 10}%`,
                      bottom: `${option.margins.bottom / 10}%`,
                      left: `${option.margins.left / 10}%`,
                      right: `${option.margins.right / 10}%`,
                    }}
                  />
                </div>
              </div>
              <div className="margin-info">
                <span className="margin-name">{option.name}</span>
                <span className="margin-desc">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarginsDropdown;

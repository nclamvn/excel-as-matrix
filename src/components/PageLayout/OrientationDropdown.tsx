// ============================================================
// ORIENTATION DROPDOWN
// ============================================================

import React, { useState, useRef } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { usePrintStore } from '../../stores/printStore';
import { PageOrientation } from '../../types/print';
import './PageLayout.css';

interface OrientationDropdownProps {
  sheetId: string;
}

export const OrientationDropdown: React.FC<OrientationDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getSettings, setOrientation } = usePrintStore();
  const settings = getSettings(sheetId);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelect = (orientation: PageOrientation) => {
    setOrientation(sheetId, orientation);
    setIsOpen(false);
  };

  return (
    <div className="orientation-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FileText
          size={16}
          className={settings.orientation === 'landscape' ? 'rotate-90' : ''}
        />
        <span>Orientation</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="orientation-menu">
          <button
            className={`orientation-item ${settings.orientation === 'portrait' ? 'active' : ''}`}
            onClick={() => handleSelect('portrait')}
          >
            <div className="orientation-preview portrait">
              <div className="page-lines">
                <div /><div /><div />
              </div>
            </div>
            <span>Portrait</span>
          </button>
          <button
            className={`orientation-item ${settings.orientation === 'landscape' ? 'active' : ''}`}
            onClick={() => handleSelect('landscape')}
          >
            <div className="orientation-preview landscape">
              <div className="page-lines">
                <div /><div /><div />
              </div>
            </div>
            <span>Landscape</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OrientationDropdown;

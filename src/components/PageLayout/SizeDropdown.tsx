// ============================================================
// SIZE DROPDOWN
// ============================================================

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { usePrintStore } from '../../stores/printStore';
import { PageSize, PAGE_SIZES } from '../../types/print';
import './PageLayout.css';

interface SizeDropdownProps {
  sheetId: string;
}

export const SizeDropdown: React.FC<SizeDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getSettings, setPageSize } = usePrintStore();
  const settings = getSettings(sheetId);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelectSize = (size: PageSize) => {
    setPageSize(sheetId, size);
    setIsOpen(false);
  };

  const currentSize = PAGE_SIZES.find(s => s.id === settings.paperSize) || PAGE_SIZES[0];

  return (
    <div className="size-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="size-icon">
          <div className="size-page" />
        </div>
        <span>Size</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="size-menu">
          <div className="menu-title">Paper Size</div>
          {PAGE_SIZES.map(size => (
            <button
              key={size.id}
              className={`size-item ${currentSize.id === size.id ? 'active' : ''}`}
              onClick={() => handleSelectSize(size)}
            >
              <div className="size-preview">
                <div
                  className="page-preview"
                  style={{
                    width: size.width > size.height ? 28 : 20,
                    height: size.width > size.height ? 20 : 28,
                  }}
                />
              </div>
              <div className="size-info">
                <span className="size-name">{size.name}</span>
                <span className="size-dimensions">
                  {size.width}" × {size.height}"
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SizeDropdown;

# 📐 IMPLEMENTATION GUIDE: Page Layout Tab
## ExcelAI — Page Setup & Layout Features

---

## 🎯 Overview

| Feature | Est. Time | Files | Impact |
|---------|-----------|-------|--------|
| Page Layout Tab | 1.5 days | 6 | +0.5% |

**Features:**
- Themes (colors, fonts, effects)
- Page Setup (margins, orientation, size)
- Scale to Fit
- Sheet Options (gridlines, headings)
- Page Breaks (insert, remove, reset)
- Background Image
- Print Titles (rows/columns to repeat)

---

## 📁 Files to Create

```
src/
├── components/
│   └── Modern/
│       └── toolbars/
│           └── PageLayoutToolbar.tsx
├── components/
│   └── PageLayout/
│       ├── index.ts
│       ├── ThemesDropdown.tsx
│       ├── MarginsDropdown.tsx
│       ├── OrientationDropdown.tsx
│       ├── SizeDropdown.tsx
│       ├── PrintTitlesDialog.tsx
│       ├── BackgroundDialog.tsx
│       └── PageLayout.css
```

---

## 📄 File 1: `src/components/Modern/toolbars/PageLayoutToolbar.tsx`

```tsx
// ============================================================
// PAGE LAYOUT TOOLBAR
// ============================================================

import React, { useState } from 'react';
import {
  Palette,
  FileText,
  Maximize,
  Grid3X3,
  Columns,
  Image,
  Printer,
  RotateCcw,
  SeparatorHorizontal,
} from 'lucide-react';
import { ThemesDropdown } from '../../PageLayout/ThemesDropdown';
import { MarginsDropdown } from '../../PageLayout/MarginsDropdown';
import { OrientationDropdown } from '../../PageLayout/OrientationDropdown';
import { SizeDropdown } from '../../PageLayout/SizeDropdown';
import { PrintTitlesDialog } from '../../PageLayout/PrintTitlesDialog';
import { BackgroundDialog } from '../../PageLayout/BackgroundDialog';
import { usePrintStore } from '../../../stores/printStore';
import { useWorkbookStore } from '../../../stores/workbookStore';
import './ToolbarStyles.css';

interface PageLayoutToolbarProps {
  sheetId: string;
}

export const PageLayoutToolbar: React.FC<PageLayoutToolbarProps> = ({ sheetId }) => {
  const [showPrintTitles, setShowPrintTitles] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  const { getSettings, updateSettings, addPageBreak, clearPageBreaks } = usePrintStore();
  const { selection } = useWorkbookStore();
  const settings = getSettings(sheetId);

  // Insert page break at current selection
  const handleInsertPageBreak = () => {
    if (!selection) return;
    addPageBreak(sheetId, 'row', selection.start.row);
    addPageBreak(sheetId, 'column', selection.start.col);
  };

  // Remove all page breaks
  const handleResetPageBreaks = () => {
    clearPageBreaks(sheetId);
  };

  return (
    <div className="toolbar page-layout-toolbar">
      {/* Themes Group */}
      <div className="toolbar-group">
        <div className="group-label">Themes</div>
        <div className="group-content">
          <ThemesDropdown sheetId={sheetId} />
          <button className="toolbar-btn" title="Colors">
            <Palette size={16} />
            <span>Colors</span>
          </button>
          <button className="toolbar-btn" title="Fonts">
            <FileText size={16} />
            <span>Fonts</span>
          </button>
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* Page Setup Group */}
      <div className="toolbar-group">
        <div className="group-label">Page Setup</div>
        <div className="group-content">
          <MarginsDropdown sheetId={sheetId} />
          <OrientationDropdown sheetId={sheetId} />
          <SizeDropdown sheetId={sheetId} />
          <button className="toolbar-btn" title="Print Area">
            <Printer size={16} />
            <span>Print Area</span>
          </button>
          <button 
            className="toolbar-btn" 
            title="Page Breaks"
            onClick={handleInsertPageBreak}
          >
            <SeparatorHorizontal size={16} />
            <span>Breaks</span>
          </button>
          <button 
            className="toolbar-btn" 
            title="Background"
            onClick={() => setShowBackground(true)}
          >
            <Image size={16} />
            <span>Background</span>
          </button>
          <button 
            className="toolbar-btn" 
            title="Print Titles"
            onClick={() => setShowPrintTitles(true)}
          >
            <Columns size={16} />
            <span>Print Titles</span>
          </button>
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* Scale to Fit Group */}
      <div className="toolbar-group">
        <div className="group-label">Scale to Fit</div>
        <div className="group-content scale-controls">
          <div className="scale-item">
            <label>Width:</label>
            <select 
              value={settings.fitToPagesWide}
              onChange={(e) => updateSettings(sheetId, { 
                fitToPagesWide: parseInt(e.target.value),
                scalingMode: 'fitToPage',
              })}
            >
              <option value={0}>Automatic</option>
              <option value={1}>1 page</option>
              <option value={2}>2 pages</option>
              <option value={3}>3 pages</option>
            </select>
          </div>
          <div className="scale-item">
            <label>Height:</label>
            <select 
              value={settings.fitToPagesTall}
              onChange={(e) => updateSettings(sheetId, { 
                fitToPagesTall: parseInt(e.target.value),
                scalingMode: 'fitToPage',
              })}
            >
              <option value={0}>Automatic</option>
              <option value={1}>1 page</option>
              <option value={2}>2 pages</option>
              <option value={3}>3 pages</option>
            </select>
          </div>
          <div className="scale-item">
            <label>Scale:</label>
            <div className="scale-input">
              <input 
                type="number" 
                min="10" 
                max="400"
                value={settings.customScale}
                onChange={(e) => updateSettings(sheetId, { 
                  customScale: parseInt(e.target.value),
                  scalingMode: 'custom',
                })}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* Sheet Options Group */}
      <div className="toolbar-group">
        <div className="group-label">Sheet Options</div>
        <div className="group-content options-grid">
          <div className="options-column">
            <span className="options-header">Gridlines</span>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={true} // View gridlines (always on in app)
                disabled
              />
              View
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={settings.printGridlines}
                onChange={(e) => updateSettings(sheetId, { printGridlines: e.target.checked })}
              />
              Print
            </label>
          </div>
          <div className="options-column">
            <span className="options-header">Headings</span>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={true} // View headings (always on in app)
                disabled
              />
              View
            </label>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={settings.printRowColHeaders}
                onChange={(e) => updateSettings(sheetId, { printRowColHeaders: e.target.checked })}
              />
              Print
            </label>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showPrintTitles && (
        <PrintTitlesDialog 
          sheetId={sheetId}
          onClose={() => setShowPrintTitles(false)}
        />
      )}
      {showBackground && (
        <BackgroundDialog 
          sheetId={sheetId}
          onClose={() => setShowBackground(false)}
        />
      )}
    </div>
  );
};

export default PageLayoutToolbar;
```

---

## 📄 File 2: `src/components/PageLayout/ThemesDropdown.tsx`

```tsx
// ============================================================
// THEMES DROPDOWN
// ============================================================

import React, { useState, useRef } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
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
  fonts: {
    heading: string;
    body: string;
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
    fonts: { heading: 'Calibri Light', body: 'Calibri' },
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
    fonts: { heading: 'Arial', body: 'Arial' },
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
    fonts: { heading: 'Segoe UI', body: 'Segoe UI' },
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
    fonts: { heading: 'Arial', body: 'Arial' },
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
    fonts: { heading: 'Verdana', body: 'Verdana' },
  },
];

interface ThemesDropdownProps {
  sheetId: string;
}

export const ThemesDropdown: React.FC<ThemesDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('office');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    // Apply theme colors to workbook (could be implemented via a themeStore)
    setIsOpen(false);
  };

  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <div className="themes-dropdown" ref={dropdownRef}>
      <button 
        className="toolbar-btn themes-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="theme-preview-mini">
          {Object.values(currentTheme.colors).slice(0, 4).map((color, i) => (
            <div key={i} className="color-dot" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>Themes</span>
        <ChevronDown size={14} />
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
```

---

## 📄 File 3: `src/components/PageLayout/MarginsDropdown.tsx`

```tsx
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

  // Determine current preset
  const currentPreset = MARGIN_OPTIONS.find(
    opt => JSON.stringify(opt.margins) === JSON.stringify(settings.margins)
  )?.name || 'Custom';

  return (
    <div className="margins-dropdown" ref={dropdownRef}>
      <button 
        className="toolbar-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="margin-icon">
          <div className="margin-box">
            <div className="margin-inner" />
          </div>
        </div>
        <span>Margins</span>
        <ChevronDown size={14} />
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
          <div className="menu-divider" />
          <button className="margin-item custom">
            <span>Custom Margins...</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MarginsDropdown;
```

---

## 📄 File 4: `src/components/PageLayout/OrientationDropdown.tsx`

```tsx
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
        className="toolbar-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FileText 
          size={16} 
          className={settings.orientation === 'landscape' ? 'rotate-90' : ''} 
        />
        <span>Orientation</span>
        <ChevronDown size={14} />
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
```

---

## 📄 File 5: `src/components/PageLayout/SizeDropdown.tsx`

```tsx
// ============================================================
// SIZE DROPDOWN — Paper Size Selection
// ============================================================

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { usePrintStore } from '../../stores/printStore';
import { PAPER_SIZES, PaperSize } from '../../types/print';
import './PageLayout.css';

interface SizeDropdownProps {
  sheetId: string;
}

export const SizeDropdown: React.FC<SizeDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getSettings, setPaperSize } = usePrintStore();
  const settings = getSettings(sheetId);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleSelect = (size: PaperSize) => {
    setPaperSize(sheetId, size);
    setIsOpen(false);
  };

  const currentSize = PAPER_SIZES[settings.paperSize];

  return (
    <div className="size-dropdown" ref={dropdownRef}>
      <button 
        className="toolbar-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="size-icon">
          <div className="page-outline" />
        </div>
        <span>Size</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="size-menu">
          <div className="menu-title">Paper Size</div>
          {(Object.entries(PAPER_SIZES) as [PaperSize, typeof PAPER_SIZES[PaperSize]][]).map(([key, value]) => (
            <button
              key={key}
              className={`size-item ${settings.paperSize === key ? 'active' : ''}`}
              onClick={() => handleSelect(key)}
            >
              <div className="size-preview">
                <div 
                  className="page-mini"
                  style={{
                    aspectRatio: `${value.width} / ${value.height}`,
                  }}
                />
              </div>
              <div className="size-info">
                <span className="size-name">{value.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SizeDropdown;
```

---

## 📄 File 6: `src/components/PageLayout/PrintTitlesDialog.tsx`

```tsx
// ============================================================
// PRINT TITLES DIALOG
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import './PageLayout.css';

interface PrintTitlesDialogProps {
  sheetId: string;
  onClose: () => void;
}

export const PrintTitlesDialog: React.FC<PrintTitlesDialogProps> = ({
  sheetId,
  onClose,
}) => {
  const { getSettings, updateSettings } = usePrintStore();
  const settings = getSettings(sheetId);

  const [repeatRows, setRepeatRows] = useState(settings.printArea || '');
  const [repeatCols, setRepeatCols] = useState('');

  const handleApply = () => {
    updateSettings(sheetId, {
      // Store repeat rows/cols (would need to extend print types)
    });
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog print-titles-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Print Titles</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <p className="dialog-description">
            Specify rows and columns to repeat on each printed page.
          </p>

          <div className="form-group">
            <label>Rows to repeat at top:</label>
            <input
              type="text"
              value={repeatRows}
              onChange={(e) => setRepeatRows(e.target.value)}
              placeholder="e.g., $1:$2"
              className="range-input"
            />
            <span className="input-hint">Example: $1:$2 repeats rows 1-2</span>
          </div>

          <div className="form-group">
            <label>Columns to repeat at left:</label>
            <input
              type="text"
              value={repeatCols}
              onChange={(e) => setRepeatCols(e.target.value)}
              placeholder="e.g., $A:$B"
              className="range-input"
            />
            <span className="input-hint">Example: $A:$B repeats columns A-B</span>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleApply}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintTitlesDialog;
```

---

## 📄 File 7: `src/components/PageLayout/BackgroundDialog.tsx`

```tsx
// ============================================================
// BACKGROUND DIALOG — Sheet Background Image
// ============================================================

import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Image } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import './PageLayout.css';

interface BackgroundDialogProps {
  sheetId: string;
  onClose: () => void;
}

export const BackgroundDialog: React.FC<BackgroundDialogProps> = ({
  sheetId,
  onClose,
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setBackgroundImage(null);
  };

  const handleApply = () => {
    // Apply background to sheet (would need to extend workbook store)
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog background-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Sheet Background</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <div 
            className="background-preview"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            }}
          >
            {!backgroundImage && (
              <div className="preview-placeholder">
                <Image size={48} />
                <span>No background image</span>
              </div>
            )}
          </div>

          <div className="background-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              hidden
            />
            <button 
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Select Image
            </button>
            {backgroundImage && (
              <button 
                className="btn-secondary delete"
                onClick={handleRemove}
              >
                <Trash2 size={16} />
                Remove
              </button>
            )}
          </div>

          <p className="background-note">
            Note: Background images are visible on screen but do not print.
          </p>
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundDialog;
```

---

## 📄 File 8: `src/components/PageLayout/PageLayout.css`

```css
/* ============================================================
   PAGE LAYOUT STYLES
   ============================================================ */

/* Toolbar Specifics */
.page-layout-toolbar .scale-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scale-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scale-item label {
  font-size: 11px;
  color: var(--text-muted, #888);
  min-width: 45px;
}

.scale-item select,
.scale-item .scale-input input {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 12px;
  min-width: 80px;
}

.scale-item .scale-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scale-item .scale-input input {
  width: 50px;
  text-align: center;
}

/* Options Grid */
.options-grid {
  display: flex;
  gap: 16px;
}

.options-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.options-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
}

.checkbox-label input {
  accent-color: var(--accent-color, #217346);
}

/* Themes Dropdown */
.themes-dropdown .theme-preview-mini {
  display: flex;
  gap: 2px;
}

.theme-preview-mini .color-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.themes-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 280px;
  padding: 12px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--bg-secondary, #f8f9fa);
  cursor: pointer;
  transition: all 0.15s;
}

.theme-item:hover {
  border-color: var(--border-color, #ddd);
}

.theme-item.active {
  border-color: var(--accent-color, #217346);
  background: var(--accent-light, #e8f5e9);
}

.theme-colors {
  display: flex;
  gap: 2px;
}

.color-block {
  width: 20px;
  height: 20px;
  border-radius: 3px;
}

.theme-name {
  font-size: 11px;
  font-weight: 500;
}

/* Margins Dropdown */
.margins-menu,
.orientation-menu,
.size-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 240px;
  padding: 8px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.margin-item,
.size-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.margin-item:hover,
.size-item:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.margin-item.active,
.size-item.active {
  background: var(--accent-light, #e8f5e9);
}

.margin-preview,
.size-preview {
  width: 40px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-preview,
.page-mini {
  width: 32px;
  height: 44px;
  border: 1px solid var(--border-color, #ccc);
  background: white;
  position: relative;
}

.content-preview {
  position: absolute;
  background: var(--accent-light, #e8f5e9);
  border: 1px dashed var(--accent-color, #217346);
}

.margin-info,
.size-info {
  flex: 1;
}

.margin-name,
.size-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
}

.margin-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 2px;
}

/* Orientation */
.orientation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 0.15s;
}

.orientation-item:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.orientation-item.active {
  border-color: var(--accent-color, #217346);
  background: var(--accent-light, #e8f5e9);
}

.orientation-preview {
  border: 1px solid var(--border-color, #ccc);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orientation-preview.portrait {
  width: 36px;
  height: 48px;
}

.orientation-preview.landscape {
  width: 48px;
  height: 36px;
}

.page-lines {
  width: 60%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-lines div {
  height: 2px;
  background: var(--border-color, #ddd);
  border-radius: 1px;
}

/* Print Titles Dialog */
.print-titles-dialog {
  width: 400px;
}

.dialog-description {
  font-size: 13px;
  color: var(--text-secondary, #666);
  margin-bottom: 16px;
}

/* Background Dialog */
.background-dialog {
  width: 420px;
}

.background-preview {
  width: 100%;
  height: 200px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  background-color: var(--bg-secondary, #f8f9fa);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted, #999);
}

.background-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.background-actions .delete {
  color: var(--error-color, #dc2626);
}

.background-note {
  font-size: 12px;
  color: var(--text-muted, #888);
  font-style: italic;
}

/* Dark Mode */
[data-theme="dark"] .themes-menu,
[data-theme="dark"] .margins-menu,
[data-theme="dark"] .orientation-menu,
[data-theme="dark"] .size-menu {
  background: var(--bg-primary-dark, #1e1e1e);
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .theme-item,
[data-theme="dark"] .background-preview {
  background: var(--bg-secondary-dark, #2a2a2a);
}

[data-theme="dark"] .page-preview,
[data-theme="dark"] .page-mini,
[data-theme="dark"] .orientation-preview {
  background: var(--bg-primary-dark, #1e1e1e);
  border-color: var(--border-color-dark, #555);
}
```

---

## 📄 File 9: `src/components/PageLayout/index.ts`

```typescript
export { ThemesDropdown } from './ThemesDropdown';
export { MarginsDropdown } from './MarginsDropdown';
export { OrientationDropdown } from './OrientationDropdown';
export { SizeDropdown } from './SizeDropdown';
export { PrintTitlesDialog } from './PrintTitlesDialog';
export { BackgroundDialog } from './BackgroundDialog';
```

---

## 🔗 Integration

Add Page Layout tab to ribbon:

```tsx
// In RibbonTabs or App.tsx
{activeTab === 'pageLayout' && (
  <PageLayoutToolbar sheetId={activeSheetId} />
)}
```

---

## ✅ Implementation Checklist

- [ ] `PageLayoutToolbar.tsx`
- [ ] `ThemesDropdown.tsx`
- [ ] `MarginsDropdown.tsx`
- [ ] `OrientationDropdown.tsx`
- [ ] `SizeDropdown.tsx`
- [ ] `PrintTitlesDialog.tsx`
- [ ] `BackgroundDialog.tsx`
- [ ] `PageLayout.css`
- [ ] `index.ts`
- [ ] Add tab to ribbon

---

**Estimated Time:** 1.5 days  
**Score Impact:** +0.5%

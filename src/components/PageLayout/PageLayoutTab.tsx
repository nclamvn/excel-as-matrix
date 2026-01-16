// ============================================================
// PAGE LAYOUT TAB - Full Page Setup Panel
// ============================================================

import React, { useState } from 'react';
import { usePageLayoutStore } from '../../stores/pageLayoutStore';
import {
  MARGIN_PRESETS,
  PAGE_SIZES,
  PageMargins,
  PageOrientation,
  PageSize,
} from '../../types/pageLayout';
import {
  FileText,
  Maximize,
  Grid,
  Rows,
  Columns,
  Image,
  Printer,
  ChevronDown,
  RotateCw,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import './PageLayout.css';

interface PageLayoutTabProps {
  sheetId?: string;
}

export const PageLayoutTab: React.FC<PageLayoutTabProps> = ({ sheetId }) => {
  const {
    getSettings,
    setMargins,
    applyMarginPreset,
    setOrientation,
    setPageSize,
    setCustomSize,
    setPrintArea,
    clearPrintArea,
    setPrintTitles,
    clearPrintTitles,
    insertPageBreak,
    removeAllPageBreaks,
    setBackground,
    clearBackground,
    setScaling,
    setGridlines,
    setHeadings,
    setCenterOnPage,
  } = usePageLayoutStore();

  const settings = getSettings(sheetId);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [customMargins, setCustomMargins] = useState<PageMargins>(settings.margins);
  const [customWidth, setCustomWidth] = useState(8.5);
  const [customHeight, setCustomHeight] = useState(11);
  const [printAreaInput, setPrintAreaInput] = useState('');
  const [repeatRowsInput, setRepeatRowsInput] = useState('');
  const [repeatColsInput, setRepeatColsInput] = useState('');
  const [scalingPercent, setScalingPercent] = useState(100);

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleMarginPreset = (presetName: string) => {
    applyMarginPreset(presetName, sheetId);
    setActivePanel(null);
  };

  const handleCustomMargins = () => {
    setMargins(customMargins, sheetId);
    setActivePanel(null);
  };

  const handleOrientationChange = (orientation: PageOrientation) => {
    setOrientation(orientation, sheetId);
  };

  const handlePageSize = (size: PageSize) => {
    setPageSize(size, sheetId);
    setActivePanel(null);
  };

  const handleCustomSize = () => {
    setCustomSize(customWidth, customHeight, sheetId);
    setActivePanel(null);
  };

  const handleSetPrintArea = () => {
    if (printAreaInput.trim()) {
      setPrintArea(printAreaInput.trim(), sheetId);
      setPrintAreaInput('');
    }
  };

  const handleSetPrintTitles = () => {
    setPrintTitles(
      {
        repeatRows: repeatRowsInput || undefined,
        repeatCols: repeatColsInput || undefined,
      },
      sheetId
    );
    setRepeatRowsInput('');
    setRepeatColsInput('');
    setActivePanel(null);
  };

  const handleScaling = (type: 'none' | 'fitToPage' | 'percentage', value: number) => {
    setScaling(type, value, sheetId);
  };

  return (
    <div className="page-layout-tab">
      {/* Margins Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('margins')}
        >
          <div className="button-content">
            <FileText size={20} />
            <span className="button-label">Margins</span>
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'margins' && (
          <div className="dropdown-panel margins-panel">
            <div className="panel-header">Margin Presets</div>
            <div className="preset-list">
              {MARGIN_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="preset-item"
                  onClick={() => handleMarginPreset(preset.name)}
                >
                  <div className="preset-preview">
                    <div
                      className="margin-preview"
                      style={{
                        padding: `${preset.margins.top * 8}px ${preset.margins.right * 8}px ${preset.margins.bottom * 8}px ${preset.margins.left * 8}px`,
                      }}
                    >
                      <div className="content-area" />
                    </div>
                  </div>
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-values">
                    T:{preset.margins.top}" B:{preset.margins.bottom}"
                  </span>
                </button>
              ))}
            </div>

            <div className="panel-divider" />
            <div className="panel-header">Custom Margins (inches)</div>
            <div className="custom-margins-grid">
              <div className="margin-input-group">
                <label>Top</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={customMargins.top}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, top: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="margin-input-group">
                <label>Bottom</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={customMargins.bottom}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, bottom: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="margin-input-group">
                <label>Left</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={customMargins.left}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, left: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="margin-input-group">
                <label>Right</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={customMargins.right}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, right: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="margin-input-group">
                <label>Header</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={customMargins.header}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, header: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="margin-input-group">
                <label>Footer</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={customMargins.footer}
                  onChange={(e) =>
                    setCustomMargins({ ...customMargins, footer: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <button className="apply-button" onClick={handleCustomMargins}>
              Apply Custom Margins
            </button>
          </div>
        )}
      </div>

      {/* Orientation Section */}
      <div className="layout-section">
        <div className="orientation-group">
          <button
            className={`orientation-button ${settings.orientation === 'portrait' ? 'active' : ''}`}
            onClick={() => handleOrientationChange('portrait')}
            title="Portrait"
          >
            <RotateCcw size={18} />
            <span>Portrait</span>
          </button>
          <button
            className={`orientation-button ${settings.orientation === 'landscape' ? 'active' : ''}`}
            onClick={() => handleOrientationChange('landscape')}
            title="Landscape"
          >
            <RotateCw size={18} />
            <span>Landscape</span>
          </button>
        </div>
      </div>

      {/* Page Size Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('size')}
        >
          <div className="button-content">
            <Maximize size={20} />
            <span className="button-label">Size</span>
            <span className="current-value">{settings.size.name}</span>
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'size' && (
          <div className="dropdown-panel size-panel">
            <div className="panel-header">Paper Size</div>
            <div className="size-list">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size.name}
                  className={`size-item ${settings.size.name === size.name ? 'active' : ''}`}
                  onClick={() => handlePageSize(size)}
                >
                  <span className="size-label">{size.label}</span>
                  {settings.size.name === size.name && <Check size={14} />}
                </button>
              ))}
            </div>
            <div className="panel-divider" />
            <div className="panel-header">Custom Size (inches)</div>
            <div className="custom-size-inputs">
              <div className="size-input-group">
                <label>Width</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 8.5)}
                />
              </div>
              <span className="size-separator">×</span>
              <div className="size-input-group">
                <label>Height</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 11)}
                />
              </div>
            </div>
            <button className="apply-button" onClick={handleCustomSize}>
              Apply Custom Size
            </button>
          </div>
        )}
      </div>

      {/* Print Area Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('printArea')}
        >
          <div className="button-content">
            <Printer size={20} />
            <span className="button-label">Print Area</span>
            {settings.printArea && (
              <span className="current-value">{settings.printArea.range}</span>
            )}
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'printArea' && (
          <div className="dropdown-panel print-area-panel">
            <div className="panel-header">Print Area</div>
            {settings.printArea ? (
              <div className="current-print-area">
                <span>Current: {settings.printArea.range}</span>
                <button
                  className="clear-button"
                  onClick={() => clearPrintArea(sheetId)}
                >
                  <X size={14} />
                  Clear
                </button>
              </div>
            ) : (
              <p className="no-print-area">No print area set</p>
            )}
            <div className="print-area-input-group">
              <input
                type="text"
                placeholder="Enter range (e.g., A1:H50)"
                value={printAreaInput}
                onChange={(e) => setPrintAreaInput(e.target.value)}
              />
              <button className="set-button" onClick={handleSetPrintArea}>
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Titles Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('printTitles')}
        >
          <div className="button-content">
            <Rows size={20} />
            <span className="button-label">Print Titles</span>
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'printTitles' && (
          <div className="dropdown-panel print-titles-panel">
            <div className="panel-header">Repeat Rows & Columns</div>
            {settings.printTitles && (
              <div className="current-print-titles">
                {settings.printTitles.repeatRows && (
                  <span>Rows: {settings.printTitles.repeatRows}</span>
                )}
                {settings.printTitles.repeatCols && (
                  <span>Cols: {settings.printTitles.repeatCols}</span>
                )}
                <button
                  className="clear-button"
                  onClick={() => clearPrintTitles(sheetId)}
                >
                  <X size={14} />
                  Clear
                </button>
              </div>
            )}
            <div className="print-titles-inputs">
              <div className="title-input-group">
                <label>Repeat Rows (e.g., 1:2)</label>
                <input
                  type="text"
                  placeholder="1:2"
                  value={repeatRowsInput}
                  onChange={(e) => setRepeatRowsInput(e.target.value)}
                />
              </div>
              <div className="title-input-group">
                <label>Repeat Columns (e.g., A:B)</label>
                <input
                  type="text"
                  placeholder="A:B"
                  value={repeatColsInput}
                  onChange={(e) => setRepeatColsInput(e.target.value)}
                />
              </div>
            </div>
            <button className="apply-button" onClick={handleSetPrintTitles}>
              Apply Print Titles
            </button>
          </div>
        )}
      </div>

      {/* Page Breaks Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('breaks')}
        >
          <div className="button-content">
            <Columns size={20} />
            <span className="button-label">Breaks</span>
            {settings.pageBreaks.length > 0 && (
              <span className="badge">{settings.pageBreaks.length}</span>
            )}
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'breaks' && (
          <div className="dropdown-panel breaks-panel">
            <div className="panel-header">Page Breaks</div>
            <div className="break-buttons">
              <button
                className="break-action"
                onClick={() => insertPageBreak('row', 10, sheetId)}
              >
                Insert Row Break
              </button>
              <button
                className="break-action"
                onClick={() => insertPageBreak('column', 5, sheetId)}
              >
                Insert Column Break
              </button>
              <button
                className="break-action danger"
                onClick={() => removeAllPageBreaks(sheetId)}
                disabled={settings.pageBreaks.length === 0}
              >
                Remove All Breaks
              </button>
            </div>
            {settings.pageBreaks.length > 0 && (
              <div className="breaks-list">
                {settings.pageBreaks.map((brk, i) => (
                  <div key={i} className="break-item">
                    {brk.type === 'row' ? 'Row' : 'Column'} break at {brk.position}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('background')}
        >
          <div className="button-content">
            <Image size={20} />
            <span className="button-label">Background</span>
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'background' && (
          <div className="dropdown-panel background-panel">
            <div className="panel-header">Sheet Background</div>
            <div className="background-options">
              <button
                className={`bg-option ${settings.background.type === 'none' ? 'active' : ''}`}
                onClick={() => clearBackground(sheetId)}
              >
                None
              </button>
              <button
                className={`bg-option ${settings.background.type === 'color' ? 'active' : ''}`}
                onClick={() =>
                  setBackground({ type: 'color', color: '#f0f0f0' }, sheetId)
                }
              >
                Color
              </button>
            </div>
            {settings.background.type === 'color' && (
              <div className="color-picker">
                <input
                  type="color"
                  value={settings.background.color || '#f0f0f0'}
                  onChange={(e) =>
                    setBackground({ type: 'color', color: e.target.value }, sheetId)
                  }
                />
                <span>Background Color</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scaling Section */}
      <div className="layout-section">
        <button
          className="layout-button with-dropdown"
          onClick={() => togglePanel('scaling')}
        >
          <div className="button-content">
            <Grid size={20} />
            <span className="button-label">Scale</span>
            <span className="current-value">
              {settings.scaling.type === 'percentage'
                ? `${settings.scaling.value}%`
                : settings.scaling.type === 'fitToPage'
                ? 'Fit'
                : '100%'}
            </span>
          </div>
          <ChevronDown size={14} className="dropdown-arrow" />
        </button>

        {activePanel === 'scaling' && (
          <div className="dropdown-panel scaling-panel">
            <div className="panel-header">Print Scaling</div>
            <div className="scaling-options">
              <button
                className={`scale-option ${settings.scaling.type === 'none' ? 'active' : ''}`}
                onClick={() => handleScaling('none', 100)}
              >
                No Scaling (100%)
              </button>
              <button
                className={`scale-option ${settings.scaling.type === 'fitToPage' ? 'active' : ''}`}
                onClick={() => handleScaling('fitToPage', 1)}
              >
                Fit Sheet on One Page
              </button>
            </div>
            <div className="custom-scaling">
              <label>Custom Scaling (%)</label>
              <div className="scaling-input-row">
                <input
                  type="range"
                  min="10"
                  max="400"
                  value={scalingPercent}
                  onChange={(e) => setScalingPercent(parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="10"
                  max="400"
                  value={scalingPercent}
                  onChange={(e) => setScalingPercent(parseInt(e.target.value) || 100)}
                />
                <span>%</span>
              </div>
              <button
                className="apply-button"
                onClick={() => handleScaling('percentage', scalingPercent)}
              >
                Apply Scaling
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Options */}
      <div className="layout-section view-options">
        <div className="panel-header">Sheet Options</div>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={settings.gridlines}
            onChange={(e) => setGridlines(e.target.checked, sheetId)}
          />
          <span>Print Gridlines</span>
        </label>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={settings.headings}
            onChange={(e) => setHeadings(e.target.checked, sheetId)}
          />
          <span>Print Headings</span>
        </label>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={settings.centerOnPage.horizontally}
            onChange={(e) =>
              setCenterOnPage(e.target.checked, settings.centerOnPage.vertically, sheetId)
            }
          />
          <span>Center Horizontally</span>
        </label>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={settings.centerOnPage.vertically}
            onChange={(e) =>
              setCenterOnPage(settings.centerOnPage.horizontally, e.target.checked, sheetId)
            }
          />
          <span>Center Vertically</span>
        </label>
      </div>
    </div>
  );
};

export default PageLayoutTab;

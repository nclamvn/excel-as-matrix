// ============================================================
// PAGE SETUP DIALOG
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import {
  PAPER_SIZES,
  MARGIN_PRESETS,
  PageMargins,
  HEADER_FOOTER_CODES,
  PaperSize,
} from '../../types/print';
import './Print.css';

interface PageSetupDialogProps {
  sheetId: string;
  onClose: () => void;
}

type TabType = 'page' | 'margins' | 'headerFooter';

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({
  sheetId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('page');
  const { getSettings, updateSettings, setMargins } = usePrintStore();
  const settings = getSettings(sheetId);

  const [localMargins, setLocalMargins] = useState<PageMargins>(settings.margins);
  const [marginPreset, setMarginPreset] = useState('normal');

  const handleMarginPresetChange = (preset: string) => {
    setMarginPreset(preset);
    if (preset !== 'custom') {
      const presetMargins = MARGIN_PRESETS[preset];
      setLocalMargins(presetMargins);
      setMargins(sheetId, presetMargins);
    }
  };

  const handleMarginChange = (key: keyof PageMargins, value: number) => {
    const newMargins = { ...localMargins, [key]: value };
    setLocalMargins(newMargins);
    setMarginPreset('custom');
    setMargins(sheetId, newMargins);
  };

  const handleHeaderChange = (position: 'left' | 'center' | 'right', value: string) => {
    updateSettings(sheetId, {
      header: { ...settings.header, [position]: value },
    });
  };

  const handleFooterChange = (position: 'left' | 'center' | 'right', value: string) => {
    updateSettings(sheetId, {
      footer: { ...settings.footer, [position]: value },
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog page-setup-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Page Setup</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="page-setup-tabs">
          <button
            className={activeTab === 'page' ? 'active' : ''}
            onClick={() => setActiveTab('page')}
          >
            Page
          </button>
          <button
            className={activeTab === 'margins' ? 'active' : ''}
            onClick={() => setActiveTab('margins')}
          >
            Margins
          </button>
          <button
            className={activeTab === 'headerFooter' ? 'active' : ''}
            onClick={() => setActiveTab('headerFooter')}
          >
            Header/Footer
          </button>
        </div>

        <div className="dialog-content">
          {/* Page Tab */}
          {activeTab === 'page' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Orientation</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={settings.orientation === 'portrait'}
                      onChange={() => updateSettings(sheetId, { orientation: 'portrait' })}
                    />
                    Portrait
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={settings.orientation === 'landscape'}
                      onChange={() => updateSettings(sheetId, { orientation: 'landscape' })}
                    />
                    Landscape
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Paper Size</label>
                <select
                  value={settings.paperSize}
                  onChange={(e) => updateSettings(sheetId, { paperSize: e.target.value as PaperSize })}
                >
                  {Object.entries(PAPER_SIZES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Scaling</label>
                <div className="scaling-options">
                  <label>
                    <input
                      type="radio"
                      checked={settings.scalingMode === 'actual' || settings.scalingMode === 'custom'}
                      onChange={() => updateSettings(sheetId, { scalingMode: 'actual' })}
                    />
                    Adjust to:
                    <input
                      type="number"
                      min="10"
                      max="400"
                      value={settings.customScale}
                      onChange={(e) => updateSettings(sheetId, { scalingMode: 'custom', customScale: parseInt(e.target.value) })}
                      className="scale-number-input"
                    />
                    % normal size
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={settings.scalingMode === 'fitToPage'}
                      onChange={() => updateSettings(sheetId, { scalingMode: 'fitToPage' })}
                    />
                    Fit to page
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Print Options</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.printGridlines}
                      onChange={(e) => updateSettings(sheetId, { printGridlines: e.target.checked })}
                    />
                    Gridlines
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.printRowColHeaders}
                      onChange={(e) => updateSettings(sheetId, { printRowColHeaders: e.target.checked })}
                    />
                    Row and column headings
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.blackAndWhite}
                      onChange={(e) => updateSettings(sheetId, { blackAndWhite: e.target.checked })}
                    />
                    Black and white
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Margins Tab */}
          {activeTab === 'margins' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Preset</label>
                <select
                  value={marginPreset}
                  onChange={(e) => handleMarginPresetChange(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                  <option value="narrow">Narrow</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="margins-grid">
                <div className="margin-input">
                  <label>Top</label>
                  <input
                    type="number"
                    value={localMargins.top}
                    onChange={(e) => handleMarginChange('top', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Bottom</label>
                  <input
                    type="number"
                    value={localMargins.bottom}
                    onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Left</label>
                  <input
                    type="number"
                    value={localMargins.left}
                    onChange={(e) => handleMarginChange('left', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Right</label>
                  <input
                    type="number"
                    value={localMargins.right}
                    onChange={(e) => handleMarginChange('right', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Header</label>
                  <input
                    type="number"
                    value={localMargins.header}
                    onChange={(e) => handleMarginChange('header', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Footer</label>
                  <input
                    type="number"
                    value={localMargins.footer}
                    onChange={(e) => handleMarginChange('footer', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="center-options">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.centerHorizontally}
                    onChange={(e) => updateSettings(sheetId, { centerHorizontally: e.target.checked })}
                  />
                  Center on page horizontally
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.centerVertically}
                    onChange={(e) => updateSettings(sheetId, { centerVertically: e.target.checked })}
                  />
                  Center on page vertically
                </label>
              </div>
            </div>
          )}

          {/* Header/Footer Tab */}
          {activeTab === 'headerFooter' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Header</label>
                <div className="header-footer-inputs">
                  <input
                    type="text"
                    placeholder="Left section"
                    value={settings.header.left}
                    onChange={(e) => handleHeaderChange('left', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Center section"
                    value={settings.header.center}
                    onChange={(e) => handleHeaderChange('center', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Right section"
                    value={settings.header.right}
                    onChange={(e) => handleHeaderChange('right', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Footer</label>
                <div className="header-footer-inputs">
                  <input
                    type="text"
                    placeholder="Left section"
                    value={settings.footer.left}
                    onChange={(e) => handleFooterChange('left', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Center section"
                    value={settings.footer.center}
                    onChange={(e) => handleFooterChange('center', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Right section"
                    value={settings.footer.right}
                    onChange={(e) => handleFooterChange('right', e.target.value)}
                  />
                </div>
              </div>

              <div className="insert-codes">
                <label>Insert codes:</label>
                <div className="code-buttons">
                  {Object.entries(HEADER_FOOTER_CODES).map(([code, label]) => (
                    <button
                      key={code}
                      className="code-btn"
                      title={`Insert ${label}`}
                      onClick={() => {
                        // Copy code to clipboard
                        navigator.clipboard.writeText(code);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageSetupDialog;

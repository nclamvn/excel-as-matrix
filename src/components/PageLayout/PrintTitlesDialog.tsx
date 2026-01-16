// ============================================================
// PRINT TITLES DIALOG
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Grid3X3 } from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import './PageLayout.css';

interface PrintTitlesDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintTitlesDialog: React.FC<PrintTitlesDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
}) => {
  const { getSettings, setPrintTitles } = usePrintStore();
  const settings = getSettings(sheetId);

  const [repeatRows, setRepeatRows] = useState(settings.printTitles?.repeatRows || '');
  const [repeatCols, setRepeatCols] = useState(settings.printTitles?.repeatCols || '');

  useEffect(() => {
    if (isOpen) {
      setRepeatRows(settings.printTitles?.repeatRows || '');
      setRepeatCols(settings.printTitles?.repeatCols || '');
    }
  }, [isOpen, settings.printTitles]);

  const handleApply = () => {
    setPrintTitles(sheetId, {
      repeatRows: repeatRows || undefined,
      repeatCols: repeatCols || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="print-titles-overlay" onClick={onClose}>
      <div className="print-titles-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Print Titles</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <p className="dialog-description">
            Specify rows and columns to repeat on each printed page.
          </p>

          <div className="print-titles-form">
            <div className="form-group">
              <label>
                <Grid3X3 size={16} />
                Rows to repeat at top:
              </label>
              <div className="input-with-hint">
                <input
                  type="text"
                  value={repeatRows}
                  onChange={e => setRepeatRows(e.target.value)}
                  placeholder="e.g., $1:$2"
                />
                <span className="hint">Example: $1:$3 (rows 1-3)</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                <Grid3X3 size={16} />
                Columns to repeat at left:
              </label>
              <div className="input-with-hint">
                <input
                  type="text"
                  value={repeatCols}
                  onChange={e => setRepeatCols(e.target.value)}
                  placeholder="e.g., $A:$B"
                />
                <span className="hint">Example: $A:$B (columns A-B)</span>
              </div>
            </div>
          </div>

          <div className="preview-section">
            <h3>Preview</h3>
            <div className="titles-preview">
              <div className="preview-page">
                {repeatRows && (
                  <div className="repeat-rows-indicator">
                    Rows: {repeatRows}
                  </div>
                )}
                {repeatCols && (
                  <div className="repeat-cols-indicator">
                    Cols: {repeatCols}
                  </div>
                )}
                <div className="page-content">
                  Page Content
                </div>
              </div>
            </div>
          </div>
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

export default PrintTitlesDialog;

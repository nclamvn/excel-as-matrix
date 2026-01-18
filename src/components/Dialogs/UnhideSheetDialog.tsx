import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface UnhideSheetDialogProps {
  onClose: () => void;
}

export const UnhideSheetDialog: React.FC<UnhideSheetDialogProps> = ({ onClose }) => {
  const { sheets, unhideSheet } = useWorkbookStore();
  const { showToast } = useUIStore();

  const hiddenSheets = Object.values(sheets).filter((s) => s.hidden);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(
    hiddenSheets.length > 0 ? hiddenSheets[0].id : null
  );

  const handleUnhide = () => {
    if (selectedSheetId) {
      unhideSheet(selectedSheetId);
      showToast('Sheet unhidden', 'success');
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog unhide-sheet-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Unhide Sheet</h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          {hiddenSheets.length === 0 ? (
            <p className="no-hidden-sheets">No hidden sheets available.</p>
          ) : (
            <>
              <label className="field-label">Select a hidden sheet to unhide:</label>
              <div className="hidden-sheets-list">
                {hiddenSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className={`hidden-sheet-item ${selectedSheetId === sheet.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSheetId(sheet.id)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{sheet.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUnhide}
            disabled={!selectedSheetId}
          >
            Unhide
          </button>
        </div>
      </div>
    </div>
  );
};

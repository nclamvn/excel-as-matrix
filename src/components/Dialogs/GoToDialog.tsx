import React, { useState } from 'react';
import { X, Navigation } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';

interface GoToDialogProps {
  onClose: () => void;
}

export const GoToDialog: React.FC<GoToDialogProps> = ({ onClose }) => {
  const [reference, setReference] = useState('');
  const [recentRefs, setRecentRefs] = useState<string[]>([]);
  const { setSelectedCell } = useSelectionStore();
  const { showToast } = useUIStore();

  // Parse cell reference like "A1", "B10", "AA100"
  const parseReference = (ref: string): { row: number; col: number } | null => {
    const match = ref.toUpperCase().trim().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const colStr = match[1];
    const rowNum = parseInt(match[2], 10);

    // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, ...)
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1; // 0-indexed

    const row = rowNum - 1; // 0-indexed

    if (row < 0 || col < 0 || row > 999999 || col > 16383) {
      return null;
    }

    return { row, col };
  };

  const handleGo = () => {
    const parsed = parseReference(reference);
    if (parsed) {
      setSelectedCell(parsed);

      // Add to recent references
      const upperRef = reference.toUpperCase().trim();
      if (!recentRefs.includes(upperRef)) {
        setRecentRefs([upperRef, ...recentRefs.slice(0, 4)]);
      }

      showToast(`Navigated to ${upperRef}`, 'success');
      onClose();
    } else {
      showToast('Invalid cell reference', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGo();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog goto-dialog" onClick={e => e.stopPropagation()} style={{ width: 320 }}>
        <div className="dialog-header">
          <h2>Go To</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-field">
            <label>Reference:</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="e.g., A1, B10, AA100"
              className="dialog-input"
              autoFocus
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {recentRefs.length > 0 && (
            <div className="dialog-field">
              <label>Recent:</label>
              <div className="goto-recent">
                {recentRefs.map((ref, i) => (
                  <button
                    key={i}
                    className="goto-recent-btn"
                    onClick={() => {
                      setReference(ref);
                    }}
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="dialog-info" style={{ marginTop: '12px' }}>
            Tip: Press Ctrl+G or F5 to open this dialog quickly.
          </p>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleGo}>
            <Navigation size={14} style={{ marginRight: 6 }} />
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

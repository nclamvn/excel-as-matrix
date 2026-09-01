/**
 * Protected Range Dialog — create and manage protected cell ranges.
 */
import { useState } from 'react';
import { useProtectionStore } from '@/stores/protectionStore';
import { ProtectedRange } from '@/types/protection';

interface ProtectedRangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string;
  userId: string;
  userName: string;
  selection?: { startRow: number; endRow: number; startCol: number; endCol: number } | null;
}

export function ProtectedRangeDialog({
  isOpen,
  onClose,
  sheetId,
  userId,
  userName,
  selection,
}: ProtectedRangeDialogProps) {
  const [name, setName] = useState('');
  const [warningOnly, setWarningOnly] = useState(false);

  const { addProtectedRange, removeProtectedRange, getProtectedRanges } = useProtectionStore();
  const ranges = getProtectedRanges(sheetId);

  const handleCreate = () => {
    if (!name.trim() || !selection) return;
    addProtectedRange({
      sheetId,
      name: name.trim(),
      startRow: selection.startRow,
      endRow: selection.endRow,
      startCol: selection.startCol,
      endCol: selection.endCol,
      ownerId: userId,
      ownerName: userName,
      editors: [],
      warningOnly,
    });
    setName('');
    setWarningOnly(false);
  };

  if (!isOpen) return null;

  return (
    <div className="pr-overlay" onClick={onClose}>
      <div className="pr-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pr-header">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2>Protected Ranges</h2>
          <button type="button" className="pr-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="pr-content">
          {/* Create new */}
          {selection && (
            <div className="pr-create">
              <h3>Protect selection: {formatRange(selection)}</h3>
              <input
                type="text"
                placeholder="Range name (e.g., Budget Data)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="pr-input"
              />
              <label className="pr-checkbox">
                <input
                  type="checkbox"
                  checked={warningOnly}
                  onChange={(e) => setWarningOnly(e.target.checked)}
                />
                Warning only (don't block edits)
              </label>
              <button
                type="button"
                className="pr-btn-create"
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Protect Range
              </button>
            </div>
          )}

          {!selection && (
            <div className="pr-hint">
              Select cells first, then open this dialog to protect them.
            </div>
          )}

          {/* Existing ranges */}
          <div className="pr-ranges">
            <h3>Protected ranges ({ranges.length})</h3>
            {ranges.length === 0 ? (
              <p className="pr-empty">No protected ranges in this sheet</p>
            ) : (
              <div className="pr-range-list">
                {ranges.map((range) => (
                  <RangeItem
                    key={range.id}
                    range={range}
                    isOwner={range.ownerId === userId}
                    onDelete={() => removeProtectedRange(range.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RangeItem({
  range,
  isOwner,
  onDelete,
}: {
  range: ProtectedRange;
  isOwner: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="pr-range-item">
      <div className="pr-range-info">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="pr-range-name">{range.name}</span>
        <span className="pr-range-ref">{formatRange(range)}</span>
        {range.warningOnly && <span className="pr-badge-warn">Warning only</span>}
      </div>
      <div className="pr-range-meta">
        <span>by {range.ownerName}</span>
        {range.editors.length > 0 && <span>+{range.editors.length} editors</span>}
        {isOwner && (
          <button
            type="button"
            className="pr-btn-delete"
            onClick={onDelete}
            title="Remove protection"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}

function formatRange(r: {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}): string {
  return `${colLetter(r.startCol)}${r.startRow + 1}:${colLetter(r.endCol)}${r.endRow + 1}`;
}

function colLetter(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// CRASH RECOVERY BANNER — Shown when uncommitted data from a crash is found
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { crashRecovery, type RecoveryData, type JournalEntry } from '../../recovery/CrashRecoveryJournal';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import type { CellValue } from '../../types/cell';

export const CrashRecoveryBanner: React.FC = () => {
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showToast = useUIStore((s) => s.showToast);
  const setCellValue = useWorkbookStore((s) => s.setCellValue);

  // Check for recovery data on mount
  useEffect(() => {
    crashRecovery.checkForRecovery().then((data) => {
      if (data) setRecoveryData(data);
    });
  }, []);

  const handleRecover = useCallback(async () => {
    if (!recoveryData) return;
    setIsRecovering(true);

    try {
      const applied = await crashRecovery.applyRecovery(recoveryData, (entry: JournalEntry) => {
        setCellValue(entry.sheetId, entry.row, entry.col, entry.newValue as CellValue);
      });

      showToast(`Recovered ${applied} unsaved changes`, 'info');
      setRecoveryData(null);
    } catch {
      showToast('Recovery failed — data may be corrupted', 'error');
    } finally {
      setIsRecovering(false);
    }
  }, [recoveryData, setCellValue, showToast]);

  const handleDiscard = useCallback(async () => {
    if (!recoveryData) return;
    await crashRecovery.dismissRecovery(recoveryData);
    showToast('Discarded unsaved changes', 'info');
    setRecoveryData(null);
  }, [recoveryData, showToast]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!recoveryData || dismissed) return null;

  const ageMinutes = Math.round(recoveryData.sessionAge / 60000);
  const entryCount = recoveryData.uncommittedEntries.length;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200 shadow-sm"
      role="alert"
      data-testid="crash-recovery-banner"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-900">
            Unsaved changes detected
          </p>
          <p className="text-xs text-amber-700">
            {entryCount} changes from {ageMinutes < 60 ? `${ageMinutes} min` : `${Math.round(ageMinutes / 60)}h`} ago were not saved.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button"
          onClick={handleRecover}
          disabled={isRecovering}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50 transition-colors"
          data-testid="recovery-restore-btn"
        >
          <RotateCcw size={14} className={isRecovering ? 'animate-spin' : ''} />
          {isRecovering ? 'Recovering...' : 'Restore'}
        </button>

        <button type="button"
          onClick={handleDiscard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
          data-testid="recovery-discard-btn"
        >
          <Trash2 size={14} />
          Discard
        </button>

        <button type="button"
          onClick={handleDismiss}
          className="p-1 text-amber-500 hover:text-amber-700 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default CrashRecoveryBanner;

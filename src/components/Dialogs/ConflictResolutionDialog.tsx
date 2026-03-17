// ═══════════════════════════════════════════════════════════════════════════
// CONFLICT RESOLUTION DIALOG
// Shows when local and server edits conflict on the same cell
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { AlertTriangle, Monitor, Cloud, CheckCircle } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { loggers } from '@/utils/logger';

interface ConflictItem {
  cellId: string;
  localValue: string | number | boolean | null;
  serverValue: string | number | boolean | null;
  localTimestamp: number;
  serverTimestamp: number;
}

export const ConflictResolutionDialog: React.FC = () => {
  const { activeConflicts, conflictDialogOpen, removeConflict } = useSyncStore();

  const handleResolve = useCallback(
    (conflict: ConflictItem, choice: 'local' | 'server') => {
      // Remove from conflict list — the chosen value will be applied
      // In the future, this would call SyncManager to apply the resolution
      removeConflict(conflict.cellId);

      // If choosing server value, we'd update the local cell
      // If choosing local value, we'd push to server
      // For now, just resolving the UI state
      loggers.ui.debug(`Resolved ${conflict.cellId}: chose ${choice}`);
    },
    [removeConflict]
  );

  const handleResolveAll = useCallback(
    (choice: 'local' | 'server') => {
      for (const conflict of activeConflicts) {
        handleResolve(conflict as ConflictItem, choice);
      }
    },
    [activeConflicts, handleResolve]
  );

  if (!conflictDialogOpen || activeConflicts.length === 0) return null;

  const conflicts = activeConflicts as ConflictItem[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[520px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <AlertTriangle size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Sync Conflicts ({conflicts.length})
          </h2>
        </div>

        {/* Description */}
        <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
          These cells were edited both locally and on the server. Choose which version to keep.
        </div>

        {/* Conflict list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {conflicts.map((conflict) => (
            <div
              key={conflict.cellId}
              className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-3"
            >
              <div className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Cell: {conflict.cellId}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Local version */}
                <button
                  onClick={() => handleResolve(conflict, 'local')}
                  className="flex items-start gap-2 p-2 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
                >
                  <Monitor size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-blue-700 dark:text-blue-300">Local</div>
                    <div className="text-neutral-600 dark:text-neutral-400 break-all">
                      {String(conflict.localValue ?? '(empty)')}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(conflict.localTimestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </button>

                {/* Server version */}
                <button
                  onClick={() => handleResolve(conflict, 'server')}
                  className="flex items-start gap-2 p-2 rounded border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-left"
                >
                  <Cloud size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-green-700 dark:text-green-300">Server</div>
                    <div className="text-neutral-600 dark:text-neutral-400 break-all">
                      {String(conflict.serverValue ?? '(empty)')}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(conflict.serverTimestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with bulk actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-2">
            <button
              onClick={() => handleResolveAll('local')}
              className="px-3 py-1.5 text-sm rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Keep All Local
            </button>
            <button
              onClick={() => handleResolveAll('server')}
              className="px-3 py-1.5 text-sm rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              Keep All Server
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <CheckCircle size={12} />
            Click a version to keep it
          </div>
        </div>
      </div>
    </div>
  );
};

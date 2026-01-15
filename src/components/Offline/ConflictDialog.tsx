// Phase 10: Conflict Dialog Component
// UI for resolving sync conflicts

import React, { useState } from 'react';
import { ConflictInfo, CellValue } from '../../offline/OfflineDB';
import { useSyncStore } from '../../stores/syncStore';

interface ConflictDialogProps {
  conflicts: ConflictInfo[];
  onResolve: (cellId: string, choice: 'local' | 'server') => void;
  onResolveAll: (choice: 'local' | 'server') => void;
  onClose: () => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  conflicts,
  onResolve,
  onResolveAll,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[selectedIndex];

  const formatValue = (value: CellValue): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-yellow-50">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sync Conflict</h2>
              <p className="text-sm text-gray-500">
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        {conflicts.length > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
            <button
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">
              Conflict {selectedIndex + 1} of {conflicts.length}
            </span>
            <button
              onClick={() => setSelectedIndex(Math.min(conflicts.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === conflicts.length - 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">Cell:</span>
            <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {currentConflict.cellId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Local Version */}
            <div
              onClick={() => onResolve(currentConflict.cellId, 'local')}
              className="border-2 border-transparent hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-all group bg-blue-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold text-blue-900">Your Version</span>
              </div>
              <div className="bg-white rounded-lg p-3 mb-2 border">
                <code className="text-lg break-all">{formatValue(currentConflict.localValue)}</code>
              </div>
              <p className="text-xs text-gray-500">
                Modified: {formatTime(currentConflict.localTimestamp)}
              </p>
              <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Use This Version
              </button>
            </div>

            {/* Server Version */}
            <div
              onClick={() => onResolve(currentConflict.cellId, 'server')}
              className="border-2 border-transparent hover:border-green-500 rounded-xl p-4 cursor-pointer transition-all group bg-green-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
                <span className="font-semibold text-green-900">Server Version</span>
              </div>
              <div className="bg-white rounded-lg p-3 mb-2 border">
                <code className="text-lg break-all">{formatValue(currentConflict.serverValue)}</code>
              </div>
              <p className="text-xs text-gray-500">
                Modified: {formatTime(currentConflict.serverTimestamp)}
              </p>
              <button className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Use This Version
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Click a version to keep it
          </div>
          {conflicts.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => onResolveAll('local')}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Keep All Local
              </button>
              <button
                onClick={() => onResolveAll('server')}
                className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                Keep All Server
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to use conflict dialog
export function useConflictDialog() {
  const conflicts = useSyncStore((state) => state.activeConflicts);
  const isOpen = useSyncStore((state) => state.conflictDialogOpen);
  const closeDialog = useSyncStore((state) => state.closeConflictDialog);

  return {
    conflicts,
    isOpen,
    closeDialog,
  };
}

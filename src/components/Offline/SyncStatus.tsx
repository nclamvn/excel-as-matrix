// Phase 10: Sync Status Component
// Displays sync progress and provides sync controls

import React from 'react';
import { useSyncStore } from '../../stores/syncStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface SyncStatusProps {
  workbookId: string;
  onSync: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ workbookId, onSync }) => {
  const { isOnline } = useNetworkStatus();
  const status = useSyncStore((state) => state.getSyncStatus(workbookId));

  const isSyncing = status?.isSyncing || false;
  const pendingChanges = status?.pendingChanges || 0;
  const lastSyncedAt = status?.lastSyncedAt;
  const lastError = status?.lastError;
  const progress = status?.progress || 0;
  const total = status?.total || 0;

  const formatTime = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Sync Button */}
      <button
        onClick={onSync}
        disabled={isSyncing || !isOnline}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isSyncing
            ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
            : isOnline
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <svg
          className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isSyncing ? 'Syncing...' : 'Sync'}
      </button>

      {/* Progress */}
      {isSyncing && total > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <span className="text-gray-500">
            {progress}/{total}
          </span>
        </div>
      )}

      {/* Pending Count */}
      {!isSyncing && pendingChanges > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{pendingChanges} pending</span>
        </div>
      )}

      {/* Last Synced */}
      {!isSyncing && (
        <span className="text-gray-400">
          Last synced: {formatTime(lastSyncedAt)}
        </span>
      )}

      {/* Error */}
      {lastError && (
        <div className="flex items-center gap-1 text-red-600" title={lastError}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Sync failed</span>
        </div>
      )}
    </div>
  );
};

// Compact sync button for toolbar
export const SyncButton: React.FC<{ workbookId: string; onSync: () => void }> = ({
  workbookId,
  onSync,
}) => {
  const { isOnline } = useNetworkStatus();
  const status = useSyncStore((state) => state.getSyncStatus(workbookId));
  const isSyncing = status?.isSyncing || false;
  const pendingChanges = status?.pendingChanges || 0;

  return (
    <button
      onClick={onSync}
      disabled={isSyncing || !isOnline}
      className={`
        relative p-2 rounded-lg transition-all
        ${isSyncing
          ? 'bg-blue-100 text-blue-700'
          : isOnline
            ? 'hover:bg-gray-100 text-gray-600'
            : 'text-gray-300 cursor-not-allowed'
        }
      `}
      title={isSyncing ? 'Syncing...' : isOnline ? 'Sync now' : 'Offline'}
    >
      <svg
        className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {pendingChanges > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
          {pendingChanges > 9 ? '9+' : pendingChanges}
        </span>
      )}
    </button>
  );
};

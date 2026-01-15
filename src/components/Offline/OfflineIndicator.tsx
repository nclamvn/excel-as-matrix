// Phase 10: Offline Indicator Component
// Displays network connection status

import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncStore } from '../../stores/syncStore';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, effectiveType } = useNetworkStatus();
  const pendingCount = useSyncStore((state) => state.globalPendingCount);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <span>Offline</span>
        </div>
      ) : effectiveType === 'slow-2g' || effectiveType === '2g' ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
          <span>Slow Connection</span>
        </div>
      ) : null}

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span>{pendingCount} pending</span>
        </div>
      )}
    </div>
  );
};

// Compact version for toolbar
export const OfflineIndicatorCompact: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const pendingCount = useSyncStore((state) => state.globalPendingCount);

  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? (pendingCount > 0 ? 'bg-blue-500' : 'bg-green-500') : 'bg-red-500'
        }`}
        title={isOnline ? (pendingCount > 0 ? `${pendingCount} changes pending` : 'Online') : 'Offline'}
      />
      {pendingCount > 0 && (
        <span className="text-xs text-gray-500">{pendingCount}</span>
      )}
    </div>
  );
};

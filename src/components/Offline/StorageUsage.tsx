// Phase 10: Storage Usage Component
// Displays local storage quota and usage

import React from 'react';
import { useStorageQuota } from '../../hooks/useOffline';

interface StorageUsageProps {
  showDetails?: boolean;
}

export const StorageUsage: React.FC<StorageUsageProps> = ({ showDetails = false }) => {
  const { usage, quota, usagePercent, loading } = useStorageQuota();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getColorClass = (): string => {
    if (usagePercent < 50) return 'bg-green-500';
    if (usagePercent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-gray-200 rounded-full w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Local Storage</span>
          <span className="text-gray-700 font-medium">
            {formatBytes(usage)} / {formatBytes(quota)}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColorClass()} transition-all duration-300`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {showDetails && usagePercent > 80 && (
        <p className="text-xs text-yellow-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Storage is running low. Consider syncing or clearing old data.
        </p>
      )}

      {!showDetails && (
        <span className="text-xs text-gray-400">{usagePercent.toFixed(0)}% used</span>
      )}
    </div>
  );
};

// Compact storage indicator
export const StorageIndicator: React.FC = () => {
  const { usagePercent, loading } = useStorageQuota();

  if (loading) return null;
  if (usagePercent < 70) return null;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${usagePercent > 90
          ? 'bg-red-100 text-red-700'
          : 'bg-yellow-100 text-yellow-700'
        }
      `}
      title={`Storage: ${usagePercent.toFixed(0)}% used`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
      {usagePercent.toFixed(0)}%
    </div>
  );
};

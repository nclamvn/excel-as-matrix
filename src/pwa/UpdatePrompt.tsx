// Phase 10: Update Prompt Component
// Notification for app updates

import React from 'react';
import { usePWA } from './usePWA';

export const UpdatePrompt: React.FC = () => {
  const { isUpdateAvailable, isUpdating, update, dismissUpdate } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
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
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Update Available</h3>
              <p className="text-sm text-gray-500 mt-1">
                A new version is ready. Refresh to update.
              </p>
            </div>
            <button
              onClick={dismissUpdate}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex border-t">
          <button
            onClick={dismissUpdate}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Later
          </button>
          <button
            onClick={update}
            disabled={isUpdating}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Updating...
              </span>
            ) : (
              'Refresh Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast-style update notification
export const UpdateToast: React.FC = () => {
  const { isUpdateAvailable, update } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-sm font-medium">New version available</span>
        <button
          onClick={update}
          className="px-3 py-1 bg-white text-green-600 text-sm font-medium rounded hover:bg-green-50 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
};

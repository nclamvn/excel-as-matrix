// Phase 10: Network Status Hook
// Monitors online/offline status with connection quality info

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
  wasOffline: boolean;
}

interface NetworkInformation extends EventTarget {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export function useNetworkStatus(): NetworkStatus {
  const getConnection = (): NetworkInformation | undefined => {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  };

  const getNetworkStatus = useCallback((): NetworkStatus => {
    const connection = getConnection();
    return {
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink ?? null,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? false,
      wasOffline: false,
    };
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        ...getNetworkStatus(),
        wasOffline: prev.wasOffline || !prev.isOnline,
      }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    const handleConnectionChange = () => {
      setStatus((prev) => ({
        ...getNetworkStatus(),
        wasOffline: prev.wasOffline,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [getNetworkStatus]);

  return status;
}

// Connection quality helper
export function getConnectionQuality(status: NetworkStatus): 'good' | 'moderate' | 'poor' | 'offline' {
  if (!status.isOnline) return 'offline';

  switch (status.effectiveType) {
    case '4g':
      return 'good';
    case '3g':
      return 'moderate';
    case '2g':
    case 'slow-2g':
      return 'poor';
    default:
      // Fallback to RTT if available
      if (status.rtt !== null) {
        if (status.rtt < 100) return 'good';
        if (status.rtt < 500) return 'moderate';
        return 'poor';
      }
      return 'moderate';
  }
}

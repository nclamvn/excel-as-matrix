// Phase 11: Session Timeout Warning Component
// Warns users about idle timeout and allows session extension

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

interface SessionTimeoutProps {
  idleTimeoutMinutes?: number;
  warningMinutes?: number;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutProps> = ({
  idleTimeoutMinutes = 30,
  warningMinutes = 5,
}) => {
  const { isAuthenticated, logout, refreshToken } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  // Track user activity
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const throttledReset = throttle(resetActivity, 1000);

    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [isAuthenticated, resetActivity]);

  // Check idle time
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkIdle = () => {
      const idleTime = Date.now() - lastActivity;
      const timeUntilTimeout = idleTimeoutMs - idleTime;

      if (timeUntilTimeout <= 0) {
        // Session expired
        logout();
        return;
      }

      if (timeUntilTimeout <= warningMs) {
        // Show warning
        setShowWarning(true);
        setRemainingSeconds(Math.ceil(timeUntilTimeout / 1000));
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkIdle, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, idleTimeoutMs, warningMs, logout]);

  // Update countdown
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, logout]);

  const handleExtendSession = async () => {
    await refreshToken();
    resetActivity();
  };

  const handleLogout = () => {
    logout();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Session Expiring</h2>
          </div>
          <button
            onClick={handleExtendSession}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Your session will expire due to inactivity. You will be logged out in:
          </p>

          {/* Countdown */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 font-mono">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-sm text-gray-500 mt-1">minutes remaining</div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-1000"
              style={{
                width: `${(remainingSeconds / (warningMinutes * 60)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
          <button
            onClick={handleExtendSession}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
};

// Throttle helper
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Session Activity Hook
export const useSessionActivity = () => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsIdle(false);
  }, []);

  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivity;
  }, [lastActivity]);

  return { lastActivity, isIdle, setIsIdle, updateActivity, getIdleTime };
};

export default SessionTimeoutWarning;

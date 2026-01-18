// ============================================================
// PROACTIVE AI NOTIFICATIONS — Smart Non-Intrusive Hints
// ============================================================
//
// Shows contextual AI notifications:
// - Data quality issues detected
// - Pattern recognition (Flash Fill opportunities)
// - Performance suggestions
// - Formula optimization hints
// - Repeated action automation suggestions
// ============================================================

import React, { useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  X,
  AlertCircle,
  TrendingUp,
  Zap,
  RefreshCw,
  Lightbulb,
  ChevronRight,
  Bell,
  BellOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { create } from 'zustand';

// Notification types
export type AINotificationType =
  | 'data_quality'
  | 'pattern_detected'
  | 'optimization'
  | 'automation'
  | 'insight'
  | 'warning';

// Notification priority
export type NotificationPriority = 'low' | 'medium' | 'high';

// Notification interface
export interface AINotification {
  id: string;
  type: AINotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action?: {
    label: string;
    prompt: string;
  };
  dismissible: boolean;
  autoHide?: number; // ms
  createdAt: number;
}

// Notification store
interface NotificationStore {
  notifications: AINotification[];
  muted: boolean;
  addNotification: (notification: Omit<AINotification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleMute: () => void;
}

export const useAINotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  muted: false,

  addNotification: (notification) => {
    if (get().muted) return;

    const newNotification: AINotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 5), // Max 5 notifications
    }));

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, notification.autoHide);
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  toggleMute: () => {
    set(state => ({ muted: !state.muted }));
  },
}));

// Icon mapping
const TYPE_ICONS: Record<AINotificationType, LucideIcon> = {
  data_quality: AlertCircle,
  pattern_detected: TrendingUp,
  optimization: Zap,
  automation: RefreshCw,
  insight: Lightbulb,
  warning: AlertCircle,
};

// Notification item component
const NotificationItem: React.FC<{
  notification: AINotification;
  onDismiss: () => void;
  onAction: () => void;
}> = ({ notification, onDismiss, onAction }) => {
  const Icon = TYPE_ICONS[notification.type];

  return (
    <div className={`ai-notification ${notification.type} ${notification.priority}`}>
      <div className="ai-notification-icon">
        <Icon size={16} />
      </div>
      <div className="ai-notification-content">
        <div className="ai-notification-title">{notification.title}</div>
        <div className="ai-notification-message">{notification.message}</div>
        {notification.action && (
          <button className="ai-notification-action" onClick={onAction}>
            {notification.action.label}
            <ChevronRight size={12} />
          </button>
        )}
      </div>
      {notification.dismissible && (
        <button className="ai-notification-dismiss" onClick={onDismiss}>
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// Main notifications container
export const ProactiveAINotifications: React.FC = () => {
  const { notifications, removeNotification, clearAll, muted, toggleMute } = useAINotificationStore();
  const { openPanel, setCurrentInput } = useAIStore();

  const handleAction = useCallback((notification: AINotification) => {
    if (notification.action?.prompt) {
      openPanel();
      setCurrentInput(notification.action.prompt);
    }
    removeNotification(notification.id);
  }, [openPanel, setCurrentInput, removeNotification]);

  if (notifications.length === 0 && !muted) return null;

  return (
    <div className="ai-notifications-container">
      {/* Header */}
      <div className="ai-notifications-header">
        <div className="ai-notifications-title">
          <Sparkles size={14} />
          <span>AI Insights</span>
          {notifications.length > 0 && (
            <span className="ai-notifications-count">{notifications.length}</span>
          )}
        </div>
        <div className="ai-notifications-actions">
          <button
            className={`ai-notifications-mute ${muted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={muted ? 'Unmute notifications' : 'Mute notifications'}
          >
            {muted ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
          {notifications.length > 0 && (
            <button className="ai-notifications-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Muted state */}
      {muted && (
        <div className="ai-notifications-muted">
          <BellOff size={16} />
          <span>AI notifications are muted</span>
        </div>
      )}

      {/* Notifications list */}
      {!muted && (
        <div className="ai-notifications-list">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={() => removeNotification(notification.id)}
              onAction={() => handleAction(notification)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Hook to trigger proactive notifications based on user actions
export function useProactiveAITriggers() {
  const { addNotification } = useAINotificationStore();
  const { sheets, activeSheetId } = useWorkbookStore();
  const lastActionRef = useRef<{ type: string; count: number; timestamp: number } | null>(null);

  // Track repeated actions for automation suggestions
  const trackAction = useCallback((actionType: string) => {
    const now = Date.now();
    const last = lastActionRef.current;

    if (last && last.type === actionType && now - last.timestamp < 5000) {
      last.count++;
      last.timestamp = now;

      // Suggest automation after 3 repeated actions
      if (last.count === 3) {
        addNotification({
          type: 'automation',
          priority: 'medium',
          title: 'Repeated Action Detected',
          message: `You've done this ${last.count} times. Want to automate it?`,
          action: {
            label: 'Automate with AI',
            prompt: `I've been repeating this action: ${actionType}. Help me automate it or create a more efficient workflow.`,
          },
          dismissible: true,
          autoHide: 10000,
        });
      }
    } else {
      lastActionRef.current = { type: actionType, count: 1, timestamp: now };
    }
  }, [addNotification]);

  // Check for data quality issues periodically
  useEffect(() => {
    if (!activeSheetId) return;

    const checkDataQuality = () => {
      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const cells = Object.values(sheet.cells);
      let errorCount = 0;

      cells.forEach(cell => {
        if (typeof cell.value === 'string' && cell.value.startsWith('#')) {
          errorCount++;
        }
      });

      if (errorCount > 5) {
        addNotification({
          type: 'data_quality',
          priority: 'high',
          title: 'Multiple Formula Errors',
          message: `Found ${errorCount} formula errors in this sheet`,
          action: {
            label: 'Fix with AI',
            prompt: `I have ${errorCount} formula errors in my spreadsheet. Help me identify and fix them.`,
          },
          dismissible: true,
        });
      }
    };

    // Check on sheet change
    const timer = setTimeout(checkDataQuality, 2000);
    return () => clearTimeout(timer);
  }, [activeSheetId, sheets, addNotification]);

  return { trackAction };
}

// Quick insight generator
export function generateInsight(data: {
  type: 'trend' | 'outlier' | 'pattern' | 'correlation';
  description: string;
  details?: string;
}): void {
  const { addNotification } = useAINotificationStore.getState();

  addNotification({
    type: 'insight',
    priority: 'low',
    title: data.type === 'trend' ? 'Trend Detected' :
           data.type === 'outlier' ? 'Outlier Found' :
           data.type === 'pattern' ? 'Pattern Recognized' :
           'Correlation Found',
    message: data.description,
    action: data.details ? {
      label: 'Learn more',
      prompt: `Tell me more about this insight: ${data.description}. ${data.details}`,
    } : undefined,
    dismissible: true,
    autoHide: 15000,
  });
}

export default ProactiveAINotifications;

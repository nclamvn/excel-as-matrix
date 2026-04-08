// ============================================================
// NOTIFICATION BELL — Shows mention notifications
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import '../Comments/Mention.css';

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

interface NotificationBellProps {
  userId: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const userNotifications = notifications.filter(
    (n) => n.mentionedUserId === userId
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        type="button"
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-dropdown__mark-read"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {userNotifications.length === 0 ? (
              <div className="notification-empty">No notifications yet</div>
            ) : (
              userNotifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.read ? '' : 'unread'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="notification-item__text">
                    <strong>{n.mentionedByName}</strong>{' '}
                    mentioned you:{' '}
                    <span className="notification-item__preview">
                      &ldquo;{n.preview.slice(0, 80)}
                      {n.preview.length > 80 ? '...' : ''}&rdquo;
                    </span>
                  </div>
                  <div className="notification-item__time">
                    {formatTimeAgo(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

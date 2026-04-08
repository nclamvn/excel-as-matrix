// ============================================================
// NOTIFICATION STORE — Mention notifications
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MentionNotification } from '../types/mention';

const generateId = () => Math.random().toString(36).substring(2, 10);

interface NotificationStore {
  notifications: MentionNotification[];
  unreadCount: number;

  addNotification: (notification: Omit<MentionNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getNotificationsForUser: (userId: string) => MentionNotification[];
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            { ...notification, id: generateId(), createdAt: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, 100), // keep max 100
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        const n = get().notifications.find((n) => n.id === id);
        if (!n || n.read) return;
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      getNotificationsForUser: (userId) =>
        get().notifications.filter((n) => n.mentionedUserId === userId),
    }),
    { name: 'excelai-notifications' }
  )
);

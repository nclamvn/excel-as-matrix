/**
 * Supabase Realtime hook for mention notifications.
 * Listens on a per-workbook channel for 'mention' broadcast events
 * and adds them to the local notification store.
 * Gracefully degrades when Supabase is not configured.
 */
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notificationStore';
import type { MentionNotification } from '@/types/mention';
import { loggers } from '@/utils/logger';

export function useRealtimeNotifications(workbookId: string, userId: string) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !workbookId || !userId) return;

    const channelName = `notifications:${workbookId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'mention' }, ({ payload }) => {
        const notification = payload as Omit<MentionNotification, 'id' | 'createdAt' | 'read'>;

        if (notification.mentionedUserId === userId) {
          addNotification(notification);
          loggers.websocket.info(
            `Received mention from ${notification.mentionedByName}`
          );
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          loggers.websocket.info(`Notification channel connected: ${channelName}`);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [workbookId, userId, addNotification]);
}

/**
 * Broadcast a mention notification to the workbook channel.
 * Other users subscribed via useRealtimeNotifications will receive it.
 * No-op when Supabase is not configured.
 */
export async function broadcastMentionNotification(
  workbookId: string,
  notification: Omit<MentionNotification, 'id' | 'createdAt' | 'read'>
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !workbookId) return;

  const channelName = `notifications:${workbookId}`;
  const channel = supabase.channel(channelName);

  await channel.send({
    type: 'broadcast',
    event: 'mention',
    payload: notification,
  });
}

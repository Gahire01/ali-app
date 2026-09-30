import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(userId: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    const perm = await Notifications.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted') {
      const ask = await Notifications.requestPermissionsAsync();
      status = ask.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat',
        importance: Notifications.AndroidImportance.HIGH,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await supabase
      .from('device_tokens')
      .upsert(
        { user_id: userId, expo_push_token: token, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,expo_push_token' },
      );

    return token;
  } catch {
    return null;
  }
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  if (userIds.length === 0) return;
  try {
    await supabase.functions.invoke('send-push', {
      body: { userIds, title, body, data },
    });
  } catch {
    // best-effort
  }
}

export function isMuted(): boolean {
  try {
    return localStorage?.getItem?.('ali_muted_notifications') === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    if (muted) localStorage?.setItem?.('ali_muted_notifications', '1');
    else localStorage?.removeItem?.('ali_muted_notifications');
  } catch {
    // ignore
  }
}

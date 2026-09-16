import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing = await Notifications.getExpoPushTokenAsync().catch(() => null);
  return existing?.data ?? null;
}

export async function ensurePushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Register (or refresh) the device's Expo push token for the signed-in user.
 * Upserts into device_tokens (RLS: users may only write their own row).
 */
export async function registerDeviceToken(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const granted = await ensurePushPermission();
  if (!granted) return false;

  const token = await getPushToken();
  if (!token) return false;

  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      { user_id: user.id, expo_push_token: token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,expo_push_token' }
    );

  if (error) {
    console.error('registerDeviceToken error', error);
    return false;
  }
  return true;
}

export async function unregisterDeviceToken(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const token = await getPushToken();
  if (!token) return;

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('expo_push_token', token);

  if (error) console.error('unregisterDeviceToken error', error);
}
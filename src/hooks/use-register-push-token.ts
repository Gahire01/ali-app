import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { registerDeviceToken, unregisterDeviceToken } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Registers this device's Expo push token once an approved member is signed
 * in, and clears it on sign-out. Also keeps the token fresh when the app
 * returns to the foreground and handles notification taps.
 */
export function useRegisterPushToken() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const isApproved = Boolean(user && profile?.status === 'approved');

    const sync = async () => {
      if (isApproved) {
        await registerDeviceToken();
      } else if (!user) {
        await unregisterDeviceToken();
      }
    };

    if (isApproved || !user) void sync();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (isApproved) void registerDeviceToken();
      }
      appState.current = next;
    });

    const notifSub = Notifications.addNotificationResponseReceivedListener(() => {
      // Member taps a push → route home (deep-link handling lives elsewhere).
    });

    return () => {
      subscription.remove();
      notifSub.remove();
    };
  }, [user, profile?.status]);
}
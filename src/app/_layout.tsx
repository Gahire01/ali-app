import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/sentry';

import { colors } from '@/constants/theme';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { useAuthStore } from '@/stores/auth-store';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const init = useAuthStore((state) => state.init);
  useProtectedRoute();
  useRegisterPushToken();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    init().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => unsubscribe?.();
  }, [init]);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
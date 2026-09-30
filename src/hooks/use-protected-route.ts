import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

/**
 * Simple routing guard. No approval gate, no pending screen.
 * Signed out → login. Signed in → the app.
 */
export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const initialized = useAuthStore(
    (s) => (s as unknown as { initialized?: boolean }).initialized,
  );
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, segments, navigationState?.key, initialized, router]);
}

import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

/**
 * Redirects based on auth state:
 *   no user                       → (auth)/login
 *   callback/reset deep links     → stay (public handlers)
 *   user, not approved            → (auth)/pending
 *   user, approved                → / (member area)
 */
export function useProtectedRoute() {
  const { initialized, user, profile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!initialized) return;
    if (!navState?.key) return;

    const segs = segments as readonly string[];
    const segment = segs[0] ?? '';
    const isDeepLinkHandler = segment === 'auth' && (segs[1] === 'callback' || segs[1] === 'reset');

    if (!user) {
      if (isDeepLinkHandler) return;
      if (segment !== '(auth)') {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Signed in.
    if (profile === null) return; // profile still loading

    if (profile.status !== 'approved') {
      if (segment !== '(auth)' || segs[1] !== 'pending') {
        router.replace('/(auth)/pending');
      }
      return;
    }

    // Approved member.
    if (segment === '(auth)' || segment === '') {
      router.replace('/');
    }
  }, [initialized, user, profile, segments, navState, router]);
}
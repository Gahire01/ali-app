import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/lib/supabase';

/**
 * Handles deep links to aliboxing://auth/callback.
 * Exchanges the OAuth code or stores the token-based session, then routes
 * the user by their approval status (root layout handles redirects).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const handleUrl = async (rawUrl: string) => {
      const url = Linking.parse(rawUrl);
      const params = url.queryParams ?? {};
      const code = typeof params.code === 'string' ? params.code : undefined;
      const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
      const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else {
          throw new Error('This sign-in link is invalid or expired. Try signing in again.');
        }

        if (!active) return;
        router.replace('/');
      } catch {
        if (active) router.replace('/(auth)/login');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => void handleUrl(url));
    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);

  return <Spinner fullscreen />;
}
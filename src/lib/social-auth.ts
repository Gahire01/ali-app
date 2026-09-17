import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { brand } from '@/constants/theme';
import { isPreviewMock } from '@/lib/env';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SocialAuthResult =
  | { ok: true; canceled: boolean }
  | { ok: false; error: Error };

/**
 * Sign in with Google via Supabase's hosted OAuth.
 *
 * Native: opens the browser with the Supabase authorize URL (built by
 * signInWithOAuth), deep-links back to aliboxing://auth/callback, and stores
 * the returned session via setSession. Works in Expo Go and dev builds.
 *
 * Web: lets Supabase drive the browser redirect (detectSessionInUrl handles
 * the callback automatically).
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    if (isPreviewMock) {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: {} });
      return { ok: true, canceled: false };
    }

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email profile',
        },
      });
      if (error) return { ok: false, error };
      return { ok: true, canceled: false };
    }

    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: brand.scheme,
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes: 'email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) return { ok: false, error };
    if (!data.url) return { ok: false, error: new Error('No OAuth URL returned.') };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: true, canceled: true };
    }
    if (result.type !== 'success') {
      return { ok: true, canceled: true };
    }

    const callbackUrl = result.url;
    const parsed = parseCallbackParams(callbackUrl);

    if (parsed.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.code);
      if (exchangeError) return { ok: false, error: exchangeError };
      return { ok: true, canceled: false };
    }

    if (parsed.access_token && parsed.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      });
      if (sessionError) return { ok: false, error: sessionError };
      return { ok: true, canceled: false };
    }

    return { ok: false, error: new Error('The Google sign-in response was incomplete.') };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error('Google sign-in failed.') };
  }
}

function parseCallbackParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const source = parsed.hash && parsed.hash.length > 1 ? parsed.hash.slice(1) : parsed.search;
    const params = new URLSearchParams(source);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  } catch {
    return {};
  }
}

type ForgotPasswordResult = { ok: true } | { ok: false; error: Error };

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  try {
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: brand.scheme,
      path: 'auth/reset',
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) return { ok: false, error };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error('Could not send reset email.') };
  }
}
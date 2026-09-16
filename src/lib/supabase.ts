import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import { isPreviewMock } from '@/lib/env';
import { previewUrl } from '@/lib/mock';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or set EXPO_PUBLIC_PREVIEW_MOCK=1 to preview the UI with sample data).'
  );
}

/**
 * Supabase storage adapter backed by expo-secure-store on native.
 * On web (where SecureStore is unavailable) it falls back to localStorage,
 * which is the platform-standard for browser session storage.
 */
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const value = await SecureStore.getItemAsync(key);
    return value ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

const authStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          return globalThis.localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          globalThis.localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          globalThis.localStorage.removeItem(key);
        },
      }
    : storageAdapter;

/* ------------------------------------------------------------------ */
/* Preview stub: lets the whole UI run against sample in-memory data.  */
/* ------------------------------------------------------------------ */

function makePreviewSession(): Session {
  const user: User = {
    id: 'me-admin',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'gahiredev01@gmail.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '+250788000001',
    app_metadata: {},
    user_metadata: { full_name: 'Ali Semwaga' },
    created_at: new Date().toISOString(),
  } as unknown as User;

  return {
    access_token: 'preview-mock-token',
    refresh_token: 'preview-mock-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

let previewSession: Session | null = makePreviewSession();
const previewListeners = new Set<(event: string, session: Session | null) => void>();

function createPreviewClient() {
  const emit = (event: string, session: Session | null) => {
    previewListeners.forEach((listener) => listener(event, session));
  };

  const auth = {
    getSession: async () => ({ data: { session: previewSession }, error: null }),
    getUser: async () => ({ data: { user: previewSession?.user ?? null }, error: null }),
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      previewListeners.add(callback);
      return {
        data: { subscription: { unsubscribe: () => previewListeners.delete(callback) } },
      };
    },
    signInWithPassword: async () => {
      previewSession = makePreviewSession();
      emit('SIGNED_IN', previewSession);
      return { data: { session: previewSession, user: previewSession.user }, error: null };
    },
    signInWithOAuth: async () => {
      previewSession = makePreviewSession();
      emit('SIGNED_IN', previewSession);
      return { data: { url: 'preview://oauth', provider: 'google' }, error: null };
    },
    signUp: async () => {
      const created = makePreviewSession();
      created.user.user_metadata = {
        full_name: 'Demo Member',
        phone: '+250 788 000 999',
        is_minor: false,
        guardian_name: null,
        guardian_phone: null,
      };
      return {
        data: { user: created.user, session: null },
        error: null,
      };
    },
    signOut: async () => {
      previewSession = null;
      emit('SIGNED_OUT', null);
      return { error: null };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async (attrs: { password?: string }) => ({
      data: { user: previewSession?.user ?? null },
      error: null,
    }),
    exchangeCodeForSession: async () => ({ data: { session: previewSession }, error: null }),
    setSession: async () => ({ data: { session: previewSession }, error: null }),
  };

  return {
    auth,
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: previewUrl(path) },
          error: null,
        }),
      }),
    },
  };
}

export const supabase: SupabaseClient<Database> = isPreviewMock
  ? (createPreviewClient() as unknown as SupabaseClient<Database>)
  : createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
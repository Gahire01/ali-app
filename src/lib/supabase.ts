import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isPreviewMock = process.env.EXPO_PUBLIC_PREVIEW_MOCK === '1';

if (!isPreviewMock && (!supabaseUrl || !supabaseAnonKey)) {
  // Fail loud in dev, but don't crash the app — screens fall back to a config notice.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set them in .env.local or set EXPO_PUBLIC_PREVIEW_MOCK=1.',
  );
}

// SecureStore isn't available on web — use undefined so Supabase falls back to localStorage.
const authStorage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

// Realtime needs a WebSocket. React Native ships one; Node (used by Expo web SSR) doesn't,
// so we provide the `ws` package there.
function getRealtimeTransport() {
  if (Platform.OS !== 'web') return undefined;
  if (typeof WebSocket !== 'undefined') return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    return ws as unknown as typeof WebSocket;
  } catch {
    return undefined;
  }
}

function createPreviewClient() {
  // Minimal stub so screens render without a real backend.
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Preview mode') }),
      signUp: async () => ({ data: null, error: new Error('Preview mode') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
    storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  } as unknown as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> = isPreviewMock
  ? (createPreviewClient() as unknown as SupabaseClient<Database>)
  : createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        transport: getRealtimeTransport(),
      },
    });

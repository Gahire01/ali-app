import { create } from 'zustand';
import { type Session, type User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
};

type AuthActions = {
  init: () => Promise<() => void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    set({ session, user: session?.user ?? null });

    if (session?.user) {
      await get().fetchProfile(session.user.id);
    }

    set({ loading: false, initialized: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const prevUser = get().user;
        const newUser = newSession?.user ?? null;

        set({ session: newSession, user: newUser });

        if (newUser && !prevUser) {
          await get().fetchProfile(newUser.id);
        } else if (newUser && prevUser && newUser.id !== prevUser.id) {
          await get().fetchProfile(newUser.id);
        } else if (!newUser) {
          set({ profile: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      set({ profile: data });
      return data;
    } catch (err) {
      console.error('fetchProfile error', err);
      return null;
    }
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return null;
    return get().fetchProfile(user.id);
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
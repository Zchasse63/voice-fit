import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../services/database/supabase.client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name,
  };
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,

        signIn: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) throw error;
            set({ user: mapSupabaseUser(data.user), isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign in failed';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        signUp: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) throw error;
            set({ user: mapSupabaseUser(data.user), isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        signOut: async () => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            set({ user: null, isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign out failed';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        checkSession: async () => {
          set({ isLoading: true });
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            set({ user: mapSupabaseUser(data.session?.user ?? null), isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Session check failed';
            set({ error: message, isLoading: false, user: null });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'AuthStore' }
  )
);


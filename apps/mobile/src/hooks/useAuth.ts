/**
 * useAuth Hook
 * 
 * Provides authentication state and token for API calls.
 * Wraps useAuthStore and adds token retrieval from Supabase.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '../services/database/supabase.client';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get current session token
    const getToken = async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token || null);
    };

    getToken();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
  };
}


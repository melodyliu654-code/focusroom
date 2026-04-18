import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!supabase) {
      setIsPro(false);
      return;
    }
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      setIsPro(false);
      return;
    }
    const res = await apiFetch('/api/me', token);
    if (!res.ok) {
      setIsPro(false);
      return;
    }
    const data = (await res.json()) as { isPro?: boolean };
    setIsPro(Boolean(data.isPro));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setIsPro(false);
      return;
    }
    void refreshProfile();
  }, [session?.access_token, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: new Error(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env.'
        ),
      };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: new Error(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env.'
        ),
      };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setIsPro(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isPro,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, loading, isPro, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

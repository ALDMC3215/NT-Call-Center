/**
 * useAuth — Supabase authentication context (v2)
 *
 * Responsibilities:
 *  • Restore Supabase session on app startup
 *  • Expose signIn(mode) / signUp / signOut
 *  • Fetch the public.profiles row and derive authStatus
 *  • Track loginMode so UX can show correct mismatch messages
 *  • Expose callRpc helpers for approve_agent / disable_agent
 *  • Map SupabaseProfile → Profile and call setProfile() so the rest of the
 *    app (useAppContext) continues to work without modification
 *
 * This is intentionally separate from useAppContext so the business-logic
 * layer (calls, blacklist, settings) remains untouched.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { SupabaseProfile } from '../types';
import type { User, Session } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginMode = 'agent' | 'manager';

export type AuthStatus =
  | 'loading'           // session check in progress
  | 'unauthenticated'   // no valid session
  | 'pending'           // account_status = pending (agent waiting approval)
  | 'disabled'          // account_status = disabled
  | 'active_agent'      // active agent → operational panel
  | 'active_admin';     // active admin  → manager panel

interface AuthContextType {
  authStatus: AuthStatus;
  /** The mode the user last attempted to sign in through */
  loginMode: LoginMode;
  setLoginMode: (mode: LoginMode) => void;
  supabaseUser: User | null;
  supabaseProfile: SupabaseProfile | null;
  /** null = ok, string = Persian error message */
  signIn: (email: string, password: string, mode: LoginMode) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signOut: () => Promise<void>;
  /** Approve a pending agent — calls the secure Supabase RPC */
  approveAgent: (targetId: string) => Promise<string | null>;
  /** Disable an active agent — calls the secure Supabase RPC */
  disableAgent: (targetId: string) => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper: map a SupabaseProfile to the existing local Profile shape
// (the local profile is used by the entire call-center business layer)
// ---------------------------------------------------------------------------
const buildLocalProfile = (sp: SupabaseProfile) => ({
  name: sp.full_name,
  date: new Date().toLocaleDateString('fa-IR'),
  shift: 'Morning' as const,
  branch: 'پردیس' as const,
  sessionId: sp.id,
  role: sp.role === 'admin' ? ('admin' as const) : ('expert' as const),
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
  /** Injected by main.tsx so this provider can call setProfile on the app context */
  onAuthenticated: (profile: ReturnType<typeof buildLocalProfile>) => void;
  onSignedOut: () => void;
}

export const AuthProvider = ({
  children,
  onAuthenticated,
  onSignedOut,
}: AuthProviderProps) => {
  const [authStatus, setAuthStatus]   = useState<AuthStatus>('loading');
  const [loginMode, setLoginMode]     = useState<LoginMode>('agent');
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<SupabaseProfile | null>(null);

  // Prevent double-fetch on StrictMode double-invoke
  const fetchingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Fetch profile from public.profiles and update auth status
  // ---------------------------------------------------------------------------
  const loadProfile = useCallback(
    async (user: User) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          // Profile row missing — trigger may not have fired yet; treat as pending
          setAuthStatus('pending');
          return;
        }

        const sp = data as SupabaseProfile;
        setSupabaseProfile(sp);

        if (sp.account_status === 'active') {
          onAuthenticated(buildLocalProfile(sp));
          setAuthStatus(sp.role === 'admin' ? 'active_admin' : 'active_agent');
        } else if (sp.account_status === 'disabled') {
          setAuthStatus('disabled');
        } else {
          setAuthStatus('pending');
        }
      } finally {
        fetchingRef.current = false;
      }
    },
    [onAuthenticated],
  );

  // ---------------------------------------------------------------------------
  // Restore session on mount + subscribe to auth state changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        loadProfile(session.user);
      } else {
        setAuthStatus('unauthenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          loadProfile(session.user);
        } else {
          setSupabaseUser(null);
          setSupabaseProfile(null);
          setAuthStatus('unauthenticated');
          onSignedOut();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [loadProfile, onSignedOut]);

  // ---------------------------------------------------------------------------
  // signIn — mode is passed so we can show role-mismatch messages
  // ---------------------------------------------------------------------------
  const signIn = useCallback(
    async (email: string, password: string, mode: LoginMode): Promise<string | null> => {
      setLoginMode(mode);
      setAuthStatus('loading');

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setAuthStatus('unauthenticated');
        if (error.message.includes('Invalid login credentials')) {
          return 'ایمیل یا رمز عبور اشتباه است.';
        }
        if (error.message.includes('Email not confirmed')) {
          return 'لطفاً ابتدا ایمیل خود را از طریق لینک ارسال‌شده تأیید کنید.';
        }
        return `خطا: ${error.message}`;
      }

      if (!data.user) {
        setAuthStatus('unauthenticated');
        return 'خطا در ورود. لطفاً دوباره تلاش کنید.';
      }

      // loadProfile is called by onAuthStateChange; role-mismatch is handled in App.tsx
      return null;
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // signUp — always creates agent + pending; no client-side role selection
  // ---------------------------------------------------------------------------
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
    ): Promise<{ error: string | null; needsVerification: boolean }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // resolves to current env (localhost / Vercel)
          data: { full_name: fullName },            // → raw_user_meta_data → trigger
        },
      });

      if (error) {
        if (
          error.message.includes('already registered') ||
          error.message.includes('already been registered') ||
          error.message.includes('User already registered')
        ) {
          return { error: 'این ایمیل قبلاً ثبت شده است.', needsVerification: false };
        }
        return { error: `خطا: ${error.message}`, needsVerification: false };
      }

      const needsVerification = !data.session;
      return { error: null, needsVerification };
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // signOut
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange listener handles state cleanup
  }, []);

  // ---------------------------------------------------------------------------
  // approveAgent — calls the secure SECURITY DEFINER RPC
  // ---------------------------------------------------------------------------
  const approveAgent = useCallback(async (targetId: string): Promise<string | null> => {
    const { error } = await supabase.rpc('approve_agent', { target_id: targetId });
    if (error) {
      if (error.message.includes('not an active admin')) return 'شما مجاز به انجام این عملیات نیستید.';
      if (error.message.includes('cannot approve your own')) return 'نمی‌توانید حساب خود را تأیید کنید.';
      if (error.message.includes('not found or already active')) return 'کارشناس مورد نظر یافت نشد یا قبلاً فعال شده.';
      return `خطا: ${error.message}`;
    }
    return null;
  }, []);

  // ---------------------------------------------------------------------------
  // disableAgent — calls the secure SECURITY DEFINER RPC
  // ---------------------------------------------------------------------------
  const disableAgent = useCallback(async (targetId: string): Promise<string | null> => {
    const { error } = await supabase.rpc('disable_agent', { target_id: targetId });
    if (error) {
      if (error.message.includes('not an active admin')) return 'شما مجاز به انجام این عملیات نیستید.';
      if (error.message.includes('cannot disable your own')) return 'نمی‌توانید حساب خود را غیرفعال کنید.';
      if (error.message.includes('not found or target is an admin')) return 'کارشناس مورد نظر یافت نشد.';
      return `خطا: ${error.message}`;
    }
    return null;
  }, []);

  const value: AuthContextType = {
    authStatus,
    loginMode,
    setLoginMode,
    supabaseUser,
    supabaseProfile,
    signIn,
    signUp,
    signOut,
    approveAgent,
    disableAgent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

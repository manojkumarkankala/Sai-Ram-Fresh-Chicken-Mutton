import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

interface AuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  signIn: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const ADMIN_LOGIN_EMAIL = 'sairamadmin@gmail.com';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      await checkAdmin(data.session?.user?.id ?? null);
      setLoading(false);
    })();

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        await checkAdmin(session?.user?.id ?? null);
      })();
    });
  }, []);

  const checkAdmin = async (userId: string | null) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    setIsAdmin(data?.role === 'admin');
  };

  const signIn = async (password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: ADMIN_LOGIN_EMAIL, password });
    if (error) {
      if (error.status === 400) return { error: 'Invalid email or password.' };
      return { error: 'Could not sign in. Check your connection and try again.' };
    }
    const userId = data.user?.id ?? null;
    if (!userId) return { error: 'Invalid email or password.' };
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      return { error: 'This account does not have admin access.' };
    }
    setIsAdmin(true);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? 'Could not update the password. Try again.' : null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? 'Could not send the reset email. Try again.' : null };
  };

  return (
    <AuthContext.Provider value={{ isAdmin, loading, signIn, signOut, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

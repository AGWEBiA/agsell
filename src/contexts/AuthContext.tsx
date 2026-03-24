import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// UUID v4 format validation
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const adminCheckRef = useRef<number>(0);

  const checkAdminRole = useCallback(async (userId: string, checkId: number) => {
    // Skip if user ID is not a valid UUID (e.g. Lovable preview token)
    if (!isValidUUID(userId)) {
      console.warn('[AuthContext] Skipping admin check - invalid UUID:', userId);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      // Only apply result if this is still the latest check
      if (checkId !== adminCheckRef.current) return;

      if (error) {
        // Fallback: query user_roles table directly
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (checkId === adminCheckRef.current) {
          setIsAdmin(!!roleData);
        }
        return;
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error('[AuthContext] Exception checking admin role:', err);
      if (checkId === adminCheckRef.current) {
        setIsAdmin(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const checkId = ++adminCheckRef.current;
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            if (isMounted) {
              checkAdminRole(currentSession.user.id, checkId);
            }
          }, 0);
        } else {
          adminCheckRef.current++;
          setIsAdmin(false);
        }
      }
    );

    // INITIAL load
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const checkId = ++adminCheckRef.current;
          await checkAdminRole(currentSession.user.id, checkId);
        }
      } catch (error) {
        console.error('Error during initial auth setup:', error);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('orgPickerDismissed');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

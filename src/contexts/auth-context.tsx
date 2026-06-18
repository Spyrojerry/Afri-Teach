import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'student' | 'teacher' | 'admin' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null, redirectTo?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null, user: User | null, redirectTo?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.user_metadata?.role ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.user_metadata?.role ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    let redirectTo = '';
    
    if (!error && data.user) {
      const role = data.user.user_metadata?.role as UserRole;
      const onboardingCompleted =
        data.user.user_metadata?.onboarding_completed === true;

      redirectTo = !onboardingCompleted
        ? '/onboarding'
        : role === 'teacher'
          ? '/teacher/dashboard'
          : '/student/dashboard';
    }
    
    return { error, redirectTo };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL('/auth/callback', window.location.origin).toString(),
      },
    });
    
    let redirectTo = '';
    
    if (!error) {
      redirectTo = '/onboarding';
    }
    
    return { error, user: data?.user ?? null, redirectTo };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      // Always return OAuth to the origin that started the browser flow.
      // This prevents local ports and deployed domains from drifting from .env.
      const redirectUrl = new URL('/auth/callback', window.location.origin).toString();
      
      console.log(`Redirecting to: ${redirectUrl}`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      return { error };
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      return { error };
    }
  };

  const getRedirectPath = () => {
    const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;
    
    if (!onboardingCompleted) {
      return '/onboarding';
    }
    
    if (userRole === 'student') {
      return '/student/dashboard';
    }
    
    if (userRole === 'teacher') {
      return '/teacher/dashboard';
    }
    
    return '/onboarding';
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    getRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

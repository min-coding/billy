import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthState, LoginCredentials, SignupCredentials } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (session: Session | null) => {
    try {
      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching user profile:', error);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }

        if (!userProfile) {
          console.warn('No user profile found for the current user.');
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }

        const user: AuthUser = {
          id: userProfile.id,
          username: userProfile.username,
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar,
          createdAt: new Date(userProfile.created_at),
        };

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth state change error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
  
    try {
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }
  
      if (!credentials.username || credentials.username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
  
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', credentials.username)
        .maybeSingle();
  
      if (existingUser) {
        throw new Error('Username is already taken');
      }
  
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
  
      if (error) {
        throw new Error(error.message);
      }
  
      const userId = data.user?.id || data.session?.user?.id;
  
      if (!userId) {
        alert('Check your email to confirm your account before logging in.');
        router.replace('/(auth)/login');
        return;
      }
  
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: credentials.username,
          name: credentials.name,
          email: credentials.email,
          avatar: `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`,
        });
  
      if (profileError) {
        throw new Error(profileError.message);
      }
  
      alert('Account created!');
      router.replace('/'); // or to your authenticated homepage
    } catch (error) {
      console.error('Signup error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };
  
;

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!authState.user) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          avatar: updates.avatar,
        })
        .eq('id', authState.user.id);

      if (error) {
        throw new Error(error.message);
      }

      const updatedUser = { ...authState.user, ...updates };
      setAuthState({
        user: updatedUser,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
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
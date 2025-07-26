'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  signOut as cognitoSignOut,
  getCurrentUser,
  initializeAuth,
  type CognitoUser
} from './aws-cognito-real';

interface AuthContextType {
  user: CognitoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 AuthProvider initializing...');
    
    const initialize = async () => {
      try {
        const currentUser = await initializeAuth();
        if (currentUser) {
          console.log('✅ User restored from storage:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('ℹ️ No user found in storage');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider.signIn called for:', email);
    setLoading(true);
    
    try {
      const user = await cognitoSignIn(email, password);
      
      // Store user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognia_user', JSON.stringify(user));
      }
      
      setUser(user);
      console.log('✅ AuthProvider.signIn successful');
    } catch (error) {
      console.error('❌ AuthProvider.signIn error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('📝 AuthProvider.signUp called for:', email);
    setLoading(true);
    
    try {
      await cognitoSignUp(email, password, displayName);
      console.log('✅ AuthProvider.signUp successful');
    } catch (error) {
      console.error('❌ AuthProvider.signUp error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 AuthProvider.signOut called');
    setLoading(true);
    
    try {
      await cognitoSignOut();
      setUser(null);
      console.log('✅ AuthProvider.signOut successful');
    } catch (error) {
      console.error('❌ AuthProvider.signOut error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  console.log('🔧 AuthProvider state:', { 
    hasUser: !!user, 
    userEmail: user?.email, 
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
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
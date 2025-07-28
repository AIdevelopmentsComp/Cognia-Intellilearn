/**
 * COGNIA INTELLILEARN - AUTHENTICATION CONTEXT
 * 
 * CONTEXTO DE NEGOCIO:
 * - Sistema de autenticación centralizado para la plataforma educativa CognIA
 * - Gestiona el estado de autenticación de estudiantes, profesores y administradores
 * - Integrado con AWS Cognito para seguridad empresarial y escalabilidad
 * - Permite acceso seguro a recursos educativos personalizados
 * 
 * PROPÓSITO:
 * - Proveer contexto de autenticación global para toda la aplicación
 * - Manejar persistencia de sesión entre recargas de página
 * - Controlar acceso a funcionalidades según el estado de autenticación
 * - Facilitar operaciones de login, logout y registro de usuarios
 * 
 * CASOS DE USO:
 * - Estudiante inicia sesión para acceder a sus cursos personalizados
 * - Profesor accede al dashboard para gestionar contenido educativo
 * - Sistema verifica permisos antes de mostrar chat AI o recursos premium
 */

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

  // Inicialización del contexto de autenticación
  useEffect(() => {
    console.log('🔧 AuthProvider initializing...');
    console.log('🔧 AuthProvider state:', { hasUser: !!user, userEmail: user?.email, loading });
    
    const initialize = async () => {
      try {
        console.log('🔧 Initializing auth...');
        const currentUser = await initializeAuth();
        if (currentUser) {
          console.log('✅ User restored from storage:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('ℹ️ No user found in storage');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Limpiar cualquier estado corrupto
        localStorage.removeItem('cognia_auth_token');
        localStorage.removeItem('cognia_user_data');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Función de inicio de sesión con manejo de errores mejorado
  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider.signIn called for:', email);
    try {
      const result = await cognitoSignIn(email, password);
      console.log('✅ AuthProvider.signIn successful');
      setUser(result);
      
      // Persistir datos de usuario en localStorage para recuperación
      localStorage.setItem('cognia_user_data', JSON.stringify(result));
      
    } catch (error) {
      console.error('❌ AuthProvider.signIn failed:', error);
      // Limpiar cualquier estado corrupto en caso de error
      setUser(null);
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      throw error;
    }
  };

  // Función de registro de nuevos usuarios
  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('📝 AuthProvider.signUp called for:', email);
    try {
      await cognitoSignUp(email, password, displayName);
      console.log('✅ AuthProvider.signUp successful');
    } catch (error) {
      console.error('❌ AuthProvider.signUp failed:', error);
      throw error;
    }
  };

  // Función de cierre de sesión con limpieza completa
  const signOut = async () => {
    console.log('🔐 AuthProvider.signOut called');
    try {
      await cognitoSignOut();
      setUser(null);
      
      // Limpieza completa del estado local
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      sessionStorage.clear();
      
      console.log('✅ AuthProvider.signOut successful');
      
      // Redirigir al login después de logout exitoso
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('❌ AuthProvider.signOut failed:', error);
      // Aún así limpiar el estado local en caso de error
      setUser(null);
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      sessionStorage.clear();
      window.location.href = '/auth/login';
    }
  };

  // Log de cambios de estado para debugging
  useEffect(() => {
    console.log('🔧 AuthProvider state:', { hasUser: !!user, userEmail: user?.email, loading });
  }, [user, loading]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
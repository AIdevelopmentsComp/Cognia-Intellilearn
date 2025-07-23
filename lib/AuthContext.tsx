/**
 * @fileoverview Authentication Context Provider
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-10
 * @updated 2023-12-15
 * @version 1.0.0
 * 
 * @description
 * Provides a React Context for authentication state management.
 * Creates a centralized authentication state accessible throughout the application.
 * 
 * @context
 * Core part of the authentication system.
 * Used by components to access user data and authentication status.
 * Integrates with Firebase Authentication through firebaseAuth.ts.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added error handling and retry logic
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges } from './firebaseAuth';

/**
 * Authentication Context Type Definition
 * @context Defines the shape of the auth context data
 */
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Authentication Context
 * @context The React context that will be used by components
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

/**
 * Authentication Provider Component
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with auth state
 * 
 * @context
 * Wraps the application to provide authentication state.
 * Usually placed near the root of the component tree.
 * 
 * @description
 * Manages authentication state and provides it through context.
 * Handles authentication state changes from Firebase.
 * Implements retry logic for authentication failures.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    /**
     * Sets up the authentication listener
     * @returns {Function} Cleanup function to unsubscribe
     */
    const setupAuthListener = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Subscribe to authentication state changes
        const unsubscribe = subscribeToAuthChanges((user) => {
          setUser(user);
          setLoading(false);
        });

        // Return cleanup function
        return unsubscribe;
      } catch (err) {
        console.error("Error al configurar la autenticación:", err);
        setError(err instanceof Error ? err : new Error('Error desconocido en autenticación'));
        setLoading(false);
        
        // Retry logic for connection issues
        if (retryCount < 3) {
          const timeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setupAuthListener();
          }, 3000); // Retry after 3 seconds
          
          return () => clearTimeout(timeout);
        }
        
        return () => {}; // No cleanup needed if failed
      }
    };

    const unsubscribe = setupAuthListener();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [retryCount]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Authentication Hook
 * 
 * @returns {AuthContextType} Authentication context values
 * 
 * @context
 * Used by components to access auth state.
 * 
 * @description
 * Custom hook to access the authentication context.
 * Provides user data, loading state, and error information.
 * 
 * @example
 * ```tsx
 * const { user, loading, error } = useAuth();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!user) return <LoginButton />;
 * 
 * return <UserProfile user={user} />;
 * ```
 */
export const useAuth = () => useContext(AuthContext); 
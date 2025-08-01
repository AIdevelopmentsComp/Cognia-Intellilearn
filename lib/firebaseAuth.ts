/**
 * @fileoverview Firebase Authentication Service
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-10
 * @updated 2023-12-15
 * @version 1.0.0
 * 
 * @description
 * This module handles all Firebase authentication-related operations.
 * It provides functions for user authentication, sign-out, and auth state management.
 * 
 * @context
 * Part of the authentication system for CognIA-IntelliLearn platform.
 * Provides Google sign-in integration and auth state management.
 * Used by the AuthContext provider to maintain global auth state.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added error handling for authentication errors
 * v1.0.2 - Fixed redirect to dashboard after successful login
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

/**
 * Firebase configuration object
 * @context Core configuration for Firebase services
 */
const firebaseConfig = {
  apiKey: "AIzaSyB2SyW8F0RSYud2XSwwB0HIYR_PtBgSV_s",
  authDomain: "cogniaintellilearn-ebdb3.firebaseapp.com",
  projectId: "cogniaintellilearn-ebdb3",
  storageBucket: "cogniaintellilearn-ebdb3.appspot.com",
  messagingSenderId: "194652864291",
  appId: "1:194652864291:web:08de5c271604bc3e741696",
  measurementId: "G-HJWX4FBK40"
};

/**
 * Initialize Firebase app singleton
 * @context Ensures Firebase is only initialized once
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firebase Auth instance
 * @context Primary authentication service instance
 */
export const auth = getAuth(app);

/**
 * Google Auth Provider
 * @context Configures Google authentication provider
 */
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider with additional scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Force account selection for improved security
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google
 * 
 * @returns {Promise<{success: boolean, user?: User, error?: Error, errorMessage?: string}>}
 * @context Authentication entry point for users
 * 
 * @description
 * Initiates Google sign-in popup and handles the authentication flow.
 * On success, redirects user to dashboard.
 * On failure, returns detailed error information.
 */
export const signInWithGoogle = async () => {
  try {
    console.log("Iniciando proceso de autenticación con Firebase");
    console.log("Configuración:", {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId
    });
    
    // Force account selection
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Autenticación exitosa", result.user.uid);
    
    // Always redirect to dashboard after successful login
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error detallado al iniciar sesión con Google:', error);
    
    // Provide more descriptive error message
    let errorMessage = "Error desconocido de autenticación";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check if it's a Firebase Auth error
      if ((error as AuthError).code) {
        const authError = error as AuthError;
        switch(authError.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "El popup de autenticación fue cerrado antes de completar el proceso";
            break;
          case 'auth/popup-blocked':
            errorMessage = "El popup de autenticación fue bloqueado por el navegador";
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = "La solicitud de popup fue cancelada";
            break;
          case 'auth/unauthorized-domain':
            errorMessage = "El dominio no está autorizado para operaciones de OAuth";
            break;
          default:
            errorMessage = `Error de Firebase: ${authError.code} - ${authError.message}`;
        }
      }
    }
    
    return { success: false, error, errorMessage };
  }
};

/**
 * Sign out user
 * 
 * @param {string} [redirectUrl] - Optional URL to redirect after sign out
 * @returns {Promise<{success: boolean, error?: Error}>}
 * @context User session termination
 * 
 * @description
 * Signs out the current user and optionally redirects to a specified URL.
 */
export const signOut = async (redirectUrl?: string) => {
  try {
    await firebaseSignOut(auth);
    
    // Redirect if URL is provided
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to authentication state changes
 * 
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 * @context Auth state monitoring
 * 
 * @description
 * Sets up a listener for authentication state changes.
 * Returns an unsubscribe function that should be called when no longer needed.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
}; 
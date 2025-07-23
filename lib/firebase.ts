/**
 * @fileoverview Firebase Services Configuration
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-10
 * @updated 2023-12-20
 * @version 1.0.0
 * 
 * @description
 * Centralizes all Firebase service initializations and exports.
 * Provides utilities for authentication, database, storage, and AI operations.
 * 
 * @context
 * Core service configuration file used throughout the application.
 * Initializes Firebase services as singletons to prevent duplicate instances.
 * Integrates Firebase AI (Gemini) for artificial intelligence capabilities.
 * 
 * @changelog
 * v1.0.0 - Initial implementation with core Firebase services
 * v1.0.1 - Added Firestore and Storage services
 * v1.0.2 - Integrated Firebase AI with Gemini model
 */

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/**
 * Firebase configuration object
 * @context Core configuration for all Firebase services
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
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/**
 * Initialize Firebase services
 * @context Service instances used throughout the application
 */
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

/**
 * Analytics initialization (client-side only)
 * @context Used for tracking user behavior when supported
 */
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  isSupported().then((supported: boolean) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

/**
 * Firebase AI Configuration
 * @context AI service initialization for Gemini model
 */
const ai = getAI(app, { backend: new GoogleAIBackend() });

/**
 * Gemini AI model instance
 * @context Used for generating AI responses throughout the app
 * gemini-1.5-pro-latest for higher quality, gemini-1.5-flash for faster responses
 */
export const geminiModel = getGenerativeModel(ai, { model: "gemini-1.5-flash" });

/**
 * Generate content using Gemini AI
 * 
 * @param {string} prompt - The text prompt to send to the AI
 * @returns {Promise<string>} The AI-generated response text
 * 
 * @context
 * Used for single-prompt AI content generation.
 * 
 * @description
 * Sends a single prompt to the Gemini model and returns the response.
 * Handles errors gracefully by returning a friendly error message.
 */
export async function generateAIResponse(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error al generar contenido con Gemini:", error);
    return "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.";
  }
}

/**
 * Chat with Gemini AI
 * 
 * @param {Array<{role: string, content: string}>} messages - Array of message objects
 * @returns {Promise<string>} The AI-generated response text
 * 
 * @context
 * Used for multi-turn conversational AI interactions.
 * 
 * @description
 * Maintains a conversation with the Gemini model by:
 * 1. Creating a new chat session
 * 2. Sending previous messages to establish context
 * 3. Sending the latest message and returning the response
 * Configured with temperature and other generation parameters for natural conversation.
 */
export async function chatWithAI(messages: Array<{role: string, content: string}>) {
  try {
    // Create a new chat session
    const chat = geminiModel.startChat({
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    // Send previous messages to establish context
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        await chat.sendMessage(msg.content);
      }
    }
    
    // Send the latest message and get response
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error("Error en la conversación con Gemini:", error);
    return "Lo siento, ha ocurrido un error en nuestra conversación. Por favor, intenta de nuevo.";
  }
}

/**
 * Google Auth Provider
 * @context Used for Google Sign-In
 */
export const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 * 
 * @returns {Promise<{success: boolean, user?: User, error?: any}>}
 * @context User authentication entry point
 * 
 * @description
 * Initiates Google sign-in popup and handles the authentication flow.
 * Returns success status and user data or error information.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    return { success: false, error };
  }
};

/**
 * Sign out user
 * 
 * @returns {Promise<{success: boolean, error?: any}>}
 * @context User session termination
 * 
 * @description
 * Signs out the current user from Firebase Authentication.
 * Returns success status or error information.
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
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

/**
 * Export Firebase service instances
 * @context Provides access to core Firebase services
 */
export { app, auth, db, storage, analytics }; 
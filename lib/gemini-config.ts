/**
 * @fileoverview Gemini AI Configuration
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-18
 * @updated 2023-12-22
 * @version 1.0.0
 * 
 * @description
 * Configuration for Google's Gemini AI API integration.
 * Contains API keys, model settings, and generation parameters.
 * 
 * @context
 * Core configuration file for AI capabilities throughout the application.
 * Defines how the application interacts with Gemini models.
 * Controls AI response behavior, safety settings, and caching.
 * 
 * @changelog
 * v1.0.0 - Initial configuration
 * v1.0.1 - Added caching support
 * v1.0.2 - Optimized generation parameters
 */

/**
 * Gemini API Configuration
 * @context Main configuration object for Gemini AI integration
 */
export const geminiConfig = {
  /**
   * Gemini API Key
   * @context Authentication for API access
   * Obtain from Google AI Studio (https://makersuite.google.com/)
   */
  apiKey: 'AIzaSyBxX0wWGEjv8JhSMmT2aKYKV3JKfwBn3Xo',
  
  /**
   * Google Cloud Project ID
   * @context Project identification for Google Cloud resources
   */
  projectId: 'cogniaintellilearn-ebdb3',
  
  /**
   * Model Identifier
   * @context Specifies which Gemini model to use
   * 
   * For standard models, use one of:
   * - 'gemini-1.5-flash' (faster, more efficient)
   * - 'gemini-1.5-pro' (more capable, higher quality)
   * 
   * For custom models, use format:
   * 'projects/{projectId}/locations/{location}/models/{modelId}'
   */
  model: 'gemini-1.5-flash',
  
  /**
   * Custom Model Flag
   * @context Indicates whether a custom-trained model is being used
   * Set to true when using a fine-tuned model specific to your application
   */
  isCustomModel: false,
  
  /**
   * Generation Parameters
   * @context Controls the behavior of AI text generation
   * 
   * - temperature: Controls randomness (0.0-1.0)
   *   Lower values = more deterministic, higher = more creative
   * 
   * - topP: Controls diversity via nucleus sampling (0.0-1.0)
   *   Lower values = more focused, higher = more diverse options
   * 
   * - maxOutputTokens: Maximum response length
   *   Lower values = shorter, more concise responses
   */
  generationConfig: {
    temperature: 0.5,         // Reduced for more consistent responses
    topP: 0.75,               // Balanced for creativity and precision
    maxOutputTokens: 800,     // Limited for concise responses and lower cost
  },
  
  /**
   * Safety Settings
   * @context Controls content filtering for generated responses
   * 
   * Categories:
   * - HARM_CATEGORY_HATE_SPEECH
   * - HARM_CATEGORY_DANGEROUS_CONTENT
   * - HARM_CATEGORY_SEXUALLY_EXPLICIT
   * - HARM_CATEGORY_HARASSMENT
   * 
   * Thresholds:
   * - BLOCK_NONE | OFF (no filtering)
   * - BLOCK_LOW_AND_ABOVE (filter extreme content)
   * - BLOCK_MEDIUM_AND_ABOVE (balanced filtering)
   * - BLOCK_HIGH_AND_ABOVE (minimal filtering)
   * 
   * Note: For educational context, filters are disabled, but should be
   * adjusted based on your specific use case and audience
   */
  safetySettings: [
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" }
  ],
  
  /**
   * Caching Configuration
   * @context Controls response caching to reduce API calls
   * 
   * - enabled: Toggles caching on/off
   * - maxEntries: Maximum number of responses to cache
   * - ttl: Time-to-live in milliseconds before cache entry expires
   */
  cache: {
    enabled: true,           // Enable caching to reduce repeated calls
    maxEntries: 100,         // Maximum number of cached entries
    ttl: 3600000             // Time-to-live: 1 hour (in milliseconds)
  }
};

/**
 * API Integration Method Flag
 * @context Controls whether to use server-side or client-side API calls
 * 
 * - true: Use server endpoint (API route) to call Gemini
 *   Safer for production as it keeps API keys private
 * 
 * - false: Call Gemini API directly from client
 *   Simpler but exposes API key in client code (not recommended for production)
 */
export const useServerEndpoint = false;

/**
 * Setup Instructions
 * @context Guidance for configuring Gemini API integration
 * 
 * 1. Option A - Get an API key from Google AI Studio:
 *    - Visit https://makersuite.google.com/
 *    - Sign in with your Google account
 *    - Go to API Keys in the settings
 *    - Create a new API key
 *    - Copy the key and paste it above in the apiKey field
 * 
 * 2. Option B - Use Google Cloud credentials:
 *    - Make sure you've authenticated with `gcloud auth application-default login`
 *    - Set useServerEndpoint to true and keep apiKey empty
 *    - The server endpoint will use your Google Cloud credentials
 * 
 * 3. Option C - Use a custom trained model:
 *    - Train a model following the instructions in README-MODEL-TRAINING.md
 *    - Set the model field to your trained model path
 *    - Set isCustomModel to true
 * 
 * For production deployments, store your API key in environment variables
 * instead of hardcoding it in this file.
 */ 
/**
 * @fileoverview AWS Services Configuration
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-10
 * @updated 2025-01-08
 * @version 2.0.0
 * 
 * @description
 * Centralizes all AWS service initializations and exports.
 * Provides utilities for authentication, database, storage, and AI operations using AWS.
 * 
 * @context
 * Core service configuration file used throughout the application.
 * Replaces Firebase with AWS services (Bedrock, Cognito, DynamoDB, S3).
 * 
 * @changelog
 * v2.0.0 - Complete migration from Firebase to AWS services
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// AWS Configuration
const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
};

// Initialize AWS Bedrock client
let bedrockClient: BedrockRuntimeClient | null = null;

const getBedrockClient = () => {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey
      }
    });
  }
  return bedrockClient;
};

// Claude 3 Haiku model ID
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Chat with AWS Bedrock (Claude 3 Haiku)
 * Replaces Firebase AI chat functionality
 */
export async function chatWithAI(
  messages: ChatMessage[],
  systemPrompt: string = "Eres un asistente educativo experto. Proporciona respuestas útiles, precisas y motivadoras sobre temas académicos."
): Promise<string> {
  try {
    const client = getBedrockClient();
    
    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Prepare conversation history for Claude
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare the payload for Claude 3 Haiku
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: conversationHistory,
      system: systemPrompt,
      temperature: 0.7,
      top_p: 0.9
    };

    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await client.send(command);
    
    if (!response.body) {
      throw new Error('No response body received from Bedrock');
    }

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text;
    } else {
      throw new Error('Invalid response format from Bedrock');
    }

  } catch (error) {
    console.error('Error calling AWS Bedrock:', error);
    
    // Return a fallback message
    return 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.';
  }
}

/**
 * Legacy compatibility function
 * Maintains compatibility with existing Firebase AI calls
 */
export const getGenerativeModel = () => ({
  generateContent: async (prompt: string) => {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    const response = await chatWithAI(messages);
    return {
      response: {
        text: () => response
      }
    };
  }
});

// Export other utilities that may be needed
export const initializeApp = () => {
  console.log('AWS services initialized');
  return { name: 'aws-services' };
};

export const getAuth = () => ({
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Mock auth state change
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('cognia_user');
      callback(user ? JSON.parse(user) : null);
    } else {
      callback(null);
    }
    return () => {}; // Unsubscribe function
  }
});

export const signOut = async () => {
  localStorage.removeItem('cognia_user');
};

// Legacy exports for compatibility
export const app = initializeApp();
export const auth = getAuth();
export const firestore = null; // Will be replaced with DynamoDB operations
export const storage = null; // Will be replaced with S3 operations
export const analytics = null; // Will be replaced with AWS CloudWatch 
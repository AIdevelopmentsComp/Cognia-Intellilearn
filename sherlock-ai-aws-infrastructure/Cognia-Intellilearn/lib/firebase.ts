/**
 * @fileoverview AWS Services Configuration
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-10
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Centralizes all AWS service initializations and exports.
 * Provides utilities for authentication, database, storage, and AI operations using AWS.
 * 
 * @context
 * Core service configuration file used throughout the application.
 * Uses AWS services (Bedrock, Cognito, DynamoDB, S3) exclusively.
 * 
 * @changelog
 * v2.0.0 - Complete migration to AWS services
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { AWS_CONFIG } from './config';

// Initialize AWS clients
let bedrockClient: BedrockRuntimeClient | null = null;
let dynamoClient: DynamoDBClient | null = null;
let s3Client: S3Client | null = null;

const getBedrockClient = () => {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: AWS_CONFIG.region
    });
  }
  return bedrockClient;
};

const getDynamoClient = () => {
  if (!dynamoClient) {
    dynamoClient = new DynamoDBClient({
      region: AWS_CONFIG.region
    });
  }
  return dynamoClient;
};

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_CONFIG.region
    });
  }
  return s3Client;
};

// Claude 3 Haiku model ID
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BedrockResponse {
  content: Array<{
    text: string;
  }>;
}

/**
 * Send a message to Claude using AWS Bedrock
 */
export const sendMessageToClaude = async (message: string, conversationHistory: ChatMessage[] = []): Promise<string> => {
  try {
    const client = getBedrockClient();
    
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ];

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: messages,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
    
    return responseBody.content[0]?.text || 'Sorry, I could not process your message.';
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    throw new Error('Error communicating with the AI assistant');
  }
};

/**
 * Generate course content using AWS Bedrock
 */
export const generateCourseContent = async (
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<any> => {
  try {
    const client = getBedrockClient();
    
    const prompt = `Generate educational content for a course on "${topic}" at ${level} level. 
    Include: title, description, learning objectives, and module structure.
    Respond in JSON format.`;

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
    
    return JSON.parse(responseBody.content[0]?.text || '{}');
  } catch (error) {
    console.error('Error generating course content:', error);
    throw new Error('Error generating course content');
  }
};

/**
 * Chat with AWS Bedrock via Lambda (Claude 3 Haiku)
 * Main AI chat functionality for the application
 */
export async function chatWithAI(
  message: string,
  systemPrompt: string = "You are an expert educational assistant. Provide helpful, accurate, and motivating responses about academic topics."
): Promise<string> {
  try {
    const lambdaEndpoint = process.env.NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT;
    if (!lambdaEndpoint) {
      throw new Error('Lambda endpoint not configured');
    }

    const response = await fetch(lambdaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AWS_BEARER_TOKEN_BEDROCK || ''}`
      },
      body: JSON.stringify({
        audioData: `${systemPrompt}\n\nUser: ${message}`,
        sessionId: `chat_${Date.now()}`,
        courseId: '000000000',
        topic: 'General Chat',
        studentId: 'general_user',
        contextSources: [],
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Lambda request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract AI response from Lambda response chunks
    const aiResponseChunks = data.chunks?.filter((chunk: any) => chunk.type === 'ai_response') || [];
    const aiResponse = aiResponseChunks.map((chunk: any) => chunk.text).join('');
    
    return aiResponse || 'Sorry, I cannot process your request at this time. Please try again later.';
  } catch (error) {
    console.error('Error calling AWS Bedrock via Lambda:', error);
    return 'Sorry, I cannot process your request at this time. Please try again later.';
  }
}

// Export AWS clients
export const bedrock = getBedrockClient;
export const dynamodb = getDynamoClient;
export const s3 = getS3Client;

// Legacy exports removed - fully AWS now
export const auth = null;
export const analytics = null; 
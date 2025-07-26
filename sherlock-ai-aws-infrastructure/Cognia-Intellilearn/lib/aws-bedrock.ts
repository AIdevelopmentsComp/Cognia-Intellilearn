/**
 * AWS Bedrock Integration for CognIA Intellilearn
 * Enhanced integration based on SherlockBedrockAssistant patterns
 * Replaces Firebase/Gemini with AWS Bedrock Claude 3.5 Sonnet
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// AWS Bedrock Configuration
const BEDROCK_CONFIG = {
  region: 'us-east-1',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
};

// Cliente de Bedrock con credenciales AWS
const bedrockClient = new BedrockRuntimeClient({
  region: BEDROCK_CONFIG.region,
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BedrockResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: null | string;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Chat with AWS Bedrock (Claude 3 Haiku)
 * @param userMessage - The user's message
 * @param systemPrompt - System prompt for the AI
 * @param chatHistory - Previous conversation history
 * @returns AI response text
 */
export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // Prepare conversation history for Claude, ensuring alternating roles
    let messages = [...chatHistory.slice(-10)]; // Keep last 10 messages for context
    
    // Only add the user message if the last message isn't already from the user
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user' as const, content: userMessage });
    } else {
      // If the last message is already from user, replace it with the new message
      messages[messages.length - 1] = { role: 'user' as const, content: userMessage };
    }

    console.log('Messages being sent to Bedrock:', messages);

    const response = await invokeBedrock(
      userMessage,
      systemPrompt,
      messages,
      BEDROCK_CONFIG.modelId
    );

    return response;
  } catch (error) {
    console.error('Error calling AWS Bedrock:', error);
    return 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.';
  }
}

/**
 * Invoke AWS Bedrock model
 */
async function invokeBedrock(
  userMessage: string,
  systemPrompt: string,
  messages: ChatMessage[],
  modelId: string
): Promise<string> {
  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: messages,
      system: systemPrompt,
      temperature: 0.7,
      top_p: 0.9
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body received from Bedrock');
    }

    const responseBody: BedrockResponse = JSON.parse(
      new TextDecoder().decode(response.body)
    );
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text;
    } else {
      throw new Error('Invalid response format from Bedrock');
    }

  } catch (error) {
    console.error('Error invoking Bedrock:', error);
    throw error;
  }
}

/**
 * Generate educational content using AWS Bedrock
 */
export async function generateEducationalContent(
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<string> {
  const systemPrompt = `Eres un experto educador que crea contenido didáctico de alta calidad. 
  Genera contenido educativo sobre el tema solicitado, adaptado al nivel ${level}.
  El contenido debe ser claro, estructurado y fácil de entender.`;
  
  const userMessage = `Genera contenido educativo sobre: ${topic}`;
  
  return await chatWithAI(userMessage, systemPrompt);
}

/**
 * Check if AWS Bedrock is available
 */
export async function checkBedrockAvailability(): Promise<boolean> {
  try {
    await chatWithAI('test', 'Responde solo "ok"');
    return true;
  } catch (error) {
    console.error('Bedrock not available:', error);
    return false;
  }
} 
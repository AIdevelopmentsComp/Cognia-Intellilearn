/**
 * Helper functions for interacting with the Gemini API through our Next.js API route
 */
import { geminiConfig } from './gemini-config';
import geminiCache from './gemini-cache';

type Message = {
  role: string;
  content: string;
};

// Implementación simple de rate limiting
const rateLimiter = {
  tokens: 10,
  maxTokens: 10,
  lastRefill: Date.now(),
  refillRate: 1000, // 1 token por segundo

  // Comprobar si tenemos tokens disponibles
  canMakeRequest(): boolean {
    this.refill();
    return this.tokens > 0;
  },

  // Consumir un token
  consumeToken(): void {
    this.tokens = Math.max(0, this.tokens - 1);
  },

  // Rellenar tokens según el tiempo transcurrido
  refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
};

/**
 * Obtiene la URL base para las Firebase Functions
 */
function getFunctionsBaseUrl(): string {
  // En desarrollo, usar una URL local para emulador de Functions
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001/cogniaintellilearn-ebdb3/us-central1';
  }
  
  // En producción, usar la URL de Firebase Functions
  return 'https://us-central1-cogniaintellilearn-ebdb3.cloudfunctions.net';
}

/**
 * Sends a chat conversation to the Gemini API and returns the response
 * @param messages Array of message objects with role ('user' or 'model') and content
 * @returns The text response from the AI
 */
export async function chatWithGemini(messages: Message[]): Promise<string> {
  try {
    // Limpiar entradas caducadas del caché periódicamente
    geminiCache.cleanExpired();

    // Comprobar caché si está habilitado
    if (geminiConfig.cache?.enabled) {
      const cachedResponse = geminiCache.get(messages);
      if (cachedResponse) {
        console.log('Respuesta obtenida desde caché');
        return cachedResponse;
      }
    }

    // Comprobar rate limiting
    if (!rateLimiter.canMakeRequest()) {
      console.warn('Rate limit excedido, esperando...');
      // Esperar un segundo antes de intentar de nuevo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return chatWithGemini(messages); // Recursión con un segundo de espera
    }

    // Consumir un token del rate limiter
    rateLimiter.consumeToken();

    // Si se está usando un modelo personalizado, llamar a la función de Firebase
    if (geminiConfig.isCustomModel) {
      try {
        const functionsBaseUrl = getFunctionsBaseUrl();
        const response = await fetch(`${functionsBaseUrl}/geminiCustomModel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages,
            modelPath: geminiConfig.model,
            config: {
              temperature: geminiConfig.generationConfig.temperature,
              topP: geminiConfig.generationConfig.topP,
              maxOutputTokens: geminiConfig.generationConfig.maxOutputTokens
            }
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          // Guardar en caché si está habilitado
          if (geminiConfig.cache?.enabled && data.text) {
            geminiCache.set(messages, data.text);
          }
          return data.text || 'No se pudo generar una respuesta.';
        } else {
          console.warn('Error al llamar a la función de Firebase para el modelo personalizado');
          // Caer en el método estándar si falla la función
        }
      } catch (error) {
        console.warn('Error al llamar a la función de Firebase:', error);
        // Caer en el método estándar si falla la función
      }
    }

    // Direct integration with Gemini API
    if (!geminiConfig.apiKey) {
      throw new Error('Gemini API key is required for direct integration with standard models');
    }

    // Transform messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Para modelos estándar de Gemini, usar la API pública
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${geminiConfig.model}:generateContent?key=${geminiConfig.apiKey}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents,
          generationConfig: geminiConfig.generationConfig,
          safetySettings: geminiConfig.safetySettings
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API direct integration error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from Gemini API');
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
    // Guardar en caché si está habilitado
    if (geminiConfig.cache?.enabled) {
      geminiCache.set(messages, aiResponse);
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error in chatWithGemini:', error);
    throw error;
  }
}

/**
 * Generates a response for a single prompt
 * @param prompt The text prompt to send to Gemini
 * @returns The text response from the AI
 */
export async function generateResponse(prompt: string): Promise<string> {
  return chatWithGemini([{ role: 'user', content: prompt }]);
} 
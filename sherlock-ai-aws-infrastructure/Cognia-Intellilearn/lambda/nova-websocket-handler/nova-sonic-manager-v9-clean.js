/**
 * Nova Sonic Manager - V9 CLEAN (No Emojis + Audio Fix)
 * Real Nova Sonic integration with 5-second timeout, robust fallback, and clean logging
 */

const { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const NOVA_SONIC_MODEL_ID = process.env.NOVA_SONIC_MODEL_ID || 'amazon.nova-sonic-v1:0';
const NOVA_TIMEOUT_MS = 30000; // 30 second timeout for Nova Sonic initialization (real-world latency)

class NovaSpeeechToSpeechManager {
  constructor(apiGwClient, connectionId, sessionId, credentials) {
    this.apiGwClient = apiGwClient;
    this.connectionId = connectionId;
    this.sessionId = sessionId;
    this.credentials = credentials;
    this.isSessionActive = false;
    this.bidirectionalStream = null;
    this.eventQueue = [];
    this.eventQueueResolver = null;
    this.isGeneratorComplete = false;
    this.fallbackMode = false;
    
    // Initialize Bedrock client
    this.bedrockClient = new BedrockRuntimeClient({
      region: 'us-east-1',
      credentials: this.credentials
    });
    
    console.log(`[V9-INIT] NovaSpeeechToSpeechManager initialized: ${this.sessionId}`);
    console.log(`[V9-INIT] connectionId: ${this.connectionId}`);
    console.log(`[V9-INIT] credentials available: ${!!this.credentials}`);
  }

  /**
   * Initialize Nova Sonic Session with TIMEOUT and FALLBACK
   */
  async initializeSession(config = {}) {
    try {
      console.log(`[V9-START] Initializing Nova Sonic with 5s timeout: ${this.sessionId}`);
      
      if (this.isSessionActive) {
        console.log('[V9-WARN] Session already active, skipping initialization');
        return true;
      }

      // Try Nova Sonic with 5-second timeout
      const success = await this.tryNovaInitialization(config);
      
      if (success) {
        console.log(`[V9-SUCCESS] Nova Sonic session active (REAL MODE): ${this.sessionId}`);
        return true;
      } else {
        console.log(`[V9-FALLBACK] Nova Sonic failed, switching to fallback mode: ${this.sessionId}`);
        return await this.initializeFallbackMode(config);
      }
      
    } catch (error) {
      console.log(`[V9-ERROR] Session initialization failed: ${error.message}`);
      return await this.initializeFallbackMode(config);
    }
  }

  /**
   * Try Nova Sonic initialization with timeout
   */
  async tryNovaInitialization(config) {
    try {
      console.log('[V9-NOVA] Attempting Nova Sonic real initialization...');
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Nova Sonic initialization timeout')), NOVA_TIMEOUT_MS);
      });

      // Create Nova Sonic initialization promise
      const novaPromise = this.initializeNovaRealMode(config);

      // Race between Nova Sonic and timeout
      await Promise.race([novaPromise, timeoutPromise]);
      
      this.fallbackMode = false;
      console.log('[V9-NOVA] Nova Sonic real mode SUCCESS');
      return true;

    } catch (error) {
      console.log(`[V9-TIMEOUT] Nova Sonic initialization failed: ${error.message}`);
      this.fallbackMode = true;
      return false;
    }
  }

  /**
   * Real Nova Sonic initialization (can timeout)
   */
  async initializeNovaRealMode(config) {
    console.log('[V9-REAL] Starting Nova Sonic bidirectional stream...');
    
    // Create the bidirectional event generator
    this.eventGenerator = this.createBidirectionalEventGenerator();
    
    const command = new InvokeModelWithBidirectionalStreamCommand({
      modelId: NOVA_SONIC_MODEL_ID,
      body: this.eventGenerator
    });

    console.log('[V9-REAL] Sending bidirectional stream command to Nova Sonic...');
    
    // Execute command and get bidirectional stream
    const response = await this.bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Nova Sonic bidirectional stream');
    }

    this.bidirectionalStream = response.body;
    console.log('[V9-REAL] Nova Sonic bidirectional stream established');
    
    // Start processing responses immediately in parallel
    const responseProcessingPromise = this.startResponseProcessing();
    
    // Send session initialization events
    await this.sendSessionStartEvents(config);
    
    // Wait for first response from Nova Sonic before marking session as ready
    console.log('[V9-WAIT] Waiting for first Nova Sonic response before confirming session...');
    this.firstResponsePromise = new Promise((resolve) => {
      this.firstResponseResolver = resolve;
    });
    
    // Set a timeout for the first response
    const firstResponseTimeout = setTimeout(() => {
      console.log('[V9-TIMEOUT] No response from Nova Sonic after 45 seconds');
      if (this.firstResponseResolver) {
        this.firstResponseResolver(false);
      }
    }, 45000);
    
    const gotFirstResponse = await this.firstResponsePromise;
    clearTimeout(firstResponseTimeout);
    
    if (!gotFirstResponse) {
      throw new Error('Nova Sonic did not respond within 45 seconds');
    }
    
    this.isSessionActive = true;
    
    // NOW notify client that session is ready
    await this.sendToClient({
      type: 'session_initialized',
      sessionId: this.sessionId,
      message: 'Nova Sonic Speech-to-Speech session initialized and ready',
      mode: 'real'
    });
  }

  /**
   * Fallback mode initialization (immediate response)
   */
  async initializeFallbackMode(config) {
    try {
      console.log(`[V9-FALLBACK] Initializing fallback mode: ${this.sessionId}`);
      
      this.isSessionActive = true;
      this.fallbackMode = true;
      
      // Send immediate session_initialized response
      await this.sendToClient({
        type: 'session_initialized',
        sessionId: this.sessionId,
        message: 'Speech-to-Speech session initialized (FALLBACK MODE - Nova Sonic unavailable)',
        mode: 'fallback'
      });

      console.log(`[V9-FALLBACK] Fallback session active: ${this.sessionId}`);
      return true;
      
    } catch (error) {
      console.log(`[V9-ERROR] Fallback initialization failed: ${error.message}`);
      
      await this.sendToClient({
        type: 'session_error',
        sessionId: this.sessionId,
        error: error.message,
        mode: 'fallback'
      });
      
      return false;
    }
  }

  /**
   * Send audio input - Real or Fallback
   */
  async sendAudioInput(audioBase64, isEndOfUtterance = false) {
    try {
      console.log(`[V9-AUDIO] Processing audio input for session: ${this.sessionId}`);
      console.log(`[V9-AUDIO] Audio data length: ${audioBase64 ? audioBase64.length : 'UNDEFINED'}`);
      console.log(`[V9-AUDIO] End of utterance: ${isEndOfUtterance}`);
      console.log(`[V9-AUDIO] Session active: ${this.isSessionActive}`);
      console.log(`[V9-AUDIO] Fallback mode: ${this.fallbackMode}`);
      
      // Validate inputs
      if (!this.sessionId) {
        console.log('[V9-ERROR] Session ID is missing');
        return false;
      }
      
      if (!audioBase64 && !isEndOfUtterance) {
        console.log('[V9-ERROR] Audio data is missing and not end of utterance');
        return false;
      }
      
      if (!this.isSessionActive) {
        console.log('[V9-WARN] Session not active for audio input');
        return false;
      }

      if (this.fallbackMode) {
        return await this.handleAudioInputFallback(audioBase64, isEndOfUtterance);
      } else {
        return await this.handleAudioInputReal(audioBase64, isEndOfUtterance);
      }

    } catch (error) {
      console.log(`[V9-ERROR] Error processing audio: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle audio input in real Nova Sonic mode
   */
  async handleAudioInputReal(audioBase64, isEndOfUtterance) {
    console.log(`[V9-REAL-AUDIO] Audio input received (${audioBase64 ? audioBase64.length : 0} chars), end: ${isEndOfUtterance}`);
    
    if (audioBase64 && audioBase64.length > 0) {
      // Add audioInput event to queue
      this.eventQueue.push({
        event: {
          audioInput: {
            audio: {
              format: "pcm",
              sampleRate: 16000,
              data: Buffer.from(audioBase64, 'base64')
            }
          }
        }
      });
      console.log('[V9-REAL-AUDIO] Audio input event added to queue');
    }

    if (isEndOfUtterance) {
      // Send audioInputEnd event
      this.eventQueue.push({
        event: {
          audioInputEnd: {}
        }
      });
      console.log('[V9-REAL-AUDIO] Audio input end event added to queue');
    }

    // Notify event generator if waiting
    if (this.eventQueueResolver) {
      this.eventQueueResolver();
      this.eventQueueResolver = null;
    }

    return true;
  }

  /**
   * Handle audio input in fallback mode
   */
  async handleAudioInputFallback(audioBase64, isEndOfUtterance) {
    console.log(`[V9-FALLBACK-AUDIO] Mock audio input received (${audioBase64 ? audioBase64.length : 0} chars), end: ${isEndOfUtterance}`);
    
    if (isEndOfUtterance) {
      // Send mock transcription
      await this.sendToClient({
        type: 'transcription',
        sessionId: this.sessionId,
        text: 'You finished speaking',
        timestamp: Date.now()
      });
      
      // Send mock response after 1 second
      setTimeout(async () => {
        try {
          await this.sendToClient({
            type: 'text_response',
            sessionId: this.sessionId,
            text: 'I understand you are testing the speech system. Nova Sonic is currently initializing. Please try again in a moment.',
            timestamp: Date.now()
          });
          
          // Send a simple audio response using base64 encoded silence
          // This is a 1 second of silence in base64 format (16kHz, mono, 16-bit PCM)
          const silenceAudioBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
          
          await this.sendToClient({
            type: 'audio_response',
            sessionId: this.sessionId,
            audioBase64: silenceAudioBase64,
            timestamp: Date.now()
          });
          
          // Complete inference
          setTimeout(async () => {
            await this.sendToClient({
              type: 'inference_complete',
              sessionId: this.sessionId,
              message: 'Response completed (fallback mode)',
              timestamp: Date.now()
            });
          }, 500);
          
        } catch (error) {
          console.log(`[V9-ERROR] Error sending fallback response: ${error.message}`);
        }
      }, 1000);
    }

    return true;
  }

  /**
   * Create bidirectional event generator for Nova Sonic
   */
  async* createBidirectionalEventGenerator() {
    console.log('[V9-REAL-GEN] Starting bidirectional event generator');
    
    while (!this.isGeneratorComplete) {
      if (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        console.log(`[V9-REAL-GEN] Yielding event: ${Object.keys(event.event)[0]}`);
        
        yield {
          chunk: {
            bytes: new TextEncoder().encode(JSON.stringify(event))
          }
        };
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 30));
      } else {
        // Wait for new events or completion
        await new Promise(resolve => {
          this.eventQueueResolver = resolve;
          setTimeout(resolve, 100); // Timeout to prevent infinite wait
        });
      }
    }
    
    console.log('[V9-REAL-GEN] Bidirectional event generator completed');
  }

  /**
   * Send session start events
   */
  async sendSessionStartEvents(config) {
    const sessionStartEvent = {
      event: {
        sessionStart: {
          inferenceConfiguration: {
            maxTokens: config.maxTokens || 1024,
            topP: config.topP || 0.9,
            temperature: config.temperature || 0.7
          }
        }
      }
    };
    
    this.eventQueue.push(sessionStartEvent);
    console.log('[V9-REAL] Session start event added to queue');
    
    if (this.eventQueueResolver) {
      this.eventQueueResolver();
      this.eventQueueResolver = null;
    }
  }

  /**
   * Start processing Nova Sonic responses
   */
  async startResponseProcessing() {
    try {
      console.log('[V9-REAL-PROC] Starting Nova Sonic response processing...');
      
      for await (const event of this.bidirectionalStream) {
        if (!this.isSessionActive) {
          console.log(`[V9-REAL-PROC] Session ${this.sessionId} no longer active, stopping response processing`);
          break;
        }
        
        if (event.chunk?.bytes) {
          try {
            const textResponse = new TextDecoder().decode(event.chunk.bytes);
            const jsonResponse = JSON.parse(textResponse);
            
            // Resolve first response promise if this is the first response
            if (this.firstResponseResolver) {
              console.log('[V9-FIRST-RESPONSE] Received first response from Nova Sonic');
              this.firstResponseResolver(true);
              this.firstResponseResolver = null;
            }
            
            await this.handleNovaResponseEvent(jsonResponse);
            
          } catch (parseError) {
            console.log(`[V9-REAL-PROC] Error parsing response: ${parseError.message}`);
          }
        }
      }
      
      console.log('[V9-REAL-PROC] Nova Sonic response processing completed');
      
    } catch (error) {
      console.log(`[V9-ERROR] Error in response processing: ${error.message}`);
      
      // Switch to fallback mode if processing fails
      this.fallbackMode = true;
      await this.sendToClient({
        type: 'session_error',
        sessionId: this.sessionId,
        error: `Nova Sonic processing failed: ${error.message}`,
        fallback: true
      });
    }
  }

  /**
   * Handle Nova Sonic response events
   */
  async handleNovaResponseEvent(jsonResponse) {
    if (jsonResponse.event?.transcriptEvent) {
      const transcriptText = jsonResponse.event.transcriptEvent.transcript || 
                           jsonResponse.event.transcriptEvent.text || 
                           '';
      
      console.log(`[V9-TRANSCRIPT] Received transcription: ${transcriptText}`);
      
      await this.sendToClient({
        type: 'transcription',
        sessionId: this.sessionId,
        text: transcriptText,
        timestamp: Date.now()
      });
    } else if (jsonResponse.event?.textOutput) {
      await this.sendToClient({
        type: 'text_response',
        sessionId: this.sessionId,
        text: jsonResponse.event.textOutput.text,
        timestamp: Date.now()
      });
    } else if (jsonResponse.event?.audioOutput) {
      const audioContent = jsonResponse.event.audioOutput.content || jsonResponse.event.audioOutput.audio;
      console.log(`[V9-AUDIO] Audio output received, content length: ${audioContent ? audioContent.length : 0}`);
      
      if (audioContent) {
        await this.sendToClient({
          type: 'audio_response',
          sessionId: this.sessionId,
          audioBase64: audioContent,
          timestamp: Date.now()
        });
      } else {
        console.log('[V9-AUDIO] No audio content found in audioOutput event');
      }
    } else if (jsonResponse.event?.toolUse) {
      await this.sendToClient({
        type: 'tool_use',
        sessionId: this.sessionId,
        toolUse: jsonResponse.event.toolUse,
        timestamp: Date.now()
      });
    } else if (jsonResponse.event?.inferenceOutput) {
      await this.sendToClient({
        type: 'inference_complete',
        sessionId: this.sessionId,
        message: 'Nova Sonic inference completed',
        timestamp: Date.now()
      });
    }
  }

  /**
   * End session
   */
  async endSession() {
    try {
      console.log(`[V9-STOP] Ending session: ${this.sessionId} (fallback: ${this.fallbackMode})`);
      this.isSessionActive = false;
      this.isGeneratorComplete = true;
      
      if (this.eventQueueResolver) {
        this.eventQueueResolver();
        this.eventQueueResolver = null;
      }
      
      await this.sendToClient({
        type: 'session_ended',
        sessionId: this.sessionId,
        message: `Session ended successfully (${this.fallbackMode ? 'fallback' : 'real'} mode)`
      });
      
      console.log(`[V9-STOP] Session ended: ${this.sessionId}`);
      return true;
    } catch (error) {
      console.log(`[V9-ERROR] Error ending session: ${error.message}`);
      return false;
    }
  }

  /**
   * Send message to WebSocket client
   */
  async sendToClient(message) {
    try {
      if (!this.apiGwClient) {
        throw new Error('apiGwClient is not initialized');
      }

      const command = new PostToConnectionCommand({
        ConnectionId: this.connectionId,
        Data: JSON.stringify(message)
      });

      await this.apiGwClient.send(command);
      console.log(`[V9-OUT] Message sent to ${this.connectionId}: ${message.type} (${this.fallbackMode ? 'fallback' : 'real'})`);
      
    } catch (error) {
      console.log(`[V9-ERROR] Failed to send message: ${error.message}`);
      
      if (error.name === 'GoneException') {
        console.log('[V9-WARN] Connection gone, client disconnected');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Check if session is active
   */
  isActive() {
    return this.isSessionActive;
  }
}

module.exports = { NovaSpeeechToSpeechManager };
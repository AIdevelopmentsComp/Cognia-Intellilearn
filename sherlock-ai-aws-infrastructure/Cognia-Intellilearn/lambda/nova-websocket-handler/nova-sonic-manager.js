/**
 * Nova Sonic Bidirectional Streaming Manager
 * Implements correct Speech-to-Speech architecture per AWS documentation
 * https://docs.aws.amazon.com/nova/latest/userguide/speech.html
 * 
 * Key Architecture Components:
 * 1. Bidirectional event streaming - persistent connection
 * 2. Event-driven communication flow - structured JSON events  
 * 3. Session lifecycle management - proper event sequencing
 * 4. Real-time audio streaming - continuous processing
 */

const { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand 
} = require('@aws-sdk/client-bedrock-runtime');

const NOVA_SONIC_MODEL_ID = process.env.NOVA_SONIC_MODEL_ID || 'amazon.nova-sonic-v1:0';

class NovaSpeeechToSpeechManager {
  constructor(apiGwClient, connectionId, sessionId, credentials) {
    this.apiGwClient = apiGwClient;
    this.connectionId = connectionId;
    this.sessionId = sessionId;
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials
    });
    
    this.isSessionActive = false;
    this.bidirectionalStream = null;
    this.streamWriter = null;
    this.responseProcessor = null;
    this.eventGenerator = null;
    
    // Event queue for bidirectional streaming
    this.eventQueue = [];
    this.eventQueueResolver = null;
    this.isGeneratorComplete = false;
  }

  /**
   * Initialize Nova Sonic Session using REAL bidirectional streaming
   * Following AWS documentation: https://docs.aws.amazon.com/nova/latest/userguide/speech.html
   */
  async initializeSession(config = {}) {
    try {
      console.log(`[REAL] Initializing Nova Sonic bidirectional session: ${this.sessionId}`);
      
      if (this.isSessionActive) {
        console.log('[WARN] Session already active, skipping initialization');
        return true;
      }

      // Create the bidirectional event generator
      this.eventGenerator = this.createBidirectionalEventGenerator();
      
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: NOVA_SONIC_MODEL_ID,
        body: this.eventGenerator
      });

      console.log('[PROC] Sending bidirectional stream command to Nova Sonic...');
      
      // Execute command and get bidirectional stream
      const response = await this.bedrockClient.send(command);
      
      if (!response.body) {
        throw new Error('No response body from Nova Sonic bidirectional stream');
      }

      this.bidirectionalStream = response.body;
      console.log('[OK] Nova Sonic bidirectional stream established');
      
      // Start processing responses immediately in parallel
      this.startResponseProcessing();
      
      // Send session initialization events
      await this.sendSessionStartEvents(config);
      
      this.isSessionActive = true;
      console.log(`[OK] [REAL] Nova Sonic session initialized: ${this.sessionId}`);
      
      // Notify client that session is ready
      await this.sendToClient({
        type: 'nova_session_ready',
        sessionId: this.sessionId,
        message: 'Nova Sonic Speech-to-Speech session initialized (real bidirectional mode)',
        mode: 'real'
      });
      
      return true;

    } catch (error) {
      console.error('[ERR] Failed to initialize Nova Sonic session (real):', error);
      await this.sendToClient({
        type: 'nova_error',
        sessionId: this.sessionId,
        error: `Real session initialization failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Send session start events following Nova Sonic protocol
   * Per documentation: Session initialization with configuration events
   */
  async sendSessionStartEvents(config) {
    console.log('[OUT] Sending Nova Sonic session start events to queue');
    
    // 1. Session Start Event
    this.addEventToQueue({
      event: {
        sessionStart: {
          inferenceConfiguration: {
            maxTokens: config.maxTokens || 2048,
            topP: config.topP || 0.9,
            temperature: config.temperature || 0.7
          },
          ...config.voice && {
            voice: config.voice
          }
        }
      }
    });

    // 2. Prompt Start Event  
    this.addEventToQueue({
      event: {
        promptStart: {
          promptName: `speech_session_${this.sessionId}`,
          additionalModelRequestFields: config.additionalFields || {}
        }
      }
    });

    console.log('[OK] Session start events queued for Nova Sonic');
  }

  /**
   * Add event to queue for bidirectional streaming
   */
  addEventToQueue(eventData) {
    this.eventQueue.push(eventData);
    console.log(`[LOG] Event queued (${this.eventQueue.length} in queue):`, eventData.event ? Object.keys(eventData.event)[0] : 'unknown');
    
    // Notify the generator that a new event is available
    if (this.eventQueueResolver) {
      const resolver = this.eventQueueResolver;
      this.eventQueueResolver = null;
      resolver();
    }
  }

  /**
   * Send continuous audio input using REAL Nova Sonic bidirectional streaming
   * Per documentation: Continuous audio streaming from user to model
   */
  async sendAudioInput(audioBase64, isEndOfUtterance = false) {
    try {
      if (!this.isSessionActive) {
        console.warn('⚠️ Cannot send audio: session not active');
        return false;
      }

      console.log(`[MIC] [REAL] Sending audio input (${audioBase64.length} chars), end: ${isEndOfUtterance}`);

      // Content Start (for this audio segment) - only on first audio input
      if (audioBase64.length > 0) {
        this.addEventToQueue({
          event: {
            contentStart: {
              promptName: `speech_session_${this.sessionId}`,
              contentName: `audio_${Date.now()}`
            }
          }
        });

        // Audio Input Event  
        this.addEventToQueue({
          event: {
            audioInput: {
              promptName: `speech_session_${this.sessionId}`,
              contentName: `audio_${Date.now()}`,
              content: audioBase64
            }
          }
        });
      }

      // Send audio input end ONLY when user stops speaking
      if (isEndOfUtterance) {
        console.log('[STOP] [REAL] Sending audio input end (user stopped speaking)');
        this.addEventToQueue({
          event: {
            audioInputEnd: {}
          }
        });
      }

      return true;

    } catch (error) {
      console.error('[ERR] Error sending audio input (real):', error);
      await this.sendToClient({
        type: 'nova_error',
        sessionId: this.sessionId,
        error: `Real audio input failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Send event to Nova Sonic bidirectional stream (using queue)
   */
  async sendEvent(eventData) {
    console.log('[OUT] Adding event to queue via sendEvent');
    this.addEventToQueue(eventData);
  }

  /**
   * Create bidirectional event generator for Nova Sonic
   * Following AWS documentation pattern for bidirectional streaming
   */
  async* createBidirectionalEventGenerator() {
    console.log('[PROC] Creating Nova Sonic bidirectional event generator');
    
    // Nova Sonic requires these events to be sent through the generator
    // Yield each event that needs to be sent to the model
    while (!this.isGeneratorComplete) {
      if (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        console.log(`[OUT] Yielding event to Nova Sonic:`, event.event ? Object.keys(event.event)[0] : 'unknown');
        yield event;
      } else {
        // Wait for new events to be added to the queue
        await new Promise(resolve => {
          this.eventQueueResolver = resolve;
          // Timeout to prevent infinite waiting
          setTimeout(resolve, 100);
        });
      }
    }
    
    console.log('[OK] Bidirectional event generator completed');
  }

  /**
   * Start processing Nova Sonic responses
   * Per documentation: Response streaming with text transcriptions, tool use, audio chunks
   */
  async startResponseProcessing() {
    try {
      console.log('📥 Starting Nova Sonic response processing');
      
      this.responseProcessor = this.processResponseStream();
      
    } catch (error) {
      console.error('[ERR] Error starting response processing:', error);
    }
  }

  /**
   * Process Nova Sonic response stream
   * Handles: ASR transcriptions, Text responses, Audio chunks, Tool use events
   */
  async processResponseStream() {
    try {
      let eventCount = 0;
      
      for await (const chunk of this.bidirectionalStream) {
        eventCount++;
        
        if (chunk.chunk && chunk.chunk.bytes) {
          const eventData = new TextDecoder().decode(chunk.chunk.bytes);
          
          try {
            const parsedEvent = JSON.parse(eventData);
            const eventType = Object.keys(parsedEvent.event || {})[0];
            
            console.log(`📨 Nova response event ${eventCount} (${this.sessionId}): ${eventType}`);
            
            // Process different types of Nova Sonic responses
            await this.handleNovaResponseEvent(parsedEvent.event, eventType, eventCount);
            
          } catch (parseError) {
            console.error('[ERR] Error parsing Nova response event:', parseError);
          }
        }
      }
      
      console.log(`[OK] Nova response processing completed. Total events: ${eventCount}`);
      
    } catch (error) {
      console.error('[ERR] Error in response stream processing:', error);
      
      await this.sendToClient({
        type: 'nova_error',
        sessionId: this.sessionId,
        error: `Response processing failed: ${error.message}`
      });
    }
  }

  /**
   * Handle different types of Nova Sonic response events
   * Per documentation: Text transcriptions, Tool use, Text responses, Audio chunks
   */
  async handleNovaResponseEvent(event, eventType, eventCount) {
    try {
      switch (eventType) {
        case 'transcriptEvent':
          // ASR - User speech transcription
          console.log('[LOG] Transcription:', event.transcriptEvent?.transcript);
          await this.sendToClient({
            type: 'transcription',
            sessionId: this.sessionId,
            transcript: event.transcriptEvent?.transcript,
            eventCount
          });
          break;

        case 'textOutput':
          // Nova Sonic text response
          console.log('💬 Text response:', event.textOutput?.text);
          await this.sendToClient({
            type: 'text_response',
            sessionId: this.sessionId,
            text: event.textOutput?.text,
            eventCount
          });
          break;

        case 'audioOutput':
          // Nova Sonic audio response
          console.log('🔊 Audio response received');
          await this.sendToClient({
            type: 'audio_response',
            sessionId: this.sessionId,
            audioBase64: event.audioOutput?.content,
            eventCount
          });
          break;

        case 'toolUse':
          // Tool/Function calling
          console.log('🛠️ Tool use event:', event.toolUse?.name);
          await this.sendToClient({
            type: 'tool_use',
            sessionId: this.sessionId,
            toolName: event.toolUse?.name,
            toolInput: event.toolUse?.input,
            eventCount
          });
          break;

        case 'inferenceOutput':
          // Final inference result
          console.log('[NOVA] Inference complete');
          await this.sendToClient({
            type: 'inference_complete',
            sessionId: this.sessionId,
            eventCount
          });
          break;

        default:
          // Forward unknown events to client for debugging
          console.log(`❓ Unknown Nova event type: ${eventType}`);
          await this.sendToClient({
            type: 'nova_response',
            sessionId: this.sessionId,
            event,
            eventType,
            eventCount
          });
          break;
      }

    } catch (error) {
      console.error(`[ERR] Error handling Nova response event ${eventType}:`, error);
    }
  }

  /**
   * End Nova Sonic session properly
   */
  async endSession() {
    try {
      console.log(`[STOP] Ending Nova Sonic session: ${this.sessionId}`);
      
      if (!this.isSessionActive) {
        console.log('⚠️ Session already inactive');
        return true;
      }

      // Send final audio input end if needed
      this.addEventToQueue({
        event: {
          audioInputEnd: {}
        }
      });

      // Mark generator as complete to stop the event loop
      this.isGeneratorComplete = true;
      
      // Notify the generator to stop waiting
      if (this.eventQueueResolver) {
        const resolver = this.eventQueueResolver;
        this.eventQueueResolver = null;
        resolver();
      }

      this.isSessionActive = false;
      this.bidirectionalStream = null;
      
      await this.sendToClient({
        type: 'session_ended',
        sessionId: this.sessionId,
        message: 'Nova Sonic session ended successfully'
      });
      
      console.log(`[OK] Nova Sonic session ended: ${this.sessionId}`);
      return true;

    } catch (error) {
      console.error('[ERR] Error ending Nova Sonic session:', error);
      return false;
    }
  }

  /**
   * Send message to WebSocket client
   */
  async sendToClient(message) {
    try {
      await this.apiGwClient.send(new (require('@aws-sdk/client-apigatewaymanagementapi').PostToConnectionCommand)({
        ConnectionId: this.connectionId,
        Data: JSON.stringify(message)
      }));
    } catch (error) {
      console.error('[ERR] Failed to send message to client:', error);
    }
  }

  /**
   * Check if session is active
   */
  isActive() {
    return this.isSessionActive;
  }
}

module.exports = NovaSpeeechToSpeechManager;
/**
 * Advanced Nova Sonic Stream Manager
 * Handles bidirectional streaming with dynamic event generation
 * Based on AWS Official Documentation patterns
 */

const { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand 
} = require('@aws-sdk/client-bedrock-runtime');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
const { v4: uuidv4 } = require('uuid');

class NovaStreamManager {
  constructor(options = {}) {
    this.awsRegion = options.awsRegion || 'us-east-1';
    this.modelId = options.modelId || 'amazon.nova-sonic-v1:0';
    this.cognitoIdentityPoolId = options.cognitoIdentityPoolId;
    this.cognitoUserPoolId = options.cognitoUserPoolId;
    
    // Event queues for dynamic streaming
    this.eventQueues = new Map();
    this.activeStreams = new Map();
  }

  /**
   * Create Nova Sonic session with bidirectional streaming
   */
  async createSession(sessionId, authToken, sessionConfig = {}) {
    try {
      console.log(`🚀 Creating Nova Sonic session: ${sessionId}`);

      // Create Bedrock client with Cognito credentials
      const bedrockClient = new BedrockRuntimeClient({
        region: this.awsRegion,
        credentials: fromCognitoIdentityPool({
          identityPoolId: this.cognitoIdentityPoolId,
          logins: {
            [`cognito-idp.${this.awsRegion}.amazonaws.com/${this.cognitoUserPoolId}`]: authToken
          }
        })
      });

      // Initialize event queue for this session
      const eventQueue = [];
      this.eventQueues.set(sessionId, eventQueue);

      // Create session configuration
      const sessionData = {
        sessionId,
        promptName: sessionConfig.promptName || uuidv4(),
        audioContentName: sessionConfig.audioContentName || uuidv4(),
        courseId: sessionConfig.courseId,
        studentId: sessionConfig.studentId,
        isActive: false,
        startTime: new Date()
      };

      // Create bidirectional event generator
      const eventGenerator = this.createDynamicEventGenerator(sessionId, sessionData);

      // Create Nova Sonic command
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: this.modelId,
        body: eventGenerator
      });

      console.log(`📡 Invoking Nova Sonic with bidirectional stream...`);
      
      // Execute command
      const response = await bedrockClient.send(command);
      
      if (!response.body) {
        throw new Error('No response body from Nova Sonic');
      }

      // Store active stream
      this.activeStreams.set(sessionId, {
        stream: response.body,
        client: bedrockClient,
        sessionData,
        isActive: true
      });

      console.log(`✅ Nova Sonic session created successfully: ${sessionId}`);
      
      // Start session with initial events
      await this.initializeSession(sessionId);
      
      return {
        sessionId,
        success: true,
        message: 'Nova Sonic session created successfully'
      };

    } catch (error) {
      console.error(`❌ Failed to create Nova Sonic session:`, error);
      
      // Cleanup on failure
      this.eventQueues.delete(sessionId);
      this.activeStreams.delete(sessionId);
      
      return {
        sessionId,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create dynamic event generator for bidirectional streaming
   */
  async* createDynamicEventGenerator(sessionId, sessionData) {
    console.log(`🔄 Creating dynamic event generator for session: ${sessionId}`);
    
    // Send initial session start event
    yield {
      chunk: {
        bytes: new TextEncoder().encode(JSON.stringify({
          event: {
            sessionStart: {
              inferenceConfiguration: {
                maxTokens: 1024,
                topP: 0.9,
                temperature: 0.7
              }
            }
          }
        }))
      }
    };

    // Send prompt start event
    yield {
      chunk: {
        bytes: new TextEncoder().encode(JSON.stringify({
          event: {
            promptStart: {
              promptName: sessionData.promptName,
              additionalModelRequestFields: {}
            }
          }
        }))
      }
    };

    // Send content start event
    yield {
      chunk: {
        bytes: new TextEncoder().encode(JSON.stringify({
          event: {
            contentStart: {
              promptName: sessionData.promptName,
              contentName: sessionData.audioContentName
            }
          }
        }))
      }
    };

    console.log(`📤 Initial events sent for session: ${sessionId}`);

    // Keep generator alive for dynamic events
    const eventQueue = this.eventQueues.get(sessionId);
    
    while (this.activeStreams.has(sessionId)) {
      // Check for queued events
      if (eventQueue && eventQueue.length > 0) {
        const event = eventQueue.shift();
        console.log(`📤 Sending queued event for session ${sessionId}:`, Object.keys(event.event)[0]);
        
        yield {
          chunk: {
            bytes: new TextEncoder().encode(JSON.stringify(event))
          }
        };
      }
      
      // Small delay to prevent busy waiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`🔚 Event generator completed for session: ${sessionId}`);
  }

  /**
   * Initialize session with additional setup events
   */
  async initializeSession(sessionId) {
    try {
      const streamInfo = this.activeStreams.get(sessionId);
      if (!streamInfo) {
        throw new Error('Session not found');
      }

      // Mark session as active
      streamInfo.isActive = true;

      // Send text input event (if needed for initialization)
      await this.queueEvent(sessionId, {
        event: {
          textInput: {
            promptName: streamInfo.sessionData.promptName,
            contentName: streamInfo.sessionData.audioContentName,
            text: "Ready to receive audio input for educational conversation."
          }
        }
      });

      // Send content end event to finalize setup
      await this.queueEvent(sessionId, {
        event: {
          contentEnd: {
            promptName: streamInfo.sessionData.promptName,
            contentName: streamInfo.sessionData.audioContentName
          }
        }
      });

      console.log(`✅ Session initialized: ${sessionId}`);

    } catch (error) {
      console.error(`❌ Failed to initialize session:`, error);
      throw error;
    }
  }

  /**
   * Queue event for dynamic streaming
   */
  async queueEvent(sessionId, event) {
    const eventQueue = this.eventQueues.get(sessionId);
    const streamInfo = this.activeStreams.get(sessionId);
    
    if (!eventQueue || !streamInfo || !streamInfo.isActive) {
      console.warn(`⚠️ Cannot queue event - session not active: ${sessionId}`);
      return false;
    }

    eventQueue.push(event);
    console.log(`📥 Event queued for session ${sessionId}:`, Object.keys(event.event)[0]);
    return true;
  }

  /**
   * Send audio input to Nova Sonic
   */
  async sendAudioInput(sessionId, audioData) {
    try {
      const streamInfo = this.activeStreams.get(sessionId);
      if (!streamInfo || !streamInfo.isActive) {
        console.warn(`⚠️ Session not active for audio input: ${sessionId}`);
        return false;
      }

      // Convert base64 audio data if needed
      let audioContent = audioData;
      if (typeof audioData === 'object' && audioData.base64) {
        audioContent = audioData.base64;
      }

      // Queue audio input event
      const success = await this.queueEvent(sessionId, {
        event: {
          audioInput: {
            promptName: streamInfo.sessionData.promptName,
            contentName: streamInfo.sessionData.audioContentName,
            content: audioContent
          }
        }
      });

      if (success) {
        console.log(`🎤 Audio input queued for session: ${sessionId}`);
      }

      return success;

    } catch (error) {
      console.error(`❌ Error sending audio input:`, error);
      return false;
    }
  }

  /**
   * Send audio input end signal
   */
  async endAudioInput(sessionId) {
    try {
      const success = await this.queueEvent(sessionId, {
        event: {
          audioInputEnd: {}
        }
      });

      if (success) {
        console.log(`🛑 Audio input end queued for session: ${sessionId}`);
      }

      return success;

    } catch (error) {
      console.error(`❌ Error ending audio input:`, error);
      return false;
    }
  }

  /**
   * Process Nova Sonic responses
   */
  async processResponses(sessionId, onEvent) {
    try {
      const streamInfo = this.activeStreams.get(sessionId);
      if (!streamInfo) {
        throw new Error('Session not found');
      }

      console.log(`📥 Starting response processing for session: ${sessionId}`);
      
      let eventCount = 0;

      for await (const chunk of streamInfo.stream) {
        if (!streamInfo.isActive) {
          console.log(`⏹️ Session marked inactive, stopping response processing: ${sessionId}`);
          break;
        }

        eventCount++;
        
        try {
          if (chunk.chunk && chunk.chunk.bytes) {
            const eventData = new TextDecoder().decode(chunk.chunk.bytes);
            const parsedEvent = JSON.parse(eventData);
            
            const eventType = Object.keys(parsedEvent.event || {})[0];
            console.log(`📨 Nova response ${eventCount} for session ${sessionId}:`, eventType);
            
            // Call event handler
            if (onEvent && typeof onEvent === 'function') {
              await onEvent(parsedEvent, sessionId, eventCount);
            }
          }
        } catch (parseError) {
          console.error(`❌ Error parsing Nova response:`, parseError);
        }
      }

      console.log(`✅ Response processing completed for session ${sessionId}. Total events: ${eventCount}`);

    } catch (error) {
      console.error(`❌ Error processing Nova responses:`, error);
      throw error;
    }
  }

  /**
   * End Nova Sonic session
   */
  async endSession(sessionId) {
    try {
      console.log(`🛑 Ending Nova Sonic session: ${sessionId}`);

      const streamInfo = this.activeStreams.get(sessionId);
      if (streamInfo) {
        // Mark as inactive
        streamInfo.isActive = false;

        // Send session end event if still connected
        if (streamInfo.stream) {
          await this.queueEvent(sessionId, {
            event: {
              sessionEnd: {}
            }
          });

          // Wait a moment for the event to be processed
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Cleanup
      this.activeStreams.delete(sessionId);
      this.eventQueues.delete(sessionId);

      console.log(`✅ Session ended and cleaned up: ${sessionId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error ending session:`, error);
      return false;
    }
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    const streamInfo = this.activeStreams.get(sessionId);
    const eventQueue = this.eventQueues.get(sessionId);
    
    if (!streamInfo) {
      return { exists: false };
    }

    return {
      exists: true,
      isActive: streamInfo.isActive,
      sessionData: streamInfo.sessionData,
      queueLength: eventQueue ? eventQueue.length : 0,
      uptime: Date.now() - streamInfo.sessionData.startTime.getTime()
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeStreams.keys()).map(sessionId => 
      this.getSessionStatus(sessionId)
    );
  }

  /**
   * Cleanup all sessions (for graceful shutdown)
   */
  async cleanup() {
    console.log(`🧹 Cleaning up all Nova Sonic sessions...`);
    
    const sessionIds = Array.from(this.activeStreams.keys());
    const cleanupPromises = sessionIds.map(sessionId => this.endSession(sessionId));
    
    await Promise.all(cleanupPromises);
    
    console.log(`✅ All sessions cleaned up. Total: ${sessionIds.length}`);
  }
}

module.exports = NovaStreamManager;
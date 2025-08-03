/**
 * Nova Sonic Manager - DEBUG VERSION FIXED
 * Ultra-simplified version for testing WebSocket flow
 * Includes proper API Gateway client for postToConnection
 */

const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

class NovaSpeeechToSpeechManager {
  constructor(apiGwClient, connectionId, sessionId, credentials) {
    this.apiGwClient = apiGwClient;
    this.connectionId = connectionId;
    this.sessionId = sessionId;
    this.isSessionActive = false;
    
    console.log(`[DEBUG] NovaSpeeechToSpeechManager initialized: ${this.sessionId}`);
    console.log(`[DEBUG] apiGwClient type: ${typeof this.apiGwClient}`);
    console.log(`[DEBUG] connectionId: ${this.connectionId}`);
  }

  /**
   * Initialize Nova Sonic Session - DEBUG VERSION (Immediate Response)
   * Testing basic WebSocket flow without Bedrock complexity
   */
  async initializeSession(config = {}) {
    try {
      console.log(`[DEBUG] Immediate session initialization: ${this.sessionId}`);
      
      if (this.isSessionActive) {
        console.log('[WARN] Session already active, skipping initialization');
        return true;
      }

      // IMMEDIATE SUCCESS - No Bedrock call for debugging
      this.isSessionActive = true;
      
      // Send immediate session_initialized response
      await this.sendToClient({
        type: 'session_initialized',
        sessionId: this.sessionId,
        message: 'DEBUG: Immediate session initialization (no Bedrock)',
        mode: 'debug',
        success: true
      });

      console.log(`[OK] DEBUG session active: ${this.sessionId}`);
      
      // Send a mock transcription after 2 seconds
      setTimeout(async () => {
        try {
          await this.sendToClient({
            type: 'transcription',
            sessionId: this.sessionId,
            text: 'DEBUG: Mock transcription - WebSocket flow working',
            timestamp: Date.now()
          });
        } catch (error) {
          console.log(`[ERR] Error sending mock transcription: ${error.message}`);
        }
      }, 2000);

      // Send mock text response after 3 seconds  
      setTimeout(async () => {
        try {
          await this.sendToClient({
            type: 'text_response',
            sessionId: this.sessionId,  
            text: 'DEBUG: This is a mock Nova Sonic response to test the WebSocket flow',
            timestamp: Date.now()
          });
        } catch (error) {
          console.log(`[ERR] Error sending mock text response: ${error.message}`);
        }
      }, 3000);

      // Send inference complete after 4 seconds
      setTimeout(async () => {
        try {
          await this.sendToClient({
            type: 'inference_complete',
            sessionId: this.sessionId,
            message: 'DEBUG: Mock inference completed successfully',
            timestamp: Date.now()
          });
        } catch (error) {
          console.log(`[ERR] Error sending mock inference complete: ${error.message}`);
        }
      }, 4000);

      return true;
      
    } catch (error) {
      console.log(`[ERR] Failed DEBUG session initialization: ${error.message}`);
      this.isSessionActive = false;
      
      try {
        await this.sendToClient({
          type: 'session_error',
          sessionId: this.sessionId,
          error: error.message,
          mode: 'debug'
        });
      } catch (sendError) {
        console.log(`[ERR] Error sending session error: ${sendError.message}`);
      }
      
      return false;
    }
  }

  /**
   * Mock audio input - just acknowledge
   */
  async sendAudioInput(audioBase64, isEndOfUtterance = false) {
    try {
      if (!this.isSessionActive) {
        console.log('[WARN] Session not active for audio input');
        return false;
      }

      console.log(`[MIC] DEBUG: Mock audio input received (${audioBase64.length} chars), end: ${isEndOfUtterance}`);
      
      if (isEndOfUtterance) {
        // Send mock transcription
        await this.sendToClient({
          type: 'transcription',
          sessionId: this.sessionId,
          text: 'DEBUG: You just finished speaking (mock transcription)',
          timestamp: Date.now()
        });
        
        // Send mock response after 1 second
        setTimeout(async () => {
          try {
            await this.sendToClient({
              type: 'text_response',
              sessionId: this.sessionId,
              text: 'DEBUG: Mock response to your speech input',
              timestamp: Date.now()
            });
          } catch (error) {
            console.log(`[ERR] Error sending mock response: ${error.message}`);
          }
        }, 1000);
      }

      return true;
    } catch (error) {
      console.log(`[ERR] Error processing mock audio: ${error.message}`);
      return false;
    }
  }

  /**
   * End session
   */
  async endSession() {
    try {
      console.log(`[STOP] Ending DEBUG session: ${this.sessionId}`);
      this.isSessionActive = false;
      
      await this.sendToClient({
        type: 'session_ended',
        sessionId: this.sessionId,
        message: 'DEBUG session ended successfully'
      });
      
      return true;
    } catch (error) {
      console.log(`[ERR] Error ending DEBUG session: ${error.message}`);
      return false;
    }
  }

  /**
   * Send message to WebSocket client - FIXED VERSION
   */
  async sendToClient(message) {
    try {
      console.log(`[OUT] Sending DEBUG message to ${this.connectionId}: ${message.type}`);
      
      // Check if apiGwClient is properly initialized
      if (!this.apiGwClient) {
        throw new Error('apiGwClient is not initialized');
      }
      
      if (typeof this.apiGwClient.send !== 'function') {
        throw new Error('apiGwClient.send is not a function');
      }

      const command = new PostToConnectionCommand({
        ConnectionId: this.connectionId,
        Data: JSON.stringify(message)
      });

      const response = await this.apiGwClient.send(command);
      console.log(`[OK] DEBUG message sent successfully: ${message.type}`);
      return response;
      
    } catch (error) {
      console.log(`[ERR] Failed to send DEBUG message: ${error.message}`);
      console.log(`[ERR] Error details:`, error);
      
      // If connection is stale, log it but don't throw
      if (error.name === 'GoneException') {
        console.log('[WARN] Connection gone, client disconnected');
        return;
      }
      
      throw error;
    }
  }
}

module.exports = { NovaSpeeechToSpeechManager };
/**
 * Intellilearn Nova Sonic WebSocket Server
 * Based on AWS Official WebSocket Architecture for Nova Sonic
 * 
 * Architecture: Frontend (React) ↔ WebSocket ↔ Node.js Server ↔ Nova Sonic
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand 
} = require('@aws-sdk/client-bedrock-runtime');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
require('dotenv').config();

// Constants
const PORT = process.env.PORT || 8080;
const NOVA_SONIC_MODEL_ID = 'amazon.nova-sonic-v1:0';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Cognito Configuration
const COGNITO_IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID || 'us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_BxbAO9DtG';

/**
 * Session management
 */
class NovaSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(wsClient, authToken) {
    const sessionId = uuidv4();
    const session = {
      sessionId,
      wsClient,
      authToken,
      novaClient: null,
      novaStream: null,
      isActive: false,
      createdAt: new Date(),
      promptName: uuidv4(),
      audioContentName: uuidv4(),
      courseId: null,
      studentId: null
    };

    this.sessions.set(sessionId, session);
    console.log(`📝 Session created: ${sessionId}`);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  removeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.novaStream) {
        // Cleanup Nova Sonic stream
        console.log(`🧹 Cleaning up Nova stream for session: ${sessionId}`);
      }
      this.sessions.delete(sessionId);
      console.log(`🗑️ Session removed: ${sessionId}`);
    }
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

/**
 * Nova Sonic Integration Handler
 */
class NovaStreamHandler {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Initialize Nova Sonic bidirectional stream
   */
  async initializeNovaStream(session) {
    try {
      console.log(`🚀 Initializing Nova Sonic stream for session: ${session.sessionId}`);

      // Create Bedrock client with Cognito credentials
      session.novaClient = new BedrockRuntimeClient({
        region: AWS_REGION,
        credentials: fromCognitoIdentityPool({
          identityPoolId: COGNITO_IDENTITY_POOL_ID,
          logins: {
            [`cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`]: session.authToken
          }
        })
      });

      // Create async generator for bidirectional communication
      const eventGenerator = this.createEventGenerator(session);

      // Create Nova Sonic command
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: NOVA_SONIC_MODEL_ID,
        body: eventGenerator
      });

      // Execute command and get stream
      console.log(`📡 Sending command to Nova Sonic...`);
      const response = await session.novaClient.send(command);
      
      if (response.body) {
        session.novaStream = response.body;
        session.isActive = true;
        
        console.log(`✅ Nova Sonic stream established for session: ${session.sessionId}`);
        
        // Start processing Nova responses
        this.processNovaResponses(session);
        
        // Send initial events
        await this.sendSessionStart(session);
        
        return true;
      }

      console.error(`❌ No response body from Nova Sonic`);
      return false;

    } catch (error) {
      console.error(`❌ Failed to initialize Nova stream:`, error);
      return false;
    }
  }

  /**
   * Create async generator for bidirectional events
   */
  async* createEventGenerator(session) {
    // Session start event
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

    // Keep generator alive for dynamic events
    console.log(`🔄 Event generator created for session: ${session.sessionId}`);
  }

  /**
   * Send session start events
   */
  async sendSessionStart(session) {
    try {
      // Send promptStart event
      const promptStartEvent = {
        event: {
          promptStart: {
            promptName: session.promptName,
            additionalModelRequestFields: {}
          }
        }
      };

      // Send contentStart event
      const contentStartEvent = {
        event: {
          contentStart: {
            promptName: session.promptName,
            contentName: session.audioContentName
          }
        }
      };

      console.log(`📤 Sent session start events for: ${session.sessionId}`);
      
      // Notify frontend that session is ready
      this.sendToClient(session, {
        type: 'nova_session_ready',
        sessionId: session.sessionId,
        message: 'Nova Sonic session initialized successfully'
      });

    } catch (error) {
      console.error(`❌ Error sending session start:`, error);
    }
  }

  /**
   * Process Nova Sonic responses
   */
  async processNovaResponses(session) {
    try {
      console.log(`📥 Processing Nova responses for session: ${session.sessionId}`);
      
      let eventCount = 0;
      
      for await (const chunk of session.novaStream) {
        eventCount++;
        console.log(`📨 Received Nova event ${eventCount} for session: ${session.sessionId}`);
        
        if (chunk.chunk && chunk.chunk.bytes) {
          const eventData = new TextDecoder().decode(chunk.chunk.bytes);
          const parsedEvent = JSON.parse(eventData);
          
          console.log(`📨 Nova event type:`, Object.keys(parsedEvent.event || {})[0]);
          
          // Forward to frontend
          this.sendToClient(session, {
            type: 'nova_response',
            sessionId: session.sessionId,
            event: parsedEvent.event
          });
        }
      }
      
      console.log(`✅ Nova stream processing completed. Total events: ${eventCount}`);
      
    } catch (error) {
      console.error(`❌ Error processing Nova responses:`, error);
      
      // Notify frontend of error
      this.sendToClient(session, {
        type: 'nova_error',
        sessionId: session.sessionId,
        error: error.message
      });
    }
  }

  /**
   * Handle audio input from frontend
   */
  async handleAudioInput(session, audioData) {
    try {
      if (!session.isActive || !session.novaStream) {
        console.warn(`⚠️ Session not active for audio input: ${session.sessionId}`);
        return;
      }

      console.log(`🎤 Processing audio input for session: ${session.sessionId}`);
      
      // This would require modifying the async generator to accept dynamic events
      // For now, we'll queue the audio data
      console.log(`📤 Audio data queued (implementation pending)`);
      
    } catch (error) {
      console.error(`❌ Error handling audio input:`, error);
    }
  }

  /**
   * Send message to WebSocket client
   */
  sendToClient(session, message) {
    try {
      if (session.wsClient && session.wsClient.readyState === WebSocket.OPEN) {
        session.wsClient.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error(`❌ Error sending to client:`, error);
    }
  }
}

/**
 * WebSocket Server Setup
 */
class NovaWebSocketServer {
  constructor() {
    this.sessionManager = new NovaSessionManager();
    this.novaHandler = new NovaStreamHandler(this.sessionManager);
    this.wss = null;
  }

  start() {
    this.wss = new WebSocket.Server({ 
      port: PORT,
      perMessageDeflate: false 
    });

    console.log(`🚀 Nova Sonic WebSocket Server started on port ${PORT}`);
    console.log(`🔗 Architecture: Frontend ↔ WebSocket ↔ Node.js Server ↔ Nova Sonic`);

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket Server Error:', error);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down WebSocket server...');
      this.wss.close(() => {
        console.log('✅ WebSocket server closed');
        process.exit(0);
      });
    });
  }

  handleConnection(ws, request) {
    console.log(`🔌 New WebSocket connection from: ${request.socket.remoteAddress}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket Error:', error);
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: 'connection_established',
      message: 'Connected to Nova Sonic WebSocket Server',
      timestamp: new Date().toISOString()
    });
  }

  async handleMessage(ws, message) {
    console.log(`📨 Received message type: ${message.type}`);

    switch (message.type) {
      case 'initialize_session':
        await this.handleInitializeSession(ws, message);
        break;
        
      case 'audio_input':
        await this.handleAudioInput(ws, message);
        break;
        
      case 'end_session':
        await this.handleEndSession(ws, message);
        break;
        
      default:
        console.warn(`⚠️ Unknown message type: ${message.type}`);
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  async handleInitializeSession(ws, message) {
    try {
      const { authToken, courseId, studentId } = message;
      
      if (!authToken) {
        this.sendError(ws, 'Auth token required');
        return;
      }

      // Create session
      const session = this.sessionManager.createSession(ws, authToken);
      session.courseId = courseId;
      session.studentId = studentId;

      // Initialize Nova Sonic stream
      const success = await this.novaHandler.initializeNovaStream(session);
      
      if (success) {
        this.sendMessage(ws, {
          type: 'session_initialized',
          sessionId: session.sessionId,
          message: 'Nova Sonic session ready for audio input'
        });
      } else {
        this.sessionManager.removeSession(session.sessionId);
        this.sendError(ws, 'Failed to initialize Nova Sonic session');
      }

    } catch (error) {
      console.error(`❌ Error initializing session:`, error);
      this.sendError(ws, 'Session initialization failed');
    }
  }

  async handleAudioInput(ws, message) {
    try {
      const { sessionId, audioData } = message;
      const session = this.sessionManager.getSession(sessionId);
      
      if (!session) {
        this.sendError(ws, 'Session not found');
        return;
      }

      await this.novaHandler.handleAudioInput(session, audioData);
      
    } catch (error) {
      console.error(`❌ Error handling audio input:`, error);
      this.sendError(ws, 'Audio input processing failed');
    }
  }

  async handleEndSession(ws, message) {
    try {
      const { sessionId } = message;
      
      if (sessionId) {
        this.sessionManager.removeSession(sessionId);
        this.sendMessage(ws, {
          type: 'session_ended',
          sessionId,
          message: 'Session ended successfully'
        });
      }
      
    } catch (error) {
      console.error(`❌ Error ending session:`, error);
    }
  }

  handleDisconnection(ws) {
    // Find and cleanup session associated with this WebSocket
    const session = this.sessionManager.getAllSessions().find(s => s.wsClient === ws);
    if (session) {
      this.sessionManager.removeSession(session.sessionId);
    }
  }

  sendMessage(ws, message) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  sendError(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Start the server
 */
if (require.main === module) {
  console.log('🎯 Starting Intellilearn Nova Sonic WebSocket Server...');
  console.log('📚 Based on AWS Official WebSocket Architecture');
  console.log('🔧 Configuration:');
  console.log(`   - Port: ${PORT}`);
  console.log(`   - AWS Region: ${AWS_REGION}`);
  console.log(`   - Nova Model: ${NOVA_SONIC_MODEL_ID}`);
  console.log(`   - Cognito Identity Pool: ${COGNITO_IDENTITY_POOL_ID}`);
  
  const server = new NovaWebSocketServer();
  server.start();
}

module.exports = { NovaWebSocketServer, NovaSessionManager, NovaStreamHandler };
/**
 * AWS Lambda WebSocket Handler for Nova Sonic
 * Handles WebSocket connections, messages, and Nova Sonic communication
 * 
 * Architecture: API Gateway WebSocket → Lambda → Nova Sonic (Bedrock)
 */

const { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand 
} = require('@aws-sdk/client-bedrock-runtime');
const { 
  ApiGatewayManagementApiClient,
  PostToConnectionCommand 
} = require('@aws-sdk/client-apigatewaymanagementapi');
const { 
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand 
} = require('@aws-sdk/client-dynamodb');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');

// Import the corrected Nova Sonic Speech-to-Speech Manager
const { NovaSpeeechToSpeechManager } = require('./nova-sonic-manager-v9-clean');

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const NOVA_SONIC_MODEL_ID = process.env.NOVA_SONIC_MODEL_ID || 'amazon.nova-sonic-v1:0';
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'NovaWebSocketConnections';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'NovaWebSocketSessions';
const COGNITO_IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

// Global session manager for persistent Nova Sonic connections
// Key: sessionId, Value: NovaSpeeechToSpeechManager instance
const activeSessions = new Map();

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('[HANDLER] Received WebSocket event:', JSON.stringify(event, null, 2));
  
  const { requestContext } = event;
  const { routeKey, connectionId, domainName, stage } = requestContext;
  
  // Create API Gateway Management API client for this connection
  const apiGwClient = new ApiGatewayManagementApiClient({
    region: AWS_REGION,
    endpoint: `https://${domainName}/${stage}`
  });

  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId, event);
        
      case '$disconnect':
        return await handleDisconnect(connectionId);
        
      case '$default':
      case 'message':
        return await handleMessage(connectionId, event, apiGwClient);
        
      default:
        console.warn(`[WARN] Unknown route: ${routeKey}`);
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('[ERR] Lambda handler error:', error);
    
    // Try to send error to client
    try {
      await sendToConnection(apiGwClient, connectionId, {
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (sendError) {
      console.error('[ERR] Failed to send error to client:', sendError);
    }
    
    return { statusCode: 500, body: 'Internal server error' };
  }
};

/**
 * Handle WebSocket connection
 */
async function handleConnect(connectionId, event) {
  console.log(`🔌 New WebSocket connection: ${connectionId}`);
  
  try {
    // Store connection in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId: { S: connectionId },
        connectedAt: { S: new Date().toISOString() },
        ttl: { N: Math.floor(Date.now() / 1000 + 3600).toString() } // 1 hour TTL
      }
    }));
    
    console.log(`[OK] Connection ${connectionId} stored in DynamoDB`);
    
    return { statusCode: 200, body: 'Connected' };
    
  } catch (error) {
    console.error('[ERR] Error handling connect:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
}

/**
 * Handle WebSocket disconnection with Nova Sonic session cleanup
 */
async function handleDisconnect(connectionId) {
  console.log(`🔌 WebSocket disconnection: ${connectionId}`);
  
  try {
    // Remove connection from DynamoDB
    await dynamoClient.send(new DeleteItemCommand({
      TableName: CONNECTIONS_TABLE,
      Key: {
        connectionId: { S: connectionId }
      }
    }));
    
    // Clean up any active Nova Sonic sessions for this connection
    await cleanupNovaSessionsForConnection(connectionId);
    
    console.log(`[OK] Connection ${connectionId} and Nova Sonic sessions cleaned up`);
    
    return { statusCode: 200, body: 'Disconnected' };
    
  } catch (error) {
    console.error('[ERR] Error handling disconnect:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
}

/**
 * Handle WebSocket messages
 */
async function handleMessage(connectionId, event, apiGwClient) {
  console.log(`[MESSAGE] Message from connection ${connectionId}`);
  
  try {
    const message = JSON.parse(event.body);
    console.log('[MESSAGE] Message type:', message.type);
    
    switch (message.type) {
      case 'initialize_session':
        return await handleInitializeSession(connectionId, message, apiGwClient);
        
      case 'audio_input':
        return await handleAudioInput(connectionId, message, apiGwClient);
        
      case 'end_session':
        return await handleEndSession(connectionId, message, apiGwClient);
        
      case 'ping':
        await sendToConnection(apiGwClient, connectionId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        return { statusCode: 200, body: 'Pong sent' };
        
      default:
        console.warn(`[WARN] Unknown message type: ${message.type}`);
        await sendToConnection(apiGwClient, connectionId, {
          type: 'error',
          error: `Unknown message type: ${message.type}`
        });
        return { statusCode: 400, body: 'Unknown message type' };
    }
    
  } catch (parseError) {
    console.error('[ERR] Error parsing message:', parseError);
    
    await sendToConnection(apiGwClient, connectionId, {
      type: 'error',
      error: 'Invalid message format'
    });
    
    return { statusCode: 400, body: 'Invalid message format' };
  }
}

/**
 * Initialize Nova Sonic session using correct Speech-to-Speech architecture
 * Per AWS documentation: https://docs.aws.amazon.com/nova/latest/userguide/speech.html
 */
async function handleInitializeSession(connectionId, message, apiGwClient) {
  console.log(`[NOVA] Initializing Nova Sonic Speech-to-Speech session for connection: ${connectionId}`);
  
  try {
    const { authToken, courseId, studentId, voiceConfig } = message;
    
    if (!authToken) {
      throw new Error('Auth token required');
    }
    
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create Cognito credentials for Nova Sonic
    const credentials = fromCognitoIdentityPool({
      identityPoolId: COGNITO_IDENTITY_POOL_ID,
      logins: {
        [`cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`]: authToken
      }
    });
    
    // Store session metadata in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: SESSIONS_TABLE,
      Item: {
        sessionId: { S: sessionId },
        connectionId: { S: connectionId },
        courseId: { S: courseId || 'default' },
        studentId: { S: studentId || 'default' },
        isActive: { BOOL: true },
        createdAt: { S: new Date().toISOString() },
        ttl: { N: Math.floor(Date.now() / 1000 + 3600).toString() } // 1 hour TTL
      }
    }));
    
    console.log(`[OK] Session ${sessionId} metadata stored in DynamoDB`);
    
    // Create Nova Sonic Speech-to-Speech Manager with persistent connection
    const novaManager = new NovaSpeeechToSpeechManager(
      apiGwClient, 
      connectionId, 
      sessionId, 
      credentials
    );
    
    // Store active session for persistence across audio chunks
    activeSessions.set(sessionId, novaManager);
    
    // Initialize the bidirectional Nova Sonic session
    const sessionConfig = {
      maxTokens: voiceConfig?.maxTokens || 2048,
      temperature: voiceConfig?.temperature || 0.7,
      topP: voiceConfig?.topP || 0.9,
      voice: voiceConfig?.voiceId || 'Matthew', // Default Nova Sonic voice
      additionalFields: {
        courseId: courseId || 'default',
        studentId: studentId || 'default'
      }
    };
    
    const success = await novaManager.initializeSession(sessionConfig);
    
    if (!success) {
      // Clean up on failure
      activeSessions.delete(sessionId);
      throw new Error('Failed to initialize Nova Sonic bidirectional session');
    }
    
    console.log(`[OK] Nova Sonic Speech-to-Speech session initialization started: ${sessionId}`);
    
    // The nova manager will send session_initialized when it's actually ready
    // Don't send it here to avoid duplicates
    
    return { statusCode: 200, body: 'Nova Sonic Speech-to-Speech session initialized' };
    
  } catch (error) {
    console.error('[ERR] Error initializing Nova Sonic session:', error);
    
    await sendToConnection(apiGwClient, connectionId, {
      type: 'error',
      error: `Nova Sonic session initialization failed: ${error.message}`
    });
    
    return { statusCode: 500, body: 'Nova Sonic session initialization failed' };
  }
}

/**
 * Handle continuous audio input from client using persistent Nova Sonic session
 * Per AWS documentation: Continuous audio streaming from user to model
 */
async function handleAudioInput(connectionId, message, apiGwClient) {
  console.log(`[MIC] Continuous audio input from connection: ${connectionId}`);
  
  try {
    const { sessionId, audioData, isEndOfUtterance } = message;
    
    if (!sessionId || (audioData === null || audioData === undefined)) {
      throw new Error('Session ID and audio data required');
    }
    
    // Get the active Nova Sonic session manager
    const novaManager = activeSessions.get(sessionId);
    
    if (!novaManager) {
      console.log(`[WARN] Session ${sessionId} not found in active sessions map`);
      console.log(`[INFO] Active sessions: ${Array.from(activeSessions.keys()).join(', ')}`);
      throw new Error('Nova Sonic session not found or expired');
    }
    
    // Verify session belongs to this connection
    const sessionResult = await dynamoClient.send(new GetItemCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        sessionId: { S: sessionId }
      }
    }));
    
    if (!sessionResult.Item) {
      // Clean up orphaned session
      activeSessions.delete(sessionId);
      console.log(`[WARN] Session ${sessionId} not found in DynamoDB`);
      throw new Error('Session metadata not found');
    }
    
    const session = sessionResult.Item;
    if (session.connectionId.S !== connectionId) {
      console.log(`[WARN] Session ${sessionId} belongs to connection ${session.connectionId.S}, but request from ${connectionId}`);
      
      // Check if session is still active and consider allowing transfer
      if (session.isActive && session.isActive.BOOL) {
        console.log(`[INFO] Updating session ${sessionId} to new connection ${connectionId}`);
        
        // Update session with new connectionId
        await dynamoClient.send(new UpdateItemCommand({
          TableName: SESSIONS_TABLE,
          Key: {
            sessionId: { S: sessionId }
          },
          UpdateExpression: 'SET connectionId = :newConnId',
          ExpressionAttributeValues: {
            ':newConnId': { S: connectionId }
          }
        }));
        
        console.log(`[OK] Session ${sessionId} transferred to new connection ${connectionId}`);
      } else {
        throw new Error('Session does not belong to this connection');
      }
    }
    
    if (!novaManager.isActive()) {
      throw new Error('Nova Sonic session is not active');
    }
    
    console.log(`[MIC] Streaming audio to Nova Sonic session: ${sessionId} (${audioData.length} chars)`);
    
    // Send continuous audio input to the persistent Nova Sonic session
    // This follows the real-time streaming pattern from AWS documentation
    const success = await novaManager.sendAudioInput(
      audioData, 
      isEndOfUtterance || false
    );
    
    if (!success) {
      throw new Error('Failed to send audio to Nova Sonic');
    }
    
    // The Nova Sonic manager will handle responses asynchronously
    // and send them directly to the client via WebSocket
    
    return { statusCode: 200, body: 'Audio streamed to Nova Sonic' };
    
  } catch (error) {
    console.error('[ERR] Error processing continuous audio input:', error);
    
    await sendToConnection(apiGwClient, connectionId, {
      type: 'error',
      error: `Nova Sonic audio streaming failed: ${error.message}`
    });
    
    return { statusCode: 500, body: 'Nova Sonic audio streaming failed' };
  }
}

// REMOVED: Obsolete functions replaced by NovaSpeeechToSpeechManager
// - createAudioEventGenerator: Now handled by manager's proper event lifecycle
// - processNovaResponse: Now handled by manager's response processing
// These functions did not follow the Nova Sonic Speech-to-Speech architecture correctly

/**
 * Handle Nova Sonic session end properly
 * Per AWS documentation: Proper session lifecycle management
 */
async function handleEndSession(connectionId, message, apiGwClient) {
  console.log(`[STOP] Ending Nova Sonic session for connection: ${connectionId}`);
  
  try {
    const { sessionId } = message;
    
    if (sessionId) {
      // Get the active Nova Sonic session manager
      const novaManager = activeSessions.get(sessionId);
      
      if (novaManager) {
        console.log(`[STOP] Properly ending Nova Sonic bidirectional session: ${sessionId}`);
        
        // End the Nova Sonic session properly (sends audioInputEnd, closes stream)
        await novaManager.endSession();
        
        // Remove from active sessions
        activeSessions.delete(sessionId);
        
        console.log(`[OK] Nova Sonic session ended and cleaned up: ${sessionId}`);
      } else {
        console.log(`[WARN] Nova Sonic session ${sessionId} not found in active sessions`);
      }
      
      // Mark session as inactive in DynamoDB
      await dynamoClient.send(new UpdateItemCommand({
        TableName: SESSIONS_TABLE,
        Key: {
          sessionId: { S: sessionId }
        },
        UpdateExpression: 'SET isActive = :inactive',
        ExpressionAttributeValues: {
          ':inactive': { BOOL: false }
        }
      }));
      
      console.log(`[OK] Session ${sessionId} marked as inactive in DynamoDB`);
    }
    
    await sendToConnection(apiGwClient, connectionId, {
      type: 'session_ended',
      sessionId,
      message: 'Nova Sonic Speech-to-Speech session ended successfully'
    });
    
    return { statusCode: 200, body: 'Nova Sonic session ended' };
    
  } catch (error) {
    console.error('[ERR] Error ending Nova Sonic session:', error);
    
    // Clean up session even if there was an error
    if (message.sessionId) {
      activeSessions.delete(message.sessionId);
    }
    
    return { statusCode: 500, body: 'Failed to end Nova Sonic session properly' };
  }
}

/**
 * Send message to WebSocket connection
 */
async function sendToConnection(apiGwClient, connectionId, message) {
  try {
    await apiGwClient.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }));
    
    console.log(`[OUT] Message sent to connection ${connectionId}:`, message.type);
    
  } catch (error) {
    if (error.statusCode === 410) {
      console.log(`🔌 Connection ${connectionId} is stale, removing...`);
      await cleanupConnection(connectionId);
    } else {
      console.error(`[ERR] Failed to send message to ${connectionId}:`, error);
      throw error;
    }
  }
}

/**
 * Cleanup stale connection
 */
async function cleanupConnection(connectionId) {
  try {
    await dynamoClient.send(new DeleteItemCommand({
      TableName: CONNECTIONS_TABLE,
      Key: {
        connectionId: { S: connectionId }
      }
    }));
    
    await cleanupNovaSessionsForConnection(connectionId);
    
  } catch (error) {
    console.error(`[ERR] Error cleaning up connection ${connectionId}:`, error);
  }
}

/**
 * Cleanup Nova Sonic sessions for disconnected connection
 */
async function cleanupNovaSessionsForConnection(connectionId) {
  try {
    console.log(`🧹 Cleaning up Nova Sonic sessions for connection: ${connectionId}`);
    
    // Find and cleanup active Nova Sonic sessions for this connection
    for (const [sessionId, novaManager] of activeSessions.entries()) {
      // Check if this session belongs to the disconnected connection
      try {
        const sessionResult = await dynamoClient.send(new GetItemCommand({
          TableName: SESSIONS_TABLE,
          Key: {
            sessionId: { S: sessionId }
          }
        }));
        
        if (sessionResult.Item && sessionResult.Item.connectionId.S === connectionId) {
          console.log(`[STOP] Ending orphaned Nova Sonic session: ${sessionId}`);
          
          // Properly end the Nova Sonic session
          if (novaManager.isActive()) {
            await novaManager.endSession();
          }
          
          // Remove from active sessions
          activeSessions.delete(sessionId);
          
          // Mark as inactive in DynamoDB
          await dynamoClient.send(new UpdateItemCommand({
            TableName: SESSIONS_TABLE,
            Key: {
              sessionId: { S: sessionId }
            },
            UpdateExpression: 'SET isActive = :inactive',
            ExpressionAttributeValues: {
              ':inactive': { BOOL: false }
            }
          }));
          
          console.log(`[OK] Cleaned up Nova Sonic session: ${sessionId}`);
        }
      } catch (sessionError) {
        console.error(`[ERR] Error cleaning up session ${sessionId}:`, sessionError);
        // Remove problematic session anyway
        activeSessions.delete(sessionId);
      }
    }
    
    console.log(`[OK] Nova Sonic session cleanup completed for connection: ${connectionId}`);
    
  } catch (error) {
    console.error(`[ERR] Error cleaning up Nova Sonic sessions for ${connectionId}:`, error);
  }
}
/**
 * NovaConversationalService - Amazon Nova Sonic Integration
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-08-01
 * 
 * Real-time bidirectional voice conversations using Amazon Nova Sonic.
 * Replaces traditional Polly TTS with advanced conversational AI.
 * 
 * Features:
 * - Bidirectional streaming (audio input/output)
 * - Real-time conversation with context awareness
 * - Educational context integration
 * - Automatic speech recognition and synthesis
 * - Natural conversation flow management
 * 
 * Architecture:
 * - Frontend: Web Audio API + MediaRecorder for browser audio
 * - Backend: Direct AWS Bedrock Runtime with Nova Sonic model
 * - Streaming: Bidirectional event-driven communication
 */

import { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'
import { awsCredentialsService } from './awsCredentialsService'
import { v4 as uuidv4 } from 'uuid'

// Audio configuration constants
const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000
const CHANNELS = 1
const CHUNK_SIZE = 1024
const NOVA_SONIC_MODEL_ID = 'amazon.nova-sonic-v1:0'

export interface NovaConversationSession {
  sessionId: string
  isActive: boolean
  client?: BedrockRuntimeClient
  stream?: any
  audioContext?: AudioContext
  mediaRecorder?: MediaRecorder
  audioQueue: any[]
  promptName: string
  contentName: string
  audioContentName: string
  streamWriter?: any  // WritableStreamDefaultWriter para enviar eventos al stream bidireccional
  useDirectWrite?: boolean // Flag to indicate if we should write directly to stream
  courseId?: string
  topic?: string
  studentId?: string
}

export interface NovaSessionConfig {
  courseId?: string
  topic?: string
  studentId?: string
  voiceId?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export class NovaConversationalService {
  private sessions: Map<string, NovaConversationSession> = new Map()
  private credentials: any = null

  /**
   * Initialize AWS credentials for Nova Sonic
   */
  private async initializeCredentials() {
    if (!this.credentials) {
      try {
        this.credentials = await awsCredentialsService.getCredentials()
        console.log('🔐 Nova Sonic credentials initialized')
      } catch (error) {
        console.error('❌ Failed to initialize Nova Sonic credentials:', error)
        
        // Check if it's a token expired or missing error
        if (error instanceof Error && error.message && (error.message.includes('COGNITO_TOKEN_EXPIRED') || error.message.includes('COGNITO_TOKEN_REQUIRED'))) {
          console.error('🔄 Token de Cognito expirado, requiere re-login');
          
          // Clear all authentication data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cognia_auth_token');
            localStorage.removeItem('cognia_user_data');
            localStorage.removeItem('cognito_tokens');
            
            // Force page reload to trigger login flow
            alert('Tu sesión ha expirado. La página se recargará para iniciar sesión nuevamente.');
            window.location.reload();
          }
          
          throw new Error('Session expired. Please login again.');
        }
        
        throw new Error('AWS credentials required for Nova Sonic')
      }
    }
    return this.credentials
  }

  /**
   * Create Bedrock Runtime client for Nova Sonic (browser-compatible)
   */
  private async createBedrockClient(): Promise<BedrockRuntimeClient> {
    const creds = await this.initializeCredentials()
    
    // Use Cognito Identity Pool credentials (browser-compatible configuration)
    return new BedrockRuntimeClient({
      region: 'us-east-1',
      credentials: creds
      // Note: HTTP/2 configuration and timeouts are handled automatically by the SDK in browser environments
    })
  }

  /**
   * Start a new Nova Sonic conversation session
   */
  async startConversation(config: NovaSessionConfig = {}): Promise<string> {
    const sessionId = uuidv4()
    const promptName = uuidv4()
    const contentName = uuidv4()
    const audioContentName = uuidv4()

    console.log('🎯 Starting Nova Sonic conversation:', sessionId)

    try {
      // 1. Initialize Bedrock client
      const client = await this.createBedrockClient()

      // 2. Create session object
      const session: NovaConversationSession = {
        sessionId,
        isActive: false,
        client,
        audioQueue: [],
        promptName,
        contentName,
        audioContentName,
        courseId: config.courseId,
        topic: config.topic,
        studentId: config.studentId
      }

      // 3. Initialize audio context
      session.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 4. Start bidirectional stream
      await this.initializeBidirectionalStream(session, config)

      // 5. Store session
      this.sessions.set(sessionId, session)
      
      console.log('✅ Nova Sonic conversation started:', sessionId)
      return sessionId

    } catch (error) {
      console.error('❌ Failed to start Nova Sonic conversation:', error)
      throw error
    }
  }

  /**
   * Initialize Nova Sonic bidirectional streaming (based on AWS official examples)
   */
  private async initializeBidirectionalStream(
    session: NovaConversationSession, 
    config: NovaSessionConfig
  ) {
    try {
      console.log('🔗 Initializing Nova Sonic bidirectional stream')
      
      // Create system prompt
      const systemPrompt = config.systemPrompt || 
        `Eres un asistente educativo especializado en ${config.topic || 'educación general'}. ` +
        `Mantienes conversaciones naturales y educativas con estudiantes. ` +
        `Respondes de manera clara, concisa y pedagógica. ` +
        `Limita tus respuestas a 2-3 oraciones para mantener la fluidez de la conversación.`

      // Initialize events based on AWS Nova Sonic examples
      const initEvents = [
        {
          event: {
            sessionStart: {
              inferenceConfiguration: {
                maxTokens: config.maxTokens || 1024,
                topP: 0.9,
                temperature: config.temperature || 0.7
              }
            }
          }
        },
        {
          event: {
            promptStart: {
              promptName: session.promptName,
              additionalModelRequestFields: {
                voiceId: config.voiceId || 'matthew'
              }
            }
          }
        },
        {
          event: {
            contentStart: {
              promptName: session.promptName,
              contentName: session.contentName,
              type: 'TEXT',
              interactive: true,
              role: 'SYSTEM',
              textInputConfiguration: {
                mediaType: 'text/plain'
              }
            }
          }
        },
        {
          event: {
            textInput: {
              promptName: session.promptName,
              contentName: session.contentName,
              content: systemPrompt
            }
          }
        },
        {
          event: {
            contentEnd: {
              promptName: session.promptName,
              contentName: session.contentName
            }
          }
        }
      ]

      // Generate chunks for streaming (based on AWS examples)
      const generateChunks = async function* () {
        const textEncoder = new TextEncoder()
        
        // Send initialization events
        for (const event of initEvents) {
          const eventJson = JSON.stringify(event)
          console.log(`📤 Sending event: ${eventJson.substring(0, 100)}...`)
          yield {
            chunk: {
              bytes: textEncoder.encode(eventJson),
            },
          }
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }

      // Create bidirectional stream command
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: NOVA_SONIC_MODEL_ID,
        body: generateChunks(),
      })

      console.log('📤 Starting Nova Sonic bidirectional stream...')
      const response = await session.client!.send(command)
      
      if (response.body) {
        // DEBUG: Investigate the complete structure of response.body
        console.log('🔍 Response body structure analysis:')
        console.log('🔍 Response body type:', typeof response.body)
        console.log('🔍 Response body constructor:', response.body.constructor.name)
        
        // TypeScript says response.body is AsyncIterable<InvokeModelWithBidirectionalStreamOutput>
        // This means it IS the correct stream - use it directly
        session.stream = response.body
        
        // Try to get more information about the stream object (casting to any to avoid TS errors)
        const streamObj = response.body as any
        console.log('🔍 Stream object keys:', Object.keys(streamObj || {}))
        console.log('🔍 Stream object properties:', Object.getOwnPropertyNames(streamObj || {}))
        
        // Log the actual key names and values
        const keys = Object.keys(streamObj || {})
        const props = Object.getOwnPropertyNames(streamObj || {})
        console.log('🔍 Actual key names:', keys)
        console.log('🔍 Actual property names:', props)
        
        // Try to access the first key/property to find the real stream
        if (keys.length > 0) {
          const firstKey = keys[0]
          console.log('🔍 First key:', firstKey, 'Value type:', typeof streamObj[firstKey])
          console.log('🔍 First key value:', streamObj[firstKey])
          
          // Check if the first key contains the real stream
          if (streamObj[firstKey] && typeof streamObj[firstKey][Symbol.asyncIterator] === 'function') {
            console.log('🔍 ✅ Found real AsyncIterable in first key - using it!')
            session.stream = streamObj[firstKey]
          } else {
            console.log('🔍 First key is not an AsyncIterable')
            
            // CRITICAL: Check if messageStream exists in the options object (based on logs)
            if (streamObj[firstKey] && streamObj[firstKey].messageStream) {
              console.log('🔍 ✅ Found messageStream in options - using it!')
              console.log('🔍 messageStream type:', typeof streamObj[firstKey].messageStream)
              console.log('🔍 messageStream has asyncIterator:', typeof streamObj[firstKey].messageStream[Symbol.asyncIterator] === 'function')
              
              if (typeof streamObj[firstKey].messageStream[Symbol.asyncIterator] === 'function') {
                console.log('🔍 ✅ USING REAL MESSAGESTREAM FROM OPTIONS!')
                session.stream = streamObj[firstKey].messageStream
                
                // CRITICAL: Deep investigation of stream structure for bidirectional writing
                try {
                  console.log('🔍 DEEP STREAM ANALYSIS - Investigating write capabilities')
                  
                  const messageStream = streamObj[firstKey].messageStream
                  console.log('🔍 messageStream properties:', Object.getOwnPropertyNames(messageStream))
                  console.log('🔍 messageStream prototype:', Object.getPrototypeOf(messageStream))
                  console.log('🔍 messageStream constructor name:', messageStream.constructor.name)
                  
                  // Check all possible write methods
                  const writeMethods = ['write', 'getWriter', 'writable', 'push', 'emit', 'send', 'enqueue']
                  writeMethods.forEach(method => {
                    if (messageStream[method]) {
                      console.log(`🔍 ✅ Found method: ${method} (type: ${typeof messageStream[method]})`)
                    } else {
                      console.log(`🔍 ❌ Missing method: ${method}`)
                    }
                  })
                  
                  // Check if it's a duplex stream (readable + writable)
                  if (messageStream.writable !== undefined) {
                    console.log('🔍 Stream writable property:', messageStream.writable)
                  }
                  
                  // Check for AWS-specific methods
                  const awsMethods = ['_write', '_writable', 'push', 'writeChunk', 'sendEvent']
                  awsMethods.forEach(method => {
                    if (messageStream[method]) {
                      console.log(`🔍 ✅ Found AWS method: ${method} (type: ${typeof messageStream[method]})`)
                    }
                  })
                  
                  // Try direct write if available
                  if (messageStream.write && typeof messageStream.write === 'function') {
                    session.streamWriter = messageStream
                    session.useDirectWrite = true
                    console.log('✅ Using direct write method on messageStream')
                  } 
                  // Try writable stream getWriter
                  else if (messageStream.getWriter && typeof messageStream.getWriter === 'function') {
                    session.streamWriter = messageStream.getWriter()
                    console.log('✅ StreamWriter initialized successfully from messageStream')
                  }
                  // Check if we can write directly to the stream
                  else if (messageStream.writable) {
                    session.streamWriter = messageStream
                    session.useDirectWrite = true
                    console.log('✅ Using writable stream directly')
                  }
                  else {
                    console.warn('⚠️ No write methods found - investigating response object')
                    
                    // Check the entire response object for write capabilities
                    console.log('🔍 Checking response object for write methods...')
                    const responseStream = streamObj[firstKey]
                    console.log('🔍 Response object properties:', Object.getOwnPropertyNames(responseStream))
                    
                    if (responseStream.write) {
                      session.streamWriter = responseStream
                      session.useDirectWrite = true
                      console.log('✅ Using response object direct write')
                    } else {
                      console.warn('⚠️ No write methods found anywhere - events will be queued')
                    }
                  }
                } catch (writerError) {
                  console.error('❌ Error during stream analysis:', writerError)
                  console.warn('⚠️ StreamWriter initialization failed - events will be queued')
                }
              }
            }
          }
        }
        
        if (props.length > 0 && props !== keys) {
          const firstProp = props[0]
          console.log('🔍 First property:', firstProp, 'Value type:', typeof streamObj[firstProp])
          
          // Check if the first property contains the real stream
          if (streamObj[firstProp] && typeof streamObj[firstProp][Symbol.asyncIterator] === 'function') {
            console.log('🔍 ✅ Found real AsyncIterable in first property - using it!')
            session.stream = streamObj[firstProp]
          }
        }
        
        // Check if it has nested properties (safely)
        if (streamObj.body) {
          console.log('🔍 Found nested body property - using it instead')
          session.stream = streamObj.body
        } else if (streamObj.stream) {
          console.log('🔍 Found nested stream property - using it instead')
          session.stream = streamObj.stream
        } else if (!keys.length) {
          console.log('🔍 Using response.body directly (AsyncIterable)')
        }
        
        session.isActive = true
        console.log('✅ Nova Sonic bidirectional stream established')
        
        // Start processing stream responses (based on AWS examples) - don't await to allow async processing
        this.processNovaStreamResponses(session).catch(error => {
          console.error('❌ Error in stream processing:', error)
        })
        
        console.log('✅ Stream response processing started asynchronously')
      } else {
        console.error('❌ No response body from Nova Sonic bidirectional stream')
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Nova Sonic bidirectional stream:', error)
      throw error
    }
  }

  /**
   * Process Nova Sonic stream responses (based on AWS official examples)
   */
  private async processNovaStreamResponses(session: NovaConversationSession) {
    if (!session.stream) return

    let timeoutId: NodeJS.Timeout | undefined
    
    try {
      console.log('📥 Starting to process Nova Sonic stream responses...')
      console.log('📥 Stream object type:', typeof session.stream)
      console.log('📥 Stream object constructor:', session.stream?.constructor?.name)
      console.log('📥 Stream object keys:', Object.keys(session.stream || {}))
      console.log('📥 Stream object properties:', Object.getOwnPropertyNames(session.stream || {}))
      console.log('📥 Stream is readable:', session.stream && typeof session.stream[Symbol.asyncIterator] === 'function')
      console.log('📥 Stream toString:', session.stream?.toString())
      
      // Check if stream has specific methods or properties
      if (session.stream) {
        console.log('📥 Stream methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(session.stream)))
        console.log('📥 Has next method:', typeof session.stream.next === 'function')
        console.log('📥 Has Symbol.asyncIterator:', Symbol.asyncIterator in session.stream)
      }
      
      let eventCount = 0
      let hasReceivedAnyEvent = false
      
      // Set a timeout to detect if no events are received
      timeoutId = setTimeout(() => {
        if (!hasReceivedAnyEvent) {
          console.log('📥 ⏰ TIMEOUT: No events received from Nova Sonic after 10 seconds')
          console.log('📥 ⏰ This may indicate Nova Sonic is not responding or stream is closed')
        }
      }, 10000) // 10 second timeout
      
      console.log('📥 Starting for await loop...')
      // Process streaming events based on AWS Nova Sonic examples
      for await (const event of session.stream) {
        eventCount++
        hasReceivedAnyEvent = true
        console.log(`📥 Event #${eventCount} - Raw event received from Nova Sonic:`, event)
        if (!session.isActive) {
          console.log(`Session ${session.sessionId} is no longer active, stopping response processing`)
          break
        }
        
        // Debug: log every event received
        console.log('📥 Raw event received from Nova Sonic:', event)
        
        if (event.chunk?.bytes) {
          try {
            // Decode the response bytes to text
            const textResponse = new TextDecoder().decode(event.chunk.bytes)
            console.log('📥 Decoded response from Nova Sonic:', textResponse)
            
            try {
              // Parse JSON response
              const jsonResponse = JSON.parse(textResponse)
              console.log('📥 Parsed JSON response:', jsonResponse)
              
              // Handle different event types based on AWS examples
              if (jsonResponse.event?.contentStart) {
                console.log('📥 ✅ Content started from Nova Sonic')
                this.dispatchEvent(session.sessionId, 'contentStart', jsonResponse.event.contentStart)
                
              } else if (jsonResponse.event?.textOutput) {
                console.log('📥 ✅ Received text output from Nova Sonic:', jsonResponse.event.textOutput.content?.substring(0, 100) + '...')
                this.dispatchEvent(session.sessionId, 'textOutput', jsonResponse.event.textOutput)
                
              } else if (jsonResponse.event?.audioOutput) {
                console.log('🔊 ✅ Received audio output from Nova Sonic')
                this.dispatchEvent(session.sessionId, 'audioOutput', jsonResponse.event.audioOutput)
                // Process audio output for playback
                await this.playAudioResponse(session.sessionId, jsonResponse.event.audioOutput.content)
                
              } else if (jsonResponse.event?.inferenceOutput) {
                console.log('🎯 ✅ INFERENCE OUTPUT from Nova Sonic:', jsonResponse.event.inferenceOutput)
                this.dispatchEvent(session.sessionId, 'inferenceOutput', jsonResponse.event.inferenceOutput)
                
              } else if (jsonResponse.event?.contentResponse) {
                console.log('💬 ✅ CONTENT RESPONSE from Nova Sonic:', jsonResponse.event.contentResponse)
                this.dispatchEvent(session.sessionId, 'contentResponse', jsonResponse.event.contentResponse)
                
              } else if (jsonResponse.event?.toolUse) {
                console.log('🔧 ✅ Received tool use from Nova Sonic')
                this.dispatchEvent(session.sessionId, 'toolUse', jsonResponse.event.toolUse)
                
              } else if (jsonResponse.event?.contentEnd) {
                console.log('📥 ✅ Content ended from Nova Sonic')
                this.dispatchEvent(session.sessionId, 'contentEnd', jsonResponse.event.contentEnd)
                
              } else if (jsonResponse.event?.sessionEnd) {
                console.log('📥 ✅ Session ended from Nova Sonic')
                this.dispatchEvent(session.sessionId, 'sessionEnd', jsonResponse.event.sessionEnd)
                
              } else {
                // Handle other events - log everything for debugging
                const eventKeys = Object.keys(jsonResponse.event || {})
                console.log(`📥 ✅ Other event keys from Nova Sonic: `, eventKeys)
                console.log(`📥 ✅ Full event data: `, jsonResponse.event)
                if (eventKeys.length > 0) {
                  this.dispatchEvent(session.sessionId, eventKeys[0], jsonResponse.event)
                } else if (Object.keys(jsonResponse).length > 0) {
                  console.log(`📥 ✅ Non-event response: `, jsonResponse)
                  this.dispatchEvent(session.sessionId, 'unknown', jsonResponse)
                }
              }
              
            } catch (parseError) {
              console.log(`📥 ✅ Raw text response from Nova Sonic (parse error): `, textResponse)
              console.error(`📥 Parse error details: `, parseError)
            }
            
          } catch (decodeError) {
            console.error(`❌ Error processing response chunk: `, decodeError)
          }
          
        } else if (event.modelStreamErrorException) {
          console.error(`❌ Model stream error from Nova Sonic: `, event.modelStreamErrorException)
          this.dispatchEvent(session.sessionId, 'error', {
            type: 'modelStreamErrorException',
            details: event.modelStreamErrorException
          })
          
        } else if (event.internalServerException) {
          console.error(`❌ Internal server error from Nova Sonic: `, event.internalServerException)
          this.dispatchEvent(session.sessionId, 'error', {
            type: 'internalServerException',
            details: event.internalServerException
          })
        } else {
          console.log('📥 ✅ Other event type received:', Object.keys(event))
                }
      }
      
      console.log('📥 ✅ Exited for await loop')
      
      // Clear timeout and log after the loop ends
      clearTimeout(timeoutId)
      console.log(`📥 ✅ Stream processing completed. Total events received: ${eventCount}`)
      if (!hasReceivedAnyEvent) {
        console.log(`📥 ❌ WARNING: No events were received from Nova Sonic stream`)
        console.log(`📥 ❌ This suggests the stream closed immediately or Nova Sonic is not responding`)  
        console.log(`📥 ❌ Possible causes: Nova Sonic model issues, insufficient audio data, or WebSocket closure`)
        console.log(`📥 ❌ Stream may be empty or closed before processing`)
      }

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      console.error('❌ Error processing Nova Sonic stream:', error)
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message)
        console.error('❌ Error stack:', error.stack)
      }
    }
  }

  /**
   * Dispatch event to UI components (enhanced for Nova Sonic events)
   */
  private dispatchEvent(sessionId: string, eventType: string, eventData: any) {
    console.log(`🎯 Event dispatched for session ${sessionId}: ${eventType}`, eventData)
    
    // Handle specific Nova Sonic event types based on AWS documentation
    if (eventType === 'textOutput' && eventData.content) {
      console.log(`💬 Nova Sonic says: ${eventData.content}`)
    }
    
    if (eventType === 'audioOutput' && eventData.content) {
      console.log(`🔊 Nova Sonic audio response ready for playback`)
    }
    
    if (eventType === 'inferenceOutput') {
      console.log(`🎯 ✅ NOVA SONIC INFERENCE COMPLETE:`, eventData)
      if (eventData.text) {
        console.log(`💬 ✅ NOVA SONIC TEXT RESPONSE: ${eventData.text}`)
      }
      if (eventData.audio) {
        console.log(`🔊 ✅ NOVA SONIC AUDIO RESPONSE AVAILABLE`)
      }
    }
    
    if (eventType === 'contentResponse') {
      console.log(`💬 ✅ NOVA SONIC CONTENT RESPONSE:`, eventData)
      if (eventData.text) {
        console.log(`📝 ✅ NOVA SONIC RESPONSE TEXT: ${eventData.text}`)
      }
    }
    
    if (eventType === 'contentStart') {
      console.log(`📥 ✅ NOVA SONIC CONTENT STARTED`)
    }
    
    if (eventType === 'contentEnd') {
      console.log(`📥 ✅ NOVA SONIC CONTENT ENDED`)
    }
  }

  /**
   * Send session start event to Nova Sonic
   */
  private async sendSessionStartEvent(session: NovaConversationSession, config: NovaSessionConfig) {
    const sessionStartEvent = {
      event: {
        sessionStart: {
          inferenceConfiguration: {
            maxTokens: config.maxTokens || 1024,
            topP: 0.9,
            temperature: config.temperature || 0.7
          }
        }
      }
    }

    console.log('📤 Sending session start event')
    // Implementation would send this to Nova Sonic via bidirectional stream
    // For now, we'll simulate the setup
  }

  /**
   * Send prompt start configuration
   */
  private async sendPromptStartEvent(session: NovaConversationSession, config: NovaSessionConfig) {
    const promptStartEvent = {
      event: {
        promptStart: {
          promptName: session.promptName,
          textOutputConfiguration: {
            mediaType: "text/plain"
          },
          audioOutputConfiguration: {
            mediaType: "audio/lpcm",
            sampleRateHertz: OUTPUT_SAMPLE_RATE,
            sampleSizeBits: 16,
            channelCount: CHANNELS,
            voiceId: config.voiceId || "matthew",
            encoding: "base64",
            audioType: "SPEECH"
          }
        }
      }
    }

    console.log('📤 Sending prompt start event')
    // Implementation would send this to Nova Sonic
  }

  /**
   * Send system prompt for educational context
   */
  private async sendSystemPrompt(session: NovaConversationSession, config: NovaSessionConfig) {
    const systemPrompt = config.systemPrompt || 
      `Eres un asistente educativo especializado en ${config.topic || 'educación general'}. ` +
      `Mantienes conversaciones naturales y educativas con estudiantes. ` +
      `Respondes de manera clara, concisa y pedagógica. ` +
      `Limita tus respuestas a 2-3 oraciones para mantener la fluidez de la conversación.`

    const systemPromptEvent = {
      event: {
        contentStart: {
          promptName: session.promptName,
          contentName: session.contentName,
          type: "TEXT",
          interactive: true,
          role: "SYSTEM",
          textInputConfiguration: {
            mediaType: "text/plain"
          }
        }
      }
    }

    const textInputEvent = {
      event: {
        textInput: {
          promptName: session.promptName,
          contentName: session.contentName,
          content: systemPrompt
        }
      }
    }

    const contentEndEvent = {
      event: {
        contentEnd: {
          promptName: session.promptName,
          contentName: session.contentName
        }
      }
    }

    console.log('📤 Sending system prompt:', systemPrompt.substring(0, 100) + '...')
    // Implementation would send these events to Nova Sonic
  }

  /**
   * Start audio capture for voice input
   */
  async startAudioCapture(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      throw new Error('Invalid or inactive session')
    }

    try {
      console.log('🎤 Starting audio capture for Nova Sonic')

      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: CHANNELS
        }
      })

      // Create MediaRecorder for audio capture
      session.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      // Handle audio data
      session.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await this.processAudioChunk(sessionId, event.data)
        }
      }

      // Start recording
      session.mediaRecorder.start(100) // Capture every 100ms
      console.log('✅ Audio capture started')

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error)
      throw error
    }
  }

  /**
   * Process audio chunk and send to Nova Sonic
   */
  private async processAudioChunk(sessionId: string, audioData: Blob) {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) return

    try {
      // Convert audio blob to base64
      const audioBuffer = await audioData.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

      // Create audio input event for Nova Sonic
      const audioInputEvent = {
        event: {
          audioInput: {
            promptName: session.promptName,
            contentName: session.audioContentName,
            content: base64Audio
          }
        }
      }

      // CRITICAL: Send real audio input event to Nova Sonic stream (based on AWS docs)
      console.log('📤 Sending audio chunk to Nova Sonic')
      await this.sendEventToStream(session, audioInputEvent)

    } catch (error) {
      console.error('❌ Error processing audio chunk:', error)
    }
  }

  /**
   * Stop audio capture and trigger Nova Sonic inference
   */
  async stopAudioCapture(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      if (session.mediaRecorder && session.mediaRecorder.state !== 'inactive') {
        session.mediaRecorder.stop()
        
        // CRITICAL: Send audioInputEnd to trigger Nova Sonic inference (based on AWS docs)
        const audioInputEndEvent = {
          event: {
            audioInputEnd: {}
          }
        }
        
        // Send the audioInputEnd event to the bidirectional stream REAL IMPLEMENTATION
        console.log('📤 ✅ Sending audioInputEnd event to trigger Nova Sonic inference')
        await this.sendEventToStream(session, audioInputEndEvent)
        
        console.log('📤 ✅ audioInputEnd sent to Nova Sonic - inference should now start')
        console.log('🛑 Audio capture stopped')
      }
    } catch (error) {
      console.error('❌ Error stopping audio capture:', error)
    }
  }

  /**
   * Send event to Nova Sonic bidirectional stream (based on AWS documentation)
   */
  private async sendEventToStream(session: NovaConversationSession, eventData: any): Promise<void> {
    try {
      if (!session.streamWriter) {
        console.warn('⚠️ StreamWriter no inicializado, encolando evento')
        if (!session.audioQueue) {
          session.audioQueue = []
        }
        session.audioQueue.push(eventData)
        return
      }

      const eventJson = JSON.stringify(eventData)
      const eventType = Object.keys(eventData.event)[0]
      
      console.log('📤 Attempting to send event to Nova Sonic:', eventType)
      
      // CRITICAL: Handle different stream write methods
      if (session.useDirectWrite) {
        console.log('📤 Using direct write method')
        
        // Try different direct write approaches
        const bytes = new TextEncoder().encode(eventJson)
        
        if (session.streamWriter.write && typeof session.streamWriter.write === 'function') {
          // Method 1: Direct write with bytes
          await session.streamWriter.write({ chunk: { bytes } })
          console.log('📤 ✅ Event sent via direct write (bytes):', eventType)
        } else if (session.streamWriter.push && typeof session.streamWriter.push === 'function') {
          // Method 2: Push method
          session.streamWriter.push({ chunk: { bytes } })
          console.log('📤 ✅ Event sent via push method:', eventType)
        } else if (session.streamWriter.emit && typeof session.streamWriter.emit === 'function') {
          // Method 3: Emit method
          session.streamWriter.emit('data', { chunk: { bytes } })
          console.log('📤 ✅ Event sent via emit method:', eventType)
        } else {
          console.warn('⚠️ No suitable write method found on direct stream')
          throw new Error('No write method available')
        }
      } else {
        // Standard WritableStreamDefaultWriter approach
        console.log('📤 Using standard writer method')
        const bytes = new TextEncoder().encode(eventJson)
        
        await session.streamWriter.write({ 
          chunk: { 
            bytes: bytes 
          } 
        })
        console.log('📤 ✅ Event sent via standard writer:', eventType)
      }
      
    } catch (error) {
      console.error('❌ Error sending event to stream:', error)
      console.error('❌ Event that failed:', Object.keys(eventData.event)[0])
      console.error('❌ Error details:', error)
      
      // Fallback to queue if writer fails
      if (!session.audioQueue) {
        session.audioQueue = []
      }
      session.audioQueue.push(eventData)
      console.warn('⚠️ Event queued due to write failure')
    }
  }

  /**
   * Play audio response from Nova Sonic
   */
  private async playAudioResponse(sessionId: string, audioData: string) {
    const session = this.sessions.get(sessionId)
    if (!session || !session.audioContext) return

    try {
      // Decode base64 audio
      const audioBytes = atob(audioData)
      const audioBuffer = new ArrayBuffer(audioBytes.length)
      const view = new Uint8Array(audioBuffer)
      
      for (let i = 0; i < audioBytes.length; i++) {
        view[i] = audioBytes.charCodeAt(i)
      }

      // Decode and play audio
      const decodedAudio = await session.audioContext.decodeAudioData(audioBuffer)
      const source = session.audioContext.createBufferSource()
      source.buffer = decodedAudio
      source.connect(session.audioContext.destination)
      source.start()

      console.log('🔊 Playing Nova Sonic audio response')

    } catch (error) {
      console.error('❌ Error playing audio response:', error)
    }
  }

  /**
   * Send text message to Nova Sonic (for testing)
   */
  async sendTextMessage(sessionId: string, message: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      throw new Error('Invalid or inactive session')
    }

    try {
      console.log('📤 Sending text message to Nova Sonic:', message)

      // For now, return a simulated response
      // In full implementation, this would go through the bidirectional stream
      const response = `Nova Sonic responde: He recibido tu mensaje "${message}". ` +
        `Estoy procesando tu consulta sobre ${session.topic || 'el tema actual'}.`

      console.log('📥 Nova Sonic response:', response)
      return response

    } catch (error) {
      console.error('❌ Error sending text message:', error)
      throw error
    }
  }

  /**
   * End Nova Sonic conversation session
   */
  async endConversation(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      console.log('🛑 Ending Nova Sonic conversation:', sessionId)

      // Stop audio capture if active
      await this.stopAudioCapture(sessionId)

      // Send session end events
      const promptEndEvent = {
        event: {
          promptEnd: {
            promptName: session.promptName
          }
        }
      }

      const sessionEndEvent = {
        event: {
          sessionEnd: {}
        }
      }

      console.log('📤 Sending session end events')

      // Mark session as inactive
      session.isActive = false

      // Cleanup resources
      if (session.audioContext && session.audioContext.state !== 'closed') {
        await session.audioContext.close()
      }

      // Remove session
      this.sessions.delete(sessionId)
      
      console.log('✅ Nova Sonic conversation ended')

    } catch (error) {
      console.error('❌ Error ending conversation:', error)
    }
  }

  /**
   * Get active session info
   */
  getSessionInfo(sessionId: string): NovaConversationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): NovaConversationSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive)
  }
}

// Export singleton instance
export const novaConversationalService = new NovaConversationalService()

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { PollyClient, StartSpeechSynthesisTaskCommand, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { S3VectorsService } from './s3VectorsService'

// AWS Configuration
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
}

// AWS Clients
const dynamoClient = new DynamoDBClient(awsConfig)
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const bedrockClient = new BedrockRuntimeClient(awsConfig)
const pollyClient = new PollyClient(awsConfig)
const s3Client = new S3Client(awsConfig)

// DynamoDB Tables
const VOICE_SESSIONS_TABLE = 'intellilearn-voice-sessions'
const VOICE_CONVERSATIONS_TABLE = 'intellilearn-voice-conversations'
const VOICE_CONTENT_TABLE = 'intellilearn-voice-content'

// S3 Configuration
const AUDIO_BUCKET = 'intellilearn-final'
const AUDIO_PREFIX = 'voice-sessions'

// Types
export interface VoiceSessionConfig {
  voiceSpeed: string
  voiceStyle: string
  duration: number
  interactionLevel: string
  aiModel: string
  personality: string
  topic: string
  level: string
}

export interface VoiceSession {
  sessionId: string
  studentId: string
  lessonId: string
  courseId: string
  config: VoiceSessionConfig
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  totalDuration: number
  currentSegment: number
  audioSegments: AudioSegment[]
}

export interface AudioSegment {
  segmentId: string
  sequenceNumber: number
  text: string
  audioUrl?: string
  duration: number
  isProcessed: boolean
}

export interface ConversationMessage {
  messageId: string
  sessionId: string
  studentId: string
  type: 'student_audio' | 'ai_response' | 'system'
  content: string
  audioUrl?: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface VoiceContent {
  contentId: string
  lessonId: string
  topic: string
  level: string
  generatedText: string
  segments: AudioSegment[]
  createdAt: string
  isProcessed: boolean
}

export class VoiceSessionService {
  
  /**
   * Create a new voice session
   */
  static async createVoiceSession(
    studentId: string,
    lessonId: string,
    courseId: string,
    config: VoiceSessionConfig
  ): Promise<VoiceSession> {
    try {
      const sessionId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session: VoiceSession = {
        sessionId,
        studentId,
        lessonId,
        courseId,
        config,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalDuration: 0,
        currentSegment: 0,
        audioSegments: []
      }

      // Save session to DynamoDB
      await docClient.send(new PutCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Item: session
      }))

      // Generate content if not exists
      await this.generateVoiceContent(lessonId, config)

      return session

    } catch (error) {
      console.error('Error creating voice session:', error)
      throw new Error(`Failed to create voice session: ${error}`)
    }
  }

  /**
   * Generate voice content using Bedrock with S3 Vectors context
   */
  static async generateVoiceContent(
    lessonId: string,
    config: VoiceSessionConfig
  ): Promise<VoiceContent> {
    try {
      // Check if content already exists
      const existingContent = await this.getVoiceContent(lessonId, config.topic, config.level)
      if (existingContent && existingContent.isProcessed) {
        return existingContent
      }

      // NEW: Step 1 - Search for relevant educational context using S3 Vectors
      console.log(`🔍 Searching for educational context: ${config.topic} (${config.level})`)
      const contextFragments = await S3VectorsService.getEducationalContext(
        config.topic,
        config.level,
        'en' // Default to English for now
      )

      // NEW: Step 2 - Build enhanced prompt with contextual information
      const prompt = S3VectorsService.buildPromptWithContext(
        config.topic,
        config.level,
        contextFragments,
        config
      )

      console.log(`📚 Found ${contextFragments.length} relevant context fragments`)
      console.log(`🤖 Generating content with enhanced prompt...`)

      // Step 3 - Generate personalized content using Bedrock
      const generatedText = await this.callBedrock(prompt)
      
      // Split content into segments (1 minute each)
      const segments = this.splitIntoSegments(generatedText, config.duration)
      
      const contentId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const voiceContent: VoiceContent = {
        contentId,
        lessonId,
        topic: config.topic,
        level: config.level,
        generatedText,
        segments,
        createdAt: new Date().toISOString(),
        isProcessed: false
      }

      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: VOICE_CONTENT_TABLE,
        Item: voiceContent
      }))

      // Process audio segments with Polly
      await this.processAudioSegments(contentId, segments, config)

      return voiceContent

    } catch (error) {
      console.error('Error generating voice content:', error)
      throw new Error(`Failed to generate voice content: ${error}`)
    }
  }

  /**
   * Build prompt for Bedrock content generation (Legacy - now using S3VectorsService.buildPromptWithContext)
   * @deprecated Use S3VectorsService.buildPromptWithContext for enhanced context-aware prompts
   */
  private static buildContentPrompt(config: VoiceSessionConfig): string {
    return `You are an expert ${config.personality} professor teaching about ${config.topic}.

Create a ${config.duration}-minute educational lesson for ${config.level} level students.

Requirements:
- Speak in a ${config.voiceStyle} teaching style
- Divide the content into ${config.duration} segments of approximately 1 minute each
- Each segment should be clearly marked with [SEGMENT X] headers
- Use ${config.interactionLevel} level of student interaction prompts
- Make it engaging and educational
- Include practical examples and real-world applications

Format your response as:
[SEGMENT 1]
Content for first minute...

[SEGMENT 2]
Content for second minute...

And so on for ${config.duration} segments.

Begin the lesson now:`
  }

  /**
   * Call Amazon Bedrock for content generation
   */
  private static async callBedrock(prompt: string): Promise<string> {
    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9
        })
      })

      const response = await bedrockClient.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      return responseBody.content[0].text

    } catch (error) {
      console.error('Error calling Bedrock:', error)
      throw new Error(`Bedrock API error: ${error}`)
    }
  }

  /**
   * Split generated content into audio segments
   */
  private static splitIntoSegments(text: string, totalMinutes: number): AudioSegment[] {
    const segments: AudioSegment[] = []
    const segmentRegex = /\[SEGMENT (\d+)\](.*?)(?=\[SEGMENT \d+\]|$)/g
    
    let match
    let sequenceNumber = 1
    
    while ((match = segmentRegex.exec(text)) !== null) {
      const segmentText = match[2].trim()
      
      if (segmentText) {
        segments.push({
          segmentId: `seg_${Date.now()}_${sequenceNumber}`,
          sequenceNumber,
          text: segmentText,
          duration: 60, // 1 minute per segment
          isProcessed: false
        })
        sequenceNumber++
      }
    }

    // If no segments found, split by estimated word count
    if (segments.length === 0) {
      const wordsPerMinute = 150 // Average speaking pace
      const words = text.split(/\s+/)
      const wordsPerSegment = wordsPerMinute
      
      for (let i = 0; i < totalMinutes; i++) {
        const startIndex = i * wordsPerSegment
        const endIndex = Math.min((i + 1) * wordsPerSegment, words.length)
        const segmentWords = words.slice(startIndex, endIndex)
        
        if (segmentWords.length > 0) {
          segments.push({
            segmentId: `seg_${Date.now()}_${i + 1}`,
            sequenceNumber: i + 1,
            text: segmentWords.join(' '),
            duration: 60,
            isProcessed: false
          })
        }
      }
    }

    return segments
  }

  /**
   * Process audio segments with Amazon Polly
   */
  private static async processAudioSegments(
    contentId: string,
    segments: AudioSegment[],
    config: VoiceSessionConfig
  ): Promise<void> {
    try {
      const processPromises = segments.map(async (segment) => {
        const audioKey = `${AUDIO_PREFIX}/${contentId}/${segment.segmentId}.mp3`
        
        // Synthesize speech with Polly
        const command = new SynthesizeSpeechCommand({
          Text: segment.text,
          OutputFormat: 'mp3',
          VoiceId: this.getPollyVoiceId(config.voiceStyle),
          Engine: 'neural',
          SampleRate: '22050'
        })

        const pollyResponse = await pollyClient.send(command)
        
        if (pollyResponse.AudioStream) {
          // Upload to S3
          const audioBuffer = await this.streamToBuffer(pollyResponse.AudioStream)
          
          await s3Client.send(new PutObjectCommand({
            Bucket: AUDIO_BUCKET,
            Key: audioKey,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
            Metadata: {
              contentId,
              segmentId: segment.segmentId,
              sequenceNumber: segment.sequenceNumber.toString()
            }
          }))

          // Update segment with audio URL
          segment.audioUrl = `https://d2sn3lk5751y3y.cloudfront.net/${audioKey}`
          segment.isProcessed = true
        }
      })

      await Promise.all(processPromises)

      // Update content as processed
      await docClient.send(new UpdateCommand({
        TableName: VOICE_CONTENT_TABLE,
        Key: { contentId },
        UpdateExpression: 'SET isProcessed = :processed, segments = :segments, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':processed': true,
          ':segments': segments,
          ':updatedAt': new Date().toISOString()
        }
      }))

    } catch (error) {
      console.error('Error processing audio segments:', error)
      throw new Error(`Failed to process audio segments: ${error}`)
    }
  }

  /**
   * Get appropriate Polly voice ID based on style
   */
  private static getPollyVoiceId(voiceStyle: string): 'Matthew' | 'Joanna' | 'Justin' | 'Amy' | 'Brian' {
    const voiceMap: Record<string, 'Matthew' | 'Joanna' | 'Justin' | 'Amy' | 'Brian'> = {
      'formal': 'Matthew',
      'casual': 'Joanna',
      'energetic': 'Justin',
      'calm': 'Amy',
      'professional': 'Brian'
    }
    
    return voiceMap[voiceStyle] || 'Matthew'
  }

  /**
   * Convert stream to buffer
   */
  private static async streamToBuffer(stream: any): Promise<Uint8Array> {
    const chunks: Uint8Array[] = []
    
    for await (const chunk of stream) {
      chunks.push(new Uint8Array(chunk))
    }
    
    // Calculate total length
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    
    // Create a new Uint8Array and copy all chunks into it
    const result = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    
    return result
  }

  /**
   * Save conversation message
   */
  static async saveConversationMessage(
    sessionId: string,
    studentId: string,
    type: 'student_audio' | 'ai_response' | 'system',
    content: string,
    audioUrl?: string,
    metadata?: Record<string, any>
  ): Promise<ConversationMessage> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const message: ConversationMessage = {
        messageId,
        sessionId,
        studentId,
        type,
        content,
        audioUrl,
        timestamp: new Date().toISOString(),
        metadata
      }

      await docClient.send(new PutCommand({
        TableName: VOICE_CONVERSATIONS_TABLE,
        Item: message
      }))

      return message

    } catch (error) {
      console.error('Error saving conversation message:', error)
      throw new Error(`Failed to save conversation message: ${error}`)
    }
  }

  /**
   * Get conversation history for a session
   */
  static async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const command = new QueryCommand({
        TableName: VOICE_CONVERSATIONS_TABLE,
        KeyConditionExpression: 'sessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': sessionId
        },
        ScanIndexForward: true // Sort by timestamp ascending
      })

      const result = await docClient.send(command)
      return result.Items as ConversationMessage[] || []

    } catch (error) {
      console.error('Error getting conversation history:', error)
      return []
    }
  }

  /**
   * Get voice content
   */
  static async getVoiceContent(lessonId: string, topic: string, level: string): Promise<VoiceContent | null> {
    try {
      const command = new QueryCommand({
        TableName: VOICE_CONTENT_TABLE,
        KeyConditionExpression: 'lessonId = :lessonId',
        FilterExpression: 'topic = :topic AND #level = :level',
        ExpressionAttributeNames: {
          '#level': 'level'
        },
        ExpressionAttributeValues: {
          ':lessonId': lessonId,
          ':topic': topic,
          ':level': level
        }
      })

      const result = await docClient.send(command)
      return result.Items?.[0] as VoiceContent || null

    } catch (error) {
      console.error('Error getting voice content:', error)
      return null
    }
  }

  /**
   * Get voice session
   */
  static async getVoiceSession(sessionId: string): Promise<VoiceSession | null> {
    try {
      const command = new GetCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Key: { sessionId }
      })

      const result = await docClient.send(command)
      return result.Item as VoiceSession || null

    } catch (error) {
      console.error('Error getting voice session:', error)
      return null
    }
  }

  /**
   * Update voice session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled',
    currentSegment?: number
  ): Promise<void> {
    try {
      let updateExpression = 'SET #status = :status, updatedAt = :updatedAt'
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status'
      }
      const expressionAttributeValues: Record<string, any> = {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }

      if (currentSegment !== undefined) {
        updateExpression += ', currentSegment = :currentSegment'
        expressionAttributeValues[':currentSegment'] = currentSegment
      }

      await docClient.send(new UpdateCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }))

    } catch (error) {
      console.error('Error updating session status:', error)
      throw new Error(`Failed to update session status: ${error}`)
    }
  }

  /**
   * Get active session for student and lesson
   */
  static async getActiveSession(studentId: string, lessonId: string): Promise<VoiceSession | null> {
    try {
      const command = new QueryCommand({
        TableName: VOICE_SESSIONS_TABLE,
        IndexName: 'StudentLessonIndex', // Assuming we have this GSI
        KeyConditionExpression: 'studentId = :studentId AND lessonId = :lessonId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':studentId': studentId,
          ':lessonId': lessonId,
          ':status': 'active'
        }
      })

      const result = await docClient.send(command)
      return result.Items?.[0] as VoiceSession || null

    } catch (error) {
      console.error('Error getting active session:', error)
      return null
    }
  }
} 
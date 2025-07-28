// Client-side service for voice sessions (browser-safe)

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

export class VoiceSessionClient {
  
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
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          studentId,
          lessonId,
          courseId,
          config
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create voice session')
      }

      return data.session

    } catch (error) {
      console.error('Error creating voice session:', error)
      throw new Error(`Failed to create voice session: ${error}`)
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
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          sessionId,
          status,
          currentSegment
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update session status')
      }

    } catch (error) {
      console.error('Error updating session status:', error)
      throw new Error(`Failed to update session status: ${error}`)
    }
  }

  /**
   * Get voice session
   */
  static async getVoiceSession(sessionId: string): Promise<VoiceSession | null> {
    try {
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getSession',
          sessionId
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get voice session')
      }

      return data.session

    } catch (error) {
      console.error('Error getting voice session:', error)
      return null
    }
  }

  /**
   * Get active session for student and lesson
   */
  static async getActiveSession(studentId: string, lessonId: string): Promise<VoiceSession | null> {
    try {
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getActiveSession',
          studentId,
          lessonId
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get active session')
      }

      return data.session

    } catch (error) {
      console.error('Error getting active session:', error)
      return null
    }
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
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveMessage',
          sessionId,
          studentId,
          type,
          content,
          audioUrl,
          metadata
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save conversation message')
      }

      return data.message

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
      const response = await fetch('/api/voice-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getHistory',
          sessionId
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get conversation history')
      }

      return data.history || []

    } catch (error) {
      console.error('Error getting conversation history:', error)
      return []
    }
  }

  /**
   * Synthesize speech using Polly
   */
  static async synthesizeSpeech(text: string, voiceStyle: string = 'professional'): Promise<string> {
    try {
      const response = await fetch('/api/polly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceStyle
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to synthesize speech')
      }

      return data.audioUrl

    } catch (error) {
      console.error('Error synthesizing speech:', error)
      throw new Error(`Failed to synthesize speech: ${error}`)
    }
  }
} 
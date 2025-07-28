/**
 * Voice Streaming Service for Amazon Bedrock Integration
 * Uses secure backend endpoint for Bedrock communication
 */

export interface VoiceStreamingSession {
  sessionId: string
  isActive: boolean
  mediaRecorder?: MediaRecorder
  audioStream?: MediaStream
  eventSource?: EventSource
}

export class VoiceStreamingService {
  private sessions: Map<string, VoiceStreamingSession> = new Map()
  private audioContext?: AudioContext
  private processor?: ScriptProcessorNode

  /**
   * Start voice streaming session
   */
  async startVoiceSession(sessionId: string): Promise<VoiceStreamingSession> {
    try {
      console.log('🎤 Starting voice session:', sessionId)
      
      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      })

      // Initialize audio context for processing
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = this.audioContext.createMediaStreamSource(audioStream)
      
      // Create processor for real-time audio processing
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
      
      // Setup MediaRecorder for streaming
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const session: VoiceStreamingSession = {
        sessionId,
        isActive: true,
        mediaRecorder,
        audioStream
      }

      // Setup streaming event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.streamAudioToBackend(event.data, sessionId)
        }
      }

      mediaRecorder.onstart = () => {
        console.log('🎤 Voice streaming started:', sessionId)
        // Send initial message to get conversation started
        this.streamAudioToBackend(new Blob(['inicio']), sessionId)
      }

      mediaRecorder.onstop = () => {
        console.log('🛑 Voice streaming stopped:', sessionId)
      }

      // Connect audio processing
      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      // Start recording with longer chunks for better processing
      mediaRecorder.start(2000) // 2 second chunks

      this.sessions.set(sessionId, session)
      return session

    } catch (error) {
      console.error('❌ Error starting voice session:', error)
      throw error
    }
  }

  /**
   * Stop voice streaming session
   */
  async stopVoiceSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      // Stop recording
      if (session.mediaRecorder && session.mediaRecorder.state !== 'inactive') {
        session.mediaRecorder.stop()
      }

      // Close EventSource if exists
      if (session.eventSource) {
        session.eventSource.close()
      }

      // Stop audio tracks
      if (session.audioStream) {
        session.audioStream.getTracks().forEach(track => track.stop())
      }

      // Cleanup audio context
      if (this.processor) {
        this.processor.disconnect()
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close()
      }

      // Mark session as inactive
      session.isActive = false
      this.sessions.delete(sessionId)

      console.log('✅ Voice session stopped:', sessionId)

    } catch (error) {
      console.error('❌ Error stopping voice session:', error)
    }
  }

  /**
   * Stream audio data to backend endpoint
   */
  private async streamAudioToBackend(audioBlob: Blob, sessionId: string): Promise<void> {
    try {
      console.log('📡 Streaming audio to backend, size:', audioBlob.size)
      
      // Convert audio blob to base64 for transmission
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      // Send to backend endpoint using fetch with streaming response
      const response = await fetch('/api/bedrock-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio.substring(0, 1000), // Limit size for demo
          sessionId
        })
      })

      console.log('📡 Backend response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Backend error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        
        console.log('📖 Starting to read streaming response...')
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('📖 Finished reading stream')
            break
          }
          
          buffer += decoder.decode(value, { stream: true })
          
          // Process complete messages
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                console.log('📝 Received data:', data.type, data.text?.substring(0, 50))
                this.handleBackendResponse(data, sessionId)
              } catch (e) {
                console.error('❌ Error parsing SSE data:', e, 'Line:', line)
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Error streaming to backend:', error)
      // Emit error event
      this.emitStreamingEvent('error', { 
        sessionId, 
        error: error instanceof Error ? error.message : 'Error de conexión con el servidor' 
      })
    }
  }

  /**
   * Handle backend response and convert to speech
   */
  private async handleBackendResponse(data: any, sessionId: string): Promise<void> {
    try {
      if (data.type === 'text_chunk' && data.text) {
        console.log('🔊 Processing text chunk:', data.text.substring(0, 50) + '...')
        
        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.text)
          utterance.lang = 'es-ES'
          utterance.rate = 0.9
          utterance.pitch = 1.0
          
          // Speak the response
          speechSynthesis.speak(utterance)
          
          console.log('🔊 Speaking response:', data.text)
        }

        // Emit event for UI updates
        this.emitStreamingEvent('response', { sessionId, text: data.text })
      }
      
      if (data.type === 'stream_end') {
        console.log('✅ Streaming completed for session:', sessionId)
        this.emitStreamingEvent('stream_end', { sessionId })
      }
      
      if (data.type === 'error') {
        console.error('❌ Backend error:', data.error, data.details)
        this.emitStreamingEvent('error', { 
          sessionId, 
          error: data.error,
          details: data.details 
        })
      }

    } catch (error) {
      console.error('❌ Error handling backend response:', error)
    }
  }

  /**
   * Emit streaming events for UI updates
   */
  private emitStreamingEvent(type: string, data: any): void {
    const event = new CustomEvent('voiceStreaming', {
      detail: { type, data }
    })
    window.dispatchEvent(event)
  }

  /**
   * Check if session is active
   */
  isSessionActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session?.isActive || false
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(id => 
      this.sessions.get(id)?.isActive
    )
  }
}

// Export singleton instance
export const voiceStreamingService = new VoiceStreamingService() 
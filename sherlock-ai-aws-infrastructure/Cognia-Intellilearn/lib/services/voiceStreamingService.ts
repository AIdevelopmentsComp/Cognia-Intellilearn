/**
 * Voice Streaming Service for Amazon Bedrock Integration
 * Implements real-time voice streaming with Bedrock following AWS architecture
 */

import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'
import { AWS_CONFIG } from '../config'

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: AWS_CONFIG.region,
  credentials: AWS_CONFIG.credentials
})

export interface VoiceStreamingSession {
  sessionId: string
  isActive: boolean
  mediaRecorder?: MediaRecorder
  audioStream?: MediaStream
  websocket?: WebSocket
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
          this.streamAudioToBedrock(event.data, sessionId)
        }
      }

      mediaRecorder.onstart = () => {
        console.log('🎤 Voice streaming started:', sessionId)
      }

      mediaRecorder.onstop = () => {
        console.log('🛑 Voice streaming stopped:', sessionId)
      }

      // Connect audio processing
      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      // Start recording with small chunks for streaming
      mediaRecorder.start(100) // 100ms chunks for real-time streaming

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
   * Stream audio data to Amazon Bedrock
   */
  private async streamAudioToBedrock(audioBlob: Blob, sessionId: string): Promise<void> {
    try {
      // Convert audio blob to base64 for Bedrock
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      // Prepare Bedrock streaming request
      const input = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Procesa este audio de voz y responde de manera conversacional. Audio: ${base64Audio.substring(0, 100)}...`
                }
              ]
            }
          ],
          stream: true
        })
      }

      // Send streaming request to Bedrock
      const command = new InvokeModelWithResponseStreamCommand(input)
      const response = await bedrockClient.send(command)

      // Process streaming response
      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes))
            
            if (chunkData.delta?.text) {
              // Stream response back to user
              this.handleBedrockResponse(chunkData.delta.text, sessionId)
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Error streaming to Bedrock:', error)
    }
  }

  /**
   * Handle Bedrock response and convert to speech
   */
  private async handleBedrockResponse(text: string, sessionId: string): Promise<void> {
    try {
      // Use Web Speech API for text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        utterance.rate = 0.9
        utterance.pitch = 1.0
        
        // Speak the response
        speechSynthesis.speak(utterance)
        
        console.log('🔊 Speaking response:', text)
      }

      // Emit event for UI updates
      this.emitStreamingEvent('response', { sessionId, text })

    } catch (error) {
      console.error('❌ Error handling Bedrock response:', error)
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
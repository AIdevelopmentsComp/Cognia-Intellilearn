'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FaMicrophone, FaTimes, FaWifi } from 'react-icons/fa'
import { useNovaWebSocket } from '../../hooks/useNovaWebSocket'

interface VoiceSessionViewerProps {
  lesson: {
    id: string
    title: string
    description: string
    content: string
    duration: string
  }
}

export default function VoiceSessionViewerNew({ lesson }: VoiceSessionViewerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTime, setStreamingTime] = useState(0)
  const [responseText, setResponseText] = useState('')
  const [audioQueue, setAudioQueue] = useState<string[]>([])
  
  // Nova Sonic Speech-to-Speech specific states
  const [userTranscription, setUserTranscription] = useState('')
  const [novaTextResponse, setNovaTextResponse] = useState('')
  const [toolsUsed, setToolsUsed] = useState<Array<{name: string, input: any}>>([])
  const [isInferenceComplete, setIsInferenceComplete] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user_speech' | 'nova_text' | 'nova_audio' | 'tool_use';
    content: string;
    timestamp: Date;
  }>>([])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)

  // Parse lesson content for session configuration
  const lessonConfig = useMemo(() => {
    try {
      const content = JSON.parse(lesson.content)
      return {
        courseId: content.courseId || 'default',
        topic: lesson.title,
        studentId: content.studentId || 'student_001',
        promptName: `lesson_${lesson.id}_prompt`,
        audioContentName: `lesson_${lesson.id}_audio`
      }
    } catch {
      return {
        courseId: 'default',
        topic: lesson.title,
        studentId: 'student_001',
        promptName: `lesson_${lesson.id}_prompt`,
        audioContentName: `lesson_${lesson.id}_audio`
      }
    }
  }, [lesson.content, lesson.title, lesson.id])

  // Initialize Nova WebSocket hook
  const nova = useNovaWebSocket({
    autoConnect: true,
    sessionConfig: lessonConfig
  })

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Play audio responses in queue
  const playNextAudio = useCallback(() => {
    if (audioQueue.length === 0 || isPlayingRef.current) {
      return
    }

    const audioData = audioQueue[0]
    setAudioQueue(prev => prev.slice(1))
    isPlayingRef.current = true

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Convert base64 to audio blob
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const audioBlob = new Blob([bytes], { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create new audio element
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onloadeddata = () => {
        console.log('🔊 Playing Nova Sonic audio response')
      }

      audio.onended = () => {
        console.log('✅ Audio playback completed')
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
        
        // Play next audio in queue
        setTimeout(playNextAudio, 100)
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
        
        // Try next audio in queue
        setTimeout(playNextAudio, 100)
      }

      audio.play().catch(error => {
        console.error('❌ Failed to play audio:', error)
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
      })

    } catch (error) {
      console.error('❌ Error processing audio data:', error)
      isPlayingRef.current = false
    }
  }, [audioQueue])

  // Handle Nova WebSocket events via state changes
  useEffect(() => {
    if (nova.state.lastAudioResponse) {
      console.log('🔊 New audio response received')
      setAudioQueue(prev => [...prev, nova.state.lastAudioResponse!])
    }
  }, [nova.state.lastAudioResponse])

  useEffect(() => {
    if (nova.state.lastTextResponse) {
      console.log('💬 Nova Sonic text response:', nova.state.lastTextResponse)
      setNovaTextResponse(nova.state.lastTextResponse)
      setResponseText(nova.state.lastTextResponse)
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        type: 'nova_text',
        content: nova.state.lastTextResponse!,
        timestamp: new Date()
      }])
    }
  }, [nova.state.lastTextResponse])

  // Handle user speech transcriptions
  useEffect(() => {
    if (nova.state.lastTranscription) {
      console.log('📝 User speech transcription:', nova.state.lastTranscription)
      setUserTranscription(nova.state.lastTranscription)
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        type: 'user_speech',
        content: nova.state.lastTranscription!,
        timestamp: new Date()
      }])
    }
  }, [nova.state.lastTranscription])

  // Handle tool use events
  useEffect(() => {
    if (nova.state.lastToolUse) {
      console.log('🛠️ Tool use event:', nova.state.lastToolUse)
      setToolsUsed(prev => [...prev, nova.state.lastToolUse!])
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        type: 'tool_use',
        content: `Tool: ${nova.state.lastToolUse!.name}`,
        timestamp: new Date()
      }])
    }
  }, [nova.state.lastToolUse])

  // Handle inference completion
  useEffect(() => {
    setIsInferenceComplete(nova.state.isInferenceComplete)
    if (nova.state.isInferenceComplete) {
      console.log('🎯 Nova Sonic inference complete')
    }
  }, [nova.state.isInferenceComplete])

  useEffect(() => {
    if (nova.state.error) {
      console.error('❌ Nova WebSocket error:', nova.state.error)
      setResponseText(`Error: ${nova.state.error}`)
      setIsStreaming(false)
    }
  }, [nova.state.error])

  // Play audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlayingRef.current) {
      playNextAudio()
    }
  }, [audioQueue, playNextAudio])

  // Connection status display
  const getConnectionStatus = () => {
    switch (nova.state.connectionState) {
      case 'connected':
        return { icon: <FaWifi className="text-green-500" />, text: 'Conectado', color: 'text-green-500' }
      case 'connecting':
        return { icon: <FaWifi className="text-yellow-500" />, text: 'Conectando...', color: 'text-yellow-500' }
      case 'error':
        return { icon: <FaWifi className="text-red-500" />, text: 'Error', color: 'text-red-500' }
      default:
        return { icon: <FaWifi className="text-gray-500" />, text: 'Desconectado', color: 'text-gray-500' }
    }
  }

  // Start voice streaming session
  const startVoiceStreaming = async () => {
    try {
      console.log('🎯 Starting Nova Sonic WebSocket session')
      
      // Ensure WebSocket is connected
      if (!nova.isConnected()) {
        console.log('🔌 Connecting to WebSocket server...')
        const connected = await nova.connect()
        if (!connected) {
          throw new Error('Failed to connect to WebSocket server')
        }
      }

      setIsStreaming(true)
      setStreamingTime(0)
      setResponseText('🔄 Inicializando sesión Nova Sonic...')

      // Initialize Nova Sonic session
      const sessionId = await nova.initializeSession(lessonConfig)
      if (!sessionId) {
        throw new Error('Failed to initialize Nova Sonic session')
      }

      console.log('✅ Nova Sonic session initialized:', sessionId)

      // Start audio capture
      const audioCaptureSuccess = await nova.startAudioCapture()
      if (!audioCaptureSuccess) {
        throw new Error('Failed to start audio capture')
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setStreamingTime(prev => prev + 1)
      }, 1000)

      setResponseText('🎤 Nova Sonic listo. Habla al micrófono para interactuar...')

    } catch (error) {
      console.error('❌ Error starting Nova Sonic session:', error)
      setResponseText(`Error: ${(error as Error).message}`)
      setIsStreaming(false)
      
      // Clear error after a delay
      setTimeout(() => nova.clearError(), 3000)
    }
  }

  // Stop voice streaming session
  const stopVoiceStreaming = async () => {
    try {
      setIsStreaming(false)
      
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      console.log('🛑 Stopping Nova Sonic session')
      
      // Stop audio capture
      await nova.stopAudioCapture()
      
      // End Nova Sonic session
      await nova.endSession()
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      // Clear audio queue
      setAudioQueue([])
      isPlayingRef.current = false
      
      setResponseText('✅ Sesión Nova Sonic finalizada')
      
    } catch (error) {
      console.error('❌ Error stopping Nova Sonic session:', error)
      setResponseText(`Error al finalizar: ${(error as Error).message}`)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up VoiceSessionViewer component');
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Only cleanup if actually streaming
      if (isStreaming && nova.state.isSessionActive) {
        console.log('🛑 Component unmounting during active session, cleaning up...');
        nova.stopAudioCapture()
        nova.endSession()
      }
    }
  }, []) // Remove dependencies to avoid re-running this effect

  // Test function for manual text input
  const sendTestMessage = async () => {
    if (nova.state.isSessionActive) {
      setResponseText('🧪 Función de test - implementar envío de texto manual')
    } else {
      setResponseText('⚠️ No hay sesión activa para enviar mensaje de prueba')
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="neuro-card p-8 rounded-2xl bg-white">
      <div className="text-center space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {connectionStatus.icon}
          <span className={`text-sm ${connectionStatus.color}`}>
            WebSocket: {connectionStatus.text}
          </span>
          {nova.state.sessionId && (
            <span className="text-xs text-gray-500 ml-2">
              Session: {nova.state.sessionId.substring(0, 8)}...
            </span>
          )}
        </div>

        {/* Voice Visualizer */}
        <div className="relative">
          <div className="voice-visualizer-container">
            <div className={`voice-logo ${isStreaming ? 'recording' : ''}`}>
              <svg viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path 
                    d="M12 16C10.3431 16 9 14.6569 9 13V7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V13C15 14.6569 13.6569 16 12 16Z" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M19 11V13C19 17.4183 15.4183 21 11 21H12C7.58172 21 4 17.4183 4 13V11" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M12 21V24" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M8 24H16" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
            
            {/* Pulsing animation rings */}
            {isStreaming && (
              <>
                <div className="pulse-ring pulse-ring-1"></div>
                <div className="pulse-ring pulse-ring-2"></div>
                <div className="pulse-ring pulse-ring-3"></div>
              </>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">
            🎙️ Sesión de Voz Interactiva - Nova Sonic
          </h3>
          <p className="text-gray-600">
            {lesson.title}
          </p>
          <div className="text-sm text-gray-500">
            WebSocket Architecture • AWS Nova Sonic AI
          </div>
        </div>

        {/* Time Display */}
        {isStreaming && (
          <div className="text-2xl font-mono text-purple-600">
            {formatTime(streamingTime)}
          </div>
        )}

        {/* Nova Sonic Speech-to-Speech Display */}
        <div className="space-y-4">
          {/* User Speech Transcription */}
          {userTranscription && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm font-medium mb-2 text-blue-700">📝 Tu mensaje (transcrito):</div>
              <div className="text-left text-blue-800">
                {userTranscription}
              </div>
            </div>
          )}

          {/* Nova Sonic Text Response */}
          <div className="bg-gray-50 p-4 rounded-lg min-h-[100px] text-gray-700">
            <div className="text-sm font-medium mb-2 flex items-center">
              🤖 Nova Sonic Response:
              {isInferenceComplete && (
                <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✅ Completado
                </span>
              )}
            </div>
            <div className="text-left whitespace-pre-wrap">
              {novaTextResponse || responseText || 'Haz clic en "Iniciar Sesión" para comenzar la conversación con Nova Sonic Speech-to-Speech...'}
            </div>
          </div>

          {/* Tools Used */}
          {toolsUsed.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <div className="text-sm font-medium mb-2 text-yellow-700">🛠️ Herramientas utilizadas:</div>
              <div className="space-y-1">
                {toolsUsed.map((tool, index) => (
                  <div key={index} className="text-sm text-yellow-800">
                    • {tool.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm font-medium mb-3 text-gray-700">💬 Historial de conversación:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conversationHistory.slice(-10).map((entry, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.type === 'user_speech' ? 'bg-blue-100 text-blue-700' :
                        entry.type === 'nova_text' ? 'bg-green-100 text-green-700' :
                        entry.type === 'nova_audio' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.type === 'user_speech' ? '👤 Usuario' :
                         entry.type === 'nova_text' ? '🤖 Nova Sonic' :
                         entry.type === 'nova_audio' ? '🔊 Audio' : '🛠️ Tool'}
                      </span>
                    </div>
                    <div className="text-gray-700 mt-1 ml-16">
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Queue Status */}
        {audioQueue.length > 0 && (
          <div className="text-xs text-blue-500">
            🔊 Reproduciendo respuestas de audio ({audioQueue.length} en cola)
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isStreaming ? (
            <button
              onClick={startVoiceStreaming}
              disabled={nova.state.connectionState === 'connecting'}
              className="neuro-button bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaMicrophone />
              <span>
                {nova.state.connectionState === 'connecting' ? 'Conectando...' : 'Iniciar Sesión'}
              </span>
            </button>
          ) : (
            <button
              onClick={stopVoiceStreaming}
              className="neuro-button bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl flex items-center space-x-2"
            >
              <FaTimes />
              <span>Finalizar Sesión</span>
            </button>
          )}

          {/* Test Button */}
          {isStreaming && (
            <button
              onClick={sendTestMessage}
              className="neuro-button bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm"
            >
              🧪 Test
            </button>
          )}
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
            <div>Connection: {nova.state.connectionState}</div>
            <div>Session Active: {nova.state.isSessionActive ? 'Yes' : 'No'}</div>
            <div>Session ID: {nova.state.sessionId || 'None'}</div>
            <div>Audio Queue: {audioQueue.length}</div>
            <div>Error: {nova.state.error || 'None'}</div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .voice-visualizer-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }

        .voice-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
          position: relative;
          transition: all 0.3s ease;
        }

        .voice-logo svg {
          width: 40px;
          height: 40px;
        }

        .pulse-ring {
          position: absolute;
          border: 2px solid #667eea;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }

        .pulse-ring-1 {
          width: 100px;
          height: 100px;
          animation-delay: 0s;
        }

        .pulse-ring-2 {
          width: 120px;
          height: 120px;
          animation-delay: 0.3s;
        }

        .pulse-ring-3 {
          width: 140px;
          height: 140px;
          animation-delay: 0.6s;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .voice-logo.recording {
          animation: recording-pulse 1.5s ease-in-out infinite;
        }

        @keyframes recording-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(102, 126, 234, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
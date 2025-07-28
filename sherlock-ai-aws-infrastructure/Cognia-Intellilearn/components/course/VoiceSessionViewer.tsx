'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaTimes } from 'react-icons/fa'
import { voiceStreamingService } from '../../lib/services/voiceStreamingService'

interface VoiceSessionViewerProps {
  lesson: {
    id: string
    title: string
    description: string
    content: string
    duration: string
  }
}

export default function VoiceSessionViewer({ lesson }: VoiceSessionViewerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTime, setStreamingTime] = useState(0)
  const [responseText, setResponseText] = useState('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionId = useRef(`voice_${lesson.id}_${Date.now()}`)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startVoiceStreaming = async () => {
    try {
      setIsStreaming(true)
      setStreamingTime(0)
      setResponseText('')
      
      // Extract course info from lesson ID for educational context
      const courseId = lesson.id.split('_')[0] || '000000000'
      const topic = lesson.title || 'General'
      const studentId = `student_${Date.now()}` // In real app, get from auth context
      
      // Start enhanced streaming session with educational context
      await voiceStreamingService.startVoiceSession(
        sessionId.current,
        courseId,
        topic,
        studentId
      )
      
      // Start timer
      timerRef.current = setInterval(() => {
        setStreamingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting voice streaming:', error)
      alert('Error al iniciar la sesión de voz. Verifica los permisos del micrófono.')
      setIsStreaming(false)
    }
  }

  const stopVoiceStreaming = async () => {
    try {
      setIsStreaming(false)
      
      // Stop streaming session
      await voiceStreamingService.stopVoiceSession(sessionId.current)
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
    } catch (error) {
      console.error('Error stopping voice streaming:', error)
    }
  }

  // Listen for enhanced streaming events
  useEffect(() => {
    const handleStreamingEvent = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      if (data.sessionId === sessionId.current) {
        switch (type) {
          case 'transcription':
            console.log('🎤 Transcripción recibida:', data.text)
            break
            
          case 'response':
            console.log('🤖 Respuesta IA:', data.text)
            setResponseText(prev => prev + data.text)
            
            // Use Web Speech API for text-to-speech
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(data.text)
              utterance.lang = 'es-ES'
              utterance.rate = 0.9
              utterance.pitch = 1.0
              speechSynthesis.speak(utterance)
            }
            break
            
          case 'audio':
            console.log('🎵 Audio recibido:', data.audioUrl)
            // Could play audio directly if provided
            break
            
          case 'error':
            console.error('❌ Error en streaming:', data.error)
            alert(`Error en la sesión de voz: ${data.error}`)
            setIsStreaming(false)
            break
        }
      }
    }

    window.addEventListener('voiceStreaming', handleStreamingEvent as EventListener)
    
    return () => {
      window.removeEventListener('voiceStreaming', handleStreamingEvent as EventListener)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Cleanup session on unmount
      if (isStreaming) {
        voiceStreamingService.stopVoiceSession(sessionId.current)
      }
    }
  }, [isStreaming])

  return (
    <div className="neuro-card p-8 rounded-2xl bg-white">
      <div className="text-center space-y-6">
        {/* Voice Visualizer */}
        <div className="relative">
          <div className="voice-visualizer-container">
            <div className={`voice-logo ${isStreaming ? 'recording' : ''}`}>
              <svg viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.5 12L13 14.333V19L20 14.333V9.667L13 5V9.667L16.5 12Z" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M6.41598 9.04293C6.07132 8.81319 5.60568 8.90635 5.37593 9.25102C5.14619 9.59568 5.23935 10.0613 5.58402 10.2911L6.41598 9.04293ZM12.584 14.9571C12.9287 15.1868 13.3943 15.0936 13.6241 14.749C13.8538 14.4043 13.7606 13.9387 13.416 13.7089L12.584 14.9571ZM6.75 9.667C6.75 9.25279 6.41421 8.917 6 8.917C5.58579 8.917 5.25 9.25279 5.25 9.667H6.75ZM5.25 14.333C5.25 14.7472 5.58579 15.083 6 15.083C6.41421 15.083 6.75 14.7472 6.75 14.333H5.25ZM5.58395 9.04298C5.23932 9.27275 5.1462 9.73841 5.37598 10.083C5.60575 10.4277 6.07141 10.5208 6.41605 10.291L5.58395 9.04298ZM13.416 5.62402C13.7607 5.39425 13.8538 4.92859 13.624 4.58395C13.3942 4.23932 12.9286 4.1462 12.584 4.37598L13.416 5.62402ZM13.416 10.2911C13.7606 10.0613 13.8538 9.59568 13.6241 9.25102C13.3943 8.90635 12.9287 8.81319 12.584 9.04293L13.416 10.2911ZM5.58402 13.7089C5.23935 13.9387 5.14619 14.4043 5.37593 14.749C5.60568 15.0936 6.07132 15.1868 6.41598 14.9571L5.58402 13.7089ZM6.41605 13.709C6.07141 13.4792 5.60575 13.5723 5.37598 13.917C5.1462 14.2616 5.23932 14.7272 5.58395 14.957L6.41605 13.709ZM12.584 19.624C12.9286 19.8538 13.3942 19.7607 13.624 19.416C13.8538 19.0714 13.7607 18.6058 13.416 18.376L12.584 19.624ZM20.416 10.2911C20.7606 10.0613 20.8538 9.59568 20.6241 9.25102C20.3943 8.90635 19.9287 8.81319 19.584 9.04293L20.416 10.2911ZM16.5 12L16.084 11.3759C15.8753 11.515 15.75 11.7492 15.75 12C15.75 12.2508 15.8753 12.485 16.084 12.6241L16.5 12ZM19.584 14.9571C19.9287 15.1868 20.3943 15.0936 20.6241 14.749C20.8538 14.4043 20.7606 13.9387 20.416 13.7089L19.584 14.9571ZM5.58402 10.2911L12.584 14.9571L13.416 13.7089L6.41598 9.04293L5.58402 10.2911ZM5.25 9.667V14.333H6.75V9.667H5.25ZM6.41605 10.291L13.416 5.62402L12.584 4.37598L5.58395 9.04298L6.41605 10.291ZM12.584 9.04293L5.58402 13.7089L6.41598 14.9571L13.416 10.2911L12.584 9.04293ZM5.58395 14.957L12.584 19.624L13.416 18.376L6.41605 13.709L5.58395 14.957ZM19.584 9.04293L16.084 11.3759L16.916 12.6241L20.416 10.2911L19.584 9.04293ZM16.084 12.6241L19.584 14.9571L20.416 13.7089L16.916 11.3759L16.084 12.6241Z" fill="#8b5cf6"></path>
                </g>
              </svg>
            </div>
            <div className="voice-ripple-1"></div>
            <div className="voice-ripple-2"></div>
            <div className="voice-ripple-3"></div>
            <div className="voice-ripple-4"></div>
            <div className="voice-ripple-5"></div>
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-2">
          <div className="text-2xl font-mono text-[#8b5cf6]">
            {isStreaming ? formatTime(streamingTime) : '00:00'}
          </div>
          <div className="text-sm text-gray-600">
            {isStreaming ? 'Conversando con IA...' : 'Sesión de Voz Interactiva'}
          </div>
        </div>

        {/* Control Buttons - Only Microphone and X */}
        <div className="flex justify-center items-center space-x-6">
          {/* Microphone/Stop Button */}
          {!isStreaming ? (
            <button
              onClick={startVoiceStreaming}
              className="neuro-button-enhanced bg-white text-[#8b5cf6] p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Iniciar Conversación de Voz"
            >
              <FaMicrophone className="text-3xl" />
            </button>
          ) : (
            <button
              onClick={stopVoiceStreaming}
              className="neuro-button-enhanced bg-red-500 text-white p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Detener Conversación"
            >
              <FaTimes className="text-3xl" />
            </button>
          )}
        </div>

        {/* Response Display */}
        {responseText && (
          <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 mt-4">
            <h4 className="font-semibold text-[#132944] mb-2">Respuesta de IA:</h4>
            <div className="text-sm text-gray-700 text-left">
              {responseText}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white">
          <h4 className="font-semibold text-[#132944] mb-2">Instrucciones:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>🎤 <strong>Hablar:</strong> Presiona el micrófono para iniciar una conversación con IA</p>
            <p>❌ <strong>Detener:</strong> Presiona X para terminar la conversación</p>
            <p>🤖 <strong>IA:</strong> La IA responderá por voz automáticamente</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
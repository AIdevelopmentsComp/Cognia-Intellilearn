'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaStop, FaPlay, FaPause, FaVolumeUp, FaTimes } from 'react-icons/fa'
import { VoiceSessionService, VoiceSession, VoiceSessionConfig, ConversationMessage } from '@/lib/services/voiceSessionService'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSegment, setCurrentSegment] = useState(0)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [sessionStatus, setSessionStatus] = useState<string>('Ready to start')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Mock student ID - in real app, get from auth context
  const studentId = 'student_123'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Parse lesson content to get voice session configuration
  const parseVoiceConfig = (content: string): VoiceSessionConfig => {
    try {
      const config = JSON.parse(content)
      return {
        voiceSpeed: config.voiceSpeed || 'medium',
        voiceStyle: config.voiceStyle || 'professional',
        duration: parseInt(config.duration) || 10,
        interactionLevel: config.interactionLevel || 'medium',
        aiModel: config.aiModel || 'claude-3-sonnet',
        personality: config.personality || 'friendly',
        topic: config.topic || lesson.title,
        level: config.level || 'intermediate'
      }
    } catch (error) {
      // Fallback configuration
      return {
        voiceSpeed: 'medium',
        voiceStyle: 'professional',
        duration: 10,
        interactionLevel: 'medium',
        aiModel: 'claude-3-sonnet',
        personality: 'friendly',
        topic: lesson.title,
        level: 'intermediate'
      }
    }
  }

  const startVoiceSession = async () => {
    try {
      setIsLoading(true)
      setSessionStatus('Starting voice session...')
      
      const config = parseVoiceConfig(lesson.content)
      
      // Check for existing active session
      let session = await VoiceSessionService.getActiveSession(studentId, lesson.id)
      
      if (!session) {
        // Create new session
        session = await VoiceSessionService.createVoiceSession(
          studentId,
          lesson.id,
          'course_id', // You might want to pass this as prop
          config
        )
      }
      
      setCurrentSession(session)
      setIsSessionActive(true)
      setSessionStatus('Voice session active')
      
      // Load conversation history
      const history = await VoiceSessionService.getConversationHistory(session.sessionId)
      setConversationHistory(history)
      
      // Start playing first audio segment if available
      if (session.audioSegments && session.audioSegments.length > 0) {
        await playAudioSegment(session.audioSegments[0])
      }
      
    } catch (error) {
      console.error('Error starting voice session:', error)
      setSessionStatus('Error starting session')
    } finally {
      setIsLoading(false)
    }
  }

  const stopVoiceSession = async () => {
    try {
      if (currentSession) {
        await VoiceSessionService.updateSessionStatus(currentSession.sessionId, 'cancelled')
        
        // Save system message
        await VoiceSessionService.saveConversationMessage(
          currentSession.sessionId,
          studentId,
          'system',
          'Voice session ended by student'
        )
      }
      
      setIsSessionActive(false)
      setCurrentSession(null)
      setIsRecording(false)
      setIsPlaying(false)
      setSessionStatus('Session ended')
      
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      // Stop audio playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
    } catch (error) {
      console.error('Error stopping voice session:', error)
    }
  }

  const playAudioSegment = async (segment: any) => {
    try {
      if (segment.audioUrl && audioRef.current) {
        audioRef.current.src = segment.audioUrl
        audioRef.current.load()
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio segment:', error)
    }
  }

  const startRecording = async () => {
    try {
      if (!isSessionActive || !currentSession) {
        await startVoiceSession()
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await handleRecordingComplete(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setSessionStatus('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    setIsRecording(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      if (!currentSession) return
      
      // Convert audio blob to base64 or handle upload to S3
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Save student audio message
      await VoiceSessionService.saveConversationMessage(
        currentSession.sessionId,
        studentId,
        'student_audio',
        'Student voice input',
        audioUrl,
        { duration: recordingTime, size: audioBlob.size }
      )
      
      // Here you could implement speech-to-text and AI response
      // For now, just update the conversation history
      const updatedHistory = await VoiceSessionService.getConversationHistory(currentSession.sessionId)
      setConversationHistory(updatedHistory)
      
      setSessionStatus('Recording processed')
      
    } catch (error) {
      console.error('Error handling recording:', error)
      setSessionStatus('Error processing recording')
    }
  }

  const playPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Cleanup media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="neuro-card p-8 rounded-2xl bg-white">
      <div className="text-center space-y-6">
        {/* Voice Visualizer */}
        <div className="relative">
          <div className="voice-visualizer-container">
            <div className={`voice-logo ${isRecording ? 'recording' : ''}`}>
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
            {isRecording ? formatTime(recordingTime) : '00:00'}
          </div>
          <div className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : sessionStatus}
          </div>
          {currentSession && (
            <div className="text-xs text-gray-500">
              Session: {currentSession.sessionId.slice(-8)}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center items-center space-x-6">
          {/* Listen Button */}
          <button
            onClick={playPause}
            disabled={!isSessionActive}
            className="neuro-button-enhanced bg-white text-[#6366f1] p-4 rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            title="Listen to Content"
          >
            <FaVolumeUp className="text-xl" />
          </button>

          {/* Main Action Button - Start Session or Record */}
          {!isSessionActive ? (
            <button
              onClick={startVoiceSession}
              disabled={isLoading}
              className="neuro-button-enhanced bg-white text-[#8b5cf6] p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              title="Start Voice Session"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5cf6]"></div>
              ) : (
                <FaMicrophone className="text-3xl" />
              )}
            </button>
          ) : !isRecording ? (
            <button
              onClick={startRecording}
              className="neuro-button-enhanced bg-white text-[#8b5cf6] p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Start Recording"
            >
              <FaMicrophone className="text-3xl" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="neuro-button-enhanced bg-red-500 text-white p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Stop Recording"
            >
              <FaStop className="text-3xl" />
            </button>
          )}

          {/* End Session Button */}
          {isSessionActive && (
            <button
              onClick={stopVoiceSession}
              className="neuro-button-enhanced bg-white text-red-500 p-4 rounded-full hover:shadow-lg transition-all duration-300"
              title="End Session"
            >
              <FaTimes className="text-xl" />
            </button>
          )}

          {/* Play Button */}
          <button
            onClick={playPause}
            disabled={!isSessionActive}
            className="neuro-button-enhanced bg-white text-[#10b981] p-4 rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl" />}
          </button>
        </div>

        {/* Instructions */}
        <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white">
          <h4 className="font-semibold text-[#132944] mb-2">Instructions:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {!isSessionActive ? (
              <p>🎤 <strong>Start:</strong> Click the microphone to begin your voice session</p>
            ) : (
              <>
                <p>🎧 <strong>Listen:</strong> AI-generated content will play automatically</p>
                <p>🎤 <strong>Speak:</strong> Record your questions and responses</p>
                <p>❌ <strong>End:</strong> Click the X to finish the session</p>
              </>
            )}
          </div>
        </div>

        {/* Conversation History (Optional - for debugging) */}
        {conversationHistory.length > 0 && (
          <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white max-h-32 overflow-y-auto">
            <h4 className="font-semibold text-[#132944] mb-2 text-xs">Session Activity:</h4>
            <div className="space-y-1">
              {conversationHistory.slice(-3).map((message, index) => (
                <div key={message.messageId} className="text-xs text-gray-500">
                  <span className="font-medium">{message.type}:</span> {message.content.slice(0, 50)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element for AI-generated content playback */}
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          // Auto-play next segment if available
          if (currentSession && currentSession.audioSegments) {
            const nextSegment = currentSession.audioSegments[currentSegment + 1]
            if (nextSegment) {
              setCurrentSegment(prev => prev + 1)
              playAudioSegment(nextSegment)
            }
          }
        }}
      />
    </div>
  )
} 
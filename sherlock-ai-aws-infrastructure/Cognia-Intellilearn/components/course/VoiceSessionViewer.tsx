'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaMicrophone, FaStop, FaPlay, FaPause, FaVolumeUp, FaTimes } from 'react-icons/fa'
import { chatWithAI } from '@/lib/firebase'
import { useAuth } from '@/lib/AuthContext'

interface VoiceSessionViewerProps {
  lesson: {
    id: string
    title: string
    description: string
    content: string
    duration: string
  }
  onClose: () => void
}

export const VoiceSessionViewer: React.FC<VoiceSessionViewerProps> = ({ lesson, onClose }) => {
  // States
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const [sessionStatus, setSessionStatus] = useState<string>('Ready to start')
  const [aiResponse, setAiResponse] = useState<string>('')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  
  // Get real user from auth context
  const { user } = useAuth()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize voice session (simplified)
  const initializeVoiceSession = async () => {
    if (!lesson || !user) return

    try {
      setSessionStatus('Initializing voice session...')
      
      // Create a simple session object
      const session = {
        sessionId: `session_${Date.now()}`,
        studentId: user?.username || 'anonymous',
        lessonId: lesson.id,
        topic: lesson.title,
        status: 'active',
        createdAt: new Date().toISOString()
      }

      setCurrentSession(session)
      setIsSessionActive(true)
      setSessionStatus('Voice session ready - Click microphone to speak')
      
    } catch (error) {
      console.error('Error initializing voice session:', error)
      setSessionStatus('Failed to initialize voice session')
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!isSessionActive) {
      await initializeVoiceSession()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })
        await processAudioInput(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setSessionStatus('🎤 Recording... Speak your question')

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      setSessionStatus('❌ Microphone access denied')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setSessionStatus('🤔 Processing your question...')
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Process audio input (simplified)
  const processAudioInput = async (audioBlob: Blob) => {
    if (!currentSession || !user) return

    try {
      // For demo purposes, simulate speech-to-text
      const simulatedQuestions = [
        `Can you explain more about ${lesson.title}?`,
        `What are the key concepts in ${lesson.title}?`,
        `How does this topic relate to real-world applications?`,
        `Can you give me an example of ${lesson.title}?`,
        `What should I focus on when studying ${lesson.title}?`
      ]
      
      const randomQuestion = simulatedQuestions[Math.floor(Math.random() * simulatedQuestions.length)]
      
      // Add to conversation history
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: randomQuestion,
        timestamp: new Date().toISOString(),
        audioSize: audioBlob.size
      }
      
      setConversationHistory(prev => [...prev, userMessage])
      
      // Generate AI response
      await generateAIResponse(randomQuestion)

    } catch (error) {
      console.error('Error processing audio:', error)
      setSessionStatus('❌ Error processing audio')
    }
  }

  // Generate AI response
  const generateAIResponse = async (userMessage: string) => {
    if (!currentSession || !user) return

    try {
      setSessionStatus('🤖 AI is thinking...')

      // Build contextual prompt
      const systemPrompt = `You are a helpful educational AI assistant for the lesson "${lesson.title}". 
      
      Lesson content: ${lesson.description}
      
      Provide clear, concise, and educational answers to help the student understand the topic better.
      Keep responses engaging and under 150 words for voice synthesis.
      Use examples and analogies when helpful.`

      // Get AI response using existing chatWithAI function
      const response = await chatWithAI(userMessage, systemPrompt)

      // Add AI response to conversation history
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      }
      
      setConversationHistory(prev => [...prev, aiMessage])
      setAiResponse(response)
      setSessionStatus('✅ AI Response ready - Check the text below')

    } catch (error) {
      console.error('Error generating AI response:', error)
      setSessionStatus('❌ Error generating response')
    }
  }

  // End session
  const endSession = () => {
    setIsSessionActive(false)
    setCurrentSession(null)
    setIsRecording(false)
    setIsPlaying(false)
    setSessionStatus('Session ended')
    setConversationHistory([])
    setAiResponse('')
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neuro-card-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Voice Session</h2>
            <p className="text-gray-600">{lesson.title}</p>
          </div>
          <button
            onClick={onClose}
            className="neuro-button text-gray-500 hover:text-red-500 p-2"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-center text-lg font-medium text-gray-700">
            {sessionStatus}
          </p>
          {isRecording && (
            <p className="text-center text-sm text-purple-600 mt-2">
              Recording: {formatTime(recordingTime)}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isSessionActive ? (
            <button
              onClick={initializeVoiceSession}
              disabled={isLoading}
              className="neuro-button-enhanced bg-white text-[#8b5cf6] p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              title="Start Voice Session"
            >
              <FaPlay size={24} />
            </button>
          ) : (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="neuro-button-enhanced bg-white text-green-500 p-6 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  title="Start Recording"
                >
                  <FaMicrophone size={24} />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="neuro-button-enhanced bg-white text-red-500 p-6 rounded-full hover:shadow-lg transition-all duration-300 animate-pulse"
                  title="Stop Recording"
                >
                  <FaStop size={24} />
                </button>
              )}
              
              <button
                onClick={endSession}
                className="neuro-button-enhanced bg-white text-red-500 p-4 rounded-full hover:shadow-lg transition-all duration-300"
                title="End Session"
              >
                <FaTimes size={20} />
              </button>
            </>
          )}
        </div>

        {/* Current AI Response */}
        {aiResponse && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-semibold text-purple-800 mb-2">🤖 AI Assistant Response:</h3>
            <p className="text-gray-700 leading-relaxed">{aiResponse}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversation History</h3>
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-green-50 border-l-4 border-green-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">
                    {message.type === 'user' ? '🎤 You asked:' : '🤖 AI responded:'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{message.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {!isSessionActive && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to use Voice Session:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Click the play button to start the session</li>
              <li>2. Click the microphone to record your question</li>
              <li>3. Speak clearly and click stop when finished</li>
              <li>4. The AI will provide a written response</li>
              <li>5. Continue the conversation or end the session</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
} 
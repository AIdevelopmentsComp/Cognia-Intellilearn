'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaTimes, FaMicrophone, FaStop, FaPlay, FaPause } from 'react-icons/fa'

interface VoiceSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sessionData: {
    title: string
    description: string
    type: 'voice_session'
    content: string
    duration: string
    order: number
  }) => void
  moduleTitle: string
}

export default function VoiceSessionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  moduleTitle 
}: VoiceSessionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTitle('')
      setDescription('')
      setIsRecording(false)
      setIsPlaying(false)
      setRecordingTime(0)
      setAudioBlob(null)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Error al acceder al micrófono. Verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para la sesión')
      return
    }

    const sessionData = {
      title: title.trim(),
      description: description.trim(),
      type: 'voice_session' as const,
      content: audioBlob ? 'voice_session_content' : '',
      duration: formatTime(recordingTime),
      order: Date.now() // Temporary order
    }

    onSave(sessionData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neuro-card bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-[#132944]">Nueva Sesión de Voz</h2>
            <p className="text-sm text-gray-500 mt-1">Módulo: {moduleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="neuro-button p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Sesión *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                placeholder="Ej: Conversación sobre Project Management"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800 resize-none"
                placeholder="Describe brevemente el contenido de esta sesión de voz..."
              />
            </div>
          </div>

          {/* Voice Session Interface */}
          <div className="neuro-card p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center space-y-6">
              <h3 className="text-lg font-semibold text-[#132944] mb-4">
                Asistente de Voz CognIA
              </h3>

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

              {/* Recording Status */}
              <div className="space-y-2">
                <div className="text-2xl font-mono text-[#8b5cf6]">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-gray-600">
                  {isRecording ? 'Grabando...' : audioBlob ? 'Grabación completada' : 'Listo para grabar'}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center items-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="neuro-button-enhanced bg-white text-[#8b5cf6] p-4 rounded-full hover:shadow-lg transition-all duration-300"
                    title="Iniciar Grabación"
                  >
                    <FaMicrophone className="text-2xl" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="neuro-button-enhanced bg-red-500 text-white p-4 rounded-full hover:shadow-lg transition-all duration-300"
                    title="Detener Grabación"
                  >
                    <FaStop className="text-2xl" />
                  </button>
                )}

                {audioBlob && !isRecording && (
                  <button
                    onClick={isPlaying ? pauseRecording : playRecording}
                    className="neuro-button-enhanced bg-white text-[#6366f1] p-4 rounded-full hover:shadow-lg transition-all duration-300"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="neuro-button px-6 py-2 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear Sesión
          </button>
        </div>
      </div>
    </div>
  )
} 
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaTimes, FaCog, FaLightbulb } from 'react-icons/fa'

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
  
  // Voice Assistant Configuration Parameters
  const [voiceSpeed, setVoiceSpeed] = useState('medium')
  const [voiceStyle, setVoiceStyle] = useState('conversational')
  const [sessionDuration, setSessionDuration] = useState('5')
  const [interactionLevel, setInteractionLevel] = useState('medium')
  const [languageModel, setLanguageModel] = useState('claude-3-haiku')
  const [voicePersonality, setVoicePersonality] = useState('friendly')

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTitle('')
      setDescription('')
      setVoiceSpeed('medium')
      setVoiceStyle('conversational')
      setSessionDuration('5')
      setInteractionLevel('medium')
      setLanguageModel('claude-3-haiku')
      setVoicePersonality('friendly')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para la sesión')
      return
    }

    const configData = {
      voiceSpeed,
      voiceStyle,
      sessionDuration,
      interactionLevel,
      languageModel,
      voicePersonality
    }

    const sessionData = {
      title: title.trim(),
      description: description.trim(),
      type: 'voice_session' as const,
      content: JSON.stringify(configData),
      duration: `${sessionDuration} min`,
      order: Date.now() // Temporary order
    }

    onSave(sessionData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neuro-card bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Voice Assistant Configuration */}
          <div className="neuro-card p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaCog className="text-[#8b5cf6] text-lg" />
                <h3 className="text-lg font-semibold text-[#132944]">
                  Configuración del Asistente de Voz
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velocidad de Voz
                  </label>
                  <select
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="slow">Lenta</option>
                    <option value="medium">Normal</option>
                    <option value="fast">Rápida</option>
                  </select>
                </div>

                {/* Voice Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo de Conversación
                  </label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="conversational">Conversacional</option>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="educational">Educativo</option>
                  </select>
                </div>

                {/* Session Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de Sesión (minutos)
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="3">3 minutos</option>
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                  </select>
                </div>

                {/* Interaction Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Interacción
                  </label>
                  <select
                    value={interactionLevel}
                    onChange={(e) => setInteractionLevel(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="low">Básico - Respuestas cortas</option>
                    <option value="medium">Intermedio - Conversación fluida</option>
                    <option value="high">Avanzado - Interacción profunda</option>
                  </select>
                </div>

                {/* Language Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo de IA
                  </label>
                  <select
                    value={languageModel}
                    onChange={(e) => setLanguageModel(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="claude-3-haiku">Claude 3 Haiku - Rápido</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet - Balanceado</option>
                    <option value="claude-3-opus">Claude 3 Opus - Avanzado</option>
                  </select>
                </div>

                {/* Voice Personality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personalidad del Asistente
                  </label>
                  <select
                    value={voicePersonality}
                    onChange={(e) => setVoicePersonality(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="friendly">Amigable</option>
                    <option value="professional">Profesional</option>
                    <option value="encouraging">Motivador</option>
                    <option value="patient">Paciente</option>
                    <option value="enthusiastic">Entusiasta</option>
                  </select>
                </div>
              </div>

              {/* Configuration Tips */}
              <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-start space-x-3">
                  <FaLightbulb className="text-[#6366f1] text-lg mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#132944] mb-2">Consejos de Configuración:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• <strong>Velocidad Lenta:</strong> Ideal para principiantes o contenido complejo</p>
                      <p>• <strong>Estilo Educativo:</strong> Mejor para explicaciones técnicas</p>
                      <p>• <strong>Interacción Alta:</strong> Permite debates y análisis profundos</p>
                      <p>• <strong>Claude 3 Opus:</strong> Mejor comprensión contextual para temas avanzados</p>
                    </div>
                  </div>
                </div>
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
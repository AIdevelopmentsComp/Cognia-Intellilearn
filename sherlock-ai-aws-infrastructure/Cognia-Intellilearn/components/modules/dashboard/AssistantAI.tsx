/**
 * COGNIA INTELLILEARN - AI ASSISTANT DASHBOARD COMPONENT
 * 
 * CONTEXTO DE NEGOCIO:
 * - Asistente de IA integrado en el dashboard para apoyo educativo personalizado
 * - Utiliza AWS Bedrock con Claude 3 Haiku para respuestas educativas inteligentes
 * - Diseñado específicamente para estudiantes, profesores y administradores educativos
 * - Proporciona tutorías personalizadas, explicaciones de conceptos y guía académica
 * 
 * PROPÓSITO:
 * - Ofrecer apoyo educativo 24/7 a través de IA conversacional
 * - Personalizar respuestas según el contexto educativo del usuario
 * - Facilitar el aprendizaje con explicaciones claras y ejemplos prácticos
 * - Integrar seamlessly con el ecosistema educativo CognIA
 * 
 * CASOS DE USO:
 * - Estudiante solicita explicación de conceptos complejos
 * - Profesor busca ideas para actividades educativas
 * - Administrador consulta sobre mejores prácticas pedagógicas
 * - Usuario necesita orientación para navegar la plataforma
 */

'use client'

import React, { useState } from 'react'
import { chatWithAI } from '@/lib/aws-bedrock'
import { FaRobot, FaPaperPlane, FaSpinner } from 'react-icons/fa'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

export default function AssistantAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente educativo CognIA. Estoy aquí para ayudarte con tus estudios, explicar conceptos, sugerir recursos y guiarte en tu proceso de aprendizaje. ¿En qué puedo ayudarte hoy?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Obtener respuesta de AWS Bedrock (Claude 3 Haiku)
      const systemPrompt = `Eres un asistente educativo experto de CognIA Intellilearn. Tu misión es:
      - Proporcionar explicaciones claras y pedagógicas
      - Adaptar el contenido al nivel del estudiante
      - Usar ejemplos prácticos y relevantes
      - Fomentar el pensamiento crítico
      - Mantener un tono motivador y profesional
      - Responder en español con terminología educativa apropiada`;

      const aiResponse = await chatWithAI(inputMessage, systemPrompt)

      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error al comunicarse con el asistente:', error)
      
      // Mensaje de error amigable
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo en unos momentos.',
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      {/* Header del Asistente */}
      <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-r from-[#132944] to-[#3C31A3] rounded-full flex items-center justify-center mr-4">
          <FaRobot className="text-white text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Asistente CognIA</h3>
          <p className="text-gray-600 text-sm">Tu tutor personalizado impulsado por inteligencia artificial AWS Bedrock</p>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-[#3C31A3] text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Indicador de carga */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <FaSpinner className="animate-spin text-[#3C31A3]" />
                <span className="text-sm">El asistente está escribiendo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre cualquier tema educativo..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[#3C31A3] text-white px-4 py-2 rounded-lg hover:bg-[#2d2580] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">Potenciado por AWS Bedrock Claude 3 Haiku</p>
        </div>
      </div>
    </div>
  )
}
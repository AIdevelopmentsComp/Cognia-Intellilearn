'use client'
import { useState, useRef, useEffect } from 'react'
import { FaRobot, FaPaperPlane, FaLightbulb, FaBookReader, FaChartLine, FaMicrophone, FaStop } from 'react-icons/fa'
import { chatWithAI } from '@/lib/firebase'

type Message = {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

type SuggestionTopic = {
  id: string
  title: string
  icon: React.ReactNode
}

export const AssistantAI = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola, soy tu asistente de aprendizaje IA. ¿En qué puedo ayudarte hoy?',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([
    { role: 'model', content: 'Hola, soy tu asistente de aprendizaje IA. ¿En qué puedo ayudarte hoy?' }
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Temas sugeridos
  const suggestionTopics: SuggestionTopic[] = [
    { id: '1', title: 'Explícame el tema de regresión lineal', icon: <FaLightbulb /> },
    { id: '2', title: 'Resumir mi próxima lección', icon: <FaBookReader /> },
    { id: '3', title: 'Analizar mi progreso en el curso', icon: <FaChartLine /> }
  ]

  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setShowSuggestions(false)
    setIsLoading(true)
    
    // Actualizar historial de chat
    const newChatHistory = [...chatHistory, { role: 'user', content: userMessage.text }];
    setChatHistory(newChatHistory);
    
    try {
      // Obtener respuesta de Gemini AI
      const aiResponseText = await chatWithAI(newChatHistory);
      
      // Agregar respuesta del AI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage]);
      setChatHistory(prev => [...prev, { role: 'model', content: aiResponseText }]);
    } catch (error) {
      console.error('Error al obtener respuesta de IA:', error);
      // Agregar mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Aquí iría la lógica real para iniciar la grabación de voz
      setTimeout(() => {
        setInputValue('¿Puedes explicarme qué es regresión lineal en términos simples?')
        setIsRecording(false)
      }, 2000)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Asistente IA</h1>
        <p className="text-gray-600">Tu tutor personalizado impulsado por inteligencia artificial Gemini</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        {/* Encabezado del chat */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 text-white flex items-center">
          <div className="bg-white/20 rounded-full p-2 mr-3">
            <FaRobot className="text-xl" />
          </div>
          <div>
            <h2 className="font-semibold">CognIA Assistant</h2>
            <p className="text-xs text-white/80">Potenciado por Gemini AI</p>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white shadow text-gray-700 rounded-tl-none'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70 text-right">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white shadow text-gray-700 rounded-lg rounded-tl-none max-w-[80%] p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef}></div>
        </div>

        {/* Sugerencias */}
        {showSuggestions && (
          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Sugerencias:</p>
            <div className="flex flex-wrap gap-2">
              {suggestionTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleSuggestionClick(topic.title)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-full flex items-center transition-colors"
                >
                  <span className="mr-1 text-purple-600">{topic.icon}</span>
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input de mensaje */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleRecording}
              className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'} hover:opacity-80 transition-colors`}
            >
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
            <div className="relative flex-grow">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-purple-500 resize-none h-10 leading-tight"
                placeholder="Escribe un mensaje..."
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  inputValue.trim() ? 'text-purple-600 hover:bg-purple-100' : 'text-gray-400'
                }`}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
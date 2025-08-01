/**
 * @fileoverview Floating AI Assistant Component
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-15
 * @updated 2023-12-20
 * @version 1.0.0
 * 
 * @description
 * Provides a floating chat interface for AI assistance throughout the application.
 * Allows users to interact with the Gemini AI model from any page.
 * 
 * @context
 * A global component accessible from any part of the application.
 * Integrated with Firebase AI (Gemini) for natural language processing.
 * Provides predefined suggestions and maintains conversation history.
 * 
 * @changelog
 * v1.0.0 - Initial implementation with basic chat functionality
 * v1.0.1 - Added conversation history and loading states
 * v1.0.2 - Integrated with Gemini AI model via Firebase
 */

import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLightbulb, FaBookReader, FaChartLine } from 'react-icons/fa';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';
import { chatWithAI } from '@/lib/firebase';

/**
 * Message type definition
 * @context Defines the structure of chat messages
 */
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * Floating Assistant Component
 * 
 * @returns {JSX.Element} Floating chat interface component
 * 
 * @context
 * Persistent UI element across the application.
 * 
 * @description
 * Renders a floating button that expands into a chat interface.
 * Manages conversation state and integrates with Gemini AI.
 * Features:
 * - User authentication integration
 * - Personalized greeting
 * - Message history
 * - Typing indicators
 * - Predefined suggestions
 */
export const FloatingAssistant = () => {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Authentication
  const { user } = useAuth();

  /**
   * Predefined suggestion topics
   * @context Quick access prompts for common user queries
   */
  const suggestionTopics = [
    { id: '1', title: 'Explícame regresión lineal', icon: <FaLightbulb className="text-[#3C31A3]" /> },
    { id: '2', title: 'Resumir mi próxima lección', icon: <FaBookReader className="text-[#3C31A3]" /> },
    { id: '3', title: 'Ver mi progreso', icon: <FaChartLine className="text-[#3C31A3]" /> }
  ];

  /**
   * Initialize chat with personalized welcome message
   * @context Sets up initial chat state when user is authenticated
   */
  useEffect(() => {
    if (user) {
      const welcomeMessage: Message = {
        id: 'welcome',
        sender: 'assistant',
        text: `¡Hola ${user.displayName?.split(' ')[0] || 'estudiante'}! Soy tu asistente CognIA. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setChatHistory([{ role: 'model', content: welcomeMessage.text }]);
    }
  }, [user]);

  /**
   * Auto-scroll to latest messages
   * @context Improves UX by keeping the latest messages visible
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle sending user messages and getting AI responses
   * @context Core chat functionality
   */
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Add user message to conversation
    const userMessage: Message = { 
      id: Date.now().toString(),
      sender: 'user', 
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Update chat history
    const newChatHistory = [...chatHistory, { role: 'user', content: userMessage.text }];
    setChatHistory(newChatHistory);
    
    try {
      // Get response from Gemini AI
      const aiResponseText = await chatWithAI(newChatHistory);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setChatHistory(prev => [...prev, { role: 'model', content: aiResponseText }]);
    } catch (error) {
      console.error('Error al obtener respuesta de IA:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle clicking on suggestion topics
   * @param {string} suggestion - The suggestion text
   * @context Facilitates quick interactions with predefined topics
   */
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  /**
   * Toggle chat window visibility
   * @context Controls the open/closed state of the chat interface
   */
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Assistant button - visible when chat is closed */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-5 py-3 rounded-md text-white font-medium shadow-lg bg-gradient-to-r from-[#132944] to-[#3C31A3] hover:scale-105 transition-transform"
        >
          <div>
            <Image src="/assets/images/IA.svg" alt="Asistente CognIA" width={33} height={33} />
          </div>
          <span>Asistente CognIA</span>
        </button>
      )}

      {/* Chat window - visible when opened */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-96 h-[500px] max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] p-3 text-white flex items-center justify-between cursor-move">
            <div className="flex items-center">
              <Image src="/assets/images/IA.svg" alt="CognIA" width={28} height={28} className="mr-2" />
              <h3 className="font-medium">Asistente CognIA</h3>
            </div>
            <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <FaTimes size={14} />
            </button>
          </div>

          {/* Chat message area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-[#3C31A3] text-white rounded-tr-none'
                      : 'bg-white shadow text-gray-700 rounded-tl-none'
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs mt-1 opacity-70 text-right">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator - shown when loading */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white shadow text-gray-700 rounded-lg rounded-tl-none max-w-[80%] p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#3C31A3] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3C31A3] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#3C31A3] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions area */}
          {showSuggestions && (
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
              <div className="flex flex-wrap gap-2">
                {suggestionTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => handleSuggestionClick(topic.title)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full flex items-center transition-colors"
                  >
                    <span className="mr-1">{topic.icon}</span>
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#3C31A3] resize-none h-9 text-sm leading-tight"
                  placeholder="Escribe un mensaje..."
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                    inputValue.trim() ? 'text-[#3C31A3] hover:bg-gray-100' : 'text-gray-400'
                  }`}
                >
                  <FaPaperPlane size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
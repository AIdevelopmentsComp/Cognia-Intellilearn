'use client'
/**
 * @fileoverview Floating AI Assistant Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-15
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Provides a floating chat interface for AI assistance with neumorphic design.
 * Allows users to interact with the Gemini AI model from any page.
 * 
 * @context
 * A global component accessible from any part of the application.
 * Integrated with Firebase AI (Gemini) for natural language processing.
 * Features modern neumorphic design with smooth animations.
 * 
 * @changelog
 * v1.0.0 - Initial implementation with basic chat functionality
 * v1.0.1 - Added conversation history and loading states
 * v1.0.2 - Integrated with Gemini AI model via Firebase
 * v2.0.0 - Added neumorphic design system
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLightbulb, FaBookReader, FaChartLine } from 'react-icons/fa';
import { useAuth } from '@/lib/AuthContext';
import { chatWithAI } from '@/lib/aws-bedrock';

/**
 * Message type definition
 * @context Defines the structure of chat messages
 */
interface Message {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: Date;
}

/**
 * Floating Assistant Component with Neumorphism
 * 
 * @returns {JSX.Element} Floating chat interface component with neumorphic design
 * 
 * @context
 * Persistent UI element across the application with modern neumorphic styling.
 * 
 * @description
 * Renders a floating button that expands into a neumorphic chat interface.
 * Manages conversation state and integrates with Gemini AI.
 * Features:
 * - User authentication integration
 * - Personalized greeting
 * - Message history with neumorphic bubbles
 * - Typing indicators
 * - Neumorphic input field and buttons
 * - Smooth animations and transitions
 */
export const FloatingAssistant = () => {
  const { user } = useAuth(); // Get user authentication state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls to the bottom of the messages container
   * @context Ensures latest messages are visible
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles chat window toggle with authentication check
   * @context Opens/closes chat interface
   */
  const handleToggle = () => {
    // If user is not authenticated, redirect to login
    if (!user) {
      console.log('🔒 Chat blocked: User not authenticated');
      window.location.href = '/auth/login';
      return;
    }
    
    setIsOpen(!isOpen);
  };

  /**
   * Sends message to AI and handles response
   * @context Core chat functionality with AWS Bedrock integration
   */
  const handleSendMessage = async () => {
    // Double check authentication before allowing chat
    if (!user) {
      console.log('🔒 Message blocked: User not authenticated');
      window.location.href = '/auth/login';
      return;
    }

    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const newChatHistory = [...messages, userMessage];
    setMessages(newChatHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get response from AWS Bedrock (Claude 3 Haiku)
      const systemPrompt = "Eres un asistente educativo experto en ayudar a estudiantes. Proporciona respuestas útiles, precisas y motivadoras sobre temas académicos.";
      
      // Convert chat history to AWS Bedrock format and ensure alternating roles
      const bedrockHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
      
      // Process chat history to ensure alternating roles
      for (let i = 0; i < newChatHistory.length; i++) {
        const msg = newChatHistory[i];
        const role = msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant';
        
        // Only add if it's different from the last role to ensure alternating
        if (bedrockHistory.length === 0 || bedrockHistory[bedrockHistory.length - 1].role !== role) {
          bedrockHistory.push({
            role: role,
            content: msg.text
          });
        }
      }
      
      console.log('Bedrock History before sending:', bedrockHistory);
      
      const aiResponseText = await chatWithAI(userMessage.text, systemPrompt, bedrockHistory);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        role: 'model',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        role: 'model',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles Enter key press for sending messages
   * @context Keyboard interaction support
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Initialize chat with personalized welcome message
   * @context Sets up initial chat state when user is authenticated
   */
  useEffect(() => {
    if (user) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `¡Hola ${user.displayName?.split(' ')[0] || 'estudiante'}! Soy tu asistente CognIA. ¿En qué puedo ayudarte hoy?`,
        role: 'model',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [user]);

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Assistant button with neumorphism - visible when chat is closed */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="neuro-button-primary flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold shadow-xl transition-all duration-300 neuro-fade-in"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <img src="/assets/images/IA.svg" alt="Asistente CognIA" width={24} height={24} />
          </div>
          <span>Asistente CognIA</span>
        </button>
      )}

      {/* Chat window with neumorphism - visible when opened */}
      {isOpen && (
        <div className="absolute bottom-0 right-0 w-96 h-[500px] max-h-[80vh] neuro-chat overflow-hidden flex flex-col transition-all duration-300 neuro-fade-in">
          {/* Header with neumorphic design */}
          <div className="p-4 text-white flex items-center justify-between cursor-move rounded-t-2xl"
               style={{
                 background: 'linear-gradient(135deg, var(--cognia-blue-dark), var(--cognia-blue-purple))'
               }}>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <img src="/assets/images/IA.svg" alt="CognIA" width={20} height={20} />
              </div>
              <h3 className="font-semibold">Asistente CognIA</h3>
            </div>
            <button 
              onClick={handleToggle} 
              className="neuro-button p-2 rounded-full transition-all duration-300 text-white bg-white/10 hover:bg-white/20"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Chat message area with neumorphic background */}
          <div className="flex-1 overflow-y-auto p-4 neuro-inset">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`neuro-message max-w-[85%] rounded-lg p-3 transition-all duration-300 ${
                    message.role === 'user' ? 'user' : 'assistant'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70 text-right">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator with neumorphic design */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="neuro-message assistant max-w-[80%] p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: 'var(--cognia-blue-purple)'}}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: 'var(--cognia-blue-purple)', animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{backgroundColor: 'var(--cognia-blue-purple)', animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area with neumorphic design */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end gap-3">
              <div className="relative flex-grow">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="neuro-input w-full px-4 py-3 pr-12 resize-none text-sm leading-tight"
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 neuro-button p-2 rounded-full transition-all duration-300 ${
                    inputValue.trim() && !isLoading 
                      ? 'text-gray-600 hover:text-gray-800' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
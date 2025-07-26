/**
 * @fileoverview Dashboard Sidebar Navigation Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Main navigation sidebar for the dashboard interface with neumorphic design.
 * Provides access to all major sections of the application.
 * 
 * @context
 * Core navigation component used in the dashboard layout.
 * Handles user profile display, main navigation, and logout functionality.
 * Responsive design with mobile toggle functionality and neumorphic styling.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added mobile responsiveness
 * v1.0.2 - Added active link highlighting
 * v2.0.0 - Added neumorphic design system
 */

'use client'
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, 
  FiBookOpen, 
  FiUsers, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiBarChart,
  FiAward,
  FiMessageSquare,
  FiUser,
  FiTrendingUp,
  FiFileText
} from 'react-icons/fi';
import { useAuth } from '@/lib/AuthContext';

/**
 * Sidebar Navigation Component with Neumorphism
 * 
 * @returns {JSX.Element} Sidebar navigation component with neumorphic design
 * 
 * @context
 * Main navigation interface for authenticated users with modern neumorphic styling.
 * 
 * @description
 * Renders a responsive sidebar with neumorphic design including:
 * - User profile information with neumorphic avatar
 * - Primary navigation menu with neumorphic buttons
 * - Secondary tools menu
 * - Neumorphic sign out button
 * - Mobile toggle functionality
 * 
 * Features:
 * - Active link highlighting with neumorphic inset effect
 * - Responsive design with mobile overlay
 * - User authentication integration
 * - Smooth animations and transitions
 */
export const Sidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  /**
   * Handle user sign out
   * @context User session termination
   */
  const handleSignOut = async () => {
    await signOut()
  }

  /**
   * Toggle sidebar visibility on mobile
   * @context Mobile responsiveness
   */
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  /**
   * Determine if a navigation link is active
   * @param {string} path - The path to check
   * @returns {boolean} True if the link is active
   * @context Active link highlighting with neumorphic effects
   */
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true
    }
    if (path !== '/dashboard' && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  /**
   * Main navigation items
   * @context Primary application sections
   */
  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/dashboard/courses', label: 'Mis Cursos', icon: <FiBookOpen /> },
    { path: '/dashboard/content', label: 'Contenido', icon: <FiFileText /> },
    { path: '/dashboard/assistant', label: 'Asistente IA', icon: <FiMessageSquare /> },
    { path: '/dashboard/analytics', label: 'Analytics', icon: <FiBarChart /> },
    { path: '/dashboard/gamification', label: 'Gamificación', icon: <FiAward /> },
  ]

  /**
   * Secondary navigation items
   * @context Additional tools and user settings
   */
  const secondaryNavItems = [
    { path: '/dashboard/assignments', label: 'Tareas', icon: <FiFileText /> },
    { path: '/dashboard/certificates', label: 'Certificados', icon: <FiAward /> },
    { path: '/dashboard/profile', label: 'Perfil', icon: <FiUser /> },
    { path: '/dashboard/settings', label: 'Configuración', icon: <FiSettings /> },
  ]

  return (
    <>
      {/* Mobile sidebar toggle button with neumorphism */}
      <button
        className="fixed top-4 left-4 neuro-button p-3 rounded-full shadow-md md:hidden z-30"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar container with neumorphic design */}
      <aside
        className={`fixed md:static w-[280px] h-screen z-20 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col neuro-sidebar`}
      >
        {/* Logo section with neumorphic container */}
        <div className="py-6 px-4 flex justify-center">
          <div className="neuro-container p-4 rounded-lg">
            <Link href="/dashboard" className="block">
              <img
                src="/assets/images/Logo.svg"
                alt="CognIA Logo"
                width={160}
                height={40}
                className="object-contain"
                style={{ maxWidth: '100%', height: 'auto' }}
                onLoad={() => console.log('✅ Sidebar logo loaded successfully')}
                onError={(e) => {
                  console.error('❌ Sidebar logo failed to load:', e);
                  console.error('Sidebar logo src:', e.currentTarget.src);
                }}
              />
            </Link>
          </div>
        </div>

        {/* User profile section with neumorphic elements */}
        <div className="px-5 py-4 mb-6">
          <div className="neuro-container p-4 rounded-lg flex items-center">
            <div className="neuro-avatar w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center uppercase font-bold text-white">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="ml-3">
              <p className="text-gray-800 text-sm font-medium">
                {user?.displayName || 'Usuario Demo'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'usuario@ejemplo.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Main navigation menu with neumorphic items */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="neuro-inset p-4 rounded-lg mb-6">
            <ul className="space-y-2">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`neuro-nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-white font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    style={isActive(item.path) ? {
                      background: 'linear-gradient(135deg, var(--cognia-blue-dark), var(--cognia-blue-purple))',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(19, 41, 68, 0.25)'
                    } : {}}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools section header */}
          <div className="mb-4">
            <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Herramientas
            </p>
          </div>

          {/* Secondary navigation menu with neumorphic items */}
          <div className="neuro-inset p-4 rounded-lg">
            <ul className="space-y-2">
              {secondaryNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`neuro-nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-white font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    style={isActive(item.path) ? {
                      background: 'linear-gradient(135deg, var(--cognia-blue-dark), var(--cognia-blue-purple))',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(19, 41, 68, 0.25)'
                    } : {}}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sign out button with neumorphic design */}
        <div className="p-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="neuro-button flex items-center justify-center gap-2 w-full py-3 px-4 text-gray-700 text-sm rounded-lg transition-all duration-300 font-semibold hover:text-gray-900"
          >
            <FiLogOut className="text-lg" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile overlay background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  )
} 
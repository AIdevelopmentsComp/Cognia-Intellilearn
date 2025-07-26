'use client'
import React, { ReactNode, useState } from 'react'
import { Sidebar } from '@/components/common/Sidebar'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'
import { FaSearch, FaBell, FaChevronDown } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, message: 'Nueva lección disponible', time: '5 min ago' },
    { id: 2, message: 'Tarea revisada', time: '1 hour ago' },
    { id: 3, message: 'Nuevo certificado obtenido', time: '2 hours ago' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cursos, lecciones, o estudiantes..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Header Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <FaBell className="text-gray-600" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notificaciones</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b hover:bg-gray-50">
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <span className="font-medium">{user?.displayName || 'Usuario'}</span>
                <FaChevronDown className="text-gray-400 text-sm" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      <FloatingAssistant />
    </div>
  )
} 
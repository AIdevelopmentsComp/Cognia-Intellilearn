import React, { useState } from 'react'
import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { useAuth } from '@/lib/AuthContext'
import { FaUser, FaCog, FaLock, FaBell, FaSave } from 'react-icons/fa'

type TabType = 'personal' | 'preferences' | 'privacy' | 'notifications'

const ProfilePage: NextPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    bio: 'Estudiante apasionado por la tecnología y el aprendizaje continuo.',
    phone: '+1 234 567 890',
    location: 'Madrid, España',
    language: 'es',
    timezone: 'Europe/Madrid',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: 'public'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData({
      ...formData,
      [name]: checked
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar actualización de perfil
    console.log('Form data:', formData)
    // Mostrar mensaje de éxito
    alert('Perfil actualizado correctamente')
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                ></textarea>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'preferences':
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Preferencias de Cuenta</h2>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona horaria
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                  >
                    <option value="Europe/Madrid">Europe/Madrid</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="America/Los_Angeles">America/Los Angeles</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema de la interfaz
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={formData.theme === 'light'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Claro</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={formData.theme === 'dark'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Oscuro</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={formData.theme === 'system'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sistema</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'privacy':
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Privacidad y Seguridad</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibilidad del perfil
                </label>
                <select
                  name="profileVisibility"
                  value={formData.profileVisibility}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                >
                  <option value="public">Público</option>
                  <option value="friends">Solo amigos</option>
                  <option value="private">Privado</option>
                </select>
              </div>
              
              <div>
                <button className="px-4 py-2 bg-[#3C31A3] text-white rounded-md hover:bg-[#2c2376]">
                  Cambiar contraseña
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'notifications':
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Notificaciones</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Notificaciones por email</h3>
                  <p className="text-xs text-gray-500">Recibe actualizaciones por correo electrónico</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#3C31A3] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Notificaciones push</h3>
                  <p className="text-xs text-gray-500">Recibe notificaciones en tiempo real</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.pushNotifications}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#3C31A3] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Perfil" description="Gestiona tu cuenta">
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Perfil</h1>
            <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#13294e] text-4xl font-bold uppercase">
                  {user?.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.displayName || 'Usuario Demo'}</h2>
                  <p className="text-white/80">{user?.email || 'usuario@ejemplo.com'}</p>
                  <p className="text-white/70 text-sm mt-1">Miembro desde Enero 2024</p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                <button
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'personal'
                      ? 'border-b-2 border-[#3C31A3] text-[#3C31A3]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('personal')}
                >
                  <FaUser className="inline-block mr-2" />
                  Información Personal
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'preferences'
                      ? 'border-b-2 border-[#3C31A3] text-[#3C31A3]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <FaCog className="inline-block mr-2" />
                  Preferencias
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'privacy'
                      ? 'border-b-2 border-[#3C31A3] text-[#3C31A3]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('privacy')}
                >
                  <FaLock className="inline-block mr-2" />
                  Privacidad
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'notifications'
                      ? 'border-b-2 border-[#3C31A3] text-[#3C31A3]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <FaBell className="inline-block mr-2" />
                  Notificaciones
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {renderTab()}
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3C31A3] text-white rounded-md hover:bg-[#2c2376] flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default ProfilePage 
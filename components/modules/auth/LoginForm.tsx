'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiMail, FiLock } from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

export const LoginForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // En un escenario real, aquí iría la lógica de autenticación
    console.log('Login attempted with:', formData)
    
    // Simular login exitoso
    router.push('/dashboard')
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/assets/images/Logo.svg"
            alt="CognIA Logo"
            width={180}
            height={60}
            quality={100}
          />
        </div>
        <h2 className="text-2xl font-bold text-[#132944]">Inicia sesión en tu cuenta</h2>
        <p className="text-gray-600 mt-2">
          Accede a tu plataforma educativa personalizada
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <a href="#" className="text-sm text-[#3C31A3] hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="text-gray-400" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3]"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3] border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Recordar mis datos
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Iniciar sesión
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-3 text-sm text-gray-500">o continúa con</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>

        <div>
          <button
            type="button"
            className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            <FaGoogle className="text-red-500 mr-2" />
            Google
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link href="/auth/register" className="text-[#3C31A3] font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
} 
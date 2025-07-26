'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FiMail, FiLock } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

const LoginForm = () => {
  const router = useRouter()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await signIn(formData.email, formData.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-md">
      <div className="mb-8 text-center">
        <img
          src="/assets/images/Logo.svg"
          alt="CognIA Logo"
          width={287}
          height={77}
          className="mx-auto mb-4"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <h2 className="text-2xl font-bold text-[#132944]">Inicia sesión en tu cuenta</h2>
        <p className="text-gray-600 mt-2">
          Accede a tu campus virtual personalizado
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

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
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Usuarios de prueba:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@mattermind.com / AdminPass123!</p>
            <p><strong>Attorney:</strong> attorney@mattermind.com / AttorneyPass123!</p>
            <p><strong>Paralegal:</strong> paralegal@mattermind.com / ParalegalPass123!</p>
          </div>
        </div>
      </div>

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

export default LoginForm
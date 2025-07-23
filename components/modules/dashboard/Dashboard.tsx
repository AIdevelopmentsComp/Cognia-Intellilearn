'use client'
import { FaPlus } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

export default function DashboardContent() {
  const { user } = useAuth()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        ¡Bienvenido, {user?.displayName?.split(' ')[0] || 'Usuario'}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-4">Cursos Recientes</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-medium">JS</span>
              </div>
              <div>
                <p className="font-medium">JavaScript Avanzado</p>
                <p className="text-xs text-gray-500">Último acceso: hace 2 días</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-medium">PY</span>
              </div>
              <div>
                <p className="font-medium">Python para Data Science</p>
                <p className="text-xs text-gray-500">Último acceso: hace 5 días</p>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 mt-4 text-sm text-purple-600 font-medium py-2 hover:bg-purple-50 rounded-lg transition-colors">
              <FaPlus size={12} />
              <span>Explorar más cursos</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-4">Tu Progreso</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">JavaScript Avanzado</span>
                <span className="text-gray-500">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Python para Data Science</span>
                <span className="text-gray-500">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">React Fundamentals</span>
                <span className="text-gray-500">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
          <div className="space-y-3">
            <div className="border border-gray-100 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-semibold mb-1">HOY - 16:00</p>
              <p className="font-medium">Masterclass: Inteligencia Artificial</p>
              <p className="text-xs text-gray-500 mt-1">Duración: 1 hora</p>
            </div>
            
            <div className="border border-gray-100 p-3 rounded-lg">
              <p className="text-xs text-purple-600 font-semibold mb-1">MAÑANA - 10:00</p>
              <p className="font-medium">Workshop: Desarrollo Web Moderno</p>
              <p className="text-xs text-gray-500 mt-1">Duración: 2 horas</p>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 mt-4 text-sm text-purple-600 font-medium py-2 hover:bg-purple-50 rounded-lg transition-colors">
              <span>Ver calendario completo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
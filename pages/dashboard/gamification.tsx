import React from 'react'
import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { FaTrophy, FaMedal, FaAward, FaStar, FaGem, FaFireAlt, FaBrain, FaChartLine, FaUsers, FaLock } from 'react-icons/fa'

const GamificationPage: NextPage = () => {
  const userLevel = 4;
  const userXP = 2750;
  const nextLevelXP = 3000;
  const progress = Math.round((userXP / nextLevelXP) * 100);
  
  // Datos de insignias y logros
  const badges = [
    {
      id: 1,
      name: 'Principiante ML',
      description: 'Completar el curso de introducción a Machine Learning',
      icon: <FaBrain size={20} className="text-blue-500" />,
      earned: true,
      date: '15/04/2024'
    },
    {
      id: 2,
      name: 'Analista de Datos',
      description: 'Completar tres proyectos de análisis de datos',
      icon: <FaChartLine size={20} className="text-green-500" />,
      earned: true,
      date: '28/04/2024'
    },
    {
      id: 3,
      name: 'Maestro Python',
      description: 'Obtener una puntuación perfecta en el examen de Python avanzado',
      icon: <FaStar size={20} className="text-yellow-500" />,
      earned: false
    },
    {
      id: 4,
      name: 'Colaborador',
      description: 'Ayudar a 10 estudiantes en el foro de la comunidad',
      icon: <FaUsers size={20} className="text-purple-500" />,
      earned: false
    }
  ]
  
  // Datos de ranking y puntuaciones
  const topStudents = [
    { id: 1, name: 'Ana García', points: 4850, avatar: '/assets/images/Image.svg' },
    { id: 2, name: 'Carlos Rodríguez', points: 4720, avatar: '/assets/images/Image.svg' },
    { id: 3, name: 'Elena Martínez', points: 4560, avatar: '/assets/images/Image.svg' },
    { id: 4, name: 'Usuario Demo', points: 2750, avatar: '/assets/images/Image.svg', isCurrentUser: true },
    { id: 5, name: 'Pablo Sánchez', points: 2300, avatar: '/assets/images/Image.svg' }
  ]
  
  // Datos de recompensas
  const rewards = [
    {
      id: 1,
      name: 'Certificado de Excelencia',
      cost: 2000,
      description: 'Certificado especial para incluir en tu portfolio profesional',
      icon: <FaAward size={24} className="text-yellow-500" />,
      available: true
    },
    {
      id: 2,
      name: 'Acceso a Webinar Exclusivo',
      cost: 3500,
      description: 'Acceso a webinar sobre las últimas tendencias en IA',
      icon: <FaGem size={24} className="text-purple-500" />,
      available: false
    },
    {
      id: 3,
      name: 'Mentoría Personalizada',
      cost: 5000,
      description: 'Sesión de 1 hora con un experto en el campo',
      icon: <FaTrophy size={24} className="text-blue-500" />,
      available: false
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout title="Gamificación" description="Tu progreso y recompensas">
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Gamificación</h1>
            <p className="text-gray-600">Sigue tu progreso, gana insignias y consigue recompensas</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de nivel y progreso */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0 w-24 h-24 bg-white/20 rounded-full flex items-center justify-center relative">
                    <span className="text-3xl font-bold">{userLevel}</span>
                    <div className="absolute -bottom-1 flex items-center justify-center w-full">
                      <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">Nivel</span>
                    </div>
                  </div>
                  
                  <div className="flex-grow text-center md:text-left">
                    <h2 className="text-xl font-bold mb-1">¡Buen trabajo, Estudiante!</h2>
                    <p className="text-white/80 mb-4">Continúa aprendiendo para desbloquear recompensas exclusivas</p>
                    
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm text-white/90">Progreso al nivel {userLevel + 1}</span>
                      <span className="text-sm text-white/90">{userXP} / {nextLevelXP} XP</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2.5">
                      <div
                        className="bg-white h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <FaMedal className="mr-2" />
                        <span>8 Logros</span>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <FaTrophy className="mr-2" />
                        <span>2 Badges</span>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <FaFireAlt className="mr-2" />
                        <span>Racha: 7 días</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insignias y logros */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaAward className="mr-2 text-[#3C31A3]" />
                  Insignias y Logros
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {badges.map(badge => (
                    <div 
                      key={badge.id} 
                      className={`border rounded-lg p-4 ${
                        badge.earned 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-gray-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          badge.earned 
                            ? 'bg-green-100' 
                            : 'bg-gray-200'
                        }`}>
                          {badge.earned ? badge.icon : <FaLock size={16} className="text-gray-500" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-800">{badge.name}</h3>
                            {badge.earned && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                Conseguido
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                          {badge.earned && badge.date && (
                            <p className="text-xs text-gray-500 mt-2">Obtenido el {badge.date}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 text-[#3C31A3] border border-[#3C31A3] rounded-md hover:bg-[#3C31A3] hover:text-white transition-colors text-sm">
                  Ver todos los logros
                </button>
              </div>
            </div>
            
            {/* Ranking */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaTrophy className="mr-2 text-[#3C31A3]" />
                  Ranking
                </h2>
                
                <div className="space-y-3">
                  {topStudents.map((student, index) => (
                    <div 
                      key={student.id} 
                      className={`flex items-center p-2 rounded-lg ${
                        student.isCurrentUser ? 'bg-blue-50 border border-blue-100' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        {index < 3 ? (
                          <FaMedal 
                            size={18} 
                            className={
                              index === 0 
                                ? 'text-yellow-500' 
                                : index === 1 
                                  ? 'text-gray-400' 
                                  : 'text-amber-700'
                            } 
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="w-8 h-8 bg-gray-200 rounded-full mx-3 overflow-hidden">
                        <div className="w-full h-full bg-gray-300"></div>
                      </div>
                      
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-800">
                          {student.name}
                          {student.isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600">(Tú)</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 text-sm font-bold text-gray-800">
                        {student.points} <span className="text-xs font-normal text-gray-500">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 text-[#3C31A3] border border-[#3C31A3] rounded-md hover:bg-[#3C31A3] hover:text-white transition-colors text-sm">
                  Ver clasificación completa
                </button>
              </div>
            </div>
            
            {/* Recompensas */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaGem className="mr-2 text-[#3C31A3]" />
                  Recompensas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rewards.map(reward => (
                    <div 
                      key={reward.id} 
                      className="border border-gray-200 rounded-lg p-4 flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-[#3C31A3]/10 rounded-lg flex items-center justify-center">
                          {reward.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{reward.name}</h3>
                          <p className="text-sm text-[#3C31A3] font-semibold">{reward.cost} XP</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 flex-grow">
                        {reward.description}
                      </p>
                      
                      <button
                        className={`w-full py-2 rounded-md text-sm ${
                          reward.available && userXP >= reward.cost
                            ? 'bg-[#3C31A3] text-white hover:bg-[#2c2376]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!reward.available || userXP < reward.cost}
                      >
                        {reward.available 
                          ? userXP >= reward.cost 
                            ? 'Canjear recompensa' 
                            : `Necesitas ${reward.cost - userXP} XP más`
                          : 'No disponible'
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default GamificationPage 
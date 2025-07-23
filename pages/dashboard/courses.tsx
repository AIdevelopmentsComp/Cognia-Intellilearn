import React from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { FaBook, FaClock, FaUsers, FaChalkboardTeacher, FaFilter, FaSort } from 'react-icons/fa'

const CoursesPage: NextPage = () => {
  // Datos de ejemplo de cursos
  const courses = [
    {
      id: 1,
      title: 'JavaScript Avanzado',
      instructor: 'Carlos Ruiz',
      description: 'Aprende técnicas avanzadas de JavaScript para desarrollo web moderno.',
      progress: 65,
      image: '/assets/images/Image.svg',
      lessons: 24,
      duration: '8 horas',
      category: 'Desarrollo Web',
      level: 'Intermedio',
      lastAccessed: 'hace 2 días'
    },
    {
      id: 2,
      title: 'Python para Data Science',
      instructor: 'Ana López',
      description: 'Fundamentos de Python aplicados al análisis y visualización de datos.',
      progress: 32,
      image: '/assets/images/Image.svg',
      lessons: 18,
      duration: '6 horas',
      category: 'Ciencia de Datos',
      level: 'Básico',
      lastAccessed: 'hace 5 días'
    },
    {
      id: 3,
      title: 'React Fundamentals',
      instructor: 'Miguel Hernández',
      description: 'Desarrollo de aplicaciones web modernas con React y su ecosistema.',
      progress: 78,
      image: '/assets/images/Image.svg',
      lessons: 20,
      duration: '7 horas',
      category: 'Desarrollo Web',
      level: 'Intermedio',
      lastAccessed: 'hace 1 semana'
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout title="Mis Cursos" description="Cursos y aprendizaje">
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Mis Cursos</h1>
              <p className="text-gray-600">Gestiona y continúa tu aprendizaje</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FaFilter className="mr-2 text-gray-500" />
                Filtrar
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FaSort className="mr-2 text-gray-500" />
                Ordenar
              </button>
              <button className="px-4 py-2 bg-[#3C31A3] text-white rounded-md hover:bg-[#2c2376]">
                Explorar catálogo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                  <div className="relative h-48">
                    <Image 
                      src={course.image} 
                      alt={course.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md">
                        {course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h2>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <FaChalkboardTeacher className="mr-2" />
                      <span>{course.instructor}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <FaClock className="mr-1" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaBook className="mr-1" />
                        <span>{course.lessons} lecciones</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaUsers className="mr-1" />
                        <span>Nivel {course.level}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progreso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Último acceso: {course.lastAccessed}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default CoursesPage 
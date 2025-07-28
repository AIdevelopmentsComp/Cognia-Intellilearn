'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaSearch, FaFilter, FaSort, FaEye, FaRegClock, FaUser, FaStar } from 'react-icons/fa'
import { courseService, Course } from '@/lib/services/courseService'

// Interfaz para el componente de curso
interface CourseCard {
  id: string
  title: string
  instructor: string
  description: string
  progress: number
  image: string
  lessons: number
  duration: string
  category: string
  level: string
  rating: number
  totalStudents: number
  lastAccessed?: string
}

/**
 * Componente principal de cursos con diseño neumórfico
 * Muestra la lista de cursos disponibles con filtros y búsqueda
 */
const Courses = () => {
  // Estado para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [levelFilter, setLevelFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState('progress')
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar cursos reales al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        
        // Limpiar localStorage manualmente antes de cargar
        if (typeof window !== 'undefined') {
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('intellilearn') || key.includes('course'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
          console.log('🧹 Manual localStorage cleanup completed')
        }
        
        // Cargar todos los cursos disponibles dinámicamente
        const allCourses = await courseService.getAllCourses()
        
        const courseCards: CourseCard[] = allCourses.map(course => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor,
          description: course.description,
          progress: 0, // Sin progreso por defecto (se puede calcular después)
          image: course.imageUrl || '/assets/images/course-default.jpg',
          lessons: course.modules.reduce((total, module) => total + module.lessons.length, 0),
          duration: course.duration,
          category: course.category,
          level: course.level === 'beginner' ? 'Básico' : 
                 course.level === 'intermediate' ? 'Intermedio' : 'Avanzado',
          rating: course.rating,
          totalStudents: course.totalStudents,
          lastAccessed: 'Nuevo'
        }))
        
        setCourses(courseCards)
        console.log(`✅ Loaded ${courseCards.length} courses dynamically`)
        
      } catch (error) {
        console.error('Error loading courses:', error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  // Obtener categorías únicas para el filtro
  const categories = ['Todos', ...new Set(courses.map(course => course.category))]
  const levels = ['Todos', 'Básico', 'Intermedio', 'Avanzado']

  /**
   * Filtra y ordena los cursos según los criterios seleccionados
   */
  const filteredCourses = courses
    .filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'Todos' || course.category === categoryFilter) &&
      (levelFilter === 'Todos' || course.level === levelFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'progress') return b.progress - a.progress
      if (sortBy === 'recent') return (a.lastAccessed || '').localeCompare(b.lastAccessed || '')
      return 0
    })

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-white">
        <div className="neuro-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#132944] mb-2">My Courses</h1>
        <p className="text-gray-600">Explore and continue with your learning journey</p>
      </div>

      {/* Filtros y búsqueda con neumorfismo */}
      <div className="neuro-card p-6 mb-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="neuro-input pl-12 pr-4 py-3 w-full text-sm rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer rounded-xl"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Filtro por nivel */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer rounded-xl"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="relative">
            <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer rounded-xl"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="progress">Highest progress</option>
              <option value="title">Alphabetical</option>
              <option value="recent">Most recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de cursos */}
      {filteredCourses.length === 0 ? (
        <div className="neuro-card p-8 text-center rounded-2xl">
          <p className="text-gray-600 text-lg">No courses found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.id} className="neuro-card p-6 rounded-2xl flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-48 mb-4 rounded-xl overflow-hidden neuro-inset">
                <Image 
                  src={course.image} 
                  alt={course.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#132944]/70 to-transparent rounded-xl"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <span className="neuro-badge bg-white/90 text-[#132944] px-3 py-1 rounded-full text-xs font-medium mr-2">
                    {course.category}
                  </span>
                  <span className="neuro-badge bg-[#8b5cf6] text-white px-3 py-1 rounded-full text-xs font-medium">
                    {course.level}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-[#132944] mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <FaUser className="mr-2 text-[#8b5cf6]" />
                  Instructor: {course.instructor}
                </p>
                <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center neuro-inset px-3 py-1 rounded-lg">
                    <FaRegClock className="text-[#8b5cf6] mr-2" />
                    <span className="text-sm text-gray-600">{course.duration}</span>
                  </div>
                  <div className="flex items-center neuro-inset px-3 py-1 rounded-lg">
                    <span className="text-sm text-gray-600">{course.lessons} lessons</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center neuro-inset px-3 py-1 rounded-lg">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{course.rating}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {course.totalStudents.toLocaleString()} students
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 font-medium">Progress: {course.progress}%</span>
                    {course.lastAccessed && (
                      <span className="text-xs text-gray-500 neuro-badge bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        {course.lastAccessed}
                      </span>
                    )}
                  </div>
                  <div className="neuro-progress rounded-full overflow-hidden">
                    <div 
                      className="neuro-progress-fill h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-4">
                <Link 
                  href={`/dashboard/courses/${course.id}`}
                  className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white w-full flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-300 font-semibold hover:shadow-lg transform hover:scale-105"
                >
                  <FaEye className="mr-2" />
                  {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Courses
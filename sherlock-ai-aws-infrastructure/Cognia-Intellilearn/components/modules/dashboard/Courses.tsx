'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaSearch, FaFilter, FaSort, FaEye, FaRegClock } from 'react-icons/fa'

// Definición de tipos
type Course = {
  id: number
  title: string
  instructor: string
  description: string
  progress: number
  image: string
  lessons: number
  duration: string
  category: string
  level: 'Básico' | 'Intermedio' | 'Avanzado'
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

  // Datos de ejemplo
  const courses: Course[] = [
    {
      id: 1,
      title: 'Introducción al Machine Learning',
      instructor: 'Dra. Ana Martínez',
      description: 'Aprende los fundamentos y conceptos básicos del aprendizaje automático.',
      progress: 75,
      image: '/assets/images/Image.svg',
      lessons: 12,
      duration: '8 horas',
      category: 'Inteligencia Artificial',
      level: 'Básico',
      lastAccessed: 'Hace 2 días'
    },
    {
      id: 2,
      title: 'Desarrollo Web Full Stack',
      instructor: 'Ing. Carlos López',
      description: 'Domina las tecnologías frontend y backend para crear aplicaciones web completas.',
      progress: 45,
      image: '/assets/images/Image.svg',
      lessons: 24,
      duration: '16 horas',
      category: 'Desarrollo Web',
      level: 'Intermedio',
      lastAccessed: 'Hace 5 días'
    },
    {
      id: 3,
      title: 'Diseño UX/UI Profesional',
      instructor: 'Lic. María González',
      description: 'Crea interfaces intuitivas y experiencias de usuario excepcionales.',
      progress: 30,
      image: '/assets/images/Image.svg',
      lessons: 18,
      duration: '12 horas',
      category: 'Diseño',
      level: 'Intermedio',
      lastAccessed: 'Hace 1 semana'
    },
    {
      id: 4,
      title: 'Big Data y Análisis Predictivo',
      instructor: 'Dr. Roberto Sánchez',
      description: 'Aprende a procesar y analizar grandes volúmenes de datos para obtener insights valiosos.',
      progress: 15,
      image: '/assets/images/Image.svg',
      lessons: 15,
      duration: '10 horas',
      category: 'Ciencia de Datos',
      level: 'Avanzado',
      lastAccessed: 'Hace 2 semanas'
    },
    {
      id: 5,
      title: 'Inteligencia Artificial Aplicada',
      instructor: 'Ing. Laura Vázquez',
      description: 'Implementa soluciones prácticas basadas en inteligencia artificial.',
      progress: 60,
      image: '/assets/images/Image.svg',
      lessons: 20,
      duration: '14 horas',
      category: 'Inteligencia Artificial',
      level: 'Avanzado',
      lastAccessed: 'Ayer'
    }
  ]

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

  return (
    <div className="p-6 min-h-screen" style={{ background: 'var(--neuro-bg-light)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Cursos</h1>
        <p className="text-gray-600">Explora y continúa con tu aprendizaje en los siguientes cursos</p>
      </div>

      {/* Filtros y búsqueda con neumorfismo */}
      <div className="neuro-container p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              className="neuro-search pl-12 pr-4 py-3 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
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
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Ordenar por */}
          <div className="relative">
            <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="neuro-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="progress">Mayor progreso</option>
              <option value="title">Alfabético</option>
              <option value="recent">Recientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado de cursos con neumorfismo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <div key={course.id} className="neuro-card neuro-fade-in flex flex-col">
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
              <Image 
                src={course.image} 
                alt={course.title}
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg"></div>
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <span className="neuro-badge mr-2">{course.category}</span>
                <span className="neuro-badge bg-gray-700 text-white">{course.level}</span>
              </div>
            </div>
            
            <div className="flex-grow">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-2">Instructor: {course.instructor}</p>
              <p className="text-sm text-gray-500 mb-4">{course.description}</p>
              
              <div className="flex items-center mb-4">
                <FaRegClock className="text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">{course.duration}</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-sm text-gray-500">{course.lessons} lecciones</span>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">Progreso: {course.progress}%</span>
                  {course.lastAccessed && (
                    <span className="text-xs text-gray-500">{course.lastAccessed}</span>
                  )}
                </div>
                <div className="neuro-progress">
                  <div 
                    className="neuro-progress-fill" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              <Link 
                href={`/dashboard/courses/${course.id}`}
                className="neuro-button-primary w-full flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 text-white font-semibold"
              >
                <FaEye className="mr-2" />
                Continuar aprendiendo
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20">
          <div className="neuro-container p-8 max-w-md mx-auto">
            <p className="text-gray-600 text-lg">No se encontraron cursos que coincidan con tus criterios de búsqueda.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Courses
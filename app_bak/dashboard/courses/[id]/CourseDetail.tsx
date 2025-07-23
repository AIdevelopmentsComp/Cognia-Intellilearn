'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FaArrowLeft, FaPlay, FaClipboardList, FaDownload, FaBookmark, FaShare } from 'react-icons/fa'

interface CourseProps {
  course: {
    id: number;
    title: string;
    instructor: string;
    description: string;
    progress: number;
    image: string;
    duration: string;
    category: string;
    level: string;
    rating: number;
    studentsCount: number;
    lastUpdate: string;
    modules: {
      id: number;
      title: string;
      lessons: {
        id: number;
        title: string;
        duration: string;
        completed: boolean;
      }[];
    }[];
  }
}

export default function CourseDetail({ course }: CourseProps) {
  // Calcular el progreso total
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const completedLessons = course.modules.reduce((sum, module) => 
    sum + module.lessons.filter(lesson => lesson.completed).length, 0)
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100)
  
  // Encontrar la próxima lección
  const nextLesson = course.modules
    .flatMap(module => module.lessons)
    .find(lesson => !lesson.completed)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link 
        href="/dashboard/courses" 
        className="inline-flex items-center text-purple-600 mb-6 hover:text-purple-800 transition-colors"
      >
        <FaArrowLeft className="mr-2" />
        Volver a mis cursos
      </Link>
      
      {/* Header del curso */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="relative h-64 md:h-80">
          <Image 
            src={course.image} 
            alt={course.title}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">{course.category}</span>
              <span className="px-3 py-1 bg-gray-700 text-white text-sm rounded-full">{course.level}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-white/80 mb-4">Instructor: {course.instructor}</p>
            
            <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center">
                <span className="mr-2">⭐</span>
                <span>{course.rating} (5)</span>
              </div>
              <div>Duración: {course.duration}</div>
              <div>{course.studentsCount} estudiantes</div>
              <div>Última actualización: {course.lastUpdate}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenido del curso */}
        <div className="lg:col-span-2">
          {/* Resumen y progreso */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sobre este curso</h2>
            <p className="text-gray-600 mb-6">{course.description}</p>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Progreso del curso</span>
                <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-purple-800 h-2.5 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {completedLessons} de {totalLessons} lecciones completadas
              </div>
            </div>
            
            {nextLesson && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Continuar aprendiendo</h3>
                <div className="flex flex-wrap items-center justify-between">
                  <div>
                    <p className="text-gray-700">{nextLesson.title}</p>
                    <p className="text-sm text-gray-500">{nextLesson.duration}</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center mt-2 md:mt-0">
                    <FaPlay className="mr-2" />
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Contenido del curso */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contenido del curso</h2>
            
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 font-semibold text-gray-800">
                    {module.title}
                  </div>
                  <div>
                    {module.lessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className={`p-4 border-t border-gray-200 flex items-center justify-between ${
                          lesson.completed ? 'bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                            lesson.completed ? 'bg-purple-600 text-white' : 'bg-gray-200'
                          }`}>
                            {lesson.completed ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-xs">{lesson.id}</span>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${lesson.completed ? 'text-purple-700' : 'text-gray-700'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-sm text-gray-500">{lesson.duration}</p>
                          </div>
                        </div>
                        <button className={`px-3 py-1 rounded-md text-sm flex items-center ${
                          lesson.completed 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}>
                          <FaPlay className="mr-1" size={12} />
                          {lesson.completed ? 'Repasar' : 'Iniciar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <FaClipboardList className="text-purple-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Recursos</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <FaDownload className="text-purple-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Descargar</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <FaBookmark className="text-purple-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Guardar</span>
              </button>
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-colors">
                <FaShare className="text-purple-600 text-xl mb-2" />
                <span className="text-sm text-gray-700">Compartir</span>
              </button>
            </div>
          </div>
          
          {/* Otros cursos recomendados */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">También te puede interesar</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3">
                  <div className="flex-shrink-0 relative w-20 h-14 rounded-md overflow-hidden">
                    <Image 
                      src="/assets/images/Image.svg" 
                      alt="Curso recomendado" 
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
                      {item === 1 ? 'Deep Learning: Redes Neuronales' : 
                       item === 2 ? 'Python para Análisis de Datos' : 'Procesamiento de Lenguaje Natural'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item === 1 ? 'Dr. Luis Pérez' : 
                       item === 2 ? 'Ing. Sara Gómez' : 'Dra. Ana Martínez'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
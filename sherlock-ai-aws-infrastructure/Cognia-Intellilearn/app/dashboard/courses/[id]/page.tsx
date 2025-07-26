'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute,
  FaArrowLeft, FaBook, FaVideo, FaQuestionCircle, FaFileText,
  FaCheckCircle, FaClock, FaUser, FaStar, FaDownload, FaShare
} from 'react-icons/fa'

// Definición de tipos para el curso
interface Lesson {
  id: number
  title: string
  type: 'video' | 'reading' | 'quiz' | 'assignment'
  duration: string
  completed: boolean
  videoUrl?: string
  content?: string
  description: string
}

interface Module {
  id: number
  title: string
  lessons: Lesson[]
  completed: boolean
}

interface CourseDetail {
  id: number
  title: string
  instructor: string
  description: string
  image: string
  progress: number
  rating: number
  students: number
  totalDuration: string
  modules: Module[]
  skills: string[]
  certificate: boolean
}

/**
 * Componente principal para mostrar los detalles completos de un curso con neumorfismo
 * Incluye navegación lateral tipo LMS y contenido dinámico central con diseño neumórfico
 */
const CourseDetailPage = () => {
  const params = useParams()
  const courseId = params.id as string
  
  // Estados para la navegación y reproducción
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  const [course, setCourse] = useState<CourseDetail | null>(null)

  /**
   * Datos de ejemplo del curso con estructura completa
   * En producción, esto vendría de una API
   */
  const courseData: CourseDetail = {
    id: parseInt(courseId),
    title: 'Introducción al Machine Learning',
    instructor: 'Dra. Ana Martínez',
    description: 'Aprende los fundamentos y conceptos básicos del aprendizaje automático con ejemplos prácticos y proyectos reales.',
    image: '/assets/images/Image.svg',
    progress: 75,
    rating: 4.8,
    students: 1247,
    totalDuration: '8 horas',
    certificate: true,
    skills: ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Data Analysis'],
    modules: [
      {
        id: 1,
        title: 'Fundamentos del Machine Learning',
        completed: true,
        lessons: [
          {
            id: 1,
            title: '¿Qué es el Machine Learning?',
            type: 'video',
            duration: '15 min',
            completed: true,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            description: 'Introducción conceptual al aprendizaje automático y sus aplicaciones.'
          },
          {
            id: 2,
            title: 'Tipos de Algoritmos',
            type: 'reading',
            duration: '20 min',
            completed: true,
            content: `
              <h2>Tipos de Algoritmos de Machine Learning</h2>
              <p>El Machine Learning se divide en tres categorías principales:</p>
              
              <h3>1. Aprendizaje Supervisado</h3>
              <p>Utiliza datos etiquetados para entrenar modelos que pueden hacer predicciones sobre nuevos datos.</p>
              <ul>
                <li><strong>Clasificación:</strong> Predice categorías discretas</li>
                <li><strong>Regresión:</strong> Predice valores continuos</li>
              </ul>
              
              <h3>2. Aprendizaje No Supervisado</h3>
              <p>Encuentra patrones ocultos en datos sin etiquetas.</p>
              <ul>
                <li><strong>Clustering:</strong> Agrupa datos similares</li>
                <li><strong>Reducción de dimensionalidad:</strong> Simplifica datos complejos</li>
              </ul>
              
              <h3>3. Aprendizaje por Refuerzo</h3>
              <p>El modelo aprende a través de interacciones y recompensas.</p>
            `,
            description: 'Exploración detallada de los diferentes enfoques del machine learning.'
          },
          {
            id: 3,
            title: 'Quiz: Conceptos Básicos',
            type: 'quiz',
            duration: '10 min',
            completed: false,
            description: 'Evaluación de los conceptos fundamentales aprendidos.'
          }
        ]
      },
      {
        id: 2,
        title: 'Preparación de Datos',
        completed: false,
        lessons: [
          {
            id: 4,
            title: 'Limpieza de Datos',
            type: 'video',
            duration: '25 min',
            completed: false,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
            description: 'Técnicas para limpiar y preparar datasets para machine learning.'
          },
          {
            id: 5,
            title: 'Feature Engineering',
            type: 'reading',
            duration: '30 min',
            completed: false,
            content: `
              <h2>Feature Engineering</h2>
              <p>El Feature Engineering es el proceso de seleccionar, modificar o crear variables (features) para mejorar el rendimiento de los modelos de machine learning.</p>
              
              <h3>Técnicas Principales:</h3>
              <ul>
                <li><strong>Normalización:</strong> Escalar valores a un rango común</li>
                <li><strong>Encoding:</strong> Convertir variables categóricas a numéricas</li>
                <li><strong>Feature Selection:</strong> Seleccionar las variables más relevantes</li>
                <li><strong>Feature Creation:</strong> Crear nuevas variables a partir de las existentes</li>
              </ul>
            `,
            description: 'Aprende a crear y seleccionar las mejores características para tus modelos.'
          }
        ]
      },
      {
        id: 3,
        title: 'Algoritmos Fundamentales',
        completed: false,
        lessons: [
          {
            id: 6,
            title: 'Regresión Linear',
            type: 'video',
            duration: '35 min',
            completed: false,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            description: 'Implementación práctica de algoritmos de regresión linear.'
          },
          {
            id: 7,
            title: 'Árboles de Decisión',
            type: 'video',
            duration: '40 min',
            completed: false,
            description: 'Comprende cómo funcionan los árboles de decisión y sus aplicaciones.'
          },
          {
            id: 8,
            title: 'Proyecto Práctico',
            type: 'assignment',
            duration: '2 horas',
            completed: false,
            description: 'Implementa un modelo completo de machine learning desde cero.'
          }
        ]
      }
    ]
  }

  useEffect(() => {
    setCourse(courseData)
    // Expandir el primer módulo por defecto
    setExpandedModules([1])
    // Seleccionar la primera lección por defecto
    if (courseData.modules[0]?.lessons[0]) {
      setCurrentLesson(courseData.modules[0].lessons[0])
    }
  }, [courseId])

  /**
   * Alterna la expansión de un módulo en el índice lateral
   */
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  /**
   * Selecciona una lección para mostrar en el contenido central
   */
  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setIsPlaying(false)
  }

  /**
   * Controla la reproducción de video
   */
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  /**
   * Alterna el modo pantalla completa
   */
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  /**
   * Alterna el sonido del video
   */
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  /**
   * Renderiza el ícono según el tipo de lección
   */
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <FaVideo className="text-red-500" />
      case 'reading': return <FaBook className="text-blue-500" />
      case 'quiz': return <FaQuestionCircle className="text-green-500" />
      case 'assignment': return <FaFileText className="text-purple-500" />
      default: return <FaBook />
    }
  }

  /**
   * Renderiza el contenido central según el tipo de lección
   */
  const renderLessonContent = () => {
    if (!currentLesson) return null

    switch (currentLesson.type) {
      case 'video':
        return (
          <div className="neuro-container relative rounded-2xl overflow-hidden">
            <div className={`aspect-video ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
              {currentLesson.videoUrl ? (
                <video
                  className="w-full h-full rounded-2xl"
                  controls
                  poster={course?.image}
                  muted={isMuted}
                >
                  <source src={currentLesson.videoUrl} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-2xl">
                  <div className="text-center text-white">
                    <FaPlay className="text-6xl mb-4 mx-auto opacity-50" />
                    <p>Video no disponible</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controles personalizados con neumorfismo */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between neuro-container bg-black bg-opacity-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlayPause}
                  className="neuro-button text-white hover:text-yellow-400 transition-colors p-2 rounded-full"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  onClick={toggleMute}
                  className="neuro-button text-white hover:text-yellow-400 transition-colors p-2 rounded-full"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="neuro-button text-white hover:text-yellow-400 transition-colors p-2 rounded-full"
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        )

      case 'reading':
        return (
          <div className="prose prose-lg max-w-none">
            <div 
              className="neuro-container p-8 rounded-2xl"
              dangerouslySetInnerHTML={{ __html: currentLesson.content || '' }}
            />
          </div>
        )

      case 'quiz':
        return (
          <div className="neuro-container p-8 rounded-2xl">
            <div className="text-center">
              <FaQuestionCircle className="text-6xl text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Quiz Interactivo</h3>
              <p className="text-gray-600 mb-6">
                Pon a prueba tus conocimientos con este quiz interactivo.
              </p>
              <button className="neuro-button-primary px-8 py-3 rounded-lg text-white font-semibold">
                Iniciar Quiz
              </button>
            </div>
          </div>
        )

      case 'assignment':
        return (
          <div className="neuro-container p-8 rounded-2xl">
            <div className="text-center">
              <FaFileText className="text-6xl text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Proyecto Práctico</h3>
              <p className="text-gray-600 mb-6">
                Aplica lo aprendido en un proyecto práctico real.
              </p>
              <div className="flex justify-center space-x-4">
                <button className="neuro-button-primary px-6 py-3 rounded-lg text-white font-semibold">
                  Ver Instrucciones
                </button>
                <button className="neuro-button px-6 py-3 rounded-lg flex items-center">
                  <FaDownload className="mr-2" />
                  Descargar Recursos
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ background: 'var(--neuro-bg-light)' }}>
        <div className="neuro-container p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--neuro-bg-light)' }}>
      {/* Header del curso con neumorfismo */}
      <div className="neuro-container shadow-sm border-b mx-4 mt-4 rounded-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/dashboard/courses"
                className="neuro-button flex items-center text-gray-600 hover:text-gray-900 mr-6 px-4 py-2 rounded-lg"
              >
                <FaArrowLeft className="mr-2" />
                Volver a Cursos
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {course.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="neuro-badge flex items-center text-sm">
                <FaStar className="text-yellow-400 mr-1" />
                {course.rating}
              </div>
              <div className="neuro-badge flex items-center text-sm">
                <FaUser className="mr-1" />
                {course.students.toLocaleString()} estudiantes
              </div>
              <button className="neuro-button p-2 rounded-full text-gray-400 hover:text-gray-600">
                <FaShare />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex p-4 gap-4">
        {/* Índice lateral con neumorfismo */}
        <div className="w-80 neuro-container rounded-2xl min-h-screen">
          <div className="p-6 border-b border-gray-100">
            <div className="relative h-32 mb-4 rounded-xl overflow-hidden neuro-container">
              <Image 
                src={course.image} 
                alt={course.title}
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-xl"
              />
            </div>
            
            <h2 className="font-bold text-lg mb-2">{course.title}</h2>
            <p className="text-sm text-gray-600 mb-3">Por {course.instructor}</p>
            
            {/* Barra de progreso neumórfica */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progreso del curso</span>
                <span className="font-semibold text-purple-600">{course.progress}%</span>
              </div>
              <div className="neuro-progress">
                <div 
                  className="neuro-progress-fill" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="flex justify-between text-sm text-gray-500">
              <span className="neuro-badge flex items-center">
                <FaClock className="mr-1" />
                {course.totalDuration}
              </span>
              {course.certificate && (
                <span className="neuro-badge">🏆 Certificado</span>
              )}
            </div>
          </div>

          {/* Lista de módulos y lecciones con neumorfismo */}
          <div className="overflow-y-auto max-h-screen pb-20">
            {course.modules.map((module) => (
              <div key={module.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="neuro-nav-item w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between transition-all duration-300"
                >
                  <div className="flex items-center">
                    {module.completed && <FaCheckCircle className="text-green-500 mr-3" />}
                    <span className="font-medium">{module.title}</span>
                  </div>
                  <span className={`transform transition-transform duration-300 ${
                    expandedModules.includes(module.id) ? 'rotate-90' : ''
                  }`}>
                    ▶
                  </span>
                </button>
                
                {expandedModules.includes(module.id) && (
                  <div className="neuro-inset p-2 m-4 rounded-lg">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={`neuro-nav-item w-full px-6 py-3 text-left rounded-lg mb-2 last:mb-0 flex items-center justify-between transition-all duration-300 ${
                          currentLesson?.id === lesson.id ? 'active' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {getLessonIcon(lesson.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium">{lesson.title}</div>
                            <div className="text-xs text-gray-500">{lesson.duration}</div>
                          </div>
                        </div>
                        {lesson.completed && <FaCheckCircle className="text-green-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido principal con neumorfismo */}
        <div className="flex-1 neuro-container rounded-2xl p-6">
          {currentLesson ? (
            <div>
              {/* Header de la lección */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  {getLessonIcon(currentLesson.type)}
                  <h2 className="text-2xl font-bold ml-3">{currentLesson.title}</h2>
                </div>
                <p className="text-gray-600 mb-2">{currentLesson.description}</p>
                <div className="neuro-badge inline-flex items-center text-sm">
                  <FaClock className="mr-1" />
                  {currentLesson.duration}
                </div>
              </div>

              {/* Contenido de la lección */}
              {renderLessonContent()}

              {/* Navegación entre lecciones con neumorfismo */}
              <div className="flex justify-between mt-8">
                <button className="neuro-button flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 rounded-lg">
                  <FaArrowLeft className="mr-2" />
                  Lección Anterior
                </button>
                <button className="neuro-button-primary flex items-center px-6 py-3 text-white rounded-lg font-semibold">
                  Siguiente Lección
                  <FaArrowLeft className="ml-2 rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="neuro-container p-8 rounded-2xl max-w-md mx-auto">
                <FaBook className="text-6xl text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">Selecciona una lección</h2>
                <p className="text-gray-500">Elige una lección del índice para comenzar tu aprendizaje</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage 
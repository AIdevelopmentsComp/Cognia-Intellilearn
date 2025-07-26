'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { 
  FaPlay, 
  FaBookOpen, 
  FaQuestionCircle, 
  FaClipboardList,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaUpload,
  FaSpinner,
  FaUser,
  FaCog,
  FaSearch,
  FaLightbulb
} from 'react-icons/fa'
import { useCourse, useSemanticSearch } from '@/hooks/useCourse'
import { Course, Module, Lesson } from '@/lib/services/courseService'

// Tipos para el modo de usuario
enum UserMode {
  STUDENT = 'student',
  ADMIN = 'admin'
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  
  // Hooks para gestión de datos
  const { 
    course, 
    loading, 
    error, 
    updateCourse,
    createModule, 
    updateModule, 
    deleteModule,
    createLesson, 
    updateLesson, 
    deleteLesson,
    uploadFile
  } = useCourse(courseId)
  
  const { searchContent, getRecommendations } = useSemanticSearch()

  // Estados del componente
  const [userMode, setUserMode] = useState<UserMode>(UserMode.ADMIN)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  
  // Estados para edición
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchModal, setShowSearchModal] = useState(false)
  
  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Funciones de modo de usuario
  const toggleUserMode = () => {
    setUserMode(prev => prev === UserMode.ADMIN ? UserMode.STUDENT : UserMode.ADMIN)
    setIsEditing(null)
    setEditingModule(null)
    setEditingLesson(null)
  }

  // Funciones de edición de curso
  const startEditingCourse = () => {
    setIsEditing('course')
    setEditData({
      title: course?.title || '',
      description: course?.description || '',
      instructor: course?.instructor || '',
      category: course?.category || '',
      duration: course?.duration || '',
      tags: course?.tags?.join(', ') || ''
    })
  }

  const saveCourse = async () => {
    try {
      if (!course) return
      
      const updates: Partial<Course> = {
        title: editData.title,
        description: editData.description,
        instructor: editData.instructor,
        category: editData.category,
        duration: editData.duration,
        tags: editData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }

      await updateCourse(updates)
      setIsEditing(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error al guardar el curso')
    }
  }

  // Funciones de edición de módulos
  const startEditingModule = (moduleItem: Module) => {
    setEditingModule(moduleItem.id)
    setEditData({
      title: moduleItem.title,
      description: moduleItem.description
    })
  }

  const saveModule = async () => {
    try {
      if (!editingModule) return

      await updateModule(editingModule, {
        title: editData.title,
        description: editData.description
      })
      
      setEditingModule(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving module:', error)
      alert('Error al guardar el módulo')
    }
  }

  const addNewModule = async () => {
    try {
      const title = prompt('Título del nuevo módulo:')
      const description = prompt('Descripción del módulo:')
      
      if (!title || !description) return

      const maxOrder = Math.max(...(course?.modules.map(m => m.order) || [0]))
      
      await createModule({
        title,
        description,
        order: maxOrder + 1
      })
    } catch (error) {
      console.error('Error creating module:', error)
      alert('Error al crear el módulo')
    }
  }

  const deleteModuleConfirm = async (moduleId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este módulo?')) {
      try {
        await deleteModule(moduleId)
      } catch (error) {
        console.error('Error deleting module:', error)
        alert('Error al eliminar el módulo')
      }
    }
  }

  // Funciones de edición de lecciones
  const startEditingLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id)
    setEditData({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      type: lesson.type
    })
  }

  const saveLesson = async () => {
    try {
      if (!editingLesson) return

      await updateLesson(editingLesson, {
        title: editData.title,
        description: editData.description,
        content: editData.content,
        videoUrl: editData.videoUrl,
        duration: editData.duration,
        type: editData.type
      })
      
      setEditingLesson(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Error al guardar la lección')
    }
  }

  const addNewLesson = async (moduleId: string) => {
    try {
      const title = prompt('Título de la nueva lección:')
      const description = prompt('Descripción de la lección:')
      const content = prompt('Contenido de la lección:') || ''
      const duration = prompt('Duración (ej: 15 min):') || '10 min'
      
      if (!title || !description) return

      const moduleItem = course?.modules.find(m => m.id === moduleId)
      const maxOrder = Math.max(...(moduleItem?.lessons.map(l => l.order) || [0]))
      
      await createLesson(moduleId, {
        title,
        description,
        content,
        duration,
        type: 'reading',
        order: maxOrder + 1
      })
    } catch (error) {
      console.error('Error creating lesson:', error)
      alert('Error al crear la lección')
    }
  }

  const deleteLessonConfirm = async (lessonId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      try {
        await deleteLesson(lessonId)
      } catch (error) {
        console.error('Error deleting lesson:', error)
        alert('Error al eliminar la lección')
      }
    }
  }

  // Función para subir video
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que es un video
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video')
      return
    }

    try {
      setUploading(true)
      const videoUrl = await uploadFile(file, 'videos')
      
      setEditData(prev => ({
        ...prev,
        videoUrl: videoUrl
      }))
      
      alert('Video subido exitosamente')
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Error al subir el video')
    } finally {
      setUploading(false)
    }
  }

  // Función de búsqueda semántica
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const results = await searchContent(searchQuery, courseId)
      setSearchResults(results)
      setShowSearchModal(true)
    } catch (error) {
      console.error('Error searching:', error)
      alert('Error en la búsqueda')
    }
  }

  // Función para cancelar edición
  const cancelEdit = () => {
    setIsEditing(null)
    setEditingModule(null)
    setEditingLesson(null)
    setEditData({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="neuro-container rounded-2xl p-8 text-center">
          <FaSpinner className="animate-spin inline mr-2 text-[#3C31A3] text-2xl" />
          <span className="text-[#132944] text-xl font-medium">Cargando curso...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="neuro-container rounded-2xl p-8 text-center">
          <div className="text-red-500 text-xl font-medium">
            Error: {error || 'Curso no encontrado'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con controles de modo */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-[#132944]">
              {isEditing === 'course' ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                  className="neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              ) : (
                course.title
              )}
            </h1>
            {userMode === UserMode.ADMIN && isEditing !== 'course' && (
              <button
                onClick={startEditingCourse}
                className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                <FaEdit className="text-[#3C31A3]" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Búsqueda semántica */}
            <div className="flex items-center space-x-2">
              <div className="neuro-inset rounded-lg p-2">
                <input
                  type="text"
                  placeholder="Buscar en el curso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent border-none outline-none text-sm text-[#132944] placeholder-gray-500 w-48"
                />
              </div>
              <button
                onClick={handleSearch}
                className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                <FaSearch className="text-[#3C31A3]" />
              </button>
            </div>

            {/* Selector de modo */}
            <button
              onClick={toggleUserMode}
              className={`neuro-button flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                userMode === UserMode.ADMIN 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
              }`}
            >
              {userMode === UserMode.ADMIN ? <FaCog /> : <FaUser />}
              <span>{userMode === UserMode.ADMIN ? 'Modo Admin' : 'Modo Estudiante'}</span>
            </button>
          </div>
        </div>

        {/* Información del curso */}
        {isEditing === 'course' && (
          <div className="neuro-container rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Instructor</label>
                <input
                  type="text"
                  value={editData.instructor}
                  onChange={(e) => setEditData(prev => ({...prev, instructor: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Categoría</label>
                <input
                  type="text"
                  value={editData.category}
                  onChange={(e) => setEditData(prev => ({...prev, category: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Duración</label>
                <input
                  type="text"
                  value={editData.duration}
                  onChange={(e) => setEditData(prev => ({...prev, duration: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tags (separados por comas)</label>
                <input
                  type="text"
                  value={editData.tags}
                  onChange={(e) => setEditData(prev => ({...prev, tags: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Descripción</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={saveCourse}
                className="neuro-button-primary px-6 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300"
              >
                <FaSave />
                <span>Guardar Curso</span>
              </button>
              <button
                onClick={cancelEdit}
                className="neuro-button px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300"
              >
                <FaTimes />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar con contenido del curso */}
          <div className="lg:col-span-1">
            <div className="neuro-container rounded-2xl p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#132944]">Contenido del Curso</h2>
                {userMode === UserMode.ADMIN && (
                  <button
                    onClick={addNewModule}
                    className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                    title="Agregar Módulo"
                  >
                    <FaPlus className="text-[#3C31A3]" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {course.modules.map((moduleItem) => (
                  <div key={moduleItem.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      {editingModule === moduleItem.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                            className="w-full neuro-inset px-3 py-1 rounded text-sm text-[#132944] bg-transparent border-none outline-none focus:ring-1 focus:ring-[#3C31A3]"
                          />
                          <textarea
                            value={editData.description}
                            onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                            rows={2}
                            className="w-full neuro-inset px-3 py-1 rounded text-sm text-[#132944] bg-transparent border-none outline-none focus:ring-1 focus:ring-[#3C31A3] resize-none"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={saveModule}
                              className="neuro-button-primary px-3 py-1 rounded text-sm text-white"
                            >
                              <FaSave />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="neuro-button px-3 py-1 rounded text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <h3 className="font-medium text-[#132944]">{moduleItem.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{moduleItem.description}</p>
                          </div>
                          {userMode === UserMode.ADMIN && (
                            <div className="flex space-x-2 ml-2">
                              <button
                                onClick={() => startEditingModule(moduleItem)}
                                className="text-gray-400 hover:text-[#3C31A3] text-sm transition-colors"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteModuleConfirm(moduleItem.id)}
                                className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="ml-4 space-y-2">
                      {moduleItem.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between group neuro-inset rounded-lg p-2 hover:bg-gray-50 transition-all duration-300">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="text-[#3C31A3]">
                              {lesson.type === 'video' && <FaPlay />}
                              {lesson.type === 'reading' && <FaBookOpen />}
                              {lesson.type === 'quiz' && <FaQuestionCircle />}
                              {lesson.type === 'assignment' && <FaClipboardList />}
                            </div>
                            <div className="flex-1">
                              <p className="text-[#132944] text-sm font-medium">{lesson.title}</p>
                              <p className="text-gray-500 text-xs">{lesson.duration}</p>
                            </div>
                          </div>
                          {userMode === UserMode.ADMIN && (
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingLesson(lesson)}
                                className="text-gray-400 hover:text-[#3C31A3] text-xs transition-colors"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteLessonConfirm(lesson.id)}
                                className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {userMode === UserMode.ADMIN && (
                        <button
                          onClick={() => addNewLesson(moduleItem.id)}
                          className="flex items-center space-x-2 text-[#3C31A3] hover:text-[#132944] text-sm ml-6 transition-colors neuro-button p-2 rounded-lg hover:bg-gray-50"
                        >
                          <FaPlus />
                          <span>Agregar Lección</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <div className="neuro-container rounded-2xl p-8">
              {editingLesson ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#132944] mb-6">Editando Lección</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Título</label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                        className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Duración</label>
                      <input
                        type="text"
                        value={editData.duration}
                        onChange={(e) => setEditData(prev => ({...prev, duration: e.target.value}))}
                        className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tipo de Lección</label>
                    <select
                      value={editData.type}
                      onChange={(e) => setEditData(prev => ({...prev, type: e.target.value}))}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                    >
                      <option value="reading">Lectura</option>
                      <option value="video">Video</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Tarea</option>
                    </select>
                  </div>

                  {editData.type === 'video' && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Video URL</label>
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          value={editData.videoUrl}
                          onChange={(e) => setEditData(prev => ({...prev, videoUrl: e.target.value}))}
                          placeholder="URL del video o sube un archivo"
                          className="flex-1 neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="neuro-button-primary px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
                        >
                          {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                          <span>{uploading ? 'Subiendo...' : 'Subir Video'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Contenido</label>
                    <textarea
                      value={editData.content}
                      onChange={(e) => setEditData(prev => ({...prev, content: e.target.value}))}
                      rows={8}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={saveLesson}
                      className="neuro-button-primary px-6 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300"
                    >
                      <FaSave />
                      <span>Guardar Lección</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="neuro-button px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300"
                    >
                      <FaTimes />
                      <span>Cancelar</span>
                    </button>
                  </div>

                  {/* Info box sobre S3 Vectors */}
                  <div className="neuro-inset rounded-lg p-4 mt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaLightbulb className="text-[#3C31A3]" />
                      <h4 className="font-medium text-[#132944]">Integración con S3 Vectors</h4>
                    </div>
                    <p className="text-gray-600 text-sm">
                      El contenido de esta lección se almacenará automáticamente como vectores en el bucket 
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs mx-1">cognia-intellilearn</code>
                      para búsquedas semánticas y recomendaciones inteligentes.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-[#132944] mb-6">
                    {course.modules[0]?.lessons[1]?.title || 'Metodologías Ágiles vs Tradicionales'}
                  </h2>
                  
                  <div className="prose prose-gray max-w-none">
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: course.modules[0]?.lessons[1]?.content || 'Contenido no disponible' 
                      }}
                    />
                  </div>

                  {/* Lecciones relacionadas */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-6">
                      <FaLightbulb className="text-[#3C31A3]" />
                      <h3 className="text-xl font-semibold text-[#132944]">Lecciones Relacionadas</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.modules[0]?.lessons.slice(0, 2).map((lesson) => (
                        <div key={lesson.id} className="neuro-container rounded-lg p-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-[#3C31A3]">
                              {lesson.type === 'video' && <FaPlay />}
                              {lesson.type === 'reading' && <FaBookOpen />}
                              {lesson.type === 'quiz' && <FaQuestionCircle />}
                            </div>
                            <h4 className="font-medium text-[#132944]">{lesson.title}</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{lesson.description}</p>
                          <p className="text-gray-500 text-xs mt-2">{lesson.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de resultados de búsqueda */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neuro-container rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#132944]">Resultados de búsqueda para &ldquo;{searchQuery}&rdquo;</h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-medium text-[#132944] mb-2">{result.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{result.excerpt}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{result.type}</span>
                        <span>Similitud: {Math.round(result.similarity * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron resultados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
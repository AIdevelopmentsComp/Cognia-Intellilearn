import React, { useState } from 'react'
import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { FaFile, FaFilePdf, FaVideo, FaHeadphones, FaList, FaPlus, FaSearch, FaFilter, FaPlay, FaDownload } from 'react-icons/fa'

type ContentType = 'all' | 'document' | 'video' | 'audio' | 'quiz'

interface ContentItem {
  id: string;
  title: string;
  type: string;
  folderId: string;
  lastModified: string;
  status: string;
  thumbnail: string;
  format?: string;
  size?: string;
  duration?: string;
  questions?: number;
}

const ContentPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContentType>('all')
  const [activeFolder, setActiveFolder] = useState<string | null>('course-materials')
  
  // Datos de ejemplo
  const folders = [
    { id: 'course-materials', name: 'Materiales de Curso', count: 6 },
    { id: 'my-uploads', name: 'Mis Subidas', count: 3 },
    { id: 'shared-content', name: 'Contenido Compartido', count: 2 },
  ]
  
  const contentItems = [
    {
      id: '1',
      title: 'Introducción a Machine Learning',
      type: 'document',
      format: 'PDF',
      size: '2.4 MB',
      folderId: 'course-materials',
      lastModified: '15/05/2024',
      status: 'completed',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '2',
      title: 'Tutorial: Implementación de regresión lineal',
      type: 'video',
      duration: '25:40',
      folderId: 'course-materials',
      lastModified: '10/05/2024',
      status: 'in-progress',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '3',
      title: 'Podcast: Tendencias en IA',
      type: 'audio',
      duration: '45:22',
      folderId: 'course-materials',
      lastModified: '01/05/2024',
      status: 'not-started',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '4',
      title: 'Evaluación: Fundamentos de ML',
      type: 'quiz',
      questions: 10,
      folderId: 'course-materials',
      lastModified: '05/05/2024',
      status: 'not-started',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '5',
      title: 'Apuntes del Curso',
      type: 'document',
      format: 'DOCX',
      size: '1.8 MB',
      folderId: 'my-uploads',
      lastModified: '18/05/2024',
      status: 'completed',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '6',
      title: 'Presentación Final',
      type: 'document',
      format: 'PPTX',
      size: '4.5 MB',
      folderId: 'my-uploads',
      lastModified: '20/05/2024',
      status: 'completed',
      thumbnail: '/assets/images/Image.svg'
    },
    {
      id: '7',
      title: 'Recursos Adicionales',
      type: 'document',
      format: 'PDF',
      size: '3.2 MB',
      folderId: 'shared-content',
      lastModified: '02/05/2024',
      status: 'not-started',
      thumbnail: '/assets/images/Image.svg'
    }
  ]
  
  // Filtrar los elementos
  const filteredItems = contentItems.filter(item => {
    // Filtrar por carpeta
    if (activeFolder && item.folderId !== activeFolder) return false
    
    // Filtrar por tipo
    if (activeFilter !== 'all' && item.type !== activeFilter) return false
    
    // Filtrar por término de búsqueda
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })
  
  // Renderizar icono según tipo de contenido
  const renderTypeIcon = (type: string) => {
    switch(type) {
      case 'document':
        return <FaFilePdf className="text-red-500" size={20} />
      case 'video':
        return <FaVideo className="text-blue-500" size={20} />
      case 'audio':
        return <FaHeadphones className="text-green-500" size={20} />
      case 'quiz':
        return <FaList className="text-purple-500" size={20} />
      default:
        return <FaFile className="text-gray-500" size={20} />
    }
  }
  
  // Renderizar indicador de estado
  const renderStatusIndicator = (status: string) => {
    switch(status) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>
      case 'in-progress':
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      case 'not-started':
        return <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      default:
        return null
    }
  }
  
  // Renderizar acción según tipo de contenido
  const renderContentAction = (item: ContentItem) => {
    switch(item.type) {
      case 'document':
        return (
          <button className="text-sm text-[#3C31A3] px-3 py-1.5 rounded-md border border-[#3C31A3] hover:bg-[#3C31A3] hover:text-white transition-colors">
            <FaDownload className="inline-block mr-1" size={12} />
            Descargar
          </button>
        )
      case 'video':
      case 'audio':
        return (
          <button className="text-sm text-white px-3 py-1.5 rounded-md bg-[#3C31A3] hover:bg-[#2c2376] transition-colors">
            <FaPlay className="inline-block mr-1" size={12} />
            Reproducir
          </button>
        )
      case 'quiz':
        return (
          <button className="text-sm text-white px-3 py-1.5 rounded-md bg-[#3C31A3] hover:bg-[#2c2376] transition-colors">
            <FaList className="inline-block mr-1" size={12} />
            Iniciar
          </button>
        )
      default:
        return (
          <button className="text-sm text-[#3C31A3] px-3 py-1.5 rounded-md border border-[#3C31A3] hover:bg-[#3C31A3] hover:text-white transition-colors">
            Ver
          </button>
        )
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Contenido" description="Materiales de aprendizaje">
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Contenido</h1>
            <p className="text-gray-600">Accede y gestiona tus materiales de aprendizaje</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Barra lateral de carpetas */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Carpetas</h2>
                
                <ul className="space-y-2">
                  {folders.map(folder => (
                    <li key={folder.id}>
                      <button
                        onClick={() => setActiveFolder(folder.id)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md ${
                          activeFolder === folder.id 
                            ? 'bg-[#3C31A3] text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <FaFile className={`mr-3 ${activeFolder === folder.id ? 'text-white' : 'text-gray-400'}`} />
                          <span>{folder.name}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-opacity-20 bg-gray-600 text-gray-600">
                          {folder.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                
                <button className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 text-sm bg-[#3C31A3] text-white rounded-md hover:bg-[#2c2376] transition-colors">
                  <FaPlus size={12} />
                  Nueva carpeta
                </button>
              </div>
            </div>
            
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              {/* Controles de búsqueda y filtrado */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar contenido..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3C31A3] focus:border-[#3C31A3]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                        activeFilter === 'all' 
                          ? 'bg-[#3C31A3] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaFilter className="mr-1" size={12} />
                      Todos
                    </button>
                    <button
                      onClick={() => setActiveFilter('document')}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                        activeFilter === 'document' 
                          ? 'bg-[#3C31A3] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaFilePdf className="mr-1" size={12} />
                      Documentos
                    </button>
                    <button
                      onClick={() => setActiveFilter('video')}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                        activeFilter === 'video' 
                          ? 'bg-[#3C31A3] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaVideo className="mr-1" size={12} />
                      Videos
                    </button>
                    <button
                      onClick={() => setActiveFilter('audio')}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                        activeFilter === 'audio' 
                          ? 'bg-[#3C31A3] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaHeadphones className="mr-1" size={12} />
                      Audio
                    </button>
                    <button
                      onClick={() => setActiveFilter('quiz')}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                        activeFilter === 'quiz' 
                          ? 'bg-[#3C31A3] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaList className="mr-1" size={12} />
                      Evaluaciones
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Lista de contenido */}
              <div className="bg-white rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {folders.find(folder => folder.id === activeFolder)?.name || 'Contenido'}
                </h2>
                
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-stretch h-full">
                          <div className="w-20 bg-gray-100 relative">
                            <div className="absolute top-2 left-2">
                              {renderTypeIcon(item.type)}
                            </div>
                            <div className="absolute bottom-2 left-2">
                              {renderStatusIndicator(item.status)}
                            </div>
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800 mb-1">{item.title}</h3>
                              <div className="text-xs text-gray-500">
                                {item.type === 'document' && (
                                  <span>{item.format} • {item.size}</span>
                                )}
                                {(item.type === 'video' || item.type === 'audio') && (
                                  <span>Duración: {item.duration}</span>
                                )}
                                {item.type === 'quiz' && (
                                  <span>{item.questions} preguntas</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">
                                Actualizado: {item.lastModified}
                              </span>
                              {renderContentAction(item)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaSearch className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontró contenido</h3>
                    <p className="text-gray-500 mb-6">Prueba con otros criterios de búsqueda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default ContentPage 
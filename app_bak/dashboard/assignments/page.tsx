'use client'
import { useState } from 'react'
import { FaTasks, FaCalendarAlt, FaHourglassHalf, FaCheckCircle, FaExclamationCircle, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'

export default function AssignmentsPage() {
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'dueDate',
    direction: 'asc'
  })
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  
  // Datos de ejemplo
  const assignmentsData = [
    {
      id: 1,
      title: 'Implementación de regresión lineal',
      course: 'Machine Learning Básico',
      dueDate: new Date('2024-06-10'),
      status: 'pending',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Clasificación con árboles de decisión',
      course: 'Machine Learning Básico',
      dueDate: new Date('2024-06-15'),
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Diseño de interfaz responsive',
      course: 'Desarrollo Web Frontend',
      dueDate: new Date('2024-06-05'),
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 4,
      title: 'Análisis de datos con pandas',
      course: 'Ciencia de Datos',
      dueDate: new Date('2024-06-02'),
      status: 'overdue',
      priority: 'high'
    },
    {
      id: 5,
      title: 'Visualización con matplotlib',
      course: 'Ciencia de Datos',
      dueDate: new Date('2024-06-20'),
      status: 'pending',
      priority: 'low'
    }
  ]
  
  // Función para ordenar las tareas
  const sortedAssignments = [...assignmentsData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })
  
  // Función para filtrar las tareas
  const filteredAssignments = sortedAssignments.filter(assignment => {
    if (filter === 'all') return true
    if (filter === 'pending') return assignment.status === 'pending' || assignment.status === 'overdue'
    if (filter === 'completed') return assignment.status === 'completed'
  })
  
  // Función para cambiar el ordenamiento
  const requestSort = (key) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }
  
  // Función para mostrar el ícono de ordenamiento
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 text-gray-400" />
    if (sortConfig.direction === 'asc') return <FaSortUp className="ml-1 text-[#3C31A3]" />
    return <FaSortDown className="ml-1 text-[#3C31A3]" />
  }
  
  // Función para formatear la fecha
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  }
  
  // Función para renderizar el indicador de estado
  const renderStatus = (status) => {
    switch(status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" />
            Completada
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaHourglassHalf className="mr-1" />
            Pendiente
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaExclamationCircle className="mr-1" />
            Vencida
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tareas</h1>
        <p className="text-gray-600">Gestiona y completa tus tareas de los diferentes cursos</p>
      </div>
      
      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <FaTasks className="text-[#3C31A3] mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Tareas asignadas</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label htmlFor="filter" className="sr-only">Filtrar por estado</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'completed')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#3C31A3] focus:border-[#3C31A3] sm:text-sm rounded-md"
              >
                <option value="all">Todas las tareas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
            
            <button className="px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors text-sm">
              + Nueva tarea
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabla de tareas */}
      {filteredAssignments.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center">
                      Tarea {getSortIcon('title')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('course')}
                  >
                    <div className="flex items-center">
                      Curso {getSortIcon('course')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('dueDate')}
                  >
                    <div className="flex items-center">
                      Fecha límite {getSortIcon('dueDate')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Estado {getSortIcon('status')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('priority')}
                  >
                    <div className="flex items-center">
                      Prioridad {getSortIcon('priority')}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{assignment.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {formatDate(assignment.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatus(assignment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                        assignment.priority === 'high' 
                          ? 'bg-red-500' 
                          : assignment.priority === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      } mr-2`}></span>
                      <span className="text-sm text-gray-500 capitalize">{assignment.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-[#3C31A3] hover:text-[#2c2376]">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FaTasks className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay tareas disponibles</h3>
          <p className="text-gray-500 mb-6">No se encontraron tareas con los filtros seleccionados</p>
          <button 
            onClick={() => setFilter('all')}
            className="px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors"
          >
            Ver todas las tareas
          </button>
        </div>
      )}
    </div>
  )
} 
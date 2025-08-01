// Script para limpiar completamente el localStorage del navegador
// Se debe ejecutar en la consola del navegador

console.log('🧹 Iniciando limpieza completa del localStorage...')

// Limpiar todos los datos relacionados con IntelliLearn
const keysToRemove = [
  'intellilearn_courses',
  'intellilearn_user_progress',
  'intellilearn_user_mode',
  'intellilearn_session',
  'course_progress',
  'user_preferences'
]

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key)
    console.log(`✅ Removed: ${key}`)
  }
})

// Limpiar cualquier clave que contenga 'intellilearn' o 'course'
Object.keys(localStorage).forEach(key => {
  if (key.includes('intellilearn') || key.includes('course')) {
    localStorage.removeItem(key)
    console.log(`✅ Removed additional key: ${key}`)
  }
})

console.log('🆕 LocalStorage limpiado completamente')
console.log('🔄 Recarga la página para inicializar con datos correctos')

// Opcional: Recargar la página automáticamente
// window.location.reload() 
import CourseDetail from './CourseDetail';

// Simulación de datos de un curso
const getCourseData = (id: string) => {
  return {
    id: parseInt(id),
    title: 'Introducción al Machine Learning',
    instructor: 'Dra. Ana Martínez',
    description: 'Aprende los fundamentos y conceptos básicos del aprendizaje automático y cómo aplicarlo en problemas del mundo real. Este curso te proporcionará una base sólida para iniciar tu carrera en el campo de la inteligencia artificial.',
    progress: 75,
    image: '/assets/images/Image.svg',
    duration: '8 horas',
    category: 'Inteligencia Artificial',
    level: 'Básico',
    rating: 4.8,
    studentsCount: 1245,
    lastUpdate: '10 de junio de 2024',
    modules: [
      {
        id: 1,
        title: 'Fundamentos de Machine Learning',
        lessons: [
          { id: 1, title: 'Introducción al curso', duration: '15 min', completed: true },
          { id: 2, title: '¿Qué es Machine Learning?', duration: '25 min', completed: true },
          { id: 3, title: 'Tipos de aprendizaje automático', duration: '30 min', completed: true },
          { id: 4, title: 'Herramientas y entorno de desarrollo', duration: '20 min', completed: false }
        ]
      },
      {
        id: 2,
        title: 'Algoritmos de Machine Learning',
        lessons: [
          { id: 5, title: 'Regresión lineal', duration: '35 min', completed: false },
          { id: 6, title: 'Regresión logística', duration: '30 min', completed: false },
          { id: 7, title: 'Árboles de decisión', duration: '45 min', completed: false },
          { id: 8, title: 'Random Forest', duration: '40 min', completed: false }
        ]
      },
      {
        id: 3,
        title: 'Evaluación de Modelos',
        lessons: [
          { id: 9, title: 'Métricas de evaluación', duration: '25 min', completed: false },
          { id: 10, title: 'Validación cruzada', duration: '30 min', completed: false },
          { id: 11, title: 'Overfitting y underfitting', duration: '35 min', completed: false },
          { id: 12, title: 'Proyecto final', duration: '60 min', completed: false }
        ]
      }
    ]
  }
}

// Esta función es necesaria para exportación estática con rutas dinámicas
export function generateStaticParams() {
  // Generar rutas para cursos del 1 al 10
  return Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
  }));
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = getCourseData(params.id);
  return <CourseDetail course={course} />;
} 
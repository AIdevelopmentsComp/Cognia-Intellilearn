/**
 * PMP Certification Course Creator
 * Creates a comprehensive Project Management Professional course
 * Based on PMI's PMBOK Guide 7th Edition and PMP Exam Content Outline
 */

require('dotenv').config({ path: '.env.local' })
const AWS = require('aws-sdk')

// Configure AWS
AWS.config.update({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
})

const dynamodb = new AWS.DynamoDB.DocumentClient()
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Intellilearn_Data'

// PMP Course Structure - 10 Modules with 5 Lessons Each
const pmpCourse = {
  courseId: '000000000',
  title: 'PMP Certification Masterclass - Project Management Professional',
  description: 'Curso completo de preparación para la certificación PMP basado en PMBOK Guide 7th Edition. Incluye todos los dominios de conocimiento, procesos y técnicas necesarias para aprobar el examen PMP.',
  instructor: 'CognIA Project Management Institute',
  duration: '120 horas',
  level: 'Profesional',
  category: 'Project Management',
  language: 'Español',
  modules: [
    {
      moduleId: 'MOD001',
      title: 'Fundamentos de Gestión de Proyectos',
      description: 'Introducción a los conceptos fundamentales de la gestión de proyectos según PMI',
      duration: '12 horas',
      order: 1,
      lessons: [
        {
          lessonId: 'L001001',
          title: '¿Qué es un Proyecto? Definiciones y Características',
          content: 'Un proyecto es un esfuerzo temporal emprendido para crear un producto, servicio o resultado único. Los proyectos tienen inicio y fin definidos, recursos limitados y entregables específicos.',
          type: 'reading',
          duration: '45 minutos',
          order: 1,
          objectives: [
            'Definir qué es un proyecto y sus características',
            'Diferenciar entre proyectos, operaciones y programas',
            'Identificar los componentes clave de un proyecto'
          ]
        },
        {
          lessonId: 'L001002', 
          title: 'El Ciclo de Vida del Proyecto y Fases',
          content: 'Los proyectos siguen un ciclo de vida que incluye inicio, planificación, ejecución, monitoreo y cierre. Cada fase tiene entregables específicos y criterios de salida.',
          type: 'video',
          duration: '60 minutos',
          order: 2,
          objectives: [
            'Describir las fases del ciclo de vida del proyecto',
            'Explicar las características de cada fase',
            'Identificar los entregables clave de cada fase'
          ]
        },
        {
          lessonId: 'L001003',
          title: 'Stakeholders y su Gestión',
          content: 'Los stakeholders son individuos, grupos u organizaciones que pueden afectar o ser afectados por el proyecto. Su identificación y gestión es crucial para el éxito.',
          type: 'reading',
          duration: '50 minutos', 
          order: 3,
          objectives: [
            'Identificar diferentes tipos de stakeholders',
            'Desarrollar estrategias de gestión de stakeholders',
            'Crear matriz de poder-interés'
          ]
        },
        {
          lessonId: 'L001004',
          title: 'Organizaciones y Estructuras Organizacionales',
          content: 'Las estructuras organizacionales influyen en la autoridad del project manager, disponibilidad de recursos y comunicación del proyecto.',
          type: 'reading',
          duration: '40 minutos',
          order: 4,
          objectives: [
            'Comparar estructuras organizacionales',
            'Analizar el impacto en la gestión de proyectos',
            'Identificar ventajas y desventajas de cada estructura'
          ]
        },
        {
          lessonId: 'L001005',
          title: 'Quiz: Fundamentos de Gestión de Proyectos',
          content: 'Evaluación de conocimientos sobre conceptos fundamentales de gestión de proyectos.',
          type: 'quiz',
          duration: '25 minutos',
          order: 5,
          objectives: [
            'Evaluar comprensión de conceptos básicos',
            'Identificar áreas de mejora',
            'Reforzar aprendizaje clave'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD002',
      title: 'Inicio del Proyecto y Charter',
      description: 'Procesos y técnicas para iniciar proyectos de manera efectiva',
      duration: '12 horas',
      order: 2,
      lessons: [
        {
          lessonId: 'L002001',
          title: 'Desarrollar el Project Charter',
          content: 'El Project Charter es el documento que autoriza formalmente el proyecto y proporciona al project manager autoridad para aplicar recursos.',
          type: 'reading',
          duration: '55 minutos',
          order: 1,
          objectives: [
            'Crear un Project Charter efectivo',
            'Identificar componentes clave del charter',
            'Obtener aprobación de stakeholders'
          ]
        },
        {
          lessonId: 'L002002',
          title: 'Identificación de Stakeholders',
          content: 'Proceso sistemático para identificar personas, grupos y organizaciones que pueden impactar o ser impactados por el proyecto.',
          type: 'video',
          duration: '50 minutos',
          order: 2,
          objectives: [
            'Aplicar técnicas de identificación de stakeholders',
            'Crear registro de stakeholders',
            'Analizar influencia e interés de stakeholders'
          ]
        },
        {
          lessonId: 'L002003',
          title: 'Business Case y Justificación del Proyecto',
          content: 'El business case proporciona la justificación económica para el proyecto y guía la toma de decisiones durante su ejecución.',
          type: 'reading',
          duration: '45 minutos',
          order: 3,
          objectives: [
            'Desarrollar un business case sólido',
            'Calcular ROI y beneficios del proyecto',
            'Presentar justificación a ejecutivos'
          ]
        },
        {
          lessonId: 'L002004',
          title: 'Factores Ambientales y Activos de Procesos',
          content: 'Los factores ambientales de la empresa y activos de procesos organizacionales influyen en la gestión del proyecto.',
          type: 'reading',
          duration: '40 minutos',
          order: 4,
          objectives: [
            'Identificar factores ambientales relevantes',
            'Utilizar activos de procesos organizacionales',
            'Adaptar enfoques según el contexto'
          ]
        },
        {
          lessonId: 'L002005',
          title: 'Taller: Desarrollo de Project Charter',
          content: 'Ejercicio práctico para crear un Project Charter completo usando plantillas y mejores prácticas.',
          type: 'assignment',
          duration: '90 minutos',
          order: 5,
          objectives: [
            'Aplicar conocimientos en caso práctico',
            'Crear documentos de inicio de proyecto',
            'Recibir retroalimentación sobre entregables'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD003',
      title: 'Planificación del Alcance y Requisitos',
      description: 'Técnicas para definir y gestionar el alcance del proyecto y requisitos',
      duration: '12 horas',
      order: 3,
      lessons: [
        {
          lessonId: 'L003001',
          title: 'Planificación de la Gestión del Alcance',
          content: 'Proceso para crear un plan que documente cómo se definirá, validará y controlará el alcance del proyecto.',
          type: 'reading',
          duration: '50 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión del alcance',
            'Definir procesos de control de alcance',
            'Establecer criterios de aceptación'
          ]
        },
        {
          lessonId: 'L003002',
          title: 'Recopilar Requisitos',
          content: 'Técnicas y herramientas para recopilar, documentar y gestionar requisitos del proyecto y del producto.',
          type: 'video',
          duration: '65 minutos',
          order: 2,
          objectives: [
            'Aplicar técnicas de recopilación de requisitos',
            'Crear matriz de trazabilidad de requisitos',
            'Gestionar cambios en requisitos'
          ]
        },
        {
          lessonId: 'L003003',
          title: 'Definir el Alcance del Proyecto',
          content: 'Desarrollo de una descripción detallada del proyecto y del producto, incluyendo criterios de aceptación.',
          type: 'reading',
          duration: '55 minutos',
          order: 3,
          objectives: [
            'Crear declaración del alcance del proyecto',
            'Definir entregables del proyecto',
            'Establecer exclusiones y restricciones'
          ]
        },
        {
          lessonId: 'L003004',
          title: 'Crear la Estructura de Desglose del Trabajo (WBS)',
          content: 'La WBS es una descomposición jerárquica del trabajo a realizar por el equipo del proyecto.',
          type: 'video',
          duration: '70 minutos',
          order: 4,
          objectives: [
            'Crear WBS usando diferentes enfoques',
            'Desarrollar diccionario de la WBS',
            'Validar completitud de la WBS'
          ]
        },
        {
          lessonId: 'L003005',
          title: 'Validar y Controlar el Alcance',
          content: 'Procesos para formalizar la aceptación de entregables y gestionar cambios en el alcance.',
          type: 'reading',
          duration: '40 minutos',
          order: 5,
          objectives: [
            'Implementar proceso de validación del alcance',
            'Controlar cambios en el alcance',
            'Gestionar scope creep'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD004',
      title: 'Gestión del Cronograma y Tiempo',
      description: 'Planificación, desarrollo y control del cronograma del proyecto',
      duration: '12 horas',
      order: 4,
      lessons: [
        {
          lessonId: 'L004001',
          title: 'Planificar la Gestión del Cronograma',
          content: 'Establecimiento de políticas, procedimientos y documentación para planificar, desarrollar y controlar el cronograma.',
          type: 'reading',
          duration: '45 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión del cronograma',
            'Seleccionar metodología de programación',
            'Definir herramientas y técnicas'
          ]
        },
        {
          lessonId: 'L004002',
          title: 'Definir y Secuenciar Actividades',
          content: 'Identificación y documentación de acciones específicas para producir entregables del proyecto.',
          type: 'video',
          duration: '60 minutos',
          order: 2,
          objectives: [
            'Definir actividades del proyecto',
            'Establecer secuencias lógicas',
            'Identificar dependencias'
          ]
        },
        {
          lessonId: 'L004003',
          title: 'Estimar Recursos y Duraciones',
          content: 'Técnicas para estimar tipos, cantidades de recursos y duración de actividades del proyecto.',
          type: 'reading',
          duration: '55 minutos',
          order: 3,
          objectives: [
            'Aplicar técnicas de estimación',
            'Considerar factores que afectan estimaciones',
            'Documentar supuestos y restricciones'
          ]
        },
        {
          lessonId: 'L004004',
          title: 'Desarrollar el Cronograma - Método de Ruta Crítica',
          content: 'Técnica para calcular fechas tempranas y tardías, identificar ruta crítica y holguras.',
          type: 'video',
          duration: '75 minutos',
          order: 4,
          objectives: [
            'Aplicar método de ruta crítica',
            'Identificar actividades críticas',
            'Calcular holguras y flexibilidad'
          ]
        },
        {
          lessonId: 'L004005',
          title: 'Controlar el Cronograma y Técnicas de Compresión',
          content: 'Monitoreo del progreso y aplicación de técnicas para acelerar el cronograma cuando sea necesario.',
          type: 'reading',
          duration: '45 minutos',
          order: 5,
          objectives: [
            'Implementar control del cronograma',
            'Aplicar fast tracking y crashing',
            'Gestionar cambios en el cronograma'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD005',
      title: 'Gestión de Costos y Presupuesto',
      description: 'Planificación, estimación, presupuestación y control de costos del proyecto',
      duration: '12 horas',
      order: 5,
      lessons: [
        {
          lessonId: 'L005001',
          title: 'Planificar la Gestión de Costos',
          content: 'Definición de cómo se estimarán, presupuestarán, gestionarán y controlarán los costos del proyecto.',
          type: 'reading',
          duration: '50 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión de costos',
            'Definir unidades de medida y precisión',
            'Establecer umbrales de control'
          ]
        },
        {
          lessonId: 'L005002',
          title: 'Estimar Costos del Proyecto',
          content: 'Técnicas y herramientas para desarrollar estimaciones de costos de recursos necesarios.',
          type: 'video',
          duration: '65 minutos',
          order: 2,
          objectives: [
            'Aplicar técnicas de estimación de costos',
            'Considerar todos los tipos de costos',
            'Documentar bases de estimación'
          ]
        },
        {
          lessonId: 'L005003',
          title: 'Determinar el Presupuesto',
          content: 'Agregación de costos estimados para establecer línea base de costos autorizada.',
          type: 'reading',
          duration: '45 minutos',
          order: 3,
          objectives: [
            'Desarrollar línea base de costos',
            'Incluir reservas de contingencia',
            'Crear presupuesto por períodos'
          ]
        },
        {
          lessonId: 'L005004',
          title: 'Controlar Costos - Gestión del Valor Ganado',
          content: 'Técnica integrada para medir rendimiento del proyecto combinando mediciones de alcance, cronograma y recursos.',
          type: 'video',
          duration: '80 minutos',
          order: 4,
          objectives: [
            'Aplicar análisis de valor ganado',
            'Calcular índices de rendimiento',
            'Proyectar costos finales'
          ]
        },
        {
          lessonId: 'L005005',
          title: 'Análisis Financiero de Proyectos',
          content: 'Técnicas financieras para evaluar viabilidad económica y retorno de inversión de proyectos.',
          type: 'reading',
          duration: '40 minutos',
          order: 5,
          objectives: [
            'Calcular NPV, IRR y payback period',
            'Evaluar viabilidad financiera',
            'Comparar alternativas de inversión'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD006',
      title: 'Gestión de Calidad',
      description: 'Planificación, aseguramiento y control de calidad en proyectos',
      duration: '12 horas',
      order: 6,
      lessons: [
        {
          lessonId: 'L006001',
          title: 'Planificar la Gestión de Calidad',
          content: 'Identificación de requisitos y estándares de calidad para el proyecto y sus entregables.',
          type: 'reading',
          duration: '50 minutos',
          order: 1,
          objectives: [
            'Definir estándares de calidad',
            'Crear plan de gestión de calidad',
            'Establecer métricas de calidad'
          ]
        },
        {
          lessonId: 'L006002',
          title: 'Gestionar la Calidad - Aseguramiento',
          content: 'Procesos para aplicar actividades de calidad planificadas y auditar requisitos de calidad.',
          type: 'video',
          duration: '60 minutos',
          order: 2,
          objectives: [
            'Implementar aseguramiento de calidad',
            'Realizar auditorías de calidad',
            'Aplicar mejora continua'
          ]
        },
        {
          lessonId: 'L006003',
          title: 'Controlar la Calidad - Herramientas Estadísticas',
          content: 'Técnicas estadísticas y herramientas para monitorear y registrar resultados de actividades de calidad.',
          type: 'reading',
          duration: '65 minutos',
          order: 3,
          objectives: [
            'Aplicar herramientas de control de calidad',
            'Interpretar gráficos de control',
            'Realizar análisis de Pareto'
          ]
        },
        {
          lessonId: 'L006004',
          title: 'Técnicas de Mejora de Procesos',
          content: 'Metodologías como Six Sigma, Lean y Kaizen para mejorar procesos y eliminar desperdicios.',
          type: 'video',
          duration: '55 minutos',
          order: 4,
          objectives: [
            'Aplicar principios de Lean y Six Sigma',
            'Identificar y eliminar desperdicios',
            'Implementar mejora continua'
          ]
        },
        {
          lessonId: 'L006005',
          title: 'Costo de la Calidad y ROI',
          content: 'Análisis económico de inversiones en calidad y su impacto en el éxito del proyecto.',
          type: 'reading',
          duration: '40 minutos',
          order: 5,
          objectives: [
            'Calcular costo de la calidad',
            'Evaluar ROI de iniciativas de calidad',
            'Optimizar inversión en calidad'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD007',
      title: 'Gestión de Recursos Humanos y Equipos',
      description: 'Planificación, adquisición, desarrollo y gestión del equipo del proyecto',
      duration: '12 horas',
      order: 7,
      lessons: [
        {
          lessonId: 'L007001',
          title: 'Planificar la Gestión de Recursos',
          content: 'Identificación y documentación de roles, responsabilidades y relaciones de reporte del proyecto.',
          type: 'reading',
          duration: '50 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión de recursos',
            'Definir roles y responsabilidades',
            'Desarrollar matriz RACI'
          ]
        },
        {
          lessonId: 'L007002',
          title: 'Estimar Recursos de Actividades',
          content: 'Estimación de tipos y cantidades de materiales, personas, equipos o suministros necesarios.',
          type: 'video',
          duration: '55 minutos',
          order: 2,
          objectives: [
            'Estimar necesidades de recursos',
            'Considerar disponibilidad de recursos',
            'Crear calendario de recursos'
          ]
        },
        {
          lessonId: 'L007003',
          title: 'Adquirir y Desarrollar el Equipo',
          content: 'Procesos para confirmar disponibilidad de recursos humanos y obtener el equipo necesario.',
          type: 'reading',
          duration: '60 minutos',
          order: 3,
          objectives: [
            'Adquirir miembros del equipo',
            'Negociar recursos con gerentes funcionales',
            'Desarrollar competencias del equipo'
          ]
        },
        {
          lessonId: 'L007004',
          title: 'Dirigir el Equipo - Liderazgo y Motivación',
          content: 'Técnicas de liderazgo, comunicación y motivación para maximizar rendimiento del equipo.',
          type: 'video',
          duration: '70 minutos',
          order: 4,
          objectives: [
            'Aplicar estilos de liderazgo efectivos',
            'Motivar y comprometer al equipo',
            'Resolver conflictos constructivamente'
          ]
        },
        {
          lessonId: 'L007005',
          title: 'Controlar Recursos y Evaluación de Desempeño',
          content: 'Seguimiento del rendimiento de miembros del equipo, retroalimentación y resolución de problemas.',
          type: 'reading',
          duration: '45 minutos',
          order: 5,
          objectives: [
            'Monitorear desempeño del equipo',
            'Proporcionar retroalimentación efectiva',
            'Gestionar cambios en el equipo'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD008',
      title: 'Gestión de Comunicaciones',
      description: 'Planificación, gestión y control de comunicaciones del proyecto',
      duration: '12 horas',
      order: 8,
      lessons: [
        {
          lessonId: 'L008001',
          title: 'Planificar la Gestión de Comunicaciones',
          content: 'Desarrollo de enfoque y plan apropiados para comunicaciones basado en necesidades de información.',
          type: 'reading',
          duration: '50 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión de comunicaciones',
            'Identificar necesidades de información',
            'Seleccionar tecnologías de comunicación'
          ]
        },
        {
          lessonId: 'L008002',
          title: 'Gestionar las Comunicaciones',
          content: 'Creación, recopilación, distribución y almacenamiento de información del proyecto.',
          type: 'video',
          duration: '60 minutos',
          order: 2,
          objectives: [
            'Distribuir información efectivamente',
            'Gestionar comunicaciones del proyecto',
            'Facilitar comunicación entre stakeholders'
          ]
        },
        {
          lessonId: 'L008003',
          title: 'Monitorear las Comunicaciones',
          content: 'Asegurar que las necesidades de información del proyecto y stakeholders se satisfagan.',
          type: 'reading',
          duration: '45 minutos',
          order: 3,
          objectives: [
            'Monitorear efectividad de comunicaciones',
            'Ajustar estrategias de comunicación',
            'Resolver problemas de comunicación'
          ]
        },
        {
          lessonId: 'L008004',
          title: 'Comunicación Efectiva y Presentaciones',
          content: 'Técnicas para comunicación clara, persuasiva y adaptada a diferentes audiencias.',
          type: 'video',
          duration: '65 minutos',
          order: 4,
          objectives: [
            'Desarrollar habilidades de presentación',
            'Adaptar mensaje a la audiencia',
            'Usar comunicación visual efectiva'
          ]
        },
        {
          lessonId: 'L008005',
          title: 'Gestión de Conflictos y Negociación',
          content: 'Técnicas para identificar, analizar y resolver conflictos de manera constructiva.',
          type: 'reading',
          duration: '50 minutos',
          order: 5,
          objectives: [
            'Identificar fuentes de conflicto',
            'Aplicar técnicas de resolución',
            'Negociar soluciones ganar-ganar'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD009',
      title: 'Gestión de Riesgos',
      description: 'Identificación, análisis, respuesta y monitoreo de riesgos del proyecto',
      duration: '12 horas',
      order: 9,
      lessons: [
        {
          lessonId: 'L009001',
          title: 'Planificar la Gestión de Riesgos',
          content: 'Definición de cómo conducir actividades de gestión de riesgos para el proyecto.',
          type: 'reading',
          duration: '45 minutos',
          order: 1,
          objectives: [
            'Crear plan de gestión de riesgos',
            'Definir categorías de riesgos',
            'Establecer escalas de probabilidad e impacto'
          ]
        },
        {
          lessonId: 'L009002',
          title: 'Identificar Riesgos',
          content: 'Determinación de riesgos que pueden afectar el proyecto y documentación de sus características.',
          type: 'video',
          duration: '60 minutos',
          order: 2,
          objectives: [
            'Aplicar técnicas de identificación de riesgos',
            'Crear registro de riesgos',
            'Involucrar stakeholders en identificación'
          ]
        },
        {
          lessonId: 'L009003',
          title: 'Realizar Análisis Cualitativo y Cuantitativo',
          content: 'Evaluación de probabilidad e impacto de riesgos identificados y análisis numérico.',
          type: 'reading',
          duration: '70 minutos',
          order: 3,
          objectives: [
            'Realizar análisis cualitativo de riesgos',
            'Aplicar técnicas cuantitativas',
            'Priorizar riesgos por importancia'
          ]
        },
        {
          lessonId: 'L009004',
          title: 'Planificar Respuesta a Riesgos',
          content: 'Desarrollo de opciones y acciones para mejorar oportunidades y reducir amenazas.',
          type: 'video',
          duration: '65 minutos',
          order: 4,
          objectives: [
            'Desarrollar estrategias de respuesta',
            'Asignar responsables de riesgos',
            'Crear planes de contingencia'
          ]
        },
        {
          lessonId: 'L009005',
          title: 'Implementar y Monitorear Respuestas',
          content: 'Implementación de planes de respuesta acordados y seguimiento de riesgos identificados.',
          type: 'reading',
          duration: '40 minutos',
          order: 5,
          objectives: [
            'Implementar respuestas a riesgos',
            'Monitorear riesgos residuales',
            'Identificar nuevos riesgos'
          ]
        }
      ]
    },
    {
      moduleId: 'MOD010',
      title: 'Gestión de Adquisiciones y Cierre',
      description: 'Procesos de adquisición, contratos, cierre del proyecto y lecciones aprendidas',
      duration: '12 horas',
      order: 10,
      lessons: [
        {
          lessonId: 'L010001',
          title: 'Planificar la Gestión de Adquisiciones',
          content: 'Documentación de decisiones de compra, especificación del enfoque e identificación de proveedores.',
          type: 'reading',
          duration: '55 minutos',
          order: 1,
          objectives: [
            'Decidir qué adquirir externamente',
            'Crear plan de gestión de adquisiciones',
            'Definir criterios de selección de proveedores'
          ]
        },
        {
          lessonId: 'L010002',
          title: 'Efectuar Adquisiciones y Contratos',
          content: 'Obtención de respuestas de vendedores, selección de proveedores y adjudicación de contratos.',
          type: 'video',
          duration: '70 minutos',
          order: 2,
          objectives: [
            'Conducir procesos de licitación',
            'Evaluar propuestas de proveedores',
            'Negociar y adjudicar contratos'
          ]
        },
        {
          lessonId: 'L010003',
          title: 'Controlar Adquisiciones',
          content: 'Gestión de relaciones de adquisición, monitoreo de rendimiento y cambios contractuales.',
          type: 'reading',
          duration: '50 minutos',
          order: 3,
          objectives: [
            'Administrar contratos efectivamente',
            'Monitorear desempeño de proveedores',
            'Gestionar cambios contractuales'
          ]
        },
        {
          lessonId: 'L010004',
          title: 'Cerrar el Proyecto o Fase',
          content: 'Finalización de actividades para completar formalmente el proyecto, fase o contrato.',
          type: 'video',
          duration: '60 minutos',
          order: 4,
          objectives: [
            'Completar cierre administrativo',
            'Obtener aceptación final',
            'Transferir entregables'
          ]
        },
        {
          lessonId: 'L010005',
          title: 'Lecciones Aprendidas y Mejora Continua',
          content: 'Documentación y transferencia de conocimientos adquiridos durante el proyecto.',
          type: 'assignment',
          duration: '45 minutos',
          order: 5,
          objectives: [
            'Documentar lecciones aprendidas',
            'Actualizar activos de procesos',
            'Planificar mejora continua'
          ]
        }
      ]
    }
  ]
}

async function createPMPCourse() {
  console.log('🚀 Iniciando creación del curso PMP Certification Masterclass...')
  
  try {
    // 1. Crear información del curso principal
    const courseData = {
      id: `COURSE#${pmpCourse.courseId}`,
      client_id: 'METADATA',
      courseId: pmpCourse.courseId,
      title: pmpCourse.title,
      description: pmpCourse.description,
      instructor: pmpCourse.instructor,
      duration: pmpCourse.duration,
      level: pmpCourse.level,
      category: pmpCourse.category,
      language: pmpCourse.language,
      totalModules: pmpCourse.modules.length,
      totalLessons: pmpCourse.modules.reduce((total, module) => total + module.lessons.length, 0),
      created_date: new Date().toISOString(),
      document_type: 'COURSE',
      status: 'active'
    }

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: courseData
    }).promise()

    console.log('✅ Información del curso creada')

    // 2. Crear módulos
    for (const module of pmpCourse.modules) {
      const moduleData = {
        id: `MODULE#${module.moduleId}`,
        client_id: `COURSE#${pmpCourse.courseId}`,
        courseId: pmpCourse.courseId,
        moduleId: module.moduleId,
        title: module.title,
        description: module.description,
        duration: module.duration,
        order: module.order,
        totalLessons: module.lessons.length,
        created_date: new Date().toISOString(),
        document_type: 'MODULE'
      }

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: moduleData
      }).promise()

      console.log(`📚 Módulo ${module.order} creado: ${module.title}`)

      // 3. Crear lecciones del módulo
      for (const lesson of module.lessons) {
        const lessonData = {
          id: `LESSON#${lesson.lessonId}`,
          client_id: `MODULE#${module.moduleId}`,
          courseId: pmpCourse.courseId,
          moduleId: module.moduleId,
          lessonId: lesson.lessonId,
          title: lesson.title,
          content: lesson.content,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          objectives: lesson.objectives,
          created_date: new Date().toISOString(),
          document_type: 'LESSON'
        }

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: lessonData
        }).promise()

        console.log(`  📖 Lección ${lesson.order}: ${lesson.title}`)
      }
    }

    // 4. Crear estadísticas del curso
    const statsData = {
      id: `STATS#${pmpCourse.courseId}`,
      client_id: 'COURSE_STATS',
      courseId: pmpCourse.courseId,
      totalModules: pmpCourse.modules.length,
      totalLessons: pmpCourse.modules.reduce((total, module) => total + module.lessons.length, 0),
      totalReadingLessons: pmpCourse.modules.reduce((total, module) => 
        total + module.lessons.filter(lesson => lesson.type === 'reading').length, 0),
      totalVideoLessons: pmpCourse.modules.reduce((total, module) => 
        total + module.lessons.filter(lesson => lesson.type === 'video').length, 0),
      totalQuizzes: pmpCourse.modules.reduce((total, module) => 
        total + module.lessons.filter(lesson => lesson.type === 'quiz').length, 0),
      totalAssignments: pmpCourse.modules.reduce((total, module) => 
        total + module.lessons.filter(lesson => lesson.type === 'assignment').length, 0),
      estimatedHours: 120,
      created_date: new Date().toISOString(),
      document_type: 'COURSE_STATS'
    }

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: statsData
    }).promise()

    console.log('📊 Estadísticas del curso creadas')

    console.log('\n🎉 ¡Curso PMP Certification Masterclass creado exitosamente!')
    console.log(`📚 Total de módulos: ${pmpCourse.modules.length}`)
    console.log(`📖 Total de lecciones: ${pmpCourse.modules.reduce((total, module) => total + module.lessons.length, 0)}`)
    console.log(`⏱️ Duración estimada: ${pmpCourse.duration}`)
    console.log(`🎯 Nivel: ${pmpCourse.level}`)
    console.log(`🌐 Idioma: ${pmpCourse.language}`)
    
    console.log('\n📋 Resumen por módulos:')
    pmpCourse.modules.forEach(module => {
      console.log(`  ${module.order}. ${module.title} (${module.lessons.length} lecciones)`)
    })

  } catch (error) {
    console.error('❌ Error creando el curso:', error)
    throw error
  }
}

// Ejecutar la creación del curso
if (require.main === module) {
  createPMPCourse()
    .then(() => {
      console.log('\n✅ Proceso completado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error en el proceso:', error)
      process.exit(1)
    })
}

module.exports = { createPMPCourse, pmpCourse } 
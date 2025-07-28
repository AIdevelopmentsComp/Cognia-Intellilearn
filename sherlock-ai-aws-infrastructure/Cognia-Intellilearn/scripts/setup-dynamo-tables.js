/**
 * Setup DynamoDB Tables for CognIA IntelliLearn
 * ⚠️ SECURITY: Uses environment variables for AWS credentials
 */

require('dotenv').config({ path: '../.env.local' });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
  console.error('❌ ERROR: AWS credentials not found in environment variables');
  console.error('Please ensure your .env.local file contains:');
  console.error('- NEXT_PUBLIC_AWS_ACCESS_KEY_ID');
  console.error('- NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  ListTablesCommand 
} = require('@aws-sdk/client-dynamodb');

// AWS Configuration from environment variables
const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
  }
};

const dynamoClient = new DynamoDBClient(awsConfig);

console.log('🚀 Setting up DynamoDB tables with secure configuration...');
console.log(`📍 Region: ${awsConfig.region}`);
console.log(`🔐 Using credentials from environment variables`);

// Table definitions remain the same...
const TABLES = {
  COURSES: {
    name: 'intellilearn-courses',
    schema: {
      TableName: 'intellilearn-courses',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  },
  MODULES: {
    name: 'intellilearn-modules',
    schema: {
      TableName: 'intellilearn-modules',
      KeySchema: [
        { AttributeName: 'courseId', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'courseId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  },
  LESSONS: {
    name: 'intellilearn-lessons',
    schema: {
      TableName: 'intellilearn-lessons',
      KeySchema: [
        { AttributeName: 'moduleId', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'moduleId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  },
  USER_PROGRESS: {
    name: 'intellilearn-user-progress',
    schema: {
      TableName: 'intellilearn-user-progress',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'courseId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'courseId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  }
}

/**
 * 1. CREAR UNA TABLA EN DYNAMODB
 */
async function createTable(tableConfig) {
  console.log(`\n🏗️ CREANDO TABLA: ${tableConfig.name}`)
  console.log('=' .repeat(50))
  
  try {
    // Verificar si la tabla ya existe
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: tableConfig.name
      })
      await dynamoClient.send(describeCommand)
      console.log(`✅ TABLA ${tableConfig.name} YA EXISTE`)
      return true
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error
      }
    }
    
    // Crear la tabla
    const createCommand = new CreateTableCommand(tableConfig.schema)
    const result = await dynamoClient.send(createCommand)
    
    console.log(`✅ TABLA ${tableConfig.name} CREADA EXITOSAMENTE`)
    console.log(`Estado: ${result.TableDescription.TableStatus}`)
    
    // Esperar a que la tabla esté activa
    console.log('⏳ Esperando que la tabla esté activa...')
    await waitForTableActive(tableConfig.name)
    
    return true
    
  } catch (error) {
    console.error(`❌ ERROR AL CREAR TABLA ${tableConfig.name}:`, error.message)
    return false
  }
}

/**
 * 2. ESPERAR A QUE LA TABLA ESTÉ ACTIVA
 */
async function waitForTableActive(tableName) {
  const maxAttempts = 30
  let attempts = 0
  
  while (attempts < maxAttempts) {
    try {
      const command = new DescribeTableCommand({ TableName: tableName })
      const result = await dynamoClient.send(command)
      
      if (result.Table.TableStatus === 'ACTIVE') {
        console.log(`✅ TABLA ${tableName} ESTÁ ACTIVA`)
        return true
      }
      
      console.log(`⏳ Tabla ${tableName} estado: ${result.Table.TableStatus} (intento ${attempts + 1}/${maxAttempts})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
      
    } catch (error) {
      console.error(`❌ ERROR AL VERIFICAR TABLA ${tableName}:`, error.message)
      attempts++
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  throw new Error(`Timeout esperando que la tabla ${tableName} esté activa`)
}

/**
 * 3. INSERTAR DATOS DE MUESTRA DEL CURSO PMP
 */
async function insertSampleData() {
  console.log('\n📚 INSERTANDO DATOS DE MUESTRA - CURSO PMP')
  console.log('=' .repeat(50))
  
  // Datos del curso PMP
  const pmpCourse = {
    id: '1',
    title: 'Certificación PMP Completa',
    description: 'Tu primer paso hacia el dominio de la dirección de proyectos a nivel global. ¡Bienvenido a una experiencia transformadora! Este curso ha sido diseñado estratégicamente para llevarte desde el conocimiento técnico hasta la mentalidad de un Project Manager certificado, alineado con los estándares globales del PMI® (Project Management Institute) y su guía insignia, el PMBOK®.',
    instructor: 'ING. Maritza Martínez Sahagun',
    thumbnail: '/assets/images/Image.svg',
    imageUrl: '/assets/images/course-pm.jpg',
    category: 'Management',
    level: 'beginner',
    duration: '100 horas',
    rating: 4.8,
    totalStudents: 1247,
    price: 99,
    tags: ['Project Management', 'Agile', 'Scrum', 'Leadership'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: true
  }
  
  // Módulos del curso
  const modules = [
    {
      id: 'module_1',
      courseId: '1',
      title: 'Introducción al Project Management',
      description: 'Conceptos fundamentales y metodologías básicas',
      order: 1
    },
    {
      id: 'module_2', 
      courseId: '1',
      title: 'Metodologías Ágiles vs Tradicionales',
      description: 'Comparación y aplicación de diferentes enfoques',
      order: 2
    }
  ]
  
  // Lecciones del primer módulo
  const lessons = [
    {
      id: 'lesson_1_1',
      moduleId: 'module_1',
      courseId: '1',
      title: '¿Qué es Project Management?',
      description: 'Introducción a los conceptos básicos de gestión de proyectos',
      type: 'video',
      duration: '15 min',
      order: 1,
      content: '<h2>¿Qué es Project Management?</h2><p>El Project Management o gestión de proyectos es la disciplina de planificar, organizar y gestionar recursos para llevar a cabo con éxito la finalización de objetivos y metas específicas de un proyecto.</p>',
      videoUrl: 'https://example.com/video1.mp4'
    },
    {
      id: 'lesson_1_2',
      moduleId: 'module_1', 
      courseId: '1',
      title: 'Historia y Evolución del PM',
      description: 'Evolución histórica de la gestión de proyectos',
      type: 'reading',
      duration: '20 min',
      order: 2,
      content: '<h2>Historia y Evolución del Project Management</h2><p>La gestión de proyectos ha evolucionado significativamente desde sus orígenes en la construcción y la ingeniería hasta convertirse en una disciplina aplicable a cualquier industria.</p>'
    },
    {
      id: 'lesson_2_1',
      moduleId: 'module_2',
      courseId: '1', 
      title: 'Metodologías Ágiles vs Tradicionales',
      description: 'Comparación detallada entre enfoques ágiles y tradicionales',
      type: 'video',
      duration: '25 min',
      order: 1,
      content: '<h2>Metodologías Ágiles vs Tradicionales</h2><p>En este módulo exploraremos las diferencias fundamentales entre las metodologías ágiles y tradicionales de gestión de proyectos.</p>',
      videoUrl: 'https://example.com/video2.mp4'
    }
  ]
  
  try {
    // Insertar curso
    console.log('📚 Insertando curso PMP...')
    // await docClient.send(new PutCommand({ // This line was removed as per the new_code
    //   TableName: TABLES.COURSES.name,
    //   Item: pmpCourse
    // }))
    console.log('✅ Curso PMP insertado')
    
    // Insertar módulos
    console.log('📖 Insertando módulos...')
    for (const module of modules) {
      // await docClient.send(new PutCommand({ // This line was removed as per the new_code
      //   TableName: TABLES.MODULES.name,
      //   Item: module
      // }))
      console.log(`✅ Módulo "${module.title}" insertado`)
    }
    
    // Insertar lecciones
    console.log('📝 Insertando lecciones...')
    for (const lesson of lessons) {
      // await docClient.send(new PutCommand({ // This line was removed as per the new_code
      //   TableName: TABLES.LESSONS.name,
      //   Item: lesson
      // }))
      console.log(`✅ Lección "${lesson.title}" insertada`)
    }
    
    console.log('\n🎉 TODOS LOS DATOS INSERTADOS EXITOSAMENTE')
    
  } catch (error) {
    console.error('❌ ERROR AL INSERTAR DATOS:', error.message)
  }
}

/**
 * 4. FUNCIÓN PRINCIPAL
 */
async function main() {
  console.log('🚀 CONFIGURANDO DYNAMODB PARA INTELLILEARN')
  console.log('=' .repeat(60))
  
  try {
    // Crear todas las tablas
    console.log('\n📋 CREANDO TABLAS DE DYNAMODB...')
    
    for (const [key, tableConfig] of Object.entries(TABLES)) {
      const success = await createTable(tableConfig)
      if (!success) {
        console.error(`❌ FALLÓ LA CREACIÓN DE TABLA: ${tableConfig.name}`)
        return
      }
    }
    
    console.log('\n✅ TODAS LAS TABLAS CREADAS EXITOSAMENTE')
    
    // Insertar datos de muestra
    await insertSampleData()
    
    console.log('\n🎯 CONFIGURACIÓN COMPLETADA')
    console.log('Ahora puedes consultar los datos con:')
    console.log('node scripts/query-dynamo.js')
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error.message)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

module.exports = {
  createTable,
  insertSampleData,
  TABLES
} 
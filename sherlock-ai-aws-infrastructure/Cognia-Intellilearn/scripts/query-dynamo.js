const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

// Configuración AWS (usar las mismas credenciales del proyecto)
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

// Crear clientes DynamoDB
const dynamoClient = new DynamoDBClient(awsConfig)
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Nombres de las tablas
const TABLES = {
  COURSES: 'intellilearn-courses',
  MODULES: 'intellilearn-modules', 
  LESSONS: 'intellilearn-lessons',
  USER_PROGRESS: 'intellilearn-user-progress'
}

/**
 * 1. CONSULTAR CURSO ESPECÍFICO POR ID
 */
async function getCourseById(courseId) {
  console.log(`\n🔍 CONSULTANDO CURSO ID: ${courseId}`)
  console.log('=' .repeat(50))
  
  try {
    const command = new GetCommand({
      TableName: TABLES.COURSES,
      Key: { id: courseId }
    })
    
    const result = await docClient.send(command)
    
    if (result.Item) {
      console.log('✅ CURSO ENCONTRADO:')
      console.log(JSON.stringify(result.Item, null, 2))
      
      // Mostrar información estructurada
      console.log('\n📊 INFORMACIÓN ESTRUCTURADA:')
      console.log(`Título: ${result.Item.title}`)
      console.log(`Instructor: ${result.Item.instructor}`)
      console.log(`Categoría: ${result.Item.category}`)
      console.log(`Duración: ${result.Item.duration}`)
      console.log(`Precio: $${result.Item.price}`)
      console.log(`Rating: ${result.Item.rating}/5`)
      console.log(`Estudiantes: ${result.Item.totalStudents}`)
      console.log(`Módulos: ${result.Item.modules ? result.Item.modules.length : 0}`)
      console.log(`Tags: ${result.Item.tags ? result.Item.tags.join(', ') : 'N/A'}`)
      console.log(`Imagen: ${result.Item.imageUrl || 'No definida'}`)
      
    } else {
      console.log('❌ CURSO NO ENCONTRADO')
    }
    
  } catch (error) {
    console.error('❌ ERROR AL CONSULTAR:', error.message)
  }
}

/**
 * 2. LISTAR TODOS LOS CURSOS
 */
async function getAllCourses() {
  console.log('\n📚 LISTANDO TODOS LOS CURSOS')
  console.log('=' .repeat(50))
  
  try {
    const command = new ScanCommand({
      TableName: TABLES.COURSES
    })
    
    const result = await docClient.send(command)
    
    console.log(`✅ ENCONTRADOS ${result.Items.length} CURSOS:`)
    
    result.Items.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Instructor: ${course.instructor}`)
      console.log(`   Precio: $${course.price}`)
      console.log(`   Rating: ${course.rating}/5`)
    })
    
  } catch (error) {
    console.error('❌ ERROR AL LISTAR CURSOS:', error.message)
  }
}

/**
 * 3. CONSULTAR MÓDULOS DE UN CURSO
 */
async function getModulesByCourse(courseId) {
  console.log(`\n📖 CONSULTANDO MÓDULOS DEL CURSO: ${courseId}`)
  console.log('=' .repeat(50))
  
  try {
    const command = new QueryCommand({
      TableName: TABLES.MODULES,
      KeyConditionExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    })
    
    const result = await docClient.send(command)
    
    console.log(`✅ ENCONTRADOS ${result.Items.length} MÓDULOS:`)
    
    result.Items.forEach((module, index) => {
      console.log(`\n${index + 1}. ${module.title}`)
      console.log(`   ID: ${module.id}`)
      console.log(`   Descripción: ${module.description}`)
      console.log(`   Orden: ${module.order}`)
    })
    
  } catch (error) {
    console.error('❌ ERROR AL CONSULTAR MÓDULOS:', error.message)
  }
}

/**
 * 4. CONSULTAR LECCIONES DE UN MÓDULO
 */
async function getLessonsByModule(moduleId) {
  console.log(`\n📝 CONSULTANDO LECCIONES DEL MÓDULO: ${moduleId}`)
  console.log('=' .repeat(50))
  
  try {
    const command = new QueryCommand({
      TableName: TABLES.LESSONS,
      KeyConditionExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':moduleId': moduleId
      }
    })
    
    const result = await docClient.send(command)
    
    console.log(`✅ ENCONTRADAS ${result.Items.length} LECCIONES:`)
    
    result.Items.forEach((lesson, index) => {
      console.log(`\n${index + 1}. ${lesson.title}`)
      console.log(`   ID: ${lesson.id}`)
      console.log(`   Tipo: ${lesson.type}`)
      console.log(`   Duración: ${lesson.duration}`)
      console.log(`   Video URL: ${lesson.videoUrl || 'N/A'}`)
    })
    
  } catch (error) {
    console.error('❌ ERROR AL CONSULTAR LECCIONES:', error.message)
  }
}

/**
 * 5. BUSCAR CURSOS POR TÍTULO
 */
async function searchCoursesByTitle(searchTerm) {
  console.log(`\n🔎 BUSCANDO CURSOS CON: "${searchTerm}"`)
  console.log('=' .repeat(50))
  
  try {
    const command = new ScanCommand({
      TableName: TABLES.COURSES,
      FilterExpression: 'contains(#title, :searchTerm)',
      ExpressionAttributeNames: {
        '#title': 'title'
      },
      ExpressionAttributeValues: {
        ':searchTerm': searchTerm
      }
    })
    
    const result = await docClient.send(command)
    
    console.log(`✅ ENCONTRADOS ${result.Items.length} CURSOS:`)
    
    result.Items.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Categoría: ${course.category}`)
    })
    
  } catch (error) {
    console.error('❌ ERROR EN BÚSQUEDA:', error.message)
  }
}

/**
 * 6. VERIFICAR ESTRUCTURA DE TABLA
 */
async function describeTable(tableName) {
  console.log(`\n🏗️ ESTRUCTURA DE LA TABLA: ${tableName}`)
  console.log('=' .repeat(50))
  
  try {
    const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb')
    const client = new DynamoDBClient(awsConfig)
    
    const command = new DescribeTableCommand({
      TableName: tableName
    })
    
    const result = await client.send(command)
    
    console.log('✅ INFORMACIÓN DE LA TABLA:')
    console.log(`Nombre: ${result.Table.TableName}`)
    console.log(`Estado: ${result.Table.TableStatus}`)
    console.log(`Elementos: ${result.Table.ItemCount}`)
    console.log(`Tamaño: ${result.Table.TableSizeBytes} bytes`)
    
    console.log('\n🔑 ESQUEMA DE CLAVES:')
    result.Table.KeySchema.forEach(key => {
      console.log(`${key.KeyType}: ${key.AttributeName}`)
    })
    
    console.log('\n📋 ATRIBUTOS:')
    result.Table.AttributeDefinitions.forEach(attr => {
      console.log(`${attr.AttributeName}: ${attr.AttributeType}`)
    })
    
  } catch (error) {
    console.error('❌ ERROR AL DESCRIBIR TABLA:', error.message)
  }
}

/**
 * FUNCIÓN PRINCIPAL - EJECUTAR CONSULTAS
 */
async function main() {
  console.log('🚀 INICIANDO CONSULTAS A DYNAMODB')
  console.log('=' .repeat(60))
  
  try {
    // 1. Consultar curso PMP específico
    await getCourseById('1')
    
    // 2. Listar todos los cursos
    await getAllCourses()
    
    // 3. Buscar cursos que contengan "Project"
    await searchCoursesByTitle('Project')
    
    // 4. Describir estructura de tabla de cursos
    await describeTable(TABLES.COURSES)
    
    // 5. Consultar módulos del curso PMP (si existe)
    await getModulesByCourse('1')
    
    // 6. Consultar lecciones del primer módulo (si existe)
    await getLessonsByModule('module_1')
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error.message)
  }
  
  console.log('\n✅ CONSULTAS COMPLETADAS')
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

module.exports = {
  getCourseById,
  getAllCourses,
  getModulesByCourse,
  getLessonsByModule,
  searchCoursesByTitle,
  describeTable
} 
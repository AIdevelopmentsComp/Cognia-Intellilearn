const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const docClient = DynamoDBDocumentClient.from(client)

async function getModules() {
  try {
    console.log('📖 Consultando módulos del curso PMP...')
    
    const result = await docClient.send(new QueryCommand({
      TableName: 'intellilearn-modules',
      KeyConditionExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': '1'
      }
    }))
    
    console.log(`\n✅ Encontrados ${result.Items.length} módulos:`)
    
    result.Items.forEach((module, index) => {
      console.log(`\n${index + 1}. ${module.title}`)
      console.log(`   ID: ${module.id}`)
      console.log(`   Descripción: ${module.description}`)
      console.log(`   Orden: ${module.order}`)
    })
    
    return result.Items
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    return []
  }
}

async function getLessons(moduleId) {
  try {
    console.log(`\n📝 Consultando lecciones del módulo: ${moduleId}`)
    
    const result = await docClient.send(new QueryCommand({
      TableName: 'intellilearn-lessons',
      KeyConditionExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':moduleId': moduleId
      }
    }))
    
    console.log(`\n✅ Encontradas ${result.Items.length} lecciones:`)
    
    result.Items.forEach((lesson, index) => {
      console.log(`\n   ${index + 1}. ${lesson.title}`)
      console.log(`      ID: ${lesson.id}`)
      console.log(`      Tipo: ${lesson.type}`)
      console.log(`      Duración: ${lesson.duration}`)
      console.log(`      Descripción: ${lesson.description}`)
      if (lesson.videoUrl) {
        console.log(`      Video: ${lesson.videoUrl}`)
      }
      if (lesson.content) {
        console.log(`      Contenido: ${lesson.content.substring(0, 100)}...`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function main() {
  console.log('🚀 CONSULTANDO ESTRUCTURA COMPLETA DEL CURSO PMP')
  console.log('=' .repeat(60))
  
  // Obtener módulos
  const modules = await getModules()
  
  // Para cada módulo, obtener sus lecciones
  for (const module of modules) {
    await getLessons(module.id)
  }
  
  console.log('\n✅ CONSULTA COMPLETADA')
}

main() 
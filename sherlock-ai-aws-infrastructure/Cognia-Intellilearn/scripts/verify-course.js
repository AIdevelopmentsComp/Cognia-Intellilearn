const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAZRFWGQV75WHQPQLI',
    secretAccessKey: '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'
  }
})

const docClient = DynamoDBDocumentClient.from(client)

async function verifyCourses() {
  try {
    console.log('🔍 Verificando cursos en DynamoDB...')
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'intellilearn-courses'
    }))
    
    console.log(`\n📊 Total de cursos encontrados: ${result.Items.length}`)
    
    result.Items.forEach((course, index) => {
      console.log(`\n${index + 1}. ID: ${course.id}`)
      console.log(`   Título: ${course.title}`)
      console.log(`   Instructor: ${course.instructor}`)
    })
    
    // Verificar específicamente el curso 000000000
    const targetCourse = result.Items.find(course => course.id === '000000000')
    if (targetCourse) {
      console.log('\n✅ Curso 000000000 encontrado correctamente')
    } else {
      console.log('\n❌ Curso 000000000 NO encontrado')
    }
    
    // Verificar que no exista el curso 1
    const oldCourse = result.Items.find(course => course.id === '1')
    if (oldCourse) {
      console.log('⚠️ Curso con ID "1" aún existe (debe eliminarse)')
    } else {
      console.log('✅ Curso con ID "1" eliminado correctamente')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verifyCourses() 
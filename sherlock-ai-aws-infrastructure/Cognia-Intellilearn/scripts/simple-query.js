const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const docClient = DynamoDBDocumentClient.from(client)

async function getCourse() {
  try {
    console.log('🔍 Consultando curso PMP...')
    
    const result = await docClient.send(new GetCommand({
      TableName: 'intellilearn-courses',
      Key: { id: '000000000' }
    }))
    
    if (result.Item) {
      console.log('\n✅ CURSO ENCONTRADO:')
      console.log('ID:', result.Item.id)
      console.log('Título:', result.Item.title)
      console.log('Instructor:', result.Item.instructor)
      console.log('Categoría:', result.Item.category)
      console.log('Duración:', result.Item.duration)
      console.log('Precio:', result.Item.price)
      console.log('Rating:', result.Item.rating)
      console.log('Estudiantes:', result.Item.totalStudents)
      console.log('Imagen:', result.Item.imageUrl)
      console.log('Tags:', result.Item.tags)
      console.log('\nDescripción:')
      console.log(result.Item.description)
    } else {
      console.log('❌ Curso no encontrado')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function listAllCourses() {
  try {
    console.log('\n📚 Listando todos los cursos...')
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'intellilearn-courses'
    }))
    
    console.log(`\n✅ Encontrados ${result.Items.length} cursos:`)
    
    result.Items.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Instructor: ${course.instructor}`)
      console.log(`   Precio: $${course.price}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function main() {
  await getCourse()
  await listAllCourses()
}

main() 
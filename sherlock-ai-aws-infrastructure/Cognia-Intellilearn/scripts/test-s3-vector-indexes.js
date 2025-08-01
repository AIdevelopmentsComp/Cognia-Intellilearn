const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Configuración AWS
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Crear clientes
const s3Client = new S3Client(awsConfig);
const bedrockClient = new BedrockRuntimeClient(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const VECTOR_BUCKET = 'intellilearn-vector-storage';
const VECTOR_INDEX = 'educational-content-index';

/**
 * Generar embeddings usando Amazon Titan
 */
async function generateEmbedding(text) {
  console.log('\n🤖 Generando embedding para texto...');
  
  try {
    const params = {
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text
      })
    };
    
    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('✅ Embedding generado (dimensiones:', responseBody.embedding.length + ')');
    
    return responseBody.embedding;
  } catch (error) {
    console.error('❌ Error generando embedding:', error.message);
    throw error;
  }
}

/**
 * Almacenar vector en S3
 */
async function storeVector(documentId, embedding, metadata) {
  console.log(`\n📦 Almacenando vector para documento: ${documentId}`);
  
  try {
    const vectorData = {
      id: documentId,
      vector: embedding,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };
    
    const params = {
      Bucket: VECTOR_BUCKET,
      Key: `${VECTOR_INDEX}/${documentId}.json`,
      Body: JSON.stringify(vectorData),
      ContentType: 'application/json'
    };
    
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    console.log('✅ Vector almacenado en S3');
    return true;
  } catch (error) {
    console.error('❌ Error almacenando vector:', error.message);
    throw error;
  }
}

/**
 * Buscar vectores similares (simulación hasta que s3vectors esté disponible)
 */
async function searchSimilarVectors(queryEmbedding, k = 5) {
  console.log(`\n🔍 Buscando ${k} vectores similares...`);
  
  // NOTA: Esta es una simulación. Con s3vectors real sería:
  // aws s3vectors query --vector-bucket-name intellilearn-vector-storage \
  //   --index-name educational-content-index --query-vector [embedding] --k 5
  
  console.log('⚠️  Búsqueda simulada (s3vectors no disponible aún)');
  
  // Simulamos resultados de búsqueda
  const simulatedResults = [
    {
      id: 'doc_1',
      score: 0.95,
      metadata: { title: 'Introducción a la Gestión de Proyectos', type: 'lesson' }
    },
    {
      id: 'doc_2', 
      score: 0.89,
      metadata: { title: 'Fundamentos de Scrum', type: 'lesson' }
    },
    {
      id: 'doc_3',
      score: 0.82,
      metadata: { title: 'Metodologías Ágiles', type: 'module' }
    }
  ];
  
  console.log('📊 Resultados simulados:');
  simulatedResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.metadata.title} (Score: ${result.score})`);
  });
  
  return simulatedResults;
}

/**
 * Casos de prueba
 */
async function runTests() {
  console.log('🚀 INICIANDO PRUEBAS DE S3 VECTOR STORAGE');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Generar embeddings para contenido educativo
    console.log('\n📚 TEST 1: Embeddings de Contenido Educativo');
    const lessonContent = "La gestión de proyectos es una disciplina que implica la planificación, organización y gestión de recursos para alcanzar objetivos específicos dentro de restricciones de tiempo y presupuesto.";
    const lessonEmbedding = await generateEmbedding(lessonContent);
    
    // Test 2: Almacenar vector en S3
    console.log('\n💾 TEST 2: Almacenamiento de Vectores');
    await storeVector('lesson_pm_101', lessonEmbedding, {
      title: 'Introducción a la Gestión de Proyectos',
      type: 'lesson',
      courseId: '1',
      moduleId: 'module_1',
      content: lessonContent,
      duration: '15 min'
    });
    
    // Test 3: Generar embeddings para evaluaciones
    console.log('\n📝 TEST 3: Embeddings de Evaluaciones');
    const quizQuestion = "¿Cuáles son las principales fases del ciclo de vida de un proyecto según el PMBOK?";
    const quizEmbedding = await generateEmbedding(quizQuestion);
    
    await storeVector('quiz_pm_phases', quizEmbedding, {
      title: 'Quiz: Fases del Proyecto',
      type: 'quiz',
      courseId: '1',
      question: quizQuestion,
      difficulty: 'intermediate'
    });
    
    // Test 4: Búsqueda semántica
    console.log('\n🔎 TEST 4: Búsqueda Semántica');
    const searchQuery = "¿Qué es Scrum y cómo se aplica en proyectos?";
    const searchEmbedding = await generateEmbedding(searchQuery);
    await searchSimilarVectors(searchEmbedding);
    
    // Test 5: Verificar integración con DynamoDB
    console.log('\n🔗 TEST 5: Integración con DynamoDB');
    const vectorMetadata = {
      vectorId: 'lesson_pm_101',
      s3Key: `${VECTOR_INDEX}/lesson_pm_101.json`,
      dimensions: 1024,
      createdAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: 'intellilearn-vector-metadata',
      Item: {
        id: 'lesson_pm_101',
        ...vectorMetadata
      }
    }));
    
    console.log('✅ Metadata almacenada en DynamoDB');
    
    // Resumen
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log('✅ Generación de embeddings con Amazon Titan');
    console.log('✅ Almacenamiento de vectores en S3');
    console.log('✅ Estructura de datos para búsqueda semántica');
    console.log('⚠️  Búsqueda vectorial pendiente (esperando s3vectors CLI)');
    console.log('✅ Integración con DynamoDB para metadata');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Actualizar AWS CLI cuando s3vectors esté disponible');
    console.log('2. Ejecutar script create-s3-vector-indexes.sh');
    console.log('3. Implementar búsqueda real con s3vectors query');
    console.log('4. Integrar en la aplicación principal');
    
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runTests();
}

module.exports = {
  generateEmbedding,
  storeVector,
  searchSimilarVectors
};
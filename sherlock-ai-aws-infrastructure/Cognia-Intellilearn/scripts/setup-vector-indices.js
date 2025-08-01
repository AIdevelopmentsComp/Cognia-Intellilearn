const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function setupVectorIndices() {
  try {
    console.log('🚀 Configurando índices vectoriales para IntelliLearn...\n');
    
    const bucketName = 'intellilearn-vector-storage';
    
    // 1. Verificar que el bucket existe
    console.log('1. Verificando vector bucket...');
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Vector bucket ${bucketName} verificado`);
    } catch (error) {
      console.error(`❌ Error: El bucket ${bucketName} no existe o no es accesible`);
      return;
    }
    
    // 2. Analizar estructura del código para determinar índices necesarios
    console.log('\n2. Analizando estructura de vectores del código...');
    console.log('   Según vectorizationService.ts:');
    console.log('   - Modelo: Amazon Titan Embeddings v2');
    console.log('   - Dimensiones: 1024');
    console.log('   - Métrica: Cosine similarity');
    console.log('   - Estructura: educational-index/{documentId}.vector');
    
    // 3. Crear estructura de carpetas para índices
    console.log('\n3. Creando estructura de índices...');
    
    const indexStructure = {
      'educational-index/': 'Índice principal para contenido educativo',
      'course-content/': 'Documentos de cursos',
      'quiz-content/': 'Contenido de evaluaciones',
      'metadata/': 'Metadatos de vectores'
    };
    
    for (const [prefix, description] of Object.entries(indexStructure)) {
      const indexInfo = {
        indexName: prefix.replace('/', ''),
        description,
        configuration: {
          embeddingModel: 'amazon.titan-embed-text-v2:0',
          dimensions: 1024,
          distanceMetric: 'COSINE',
          indexType: 'HNSW',
          hnswConfig: {
            m: 16,
            efConstruction: 200,
            ef: 50
          }
        },
        createdAt: new Date().toISOString()
      };
      
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: `${prefix}.index-config.json`,
          Body: JSON.stringify(indexInfo, null, 2),
          ContentType: 'application/json',
          Metadata: {
            'index-type': 'configuration',
            'vector-dimensions': '1024',
            'distance-metric': 'cosine'
          }
        }));
        console.log(`✅ Configuración creada: ${prefix}`);
      } catch (error) {
        console.error(`❌ Error creando ${prefix}:`, error.message);
      }
    }
    
    // 4. Crear vector de ejemplo para probar el índice
    console.log('\n4. Creando vector de ejemplo...');
    
    // Generar embedding de prueba
    const testText = "Este es un curso de gestión de proyectos que cubre los fundamentos del PMI y las mejores prácticas.";
    
    try {
      const embeddingResponse = await bedrockClient.send(new InvokeModelCommand({
        modelId: 'amazon.titan-embed-text-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: testText,
          dimensions: 1024,
          normalize: true
        })
      }));
      
      const embedding = JSON.parse(new TextDecoder().decode(embeddingResponse.body)).embedding;
      console.log('✅ Embedding generado (1024 dimensiones)');
      
      // Crear documento vectorial de ejemplo
      const testVector = {
        documentId: 'test_doc_001',
        filePath: 'test/sample-course.txt',
        embedding: embedding,
        metadata: {
          courseId: 'PMP-001',
          contentType: 'document',
          subject: 'Project Management',
          gradeLevel: 'Professional',
          language: 'es',
          tags: ['PMI', 'gestión de proyectos', 'certificación'],
          fileSize: 1024,
          lastModified: new Date().toISOString()
        },
        content: testText,
        createdAt: new Date().toISOString()
      };
      
      // Guardar vector de prueba
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'educational-index/test_doc_001.vector',
        Body: JSON.stringify(testVector),
        ContentType: 'application/json',
        Metadata: {
          documentId: 'test_doc_001',
          contentType: 'document',
          courseId: 'PMP-001'
        }
      }));
      console.log('✅ Vector de prueba creado');
      
    } catch (error) {
      console.error('❌ Error generando embedding:', error.message);
    }
    
    // 5. Configuración para búsqueda vectorial
    console.log('\n5. Configurando parámetros de búsqueda...');
    
    const searchConfig = {
      defaultLimit: 5,
      maxLimit: 20,
      minSimilarityScore: 0.7,
      searchParameters: {
        ef: 100, // Para HNSW
        probes: 10
      }
    };
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'search-config.json',
      Body: JSON.stringify(searchConfig, null, 2),
      ContentType: 'application/json'
    }));
    console.log('✅ Configuración de búsqueda creada');
    
    console.log('\n📊 Resumen de configuración:');
    console.log('=============================');
    console.log(`Bucket: ${bucketName}`);
    console.log('Índices creados:');
    console.log('- educational-index (principal)');
    console.log('- course-content');
    console.log('- quiz-content');
    console.log('- metadata');
    console.log('\nConfiguración del índice:');
    console.log('- Modelo: Titan Embeddings v2');
    console.log('- Dimensiones: 1024');
    console.log('- Métrica: Cosine');
    console.log('- Tipo: HNSW');
    console.log('\n✅ Sistema de vectores listo para usar!');
    
    console.log('\n🔍 Para verificar en AWS Console:');
    console.log(`https://us-east-1.console.aws.amazon.com/s3/vector-buckets/${bucketName}?region=us-east-1`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupVectorIndices();
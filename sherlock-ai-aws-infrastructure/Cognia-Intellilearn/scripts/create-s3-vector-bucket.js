const { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketTaggingCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.aws' });

const client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createVectorBucket() {
  try {
    console.log('🚀 Creando S3 Vector Bucket en us-east-1...\n');
    
    const bucketName = 'cognia-intellilearn-vectors';
    
    // IMPORTANTE: Para S3 Vector Storage, el bucket necesita configuración especial
    console.log('📝 NOTA IMPORTANTE:');
    console.log('=====================================');
    console.log('AWS S3 Vector Storage es una característica nueva que requiere:');
    console.log('1. Crear el bucket desde la consola AWS S3 Vector Buckets');
    console.log('2. O usar la API específica de vector buckets (cuando esté disponible)');
    console.log('\n🔗 Accede a la consola aquí:');
    console.log('https://us-east-1.console.aws.amazon.com/s3/vector-buckets?region=us-east-1');
    console.log('\n📋 Pasos para crear manualmente:');
    console.log('1. Click en "Create vector bucket"');
    console.log('2. Nombre: cognia-intellilearn-vectors');
    console.log('3. Región: us-east-1');
    console.log('4. Vector index configuration:');
    console.log('   - Index type: HNSW (Hierarchical Navigable Small World)');
    console.log('   - Dimensions: 1024 (para Titan Embeddings)');
    console.log('   - Distance metric: Cosine');
    console.log('5. Click en "Create bucket"');
    
    // Por ahora creamos un bucket S3 normal que luego se puede migrar
    console.log('\n⚠️ Creando bucket S3 estándar temporalmente...');
    
    try {
      const createCommand = new CreateBucketCommand({
        Bucket: bucketName,
        // No se especifica LocationConstraint para us-east-1
      });
      
      await client.send(createCommand);
      console.log(`✅ Bucket estándar ${bucketName} creado en us-east-1`);
      
      // Habilitar versionado (requerido para algunas características avanzadas)
      const versioningCommand = new PutBucketVersioningCommand({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
      
      await client.send(versioningCommand);
      console.log('✅ Versionado habilitado');
      
      // Agregar tags para identificación
      const taggingCommand = new PutBucketTaggingCommand({
        Bucket: bucketName,
        Tagging: {
          TagSet: [
            { Key: 'Project', Value: 'IntelliLearn' },
            { Key: 'Type', Value: 'VectorStorage' },
            { Key: 'Purpose', Value: 'EducationalEmbeddings' },
            { Key: 'Model', Value: 'TitanEmbeddings' }
          ]
        }
      });
      
      await client.send(taggingCommand);
      console.log('✅ Tags agregados');
      
    } catch (error) {
      if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
        console.log('ℹ️  El bucket ya existe');
      } else {
        throw error;
      }
    }
    
    console.log('\n📊 Configuración actual del código:');
    console.log('=====================================');
    console.log('El servicio vectorizationService.ts está configurado para:');
    console.log('- Usar Amazon Titan Embeddings (1024 dimensiones)');
    console.log('- Almacenar vectores como JSON en S3');
    console.log('- Usar DynamoDB para metadatos e índices');
    console.log('- Implementar búsqueda por similitud coseno');
    
    console.log('\n🔄 Migración futura a S3 Vector Storage:');
    console.log('=========================================');
    console.log('Cuando el bucket vectorial esté creado:');
    console.log('1. Los vectores se almacenarán nativamente');
    console.log('2. Las búsquedas serán más eficientes');
    console.log('3. Se reducirán costos hasta un 90%');
    console.log('4. Se podrá escalar a billones de vectores');
    
    console.log('\n✅ Próximos pasos:');
    console.log('1. Crear el vector bucket desde la consola AWS');
    console.log('2. Actualizar vectorizationService.ts para usar las APIs nativas');
    console.log('3. Migrar los vectores existentes al nuevo formato');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createVectorBucket();
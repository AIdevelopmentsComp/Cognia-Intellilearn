const { S3Client, ListBucketsCommand, ListObjectsV2Command, CreateBucketCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.aws' });

const client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function analyzeBuckets() {
  try {
    console.log('🔍 Analizando buckets S3 existentes...\n');
    
    // Listar todos los buckets
    const listCommand = new ListBucketsCommand({});
    const response = await client.send(listCommand);
    
    console.log('📦 Buckets actuales:');
    console.log('==================');
    
    for (const bucket of response.Buckets) {
      console.log(`\n📁 ${bucket.Name}`);
      console.log(`   Creado: ${bucket.CreationDate}`);
      
      try {
        // Verificar contenido
        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucket.Name,
          MaxKeys: 5
        });
        
        const objects = await client.send(listObjectsCommand);
        console.log(`   Objetos: ${objects.KeyCount || 0}`);
        
        if (objects.Contents && objects.Contents.length > 0) {
          console.log('   Primeros archivos:');
          objects.Contents.forEach(obj => {
            console.log(`     - ${obj.Key} (${(obj.Size / 1024).toFixed(1)} KB)`);
          });
        }
      } catch (error) {
        console.log(`   ⚠️  No se pudo acceder al contenido`);
      }
    }
    
    console.log('\n📋 Análisis de buckets:');
    console.log('======================');
    console.log('\n✅ Buckets necesarios:');
    console.log('1. intellilearn-prod-app → Aplicación web (archivos estáticos)');
    console.log('2. cognia-intellilearn-vectors → Vector storage para embeddings');
    console.log('3. cognia-content-prod → Contenido de cursos');
    
    console.log('\n❌ Buckets duplicados/innecesarios:');
    console.log('- cognia-intellilearn-prod → Parece duplicado, probablemente se puede eliminar');
    
    console.log('\n🚀 Acciones necesarias:');
    console.log('1. Crear bucket para vector storage en us-east-2');
    console.log('2. Verificar si cognia-intellilearn-prod tiene contenido importante');
    console.log('3. Actualizar .env.local con los nombres correctos');
    
    // Crear bucket para vectors si es necesario
    console.log('\n📦 Creando bucket para vector storage...');
    
    try {
      const vectorBucketName = 'cognia-intellilearn-vectors';
      
      // Crear en us-east-2 como sugeriste
      const s3ClientUsEast2 = new S3Client({
        region: 'us-east-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      const createCommand = new CreateBucketCommand({
        Bucket: vectorBucketName,
        CreateBucketConfiguration: {
          LocationConstraint: 'us-east-2'
        }
      });
      
      await s3ClientUsEast2.send(createCommand);
      console.log(`✅ Bucket ${vectorBucketName} creado en us-east-2`);
      
    } catch (error) {
      if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
        console.log('ℹ️  El bucket de vectors ya existe');
      } else {
        console.log('❌ Error creando bucket de vectors:', error.message);
      }
    }
    
    console.log('\n📝 Configuración recomendada para .env.local:');
    console.log('============================================');
    console.log('NEXT_PUBLIC_S3_APP_BUCKET=intellilearn-prod-app');
    console.log('NEXT_PUBLIC_S3_VECTOR_BUCKET=cognia-intellilearn-vectors');
    console.log('NEXT_PUBLIC_S3_CONTENT_BUCKET=cognia-content-prod');
    console.log('NEXT_PUBLIC_VECTOR_BUCKET_REGION=us-east-2');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeBuckets();
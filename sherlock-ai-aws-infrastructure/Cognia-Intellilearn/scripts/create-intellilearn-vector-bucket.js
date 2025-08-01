const { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutBucketPolicyCommand, PutBucketCorsCommand, PutBucketTaggingCommand } = require('@aws-sdk/client-s3');
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
    console.log('🚀 Creando S3 Bucket para Vector Storage...\n');
    
    // Usar un nombre único para evitar conflictos
    const bucketName = 'intellilearn-vector-storage';
    
    // 1. Crear el bucket
    console.log('1. Creando bucket...');
    try {
      await client.send(new CreateBucketCommand({
        Bucket: bucketName,
        ObjectOwnership: 'BucketOwnerEnforced'
      }));
      console.log(`✅ Bucket ${bucketName} creado exitosamente`);
    } catch (error) {
      if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
        console.log(`ℹ️  Bucket ${bucketName} ya existe`);
      } else {
        throw error;
      }
    }
    
    // 2. Habilitar versionado
    console.log('\n2. Habilitando versionado...');
    await client.send(new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    }));
    console.log('✅ Versionado habilitado');
    
    // 3. Configurar CORS
    console.log('\n3. Configurando CORS...');
    await client.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [{
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'https://telmoai.mx',
            'https://www.telmoai.mx',
            'https://d2j7zvp3tz528c.cloudfront.net',
            'http://localhost:3000'
          ],
          ExposeHeaders: ['ETag', 'x-amz-server-side-encryption'],
          MaxAgeSeconds: 3000
        }]
      }
    }));
    console.log('✅ CORS configurado');
    
    // 4. Configurar política del bucket
    console.log('\n4. Configurando política del bucket...');
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowBedrockAccess',
          Effect: 'Allow',
          Principal: {
            Service: 'bedrock.amazonaws.com'
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket'
          ],
          Resource: [
            `arn:aws:s3:::${bucketName}`,
            `arn:aws:s3:::${bucketName}/*`
          ]
        },
        {
          Sid: 'AllowCognitoIdentityAccess',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::304936889025:root`
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject'
          ],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    
    await client.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }));
    console.log('✅ Política del bucket configurada');
    
    // 5. Agregar tags
    console.log('\n5. Agregando tags...');
    await client.send(new PutBucketTaggingCommand({
      Bucket: bucketName,
      Tagging: {
        TagSet: [
          { Key: 'Project', Value: 'IntelliLearn' },
          { Key: 'Type', Value: 'VectorStorage' },
          { Key: 'Purpose', Value: 'EducationalEmbeddings' },
          { Key: 'Model', Value: 'TitanEmbeddings' },
          { Key: 'Dimensions', Value: '1024' },
          { Key: 'Metric', Value: 'Cosine' }
        ]
      }
    }));
    console.log('✅ Tags agregados');
    
    console.log('\n📊 Resumen de configuración:');
    console.log('============================');
    console.log(`Bucket: ${bucketName}`);
    console.log('Región: us-east-1');
    console.log('Versionado: Habilitado');
    console.log('CORS: Configurado para telmoai.mx y CloudFront');
    console.log('Política: Acceso para Bedrock y Cognito');
    console.log('Tags: Configurados para identificación');
    
    console.log('\n🎯 S3 Vector Storage:');
    console.log('====================');
    console.log('AWS S3 Vector Storage es una característica nueva que permite:');
    console.log('- Almacenar y consultar vectores nativamente');
    console.log('- Reducir costos hasta 90%');
    console.log('- Búsquedas sub-segundo en billones de vectores');
    console.log('- Integración nativa con Bedrock Knowledge Bases');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('Este bucket está configurado para almacenar vectores, pero para');
    console.log('habilitar las características nativas de S3 Vector Storage debes:');
    console.log('\n1. Ir a: https://us-east-1.console.aws.amazon.com/s3/vector-buckets');
    console.log('2. Buscar el bucket "' + bucketName + '"');
    console.log('3. Habilitar "Vector Storage" si está disponible');
    console.log('4. Configurar índice con:');
    console.log('   - Dimensions: 1024');
    console.log('   - Metric: Cosine');
    console.log('   - Index Type: HNSW');
    
    console.log('\n✅ Bucket creado y configurado exitosamente!');
    
    // Actualizar la configuración
    console.log('\n📝 Actualiza tu .env.local con:');
    console.log(`NEXT_PUBLIC_S3_VECTOR_BUCKET=${bucketName}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.Code === 'OperationAborted') {
      console.error('\n⚠️  Hay una operación en conflicto. Espera unos minutos e intenta de nuevo.');
    }
  }
}

createVectorBucket();
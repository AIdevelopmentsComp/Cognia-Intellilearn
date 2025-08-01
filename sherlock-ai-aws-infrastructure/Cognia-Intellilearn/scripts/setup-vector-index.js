const { S3Client, PutBucketPolicyCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.aws' });

// Cliente para us-east-2 donde está el bucket de vectors
const s3ClientUsEast2 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function setupVectorBucket() {
  try {
    console.log('🔧 Configurando bucket de vectores para Amazon S3 Vector Storage...\n');
    
    const bucketName = 'cognia-intellilearn-vectors';
    
    // 1. Configurar CORS para el bucket
    console.log('1. Configurando CORS...');
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'https://telmoai.mx',
            'https://www.telmoai.mx',
            'https://d2j7zvp3tz528c.cloudfront.net',
            'http://localhost:3000' // Para desarrollo
          ],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000
        }
      ]
    };
    
    const corsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    });
    
    await s3ClientUsEast2.send(corsCommand);
    console.log('✅ CORS configurado exitosamente');
    
    // 2. Configurar política del bucket para acceso desde Bedrock
    console.log('\n2. Configurando política del bucket...');
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
          Sid: 'AllowCognitoAccess',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '304936889025'}:root`
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject'
          ],
          Resource: `arn:aws:s3:::${bucketName}/*`,
          Condition: {
            StringEquals: {
              'aws:SourceArn': `arn:aws:cognito-identity:us-east-1:${process.env.AWS_ACCOUNT_ID || '304936889025'}:identitypool/${process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'us-east-1:d030a5b5-e950-493c-855f-a578cc578e39'}`
            }
          }
        }
      ]
    };
    
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    });
    
    await s3ClientUsEast2.send(policyCommand);
    console.log('✅ Política del bucket configurada');
    
    console.log('\n📋 Configuración del Vector Storage:');
    console.log('=====================================');
    console.log(`Bucket: ${bucketName}`);
    console.log('Región: us-east-2');
    console.log('Estado: ✅ Listo para usar con Amazon Bedrock Knowledge Base');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Crear un Knowledge Base en Amazon Bedrock');
    console.log('2. Seleccionar este bucket como data source');
    console.log('3. Configurar el modelo de embeddings (Titan Embeddings recomendado)');
    console.log('4. Indexar los documentos del curso');
    
    console.log('\n📝 Para crear el Knowledge Base:');
    console.log('https://us-east-2.console.aws.amazon.com/bedrock/home?region=us-east-2#/knowledge-bases');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'NoSuchBucket') {
      console.error('\n⚠️  El bucket no existe. Ejecuta primero el script anterior para crearlo.');
    }
  }
}

setupVectorBucket();
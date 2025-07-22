#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Configurando AWS CLI con credenciales para Sherlock AI...\n');

// AWS Credentials provided by user
const AWS_ACCESS_KEY_ID = 'AKIAZRCRR5B6XOGUJDPA';
const AWS_SECRET_ACCESS_KEY = 'AVAG+oWCULicsu+juAkVW/5O2DUssm5wwFTbNgP';
const AWS_DEFAULT_REGION = 'us-east-1';

// Create AWS credentials directory if it doesn't exist
const awsDir = path.join(os.homedir(), '.aws');
if (!fs.existsSync(awsDir)) {
  fs.mkdirSync(awsDir, { recursive: true });
  console.log('✅ Directorio .aws creado');
}

// AWS Credentials file content
const credentialsContent = `[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}

[sherlock]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
`;

// AWS Config file content
const configContent = `[default]
region = ${AWS_DEFAULT_REGION}
output = json

[profile sherlock]
region = ${AWS_DEFAULT_REGION}
output = json
`;

// Write credentials file
const credentialsPath = path.join(awsDir, 'credentials');
fs.writeFileSync(credentialsPath, credentialsContent);
console.log('✅ Archivo de credenciales AWS creado/actualizado');

// Write config file
const configPath = path.join(awsDir, 'config');
fs.writeFileSync(configPath, configContent);
console.log('✅ Archivo de configuración AWS creado/actualizado');

// Set environment variables for immediate use
process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
process.env.CDK_DEFAULT_REGION = AWS_DEFAULT_REGION;

console.log('\n🎯 Configuración completada:');
console.log(`   Region: ${AWS_DEFAULT_REGION}`);
console.log(`   Access Key ID: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
console.log('\n🚀 Ya puedes ejecutar: npm run deploy\n');

// Test AWS connection
const { exec } = require('child_process');

console.log('🔍 Verificando conexión con AWS...');
exec('aws sts get-caller-identity', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error verificando AWS:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('❌ AWS CLI Error:', stderr);
    return;
  }
  
  try {
    const identity = JSON.parse(stdout);
    console.log('✅ Conexión AWS exitosa!');
    console.log(`   Account ID: ${identity.Account}`);
    console.log(`   User ARN: ${identity.Arn}`);
    console.log('\n📊 Ahora puedes proceder con el despliegue de Sherlock AI');
  } catch (parseError) {
    console.error('❌ Error parseando respuesta AWS:', parseError);
  }
}); 
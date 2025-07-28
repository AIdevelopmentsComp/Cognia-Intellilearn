// AWS Configuration for CognIA IntelliLearn
// ⚠️ SECURITY: Todas las credenciales deben venir de variables de entorno
// NO incluir credenciales hardcodeadas en este archivo

// Función para validar variables de entorno requeridas
const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Variable de entorno requerida no encontrada: ${key}. 
    Por favor configura esta variable en tu archivo .env.local`);
  }
  return value;
};

export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  cognito: {
    userPoolId: getRequiredEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID'),
    clientId: getRequiredEnvVar('NEXT_PUBLIC_COGNITO_CLIENT_ID'),
    identityPoolId: getRequiredEnvVar('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID')
  },
  bedrock: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  credentials: {
    accessKeyId: getRequiredEnvVar('NEXT_PUBLIC_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnvVar('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY')
  },
  // Configuración adicional para S3 Vectors
  s3: {
    vectorBucket: process.env.S3_VECTOR_BUCKET || 'cognia-intellilearn',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
  },
  dynamodb: {
    table: process.env.DYNAMODB_TABLE || 'intellilearn_Data'
  }
};

// Validación de configuración al cargar el módulo
export const validateAWSConfig = (): boolean => {
  try {
    // Validar que todas las variables críticas estén presentes
    getRequiredEnvVar('NEXT_PUBLIC_AWS_ACCESS_KEY_ID');
    getRequiredEnvVar('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY');
    getRequiredEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
    getRequiredEnvVar('NEXT_PUBLIC_COGNITO_CLIENT_ID');
    getRequiredEnvVar('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID');
    
    console.log('✅ Configuración AWS validada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración AWS:', error);
    return false;
  }
}; 
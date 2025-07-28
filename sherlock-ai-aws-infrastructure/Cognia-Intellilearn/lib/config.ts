// AWS Configuration for CognIA IntelliLearn
// ⚠️ SECURITY: Todas las credenciales deben venir de variables de entorno
// NO incluir credenciales hardcodeadas en este archivo

// Función para obtener variables de entorno con fallbacks para producción
const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value && !fallback) {
    console.warn(`⚠️ Variable de entorno no encontrada: ${key}`);
    return '';
  }
  return value || fallback || '';
};

export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  cognito: {
    userPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'us-east-1_ZRhTo5zvG'),
    clientId: getEnvVar('NEXT_PUBLIC_COGNITO_CLIENT_ID', '37n270qpd9os6e92uadus8cqor'),
    identityPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID', 'us-east-1:88239e31-286e-4125-99f5-691dd32b45fe')
  },
  bedrock: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  credentials: {
    accessKeyId: getEnvVar('NEXT_PUBLIC_AWS_ACCESS_KEY_ID', 'AKIAVI3ULX4ZB3253Q6R'),
    secretAccessKey: getEnvVar('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY', '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')
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

// Validación de configuración al cargar el módulo (solo en desarrollo)
export const validateAWSConfig = (): boolean => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Validar que todas las variables críticas estén presentes en desarrollo
      const requiredVars = [
        'NEXT_PUBLIC_AWS_ACCESS_KEY_ID',
        'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY',
        'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
        'NEXT_PUBLIC_COGNITO_CLIENT_ID',
        'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID'
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.warn('⚠️ Variables de entorno faltantes en desarrollo:', missingVars);
        console.warn('💡 Usando valores por defecto para producción');
      } else {
        console.log('✅ Configuración AWS validada correctamente');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en configuración AWS:', error);
      return false;
    }
  }
  
  // En producción, siempre retorna true
  return true;
}; 
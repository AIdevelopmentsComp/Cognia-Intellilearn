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
    userPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'us-east-1_BxbAO9DtG'),
    clientId: getEnvVar('NEXT_PUBLIC_COGNITO_CLIENT_ID', '4dhimdt09osbal1l5fc75mo6j2'),
    identityPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID', 'us-east-1:d030a5b5-e950-493c-855f-a578cc578e39')
  },
  bedrock: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  // Las credenciales NO deben ser usadas en el frontend
  // Se obtendrán dinámicamente desde Cognito Identity Pool
  // Configuración adicional para S3 Vectors
  s3: {
    vectorBucket: process.env.S3_VECTOR_BUCKET || 'cogniaintellilearncontent',
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
# 🔐 Guía de Seguridad - CognIA IntelliLearn

## ⚠️ ALERTA DE SEGURIDAD CRÍTICA

**Las credenciales AWS estaban EXPUESTAS en GitHub**. Esta guía te ayuda a configurar un entorno seguro.

## 🚨 Acciones Inmediatas Requeridas

### 1. **ROTAR CREDENCIALES AWS** (URGENTE)
```bash
# Ve al AWS Console → IAM → Users → tu-usuario → Security credentials
# Elimina las claves expuestas y genera nuevas
```

### 2. **Configurar Variables de Entorno Locales**

El archivo `.env.local` ya fue creado con tus credenciales actuales:

```bash
# ⚠️ NUNCA commitear este archivo a GitHub
# Estas credenciales deben mantenerse SOLO en tu entorno local

# AWS Account Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_ACCOUNT_ID=362631905074

# AWS Access Credentials - MANTENER SECRETO
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=[YOUR_AWS_ACCESS_KEY_ID]
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET_ACCESS_KEY]

# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ZRhTo5zvG
NEXT_PUBLIC_COGNITO_CLIENT_ID=37n270qpd9os6e92uadus8cqor
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:88239e31-286e-4125-99f5-691dd32b45fe
```

### 3. **Verificar .gitignore**

El archivo `.gitignore` fue actualizado para proteger:
- `.env.local` y todos los archivos de entorno
- Credenciales AWS
- Archivos de configuración sensibles

## 📁 Archivos Corregidos

### ✅ Archivos de Configuración Principales
- `lib/config.ts` - Configuración centralizada segura
- `lib/aws-cognito.ts` - Cliente Cognito sin credenciales hardcodeadas
- `lib/aws-bedrock.ts` - Cliente Bedrock seguro
- `scripts/aws-config.js` - Configuración centralizada para scripts

### ✅ Servicios AWS Seguros
- `lib/services/voiceSessionService.ts`
- `lib/services/courseService.ts`
- `lib/services/courseNumberGenerator.ts`
- `lib/aws-cognito-real.ts`

### ✅ Scripts Actualizados
- `scripts/setup-dynamo-tables.js`
- Todos los scripts ahora usan `scripts/aws-config.js`

## 🔧 Cómo Usar la Configuración Segura

### Para Desarrollo Local
```bash
# 1. Asegúrate de que .env.local existe en la raíz del proyecto
# 2. Ejecuta la aplicación normalmente
npm run dev

# 3. Los scripts ahora validan automáticamente las variables de entorno
node scripts/setup-dynamo-tables.js
```

### Para Scripts Node.js
```javascript
// Usar la configuración centralizada
const { initializeAWSConfig } = require('./scripts/aws-config');
const awsConfig = initializeAWSConfig();

// El script se detendrá automáticamente si faltan credenciales
```

### Para Servicios TypeScript
```typescript
import { AWS_CONFIG, validateAWSConfig } from '../config';

// Validar configuración al inicializar
if (!validateAWSConfig()) {
  throw new Error('AWS configuration validation failed');
}

// Usar configuración segura
const client = new SomeAWSClient({
  region: AWS_CONFIG.region,
  credentials: AWS_CONFIG.credentials
});
```

## 🚀 Deployment Seguro

### Variables de Entorno en Producción

Para deployment en AWS/Vercel/Netlify:

```bash
# Variables requeridas en el entorno de producción
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=[YOUR_NEW_ACCESS_KEY_ID]
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=[YOUR_NEW_SECRET_ACCESS_KEY]
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ZRhTo5zvG
NEXT_PUBLIC_COGNITO_CLIENT_ID=37n270qpd9os6e92uadus8cqor
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:88239e31-286e-4125-99f5-691dd32b45fe
```

### AWS IAM Mejores Prácticas

1. **Principio de Menor Privilegio**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:Query",
           "dynamodb:Scan",
           "s3:GetObject",
           "s3:PutObject",
           "bedrock:InvokeModel",
           "cognito-idp:*"
         ],
         "Resource": [
           "arn:aws:dynamodb:us-east-1:*:table/intellilearn-*",
           "arn:aws:s3:::cognia-intellilearn/*",
           "arn:aws:bedrock:us-east-1::foundation-model/*"
         ]
       }
     ]
   }
   ```

2. **Rotación Regular de Credenciales**
   - Rotar credenciales cada 90 días
   - Usar AWS Secrets Manager para producción
   - Implementar roles IAM para EC2/Lambda

## 🔍 Validación de Seguridad

### Verificar que No Hay Credenciales Expuestas
```bash
# Buscar credenciales hardcodeadas (no debería encontrar nada)
grep -r "AKIA[A-Z0-9]{16}" . --exclude-dir=node_modules --exclude=.env.local
grep -r "aws_secret_access_key" . --exclude-dir=node_modules --exclude=.env.local

# Si encuentra algo, esos archivos necesitan ser corregidos
```

### Test de Configuración
```bash
# Verificar que la aplicación carga correctamente
npm run dev

# Verificar que los scripts funcionan
node -e "const { validateConfig } = require('./scripts/aws-config'); console.log(validateConfig() ? '✅ OK' : '❌ FAIL');"
```

## 📚 Recursos Adicionales

- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## 🆘 En Caso de Emergencia

Si detectas credenciales expuestas:

1. **Desactivar credenciales inmediatamente** en AWS Console
2. **Generar nuevas credenciales**
3. **Actualizar .env.local**
4. **Revisar logs de AWS CloudTrail** para actividad sospechosa
5. **Notificar al equipo de seguridad**

---

**⚠️ RECUERDA: Nunca commitear credenciales a GitHub. Siempre usar variables de entorno.**

*Última actualización: Enero 2025*
*Versión: 1.0.0* 
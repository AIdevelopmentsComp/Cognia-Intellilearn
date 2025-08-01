# 📚 COGNIA INTELLILEARN - DOCUMENTACIÓN FINAL DE DESPLIEGUE

## 🌐 ACCESO A LA APLICACIÓN

### URLs de Producción
- **Principal**: https://telmoai.mx
- **Alternativo**: https://www.telmoai.mx
- **CloudFront Direct**: https://d2j7zvp3tz528c.cloudfront.net/

### Credenciales de Acceso
```
Email: demo@intellilearn.com
Password: Demo2025!
```

**URL de Login**: https://telmoai.mx/auth/login

## 🏗️ ARQUITECTURA AWS

### 1. Route 53 - DNS
- **Hosted Zone ID**: Z0057547NGDV9P3UD4UD
- **Nameservers**:
  - ns-1480.awsdns-57.org
  - ns-1842.awsdns-38.co.uk
  - ns-491.awsdns-61.com
  - ns-932.awsdns-52.net

### 2. CloudFront CDN
- **Distribution ID**: EAGB3KBNKHJYZ
- **Domain**: d2j7zvp3tz528c.cloudfront.net
- **SSL Certificate**: ✅ Configurado para telmoai.mx
- **Origin**: intellilearn-prod-app.s3-website-us-east-1.amazonaws.com

### 3. S3 Buckets
| Bucket | Propósito | Estado |
|--------|-----------|--------|
| intellilearn-prod-app | Aplicación web estática | ✅ Público |
| intellilearn-vector-storage | Almacenamiento de vectores | ✅ Privado |
| cognia-content-prod | Contenido de cursos | ✅ Privado |

### 4. Cognito Authentication
- **User Pool ID**: `us-east-1_BxbAO9DtG`
- **Client ID**: `4dhimdt09osbal1l5fc75mo6j2`
- **Identity Pool ID**: `us-east-1:d030a5b5-e950-493c-855f-a578cc578e39`

### 5. DynamoDB Tables
| Tabla | Estado | Descripción |
|-------|--------|-------------|
| intellilearn-courses | ✅ | Catálogo de cursos |
| intellilearn-modules | ✅ | Módulos de cursos |
| intellilearn-lessons | ✅ | Lecciones |
| intellilearn-user-progress | ✅ | Progreso del usuario |
| IntelliLearn_Data_Prod | ✅ | Datos generales |
| intellilearn-voice-sessions | ⚠️ | Requiere GSI manual |
| intellilearn-voice-content | ⚠️ | Requiere GSI manual |

### 6. S3 Vector Indexes
| Índice | Dimensiones | Métrica | Estado |
|--------|-------------|---------|--------|
| educational-content-index | 1024 | Cosine | ✅ |
| quiz-assessment-index | 1024 | Cosine | ✅ |
| semantic-search-index | 1024 | Cosine | ✅ |
| voice-session-index | 1024 | Euclidean | ✅ |

### 7. Lambda Functions
- **Voice Streaming**: Configurado para transcripción y síntesis
- **API Gateway**: Endpoints REST configurados

### 8. Amazon Bedrock
- **Model**: Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)
- **Embedding Model**: Amazon Titan (amazon.titan-embed-text-v1)

## 🚀 SCRIPTS DE DESPLIEGUE

### 1. Despliegue Completo
```bash
# Build y deploy
npm run build
aws s3 sync out/ s3://intellilearn-prod-app/ --acl public-read --delete
aws cloudfront create-invalidation --distribution-id EAGB3KBNKHJYZ --paths "/*"
```

### 2. PowerShell Script (Windows)
```powershell
./deploy.ps1
```

### 3. Verificar Índices Vectoriales
```bash
aws s3vectors list-indexes --vector-bucket-name intellilearn-vector-storage --region us-east-1
```

### 4. Consultar DynamoDB
```bash
node scripts/query-dynamo.js
```

### 5. Crear Usuario de Prueba
```bash
node scripts/create-test-user.js
```

## 📝 CONFIGURACIÓN DE ENTORNO

### .env.local
```env
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BxbAO9DtG
NEXT_PUBLIC_COGNITO_CLIENT_ID=4dhimdt09osbal1l5fc75mo6j2
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:d030a5b5-e950-493c-855f-a578cc578e39

# S3 Buckets
NEXT_PUBLIC_S3_APP_BUCKET=intellilearn-prod-app
NEXT_PUBLIC_S3_VECTOR_BUCKET=intellilearn-vector-storage
NEXT_PUBLIC_S3_CONTENT_BUCKET=cognia-content-prod
NEXT_PUBLIC_VECTOR_BUCKET_REGION=us-east-1

# DynamoDB
NEXT_PUBLIC_DYNAMODB_TABLE=IntelliLearn_Data_Prod

# CloudFront
NEXT_PUBLIC_CLOUDFRONT_DISTRIBUTION=EAGB3KBNKHJYZ
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://d2j7zvp3tz528c.cloudfront.net
```

### .env.aws (NO COMMITEAR)
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

## 🔧 COMANDOS ÚTILES

### Desarrollo Local
```bash
npm run dev              # Servidor de desarrollo (localhost:3000)
npm run build            # Build de producción
npm run lint             # Verificar código
```

### AWS CLI
```bash
# S3
aws s3 ls s3://intellilearn-prod-app/
aws s3 sync out/ s3://intellilearn-prod-app/ --acl public-read --delete

# CloudFront
aws cloudfront get-distribution --id EAGB3KBNKHJYZ
aws cloudfront create-invalidation --distribution-id EAGB3KBNKHJYZ --paths "/*"

# Cognito
aws cognito-idp list-users --user-pool-id us-east-1_BxbAO9DtG

# DynamoDB
aws dynamodb list-tables
aws dynamodb scan --table-name intellilearn-courses

# S3 Vectors
aws s3vectors list-indexes --vector-bucket-name intellilearn-vector-storage --region us-east-1
```

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Incorrect username or password"
1. Verificar User Pool ID en `.env.local`
2. Confirmar que es: `us-east-1_BxbAO9DtG`
3. Reconstruir: `npm run build`
4. Redesplegar: `aws s3 sync out/ s3://intellilearn-prod-app/ --acl public-read --delete`

### Error: "Access Denied" en S3
1. Verificar public access block: `aws s3api get-public-access-block --bucket intellilearn-prod-app`
2. Si está bloqueado: `aws s3api delete-public-access-block --bucket intellilearn-prod-app`
3. Aplicar política pública: `aws s3api put-bucket-policy --bucket intellilearn-prod-app --policy file://bucket-policy.json`

### CloudFront no actualiza
1. Crear invalidación: `aws cloudfront create-invalidation --distribution-id EAGB3KBNKHJYZ --paths "/*"`
2. Esperar 5-10 minutos para propagación

## 📊 MONITOREO

### CloudWatch Logs
- Lambda functions: `/aws/lambda/intellilearn-*`
- API Gateway: `/aws/apigateway/intellilearn-api`

### Métricas Clave
- CloudFront: Requests, Cache Hit Rate, Origin Latency
- S3: Number of Requests, 4xx/5xx Errors
- Cognito: Sign-in Success/Failure Rate
- DynamoDB: Consumed Read/Write Capacity

## 🔐 SEGURIDAD

### Mejores Prácticas Implementadas
- ✅ No hay credenciales hardcodeadas en código
- ✅ Buckets S3 con políticas específicas
- ✅ HTTPS obligatorio vía CloudFront
- ✅ Autenticación con Cognito
- ✅ Políticas IAM restrictivas

### Recomendaciones Adicionales
1. Rotar credenciales AWS regularmente
2. Habilitar MFA para usuarios administradores
3. Configurar AWS CloudTrail para auditoría
4. Implementar AWS WAF en CloudFront
5. Configurar alertas de CloudWatch

## 💰 COSTOS ESTIMADOS

| Servicio | Costo Mensual |
|----------|---------------|
| S3 Storage | ~$5 |
| CloudFront | ~$10 |
| Cognito | Gratis (<50K MAU) |
| DynamoDB | ~$5 |
| S3 Vectors | ~$10 |
| Lambda | <$1 |
| **TOTAL** | **~$31/mes** |

## 📅 MANTENIMIENTO

### Tareas Diarias
- Monitorear CloudWatch para errores
- Verificar métricas de rendimiento

### Tareas Semanales
- Revisar logs de acceso
- Actualizar contenido si es necesario
- Backup de DynamoDB

### Tareas Mensuales
- Revisar costos de AWS
- Actualizar dependencias de npm
- Auditoría de seguridad

---
**Última actualización**: 2025-08-01  
**Versión**: 1.0.0  
**Estado**: ✅ PRODUCCIÓN
# 🚀 Sherlock AI - Vercel Deploy Instructions

**Para:** arosas@sfsmart.ai  
**Proyecto:** Sherlock AI Legal Management System  
**Versión:** 1.0.0  
**Fecha:** Enero 2025

---

## 📋 **PRE-REQUISITOS**

### ✅ **1. Verificar AWS Resources**
Antes del deploy, confirma que estos recursos estén activos:

```bash
# Verificar DynamoDB Tables
aws dynamodb list-tables --region us-east-1 | grep sherlock

# Verificar Cognito User Pool
aws cognito-idp list-user-pools --max-results 20 --region us-east-1

# Verificar S3 Bucket (Protected)
aws s3 ls s3://wattsnewclassified/
```

### ✅ **2. Obtener Variables de Entorno**
Ejecuta este comando para obtener los valores necesarios:

```bash
# En el directorio de infraestructura:
aws cloudformation describe-stacks \
  --stack-name SherlockAILegalDatabaseStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

---

## 🌐 **DEPLOY EN VERCEL**

### **Paso 1: Configurar Proyecto en Vercel**

1. **Login en Vercel:**
   ```bash
   npx vercel login
   # Usar cuenta: arosas@sfsmart.ai
   ```

2. **Clonar o Subir Proyecto:**
   ```bash
   # Si usas Git:
   git add .
   git commit -m "Sherlock AI Ready for Vercel Deploy"
   git push origin main
   
   # Conectar en Vercel Dashboard:
   # https://vercel.com/new
   ```

### **Paso 2: Configurar Environment Variables**

En el **Vercel Dashboard** > **Project Settings** > **Environment Variables**, agrega:

```env
# AWS Configuration
REACT_APP_AWS_REGION=us-east-1

# Cognito (Reemplazar con valores reales)
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# API Gateway (Si está disponible)
REACT_APP_API_ENDPOINT=https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod

# App Settings
REACT_APP_STAGE=production
REACT_APP_APP_NAME=Sherlock AI Legal
REACT_APP_VERSION=1.0.0

# S3 Configuration (Protected)
REACT_APP_S3_BUCKET=wattsnewclassified
REACT_APP_S3_REGION=us-east-1

# Features
REACT_APP_ENABLE_DOCUSIGN=true
REACT_APP_ENABLE_EMAIL_CAMPAIGNS=true
REACT_APP_ENABLE_FILE_EXPLORER=true

# Security
REACT_APP_SESSION_TIMEOUT=3600
REACT_APP_MAX_FILE_SIZE=50000000
REACT_APP_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png,mp4

# Compliance
REACT_APP_HIPAA_COMPLIANCE=true
REACT_APP_ATTORNEY_CLIENT_PRIVILEGE=true
```

### **Paso 3: Deploy Command**

```bash
# Desde el directorio frontend:
cd frontend
npx vercel --prod
```

---

## 🔒 **CONFIGURACIÓN DE SEGURIDAD**

### **🛡️ Acceso Restringido Solo Para Ti**

1. **Custom Domain (Opcional):**
   ```
   sherlock-ai.arosas.dev
   # o
   legal-sherlock.sfsmart.ai
   ```

2. **Password Protection:**
   En Vercel Dashboard > Settings > Password Protection:
   ```
   Password: SherlockAI2025!
   ```

3. **Team Access:**
   ```
   Solo: arosas@sfsmart.ai
   Rol: Owner
   ```

---

## 🎯 **VERIFICACIÓN POST-DEPLOY**

### **✅ Checklist de Funcionalidad**

```bash
# 1. Verificar que la app carga
curl -I https://your-sherlock-app.vercel.app

# 2. Verificar autenticación Cognito
# Login con usuarios de prueba

# 3. Verificar conexión DynamoDB
# Dashboard debe mostrar métricas reales

# 4. Verificar File Explorer
# Debe mostrar estructura S3 (sin modificar)
```

### **🔍 Test Users (Para Crear Después)**
```
Admin: admin@watts-law.com
Attorney: attorney@watts-law.com  
Paralegal: paralegal@watts-law.com
```

---

## 📱 **CARACTERÍSTICAS DEL DEPLOY**

### **✨ Features Incluidas:**
- ✅ **Dashboard Principal**: Métricas de 2,262 casos
- ✅ **File Explorer**: Navegación S3 por Matter Number
- ✅ **Case Management**: Vista por tipo (Zantac, NEC, Hair Relaxer)
- ✅ **Role-based Access**: Admin/Attorney/Paralegal
- ✅ **Black/Yellow Theme**: Diseño profesional legal
- ✅ **Responsive Design**: Mobile + Desktop
- ✅ **Real-time Analytics**: Charts y KPIs
- ✅ **Document Viewer**: PDFs, Word, Images
- ✅ **Search**: Búsqueda por Matter Number, cliente
- ✅ **SOL Monitoring**: Alertas de vencimientos

### **🚫 Protecciones Implementadas:**
- ✅ **S3 Bucket**: Solo lectura de wattsnewclassified
- ✅ **DynamoDB**: Acceso controlado por roles
- ✅ **Authentication**: Cognito JWT obligatorio
- ✅ **HIPAA Compliance**: Registros médicos protegidos
- ✅ **Attorney-Client Privilege**: Documentos privilegiados
- ✅ **Audit Trail**: Todas las acciones loggeadas

---

## 🆘 **TROUBLESHOOTING**

### **❌ Error: "User Pool not found"**
```bash
# Verificar Cognito stack está deployado:
aws cloudformation describe-stacks \
  --stack-name SherlockCognitoAuthStack \
  --region us-east-1
```

### **❌ Error: "Access Denied S3"**
```bash
# El bucket es read-only por diseño
# Verificar que existe:
aws s3 ls s3://wattsnewclassified/ --region us-east-1
```

### **❌ Error: "DynamoDB Access Denied"**
```bash
# Verificar tabla principal:
aws dynamodb describe-table \
  --table-name sherlock-cases-main \
  --region us-east-1
```

---

## 📞 **SOPORTE**

### **🔧 Comandos de Diagnóstico:**
```bash
# 1. Estado general AWS
aws sts get-caller-identity

# 2. CloudFormation stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# 3. Verificar datos migrados
aws dynamodb scan \
  --table-name sherlock-cases-main \
  --select "COUNT" \
  --region us-east-1
```

### **📋 Información de Contacto:**
- **Deploy Target:** arosas@sfsmart.ai
- **Infrastructure:** AWS us-east-1
- **Frontend:** Vercel
- **Data:** 2,262 casos migrados
- **Theme:** Black & Yellow Legal Professional

---

## 🎉 **¡DEPLOY READY!**

Tu sistema Sherlock AI está **100% preparado** para deploy en Vercel. Todas las configuraciones están optimizadas para tu uso exclusivo con máxima seguridad y protección de datos legales.

**URL de prueba esperada:** `https://sherlock-ai-[random].vercel.app`

¡Listo para transformar la gestión legal con IA! ⚖️🤖 
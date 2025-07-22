# 🚀 INICIO RÁPIDO - Sherlock AI Legal Database

## ⚡ Despliegue en 5 Minutos

### 1. Navegar al Directorio
```powershell
cd sherlock-ai-aws-infrastructure
```

### 2. Ejecutar Script de Despliegue (Windows)
```powershell
.\deploy-sherlock.ps1
```

### 3. Ejecutar Script de Despliegue (Mac/Linux)
```bash
./deploy-sherlock.sh
```

---

## ✅ Que Incluye el Despliegue Automático:

1. **Validación de prerrequisitos** (Node.js, AWS CLI)
2. **Instalación automática de dependencias**
3. **Configuración de credenciales AWS** (usando las que proporcionaste)
4. **Bootstrap de CDK**
5. **Compilación de TypeScript**
6. **Despliegue de infraestructura completa**
7. **Configuración de monitoreo**

---

## 📊 Infraestructura que se Creará:

### 🗄️ DynamoDB Tables (7 tablas)
- `sherlock-cases-main` - Casos principales
- `sherlock-parties-roles` - Injured parties, executors, guardians  
- `sherlock-legal-representatives` - Representación legal
- `sherlock-witnesses` - Testigos y expertos
- `sherlock-medical-records` - Registros médicos (HIPAA)
- `sherlock-financial-ledger` - Trust accounts y costos
- `sherlock-documents` - Documentos privilegiados

### 🪣 S3 Buckets (3 buckets)
- `sherlock-ai-privileged-documents` - Documentos attorney-client
- `sherlock-ai-medical-records` - Registros médicos encriptados
- `sherlock-ai-communications` - Correspondencia archivada

### 🔐 Seguridad
- **KMS Key** para encriptación
- **IAM Roles** para Attorney/Paralegal/Admin
- **API Gateway** con authentication
- **CloudWatch** monitoring y alertas

---

## 🎯 Después del Despliegue:

### Para Salesforce Integration:
1. Usar el **API Gateway Endpoint** mostrado al final
2. Configurar **Named Credential** con el **API Key ID**
3. Implementar **Apex callouts** para comunicación

### Para Migración de Datos:
1. Los datos existentes (Excel) se pueden migrar automáticamente
2. Lambda functions incluidas para ETL
3. Validación de integridad de datos

---

## 💰 Costo Estimado: $275-550/mes

### Desglose:
- DynamoDB (on-demand): $200-400/mes
- S3 Storage: $25-50/mes  
- Lambda/API Gateway: $50-100/mes
- KMS/CloudWatch: $25-50/mes

---

## 🆘 Soporte:

Si tienes algún problema durante el despliegue:

1. **Revisa** que tienes Node.js 18+ instalado
2. **Verifica** conexión a internet para AWS
3. **Confirma** que las credenciales AWS están correctas
4. **Ejecuta** el script nuevamente si hay errores temporales

El script es **idempotente** - puedes ejecutarlo múltiples veces sin problema.

---

## 🎉 ¡Listo para Empezar!

Una vez completado el despliegue, tendrás:
- ✅ Base de datos legal completamente funcional
- ✅ Integración lista para Salesforce  
- ✅ Compliance con regulaciones legales
- ✅ Monitoreo automático de SOL
- ✅ Estructura para DocuSign integration

**Tiempo estimado de despliegue: 15-20 minutos** 
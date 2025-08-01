# 🔧 SOLUCIÓN PERMISOS S3 - INTELLILEARN-FINAL

## 📋 ANÁLISIS DE LA CONFIGURACIÓN ACTUAL

### Bucket: `intellilearn-final`
- ✅ **Bucket existe** y está configurado
- ✅ **CloudFront configurado** apuntando a: `intellilearn-final.s3-website-us-east-1.amazonaws.com`
- ❌ **Acceso público bloqueado** (configuración actual)
- ❌ **Políticas de IAM con "explicit deny"** para usuario `AITelmo`

### Usuario IAM: `AITelmo` 
- **ARN:** `arn:aws:iam::362631905074:user/AITelmo`
- **Problema:** Explicit deny en políticas de IAM

## 🛠️ SOLUCIONES REQUERIDAS

### 1. ACTUALIZAR POLÍTICA DE BUCKET S3

**Ir a:** AWS S3 Console > intellilearn-final > Permisos > Política de bucket

**Reemplazar la política actual con:**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::intellilearn-final/*"
        },
        {
            "Sid": "AllowAITelmoFullAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::362631905074:user/AITelmo"
            },
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::intellilearn-final",
                "arn:aws:s3:::intellilearn-final/*"
            ]
        }
    ]
}
```

### 2. DESBLOQUEAR ACCESO PÚBLICO (PARCIAL)

**Ir a:** AWS S3 Console > intellilearn-final > Permisos > Bloquear acceso público

**Configuración recomendada:**
- ✅ **Bloquear acceso público a buckets y objetos** otorgado a través de nuevas listas de control de acceso (ACL)
- ✅ **Bloquear acceso público a buckets y objetos** otorgado a través de cualquier lista de control de acceso (ACL)
- ❌ **Bloquear acceso público a buckets y objetos** otorgado a través de nuevas políticas de acceso público ← **DESMARCAR**
- ❌ **Bloquear acceso público a buckets y objetos** otorgado a través de cualquier política de acceso público ← **DESMARCAR**

### 3. ACTUALIZAR POLÍTICA IAM DEL USUARIO

**Ir a:** AWS IAM Console > Users > AITelmo > Permissions

**Agregar o actualizar política inline:**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning"
            ],
            "Resource": "arn:aws:s3:::intellilearn-final"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::intellilearn-final/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation"
            ],
            "Resource": "arn:aws:cloudfront::362631905074:distribution/E1UF9C891JJD1F"
        }
    ]
}
```

### 4. VERIFICAR POLÍTICAS EXISTENTES

**Revisar si hay políticas que contengan "Deny" explícito:**
- Ir a IAM > Users > AITelmo > Permissions
- Revisar todas las políticas adjuntas (Managed policies + Inline policies)
- **Buscar cualquier "Effect": "Deny"** que incluya acciones de S3
- **Remover o modificar** esas políticas restrictivas

## 🧪 VERIFICACIÓN POST-CONFIGURACIÓN

Una vez aplicados los cambios, ejecutar estos comandos para verificar:

```powershell
# Verificar acceso al bucket
aws s3 ls s3://intellilearn-final/

# Probar subida de archivo de prueba
echo "test" > test.txt
aws s3 cp test.txt s3://intellilearn-final/test.txt
aws s3 rm s3://intellilearn-final/test.txt
rm test.txt

# Si todo funciona, ejecutar el despliegue completo
.\deploy.ps1
```

## 🚨 ALTERNATIVA: CONFIGURACIÓN WEBSITE HOSTING

Si el bucket debe servir como website estático, también configurar:

**Ir a:** S3 Console > intellilearn-final > Properties > Static website hosting

**Configuración:**
- ✅ **Enable static website hosting**
- **Index document:** `index.html`
- **Error document:** `404.html`

## 📞 PASOS DE IMPLEMENTACIÓN

1. **Administrador AWS debe aplicar cambios en este orden:**
   - Política IAM del usuario AITelmo
   - Política del bucket S3
   - Configuración de acceso público
   - Verificar configuración de website hosting

2. **Desarrollador puede entonces ejecutar:**
   ```powershell
   .\deploy.ps1
   ```

3. **Verificar sitio en:**
   - https://d2sn3lk5751y3y.cloudfront.net

---
**Creado:** 2025-01-27  
**Prioridad:** Alta - Requerido para despliegue 
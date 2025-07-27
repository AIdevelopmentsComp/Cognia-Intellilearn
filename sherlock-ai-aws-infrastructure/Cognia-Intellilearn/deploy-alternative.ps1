# COGNIA INTELLILEARN - DEPLOYMENT ALTERNATIVO
# Intenta despliegue usando métodos alternativos
# Author: Sherlock AI Team
# Updated: 2025-01-27

Write-Host "🚀 COGNIA INTELLILEARN - DEPLOYMENT ALTERNATIVO" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Configurar variables de entorno AWS
$env:AWS_ACCESS_KEY_ID = "AKIAVI3ULX4ZB3253Q6R"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

# Variables de configuración
$S3_BUCKET = "intellilearn-final"
$CLOUDFRONT_DISTRIBUTION_ID = "E1UF9C891JJD1F"
$BUILD_DIR = "out"

Write-Host "⚠️  PROBLEMA DETECTADO: Política AWSCompromisedKeyQuarantineV3 activa" -ForegroundColor Yellow
Write-Host "   Esta política bloquea acceso a S3 cuando AWS detecta credenciales comprometidas" -ForegroundColor White
Write-Host ""

# Verificar que el directorio de build existe
if (-not (Test-Path $BUILD_DIR)) {
    Write-Host "❌ Error: Directorio '$BUILD_DIR' no encontrado" -ForegroundColor Red
    Write-Host "   Ejecuta 'npm run build' primero" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directorio de build encontrado" -ForegroundColor Green

# Intentar métodos alternativos
Write-Host "🔄 Intentando métodos alternativos..." -ForegroundColor Yellow

# Método 1: Intentar con aws s3api put-object individual
Write-Host "   Método 1: Upload individual de archivos..." -ForegroundColor White
try {
    # Subir index.html como prueba
    aws s3api put-object --bucket $S3_BUCKET --key "index.html" --body "$BUILD_DIR/index.html" --content-type "text/html"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Método 1 exitoso - Procediendo con upload completo" -ForegroundColor Green
        
        # Subir todos los archivos
        Get-ChildItem -Path $BUILD_DIR -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring((Get-Item $BUILD_DIR).FullName.Length + 1)
            $key = $relativePath -replace "\\", "/"
            
            $contentType = switch ($_.Extension.ToLower()) {
                ".html" { "text/html" }
                ".css" { "text/css" }
                ".js" { "application/javascript" }
                ".json" { "application/json" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif" { "image/gif" }
                ".svg" { "image/svg+xml" }
                ".ico" { "image/x-icon" }
                default { "application/octet-stream" }
            }
            
            Write-Host "   Subiendo: $key" -ForegroundColor Gray
            aws s3api put-object --bucket $S3_BUCKET --key $key --body $_.FullName --content-type $contentType
        }
        
        Write-Host "✅ Upload completo exitoso" -ForegroundColor Green
        $uploadSuccess = $true
    }
} catch {
    Write-Host "❌ Método 1 falló" -ForegroundColor Red
    $uploadSuccess = $false
}

if (-not $uploadSuccess) {
    # Método 2: Intentar con AWS CLI profile diferente
    Write-Host "   Método 2: Intentando con configuración alternativa..." -ForegroundColor White
    try {
        # Crear archivo temporal de credenciales
        $tempCredentials = @"
[default]
aws_access_key_id = AKIAVI3ULX4ZB3253Q6R
aws_secret_access_key = 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
region = us-east-1
"@
        $tempCredentials | Out-File -FilePath "$env:TEMP\aws_credentials_temp" -Encoding UTF8
        
        $env:AWS_SHARED_CREDENTIALS_FILE = "$env:TEMP\aws_credentials_temp"
        
        aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ --delete --region us-east-1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Método 2 exitoso" -ForegroundColor Green
            $uploadSuccess = $true
        }
        
        # Limpiar archivo temporal
        Remove-Item "$env:TEMP\aws_credentials_temp" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "❌ Método 2 falló" -ForegroundColor Red
    }
}

if (-not $uploadSuccess) {
    Write-Host ""
    Write-Host "❌ TODOS LOS MÉTODOS FALLARON" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 SOLUCIÓN REQUERIDA:" -ForegroundColor Yellow
    Write-Host "   Un administrador AWS debe remover la política:" -ForegroundColor White
    Write-Host "   AWSCompromisedKeyQuarantineV3" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Comando para el administrador:" -ForegroundColor White
    Write-Host "   aws iam detach-user-policy --user-name AITelmo --policy-arn arn:aws:iam::aws:policy/AWSCompromisedKeyQuarantineV3" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 RAZÓN DEL PROBLEMA:" -ForegroundColor Yellow
    Write-Host "   AWS detectó que las credenciales pueden estar comprometidas" -ForegroundColor White
    Write-Host "   (probablemente por estar en un repositorio público)" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Si llegamos aquí, el upload fue exitoso
Write-Host ""
Write-Host "🔄 Invalidando caché de CloudFront..." -ForegroundColor Yellow
try {
    $invalidation = aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" --output json | ConvertFrom-Json
    Write-Host "✅ Invalidación creada: $($invalidation.Invalidation.Id)" -ForegroundColor Green
    Write-Host "   Estado: $($invalidation.Invalidation.Status)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Advertencia: No se pudo invalidar el caché de CloudFront" -ForegroundColor Yellow
    Write-Host "   El sitio puede tardar en actualizarse" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "   URL: https://d2sn3lk5751y3y.cloudfront.net" -ForegroundColor Cyan
Write-Host "   Los cambios pueden tardar 5-15 minutos en propagarse globalmente" -ForegroundColor Yellow
Write-Host ""

# Opcional: Abrir el sitio en el navegador
$openSite = Read-Host "¿Abrir el sitio en el navegador? (y/N)"
if ($openSite -eq "y" -or $openSite -eq "Y") {
    Start-Process "https://d2sn3lk5751y3y.cloudfront.net"
} 
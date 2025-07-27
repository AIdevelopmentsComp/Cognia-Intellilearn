# COGNIA INTELLILEARN - DEPLOYMENT SCRIPT
# Automated deployment to AWS S3 + CloudFront
# Author: Sherlock AI Team
# Updated: 2025-01-27

Write-Host "🚀 COGNIA INTELLILEARN - DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Configurar variables de entorno AWS
$env:AWS_ACCESS_KEY_ID = "AKIAVI3ULX4ZB3253Q6R"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

# Variables de configuración
$S3_BUCKET = "intellilearn-final"
$CLOUDFRONT_DISTRIBUTION_ID = "E1UF9C891JJD1F"  # ID de distribución de CloudFront
$BUILD_DIR = "out"

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "   S3 Bucket: $S3_BUCKET" -ForegroundColor White
Write-Host "   CloudFront ID: $CLOUDFRONT_DISTRIBUTION_ID" -ForegroundColor White
Write-Host "   Build Directory: $BUILD_DIR" -ForegroundColor White
Write-Host ""

# Paso 1: Preparar assets
Write-Host "🎬 Preparando assets (video y recursos)..." -ForegroundColor Yellow
try {
    npm run prepare-assets
    Write-Host "✅ Assets preparados correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Advertencia: Error preparando assets, continuando..." -ForegroundColor Yellow
}

# Verificar que el directorio de build existe
if (-not (Test-Path $BUILD_DIR)) {
    Write-Host "❌ Error: Directorio '$BUILD_DIR' no encontrado" -ForegroundColor Red
    Write-Host "   Ejecuta 'npm run build' primero" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Verificando directorio de build..." -ForegroundColor Green

# Verificar credenciales AWS
Write-Host "🔐 Verificando credenciales AWS..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "   Usuario: $($identity.Arn)" -ForegroundColor Green
    Write-Host "   Cuenta: $($identity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: No se pudieron verificar las credenciales AWS" -ForegroundColor Red
    exit 1
}

# Sincronizar archivos con S3
Write-Host "📤 Desplegando a S3..." -ForegroundColor Yellow
Write-Host "   Sincronizando archivos..." -ForegroundColor White

try {
    aws s3 sync $BUILD_DIR/ s3://$S3_BUCKET/ --delete --region us-east-1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Archivos sincronizados exitosamente con S3" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al sincronizar con S3" -ForegroundColor Red
        Write-Host "   Verifica los permisos de IAM para el bucket $S3_BUCKET" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error durante la sincronización con S3" -ForegroundColor Red
    exit 1
}

# Invalidar caché de CloudFront
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
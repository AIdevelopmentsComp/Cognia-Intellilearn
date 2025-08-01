# Production Environment Setup for CognIA Lambda
# Configura todas las variables de entorno para producción

param(
    [string]$FunctionName = "cognia-bedrock-voice-streaming",
    [string]$Region = "us-east-1",
    [string]$Environment = "production"
)

Write-Host "🔧 Configurando variables de entorno para producción..." -ForegroundColor Green

# Variables de entorno optimizadas para producción
$envVars = @{
    'BUCKET_NAME' = 'cognia-intellilearn'
    'DYNAMODB_TABLE' = 'intellilearn_Data'
    'BEDROCK_MODEL_ID' = 'anthropic.claude-3-haiku-20240307-v1:0'
    'TTL_DAYS' = '30'
    'MAX_CONTEXT_SOURCES' = '3'
    'MAX_CONTEXT_LENGTH' = '500'
    'MAX_TOKENS' = '1000'
    'TEMPERATURE' = '0.7'
    'TOP_P' = '0.9'
    'ENABLE_METRICS' = 'true'
    'ENVIRONMENT' = $Environment
    'LOG_LEVEL' = 'INFO'
}

# Convertir a formato JSON para AWS CLI
$envVarsJson = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ','
$envVarsFormatted = "Variables={$envVarsJson}"

Write-Host "📊 Variables configuradas:" -ForegroundColor Cyan
$envVars.GetEnumerator() | ForEach-Object {
    Write-Host "  - $($_.Key): $($_.Value)" -ForegroundColor White
}

# Actualizar función Lambda
Write-Host ""
Write-Host "⚡ Actualizando configuración Lambda..." -ForegroundColor Yellow

try {
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment $envVarsFormatted `
        --region $Region

    Write-Host "✅ Variables de entorno configuradas exitosamente" -ForegroundColor Green
    
    # Mostrar configuración actual
    Write-Host ""
    Write-Host "📋 Configuración actual:" -ForegroundColor Cyan
    aws lambda get-function-configuration --function-name $FunctionName --region $Region --query 'Environment.Variables' --output table

} catch {
    Write-Host "❌ Error configurando variables de entorno: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Configuración de producción completada" -ForegroundColor Green
Write-Host "📈 CloudWatch métricas habilitadas en namespace: CognIA/VoiceStreaming" -ForegroundColor Blue
Write-Host "🔒 Función optimizada para entorno de producción" -ForegroundColor Blue 
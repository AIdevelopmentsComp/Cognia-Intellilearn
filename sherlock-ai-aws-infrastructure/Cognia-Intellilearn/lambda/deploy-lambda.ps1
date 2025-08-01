# CognIA Bedrock Voice Streaming Lambda Deployment Script (PowerShell)
# Este script crea y despliega la función Lambda usando AWS CLI en Windows

param(
    [string]$FunctionName = "cognia-bedrock-voice-streaming",
    [string]$RoleName = "CogniaBedrockLambdaRole",
    [string]$Region = "us-east-1",
    [string]$BucketName = "cognia-intellilearn",
    [string]$DynamoDBTable = "intellilearn_Data"
)

Write-Host "🚀 Iniciando deployment de Lambda CognIA Bedrock Voice Streaming..." -ForegroundColor Green

Write-Host "📋 Configuración:" -ForegroundColor Cyan
Write-Host "  - Function: $FunctionName" -ForegroundColor White
Write-Host "  - Role: $RoleName" -ForegroundColor White
Write-Host "  - Region: $Region" -ForegroundColor White
Write-Host "  - Bucket: $BucketName" -ForegroundColor White
Write-Host "  - DynamoDB: $DynamoDBTable" -ForegroundColor White

# Paso 1: Crear el rol IAM si no existe
Write-Host ""
Write-Host "🔐 Paso 1: Verificando/Creando rol IAM..." -ForegroundColor Yellow

# Trust policy para Lambda
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8

# Verificar si el rol existe
try {
    aws iam get-role --role-name $RoleName --region $Region | Out-Null
    Write-Host "✅ Rol $RoleName ya existe" -ForegroundColor Green
} catch {
    Write-Host "🆕 Creando rol $RoleName..." -ForegroundColor Blue
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://trust-policy.json --region $Region
    
    Write-Host "⏳ Esperando a que el rol se propague..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Adjuntar políticas necesarias
Write-Host "📎 Adjuntando políticas al rol..." -ForegroundColor Cyan

$policies = @(
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AmazonBedrockFullAccess",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
)

foreach ($policy in $policies) {
    Write-Host "  - Adjuntando: $policy" -ForegroundColor White
    try {
        aws iam attach-role-policy --role-name $RoleName --policy-arn $policy --region $Region
    } catch {
        Write-Host "    (Ya adjuntada)" -ForegroundColor Gray
    }
}

# Obtener ARN del rol
$roleArn = aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text --region $Region
Write-Host "✅ Role ARN: $roleArn" -ForegroundColor Green

# Paso 2: Crear el paquete de deployment
Write-Host ""
Write-Host "📦 Paso 2: Creando paquete de deployment..." -ForegroundColor Yellow

# Crear directorio temporal
$tempDir = "$env:TEMP\lambda-package"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar código de la función
Copy-Item "bedrock-voice-streaming\index.py" -Destination $tempDir
Copy-Item "bedrock-voice-streaming\requirements.txt" -Destination $tempDir

# Verificar si Python y pip están disponibles
Write-Host "🐍 Verificando Python y pip..." -ForegroundColor Cyan

try {
    $pythonVersion = python --version 2>&1
    Write-Host "  - Python encontrado: $pythonVersion" -ForegroundColor Green
    
    # Instalar dependencias
    Write-Host "📥 Instalando dependencias Python..." -ForegroundColor Blue
    Set-Location $tempDir
    
    # Usar pip para instalar dependencias
    pip install -r requirements.txt -t . --quiet --no-warn-script-location
    
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Python/pip no encontrado, continuando sin dependencias adicionales..." -ForegroundColor Yellow
    Write-Host "  (boto3 está incluido en el runtime de Lambda)" -ForegroundColor Gray
}

# Volver al directorio lambda
Set-Location $PSScriptRoot

# Crear ZIP usando PowerShell
Write-Host "🗜️ Creando archivo ZIP..." -ForegroundColor Cyan
$zipPath = "$env:TEMP\lambda-deployment.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Usar Compress-Archive de PowerShell
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Write-Host "✅ Paquete creado: $zipPath" -ForegroundColor Green

# Paso 3: Crear o actualizar la función Lambda
Write-Host ""
Write-Host "⚡ Paso 3: Desplegando función Lambda..." -ForegroundColor Yellow

# Verificar si la función existe
try {
    aws lambda get-function --function-name $FunctionName --region $Region | Out-Null
    Write-Host "🔄 Actualizando función existente..." -ForegroundColor Blue
    
    aws lambda update-function-code --function-name $FunctionName --zip-file "fileb://$zipPath" --region $Region
    
    Write-Host "⚙️ Actualizando configuración..." -ForegroundColor Cyan
    aws lambda update-function-configuration --function-name $FunctionName --timeout 300 --memory-size 512 --environment "Variables={BUCKET_NAME=$BucketName,DYNAMODB_TABLE=$DynamoDBTable,AWS_REGION=$Region}" --region $Region
    
} catch {
    Write-Host "🆕 Creando nueva función Lambda..." -ForegroundColor Blue
    
    aws lambda create-function --function-name $FunctionName --runtime python3.11 --role $roleArn --handler index.lambda_handler --zip-file "fileb://$zipPath" --timeout 300 --memory-size 512 --environment "Variables={BUCKET_NAME=$BucketName,DYNAMODB_TABLE=$DynamoDBTable,AWS_REGION=$Region}" --region $Region
}

# Paso 4: Configurar API Gateway (HTTP API)
Write-Host ""
Write-Host "🌐 Paso 4: Configurando API Gateway..." -ForegroundColor Yellow

# Crear HTTP API
$apiName = "cognia-bedrock-api"
Write-Host "🆕 Creando HTTP API: $apiName" -ForegroundColor Blue

$apiId = aws apigatewayv2 create-api --name $apiName --protocol-type HTTP --cors-configuration "AllowOrigins=*,AllowMethods=POST,OPTIONS,AllowHeaders=Content-Type,Authorization" --region $Region --query 'ApiId' --output text

Write-Host "✅ API ID: $apiId" -ForegroundColor Green

# Crear integración con Lambda
Write-Host "🔗 Creando integración Lambda..." -ForegroundColor Cyan

$functionArn = aws lambda get-function --function-name $FunctionName --region $Region --query 'Configuration.FunctionArn' --output text

$integrationId = aws apigatewayv2 create-integration --api-id $apiId --integration-type AWS_PROXY --integration-uri $functionArn --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text

Write-Host "✅ Integration ID: $integrationId" -ForegroundColor Green

# Crear rutas
Write-Host "🛣️ Creando rutas..." -ForegroundColor Cyan

# Ruta POST
aws apigatewayv2 create-route --api-id $apiId --route-key "POST /bedrock-stream" --target "integrations/$integrationId" --region $Region

# Ruta OPTIONS para CORS
aws apigatewayv2 create-route --api-id $apiId --route-key "OPTIONS /bedrock-stream" --target "integrations/$integrationId" --region $Region

# Crear stage
Write-Host "🎭 Creando stage..." -ForegroundColor Cyan
aws apigatewayv2 create-stage --api-id $apiId --stage-name "prod" --auto-deploy --region $Region

# Dar permisos a API Gateway para invocar Lambda
Write-Host "🔑 Configurando permisos..." -ForegroundColor Cyan
try {
    aws lambda add-permission --function-name $FunctionName --statement-id "api-gateway-invoke" --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn "arn:aws:execute-api:${Region}:*:${apiId}/*/*" --region $Region
} catch {
    Write-Host "  (Permisos ya configurados)" -ForegroundColor Gray
}

# Obtener URL del endpoint
$apiEndpoint = "https://$apiId.execute-api.$Region.amazonaws.com/prod/bedrock-stream"

# Paso 5: Limpiar archivos temporales
Write-Host ""
Write-Host "🧹 Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item -Force "trust-policy.json" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

# Resumen final
Write-Host ""
Write-Host "🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
Write-Host "  ✅ Función Lambda: $FunctionName" -ForegroundColor White
Write-Host "  ✅ Rol IAM: $RoleName" -ForegroundColor White
Write-Host "  ✅ API Gateway: $apiId" -ForegroundColor White
Write-Host "  ✅ Endpoint URL: $apiEndpoint" -ForegroundColor White
Write-Host ""
Write-Host "🔧 CONFIGURACIÓN PARA .env.local:" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT=$apiEndpoint" -ForegroundColor Magenta
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Copia el endpoint URL a tu .env.local" -ForegroundColor White
Write-Host "2. Redeploy tu aplicación Next.js" -ForegroundColor White
Write-Host "3. Prueba la funcionalidad de voz" -ForegroundColor White
Write-Host ""
Write-Host "🧪 PRUEBA RÁPIDA:" -ForegroundColor Yellow
Write-Host "curl -X POST $apiEndpoint \\" -ForegroundColor Gray
Write-Host "  -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "  -d '{`"audioData`":`"test`",`"sessionId`":`"test123`",`"topic`":`"Test`"}'" -ForegroundColor Gray 
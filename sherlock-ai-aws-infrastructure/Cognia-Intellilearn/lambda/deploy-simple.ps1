# Deployment simple para Lambda CognIA
Write-Host "🚀 Desplegando Lambda CognIA..." -ForegroundColor Green

$FunctionName = "cognia-bedrock-voice-streaming"
$RoleName = "CogniaBedrockLambdaRole"
$Region = "us-east-1"

# Obtener ARN del rol
Write-Host "🔍 Obteniendo ARN del rol..." -ForegroundColor Cyan
$roleArn = aws iam get-role --role-name $RoleName --query 'Role.Arn' --output text --region $Region
Write-Host "✅ Role ARN: $roleArn" -ForegroundColor Green

# Crear directorio temporal
Write-Host "📦 Creando paquete..." -ForegroundColor Cyan
$tempDir = "$env:TEMP\lambda-package"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar archivos
Copy-Item "bedrock-voice-streaming\index.py" -Destination $tempDir
Copy-Item "bedrock-voice-streaming\requirements.txt" -Destination $tempDir

# Verificar Python
Write-Host "🐍 Instalando dependencias..." -ForegroundColor Cyan
$currentDir = Get-Location
Set-Location $tempDir

try {
    pip install -r requirements.txt -t . --quiet
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error con pip, continuando..." -ForegroundColor Yellow
}

Set-Location $currentDir

# Crear ZIP
Write-Host "🗜️ Creando ZIP..." -ForegroundColor Cyan
$zipPath = "$env:TEMP\lambda-deployment.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Write-Host "✅ ZIP creado: $zipPath" -ForegroundColor Green

# Actualizar función Lambda
Write-Host "⚡ Actualizando función Lambda..." -ForegroundColor Cyan

try {
    # Intentar actualizar función existente
    aws lambda update-function-code --function-name $FunctionName --zip-file "fileb://$zipPath" --region $Region
    Write-Host "✅ Función actualizada" -ForegroundColor Green
} catch {
    # Crear nueva función
    Write-Host "🆕 Creando nueva función..." -ForegroundColor Blue
    aws lambda create-function --function-name $FunctionName --runtime python3.11 --role $roleArn --handler index.lambda_handler --zip-file "fileb://$zipPath" --timeout 300 --memory-size 512 --region $Region
}

# Configurar variables de entorno
Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Cyan
aws lambda update-function-configuration --function-name $FunctionName --environment 'Variables={BUCKET_NAME=cognia-intellilearn,DYNAMODB_TABLE=intellilearn_Data,AWS_REGION=us-east-1}' --region $Region

# Crear API Gateway
Write-Host "🌐 Configurando API Gateway..." -ForegroundColor Cyan

$apiName = "cognia-bedrock-api"
$apiId = aws apigatewayv2 create-api --name $apiName --protocol-type HTTP --region $Region --query 'ApiId' --output text

Write-Host "✅ API ID: $apiId" -ForegroundColor Green

# Integración
$functionArn = aws lambda get-function --function-name $FunctionName --region $Region --query 'Configuration.FunctionArn' --output text
$integrationId = aws apigatewayv2 create-integration --api-id $apiId --integration-type AWS_PROXY --integration-uri $functionArn --payload-format-version "2.0" --region $Region --query 'IntegrationId' --output text

# Rutas
aws apigatewayv2 create-route --api-id $apiId --route-key "POST /bedrock-stream" --target "integrations/$integrationId" --region $Region
aws apigatewayv2 create-route --api-id $apiId --route-key "OPTIONS /bedrock-stream" --target "integrations/$integrationId" --region $Region

# Stage
aws apigatewayv2 create-stage --api-id $apiId --stage-name "prod" --auto-deploy --region $Region

# Permisos
aws lambda add-permission --function-name $FunctionName --statement-id "api-gateway-invoke" --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn "arn:aws:execute-api:us-east-1:*:$apiId/*/*" --region $Region

# URL final
$apiEndpoint = "https://$apiId.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream"

# Limpiar
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 ¡DEPLOYMENT COMPLETADO!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 ENDPOINT URL:" -ForegroundColor Yellow
Write-Host $apiEndpoint -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 Agrega esto a tu .env.local:" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT=$apiEndpoint" -ForegroundColor White 
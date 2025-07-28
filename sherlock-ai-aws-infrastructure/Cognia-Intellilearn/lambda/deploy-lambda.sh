#!/bin/bash

# CognIA Bedrock Voice Streaming Lambda Deployment Script
# Este script crea y despliega la función Lambda usando AWS CLI

set -e  # Exit on any error

echo "🚀 Iniciando deployment de Lambda CognIA Bedrock Voice Streaming..."

# Variables de configuración
FUNCTION_NAME="cognia-bedrock-voice-streaming"
ROLE_NAME="CogniaBedrockLambdaRole"
REGION="us-east-1"
BUCKET_NAME="cognia-intellilearn"
DYNAMODB_TABLE="intellilearn_Data"

echo "📋 Configuración:"
echo "  - Function: $FUNCTION_NAME"
echo "  - Role: $ROLE_NAME"
echo "  - Region: $REGION"
echo "  - Bucket: $BUCKET_NAME"
echo "  - DynamoDB: $DYNAMODB_TABLE"

# Paso 1: Crear el rol IAM si no existe
echo ""
echo "🔐 Paso 1: Verificando/Creando rol IAM..."

# Trust policy para Lambda
cat > trust-policy.json << EOF
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
EOF

# Verificar si el rol existe
if aws iam get-role --role-name $ROLE_NAME --region $REGION > /dev/null 2>&1; then
    echo "✅ Rol $ROLE_NAME ya existe"
else
    echo "🆕 Creando rol $ROLE_NAME..."
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json \
        --region $REGION
    
    echo "⏳ Esperando a que el rol se propague..."
    sleep 10
fi

# Adjuntar políticas necesarias
echo "📎 Adjuntando políticas al rol..."

POLICIES=(
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
    "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
)

for policy in "${POLICIES[@]}"; do
    echo "  - Adjuntando: $policy"
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn $policy \
        --region $REGION || echo "    (Ya adjuntada)"
done

# Obtener ARN del rol
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION)
echo "✅ Role ARN: $ROLE_ARN"

# Paso 2: Crear el paquete de deployment
echo ""
echo "📦 Paso 2: Creando paquete de deployment..."

# Crear directorio temporal
rm -rf /tmp/lambda-package
mkdir -p /tmp/lambda-package

# Copiar código de la función
cp bedrock-voice-streaming/index.py /tmp/lambda-package/
cp bedrock-voice-streaming/requirements.txt /tmp/lambda-package/

# Instalar dependencias si hay requirements.txt
cd /tmp/lambda-package
if [ -f requirements.txt ]; then
    echo "📥 Instalando dependencias Python..."
    pip install -r requirements.txt -t . --quiet
fi

# Crear ZIP
echo "🗜️ Creando archivo ZIP..."
zip -r ../lambda-deployment.zip . -q
cd - > /dev/null

echo "✅ Paquete creado: /tmp/lambda-deployment.zip"

# Paso 3: Crear o actualizar la función Lambda
echo ""
echo "⚡ Paso 3: Desplegando función Lambda..."

# Verificar si la función existe
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
    echo "🔄 Actualizando función existente..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb:///tmp/lambda-deployment.zip \
        --region $REGION
    
    echo "⚙️ Actualizando configuración..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 300 \
        --memory-size 512 \
        --environment Variables="{BUCKET_NAME=$BUCKET_NAME,DYNAMODB_TABLE=$DYNAMODB_TABLE,AWS_REGION=$REGION}" \
        --region $REGION
else
    echo "🆕 Creando nueva función Lambda..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler index.lambda_handler \
        --zip-file fileb:///tmp/lambda-deployment.zip \
        --timeout 300 \
        --memory-size 512 \
        --environment Variables="{BUCKET_NAME=$BUCKET_NAME,DYNAMODB_TABLE=$DYNAMODB_TABLE,AWS_REGION=$REGION}" \
        --region $REGION
fi

# Paso 4: Configurar API Gateway (HTTP API)
echo ""
echo "🌐 Paso 4: Configurando API Gateway..."

# Crear HTTP API
API_NAME="cognia-bedrock-api"
echo "🆕 Creando HTTP API: $API_NAME"

API_ID=$(aws apigatewayv2 create-api \
    --name $API_NAME \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type,Authorization" \
    --region $REGION \
    --query 'ApiId' --output text)

echo "✅ API ID: $API_ID"

# Crear integración con Lambda
echo "🔗 Creando integración Lambda..."

FUNCTION_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $FUNCTION_ARN \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' --output text)

echo "✅ Integration ID: $INTEGRATION_ID"

# Crear rutas
echo "🛣️ Creando rutas..."

# Ruta POST
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /bedrock-stream" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION

# Ruta OPTIONS para CORS
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "OPTIONS /bedrock-stream" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION

# Crear stage
echo "🎭 Creando stage..."
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name "prod" \
    --auto-deploy \
    --region $REGION

# Dar permisos a API Gateway para invocar Lambda
echo "🔑 Configurando permisos..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id "api-gateway-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
    --region $REGION || echo "  (Permisos ya configurados)"

# Obtener URL del endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod/bedrock-stream"

# Paso 5: Limpiar archivos temporales
echo ""
echo "🧹 Limpiando archivos temporales..."
rm -f trust-policy.json
rm -rf /tmp/lambda-package
rm -f /tmp/lambda-deployment.zip

# Resumen final
echo ""
echo "🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
echo ""
echo "📊 RESUMEN:"
echo "  ✅ Función Lambda: $FUNCTION_NAME"
echo "  ✅ Rol IAM: $ROLE_NAME"
echo "  ✅ API Gateway: $API_ID"
echo "  ✅ Endpoint URL: $API_ENDPOINT"
echo ""
echo "🔧 CONFIGURACIÓN PARA .env.local:"
echo "NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT=$API_ENDPOINT"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Copia el endpoint URL a tu .env.local"
echo "2. Redeploy tu aplicación Next.js"
echo "3. Prueba la funcionalidad de voz"
echo ""
echo "🧪 PRUEBA RÁPIDA:"
echo "curl -X POST $API_ENDPOINT \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"audioData\":\"test\",\"sessionId\":\"test123\",\"topic\":\"Test\"}'" 
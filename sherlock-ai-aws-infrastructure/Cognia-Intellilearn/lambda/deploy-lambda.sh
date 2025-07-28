#!/bin/bash

# CognIA IntelliLearn - Bedrock Voice Streaming Lambda Deployment
# Deploys serverless function with proper IAM permissions

set -e

FUNCTION_NAME="cognia-bedrock-voice-streaming"
REGION="us-east-1"
RUNTIME="python3.11"
HANDLER="index.lambda_handler"
ROLE_NAME="CogniaBedrockLambdaRole"

echo "🚀 Deploying CognIA Bedrock Voice Streaming Lambda..."

# Create IAM role if it doesn't exist
echo "📋 Creating/updating IAM role..."
aws iam create-role --role-name $ROLE_NAME \
    --assume-role-policy-document '{
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
    }' --region $REGION || echo "Role already exists"

# Attach policies
echo "🔐 Attaching IAM policies..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create Bedrock policy
aws iam put-role-policy --role-name $ROLE_NAME \
    --policy-name BedrockInvokePolicy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream"
                ],
                "Resource": "*"
            }
        ]
    }'

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "📋 Using IAM Role: $ROLE_ARN"

# Package Lambda function
echo "📦 Packaging Lambda function..."
cd bedrock-voice-streaming
zip -r ../lambda-deployment.zip . -x "*.pyc" "__pycache__/*"
cd ..

# Deploy/Update Lambda function
echo "⚡ Deploying Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime $RUNTIME \
    --role $ROLE_ARN \
    --handler $HANDLER \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 30 \
    --memory-size 512 \
    --region $REGION \
    --description "CognIA Bedrock Voice Streaming - Secure serverless endpoint" || \
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-deployment.zip \
    --region $REGION

# Create API Gateway if needed
echo "🌐 Setting up API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
    --name "cognia-voice-api" \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type" \
    --region $REGION \
    --query 'ApiId' --output text 2>/dev/null || \
aws apigatewayv2 get-apis --query 'Items[?Name==`cognia-voice-api`].ApiId' --output text)

echo "🔗 API Gateway ID: $API_ID"

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME/invocations \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' --output text 2>/dev/null || echo "Integration exists")

# Create route
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /bedrock-stream" \
    --target integrations/$INTEGRATION_ID \
    --region $REGION 2>/dev/null || echo "Route exists"

# Deploy API
aws apigatewayv2 create-deployment \
    --api-id $API_ID \
    --stage-name prod \
    --region $REGION 2>/dev/null || echo "Deployment exists"

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
    --region $REGION 2>/dev/null || echo "Permission exists"

# Get API endpoint
API_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo ""
echo "✅ Lambda deployment completed!"
echo "🎯 Function Name: $FUNCTION_NAME"
echo "🌐 API Endpoint: $API_ENDPOINT/bedrock-stream"
echo "🔐 IAM Role: $ROLE_ARN"
echo ""
echo "📝 Update your frontend to use: $API_ENDPOINT/bedrock-stream"

# Cleanup
rm -f lambda-deployment.zip

echo "🎉 Deployment successful!" 
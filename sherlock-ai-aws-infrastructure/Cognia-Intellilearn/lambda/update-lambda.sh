#!/bin/bash

# Quick Lambda update script for Polly TTS support

FUNCTION_NAME="cognia-bedrock-voice-streaming"
REGION="us-east-1"
ZIP_FILE="lambda-polly-deployment.zip"

echo "🚀 Updating Lambda function with Polly TTS support..."

# Check if zip exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: $ZIP_FILE not found!"
    echo "Creating deployment package..."
    zip -r $ZIP_FILE bedrock-voice-streaming/
fi

# Update Lambda function code
echo "⚡ Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://$ZIP_FILE \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Function code updated successfully!"
    
    # Get role name
    ROLE_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.Role' --output text)
    ROLE_NAME=$(echo $ROLE_ARN | awk -F'/' '{print $NF}')
    
    echo "🔐 Checking Polly permissions for role: $ROLE_NAME"
    
    # Check if Polly policy is attached
    POLLY_ATTACHED=$(aws iam list-attached-role-policies --role-name $ROLE_NAME --query "AttachedPolicies[?contains(PolicyArn, 'AmazonPollyFullAccess')]" --output text)
    
    if [ -z "$POLLY_ATTACHED" ]; then
        echo "📎 Adding Polly permissions..."
        aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn "arn:aws:iam::aws:policy/AmazonPollyFullAccess"
        echo "✅ Polly permissions added!"
    else
        echo "✅ Polly permissions already configured"
    fi
    
    echo ""
    echo "🎉 Lambda updated with TTS support!"
    echo "🔊 New features: Polly TTS, Neural voices, MP3 generation"
else
    echo "❌ Error updating Lambda function!"
    exit 1
fi
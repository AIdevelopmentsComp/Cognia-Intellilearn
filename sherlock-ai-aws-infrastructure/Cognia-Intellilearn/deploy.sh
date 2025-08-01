#!/bin/bash

# CognIA IntelliLearn - Deployment Script
echo "🚀 CognIA IntelliLearn - Deployment Script"
echo "=========================================="

# Load AWS credentials from .env.aws
if [ -f .env.aws ]; then
    echo "📄 Loading AWS credentials..."
    export $(cat .env.aws | grep -v '^#' | xargs)
else
    echo "❌ ERROR: .env.aws file not found!"
    echo "Please create .env.aws with your AWS credentials"
    exit 1
fi

# Configuration
S3_BUCKET="intellilearn-prod-app"
CLOUDFRONT_ID="EAGB3KBNKHJYZ"
REGION="us-east-1"

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: AWS credentials not valid"
    exit 1
fi
echo "✅ AWS credentials valid"

# Build
echo ""
echo "📦 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build completed"

# Deploy to S3
echo ""
echo "☁️ Syncing to S3..."
aws s3 sync out/ s3://$S3_BUCKET/ --acl public-read --delete --region $REGION
if [ $? -ne 0 ]; then
    echo "❌ S3 sync failed!"
    exit 1
fi
echo "✅ Files uploaded to S3"

# Invalidate CloudFront
echo ""
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" --region $REGION
if [ $? -ne 0 ]; then
    echo "⚠️ CloudFront invalidation failed (deployment still completed)"
else
    echo "✅ CloudFront cache invalidated"
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Access your application at:"
echo "   - https://telmoai.mx"
echo "   - https://www.telmoai.mx"
echo "   - https://d2j7zvp3tz528c.cloudfront.net"
echo ""
echo "📧 Login credentials:"
echo "   Email: demo@intellilearn.com"
echo "   Password: Demo2025!"
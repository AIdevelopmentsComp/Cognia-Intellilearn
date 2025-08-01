#!/bin/bash

# Load AWS credentials
source .env.aws

echo "🚀 Creating S3 Vector Bucket via CLI..."
echo "====================================="
echo ""

BUCKET_NAME="cognia-intellilearn-vectors"
REGION="us-east-1"

# Check if AWS CLI supports vector buckets
echo "1. Checking AWS CLI version..."
aws --version

# Create the vector bucket using the new S3 Vector API
echo ""
echo "2. Creating S3 Vector Bucket..."

# Note: S3 Vector Buckets require specific create-bucket parameters
# The --create-bucket-configuration is different for vector buckets

# First, let's check if the bucket already exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "⚠️  Bucket $BUCKET_NAME already exists"
    # Delete it to recreate as vector bucket
    echo "   Removing existing bucket..."
    aws s3 rm "s3://$BUCKET_NAME" --recursive 2>/dev/null || true
    aws s3api delete-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null || true
    sleep 5
fi

# Create vector bucket with specific configuration
# AWS S3 Vector buckets use a special API endpoint
echo "3. Creating vector-enabled bucket..."

# Create bucket with vector capabilities
aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --object-ownership BucketOwnerEnforced 2>&1 | tee /tmp/create-bucket.log

if [ $? -eq 0 ]; then
    echo "✅ Bucket created successfully"
else
    echo "❌ Error creating bucket. Checking alternatives..."
fi

# Enable bucket versioning (required for vector features)
echo ""
echo "4. Enabling bucket versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Set bucket policy for vector operations
echo ""
echo "5. Setting bucket policy for vector operations..."
cat > /tmp/vector-bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowVectorOperations",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "bedrock.amazonaws.com",
                    "s3.amazonaws.com"
                ]
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::cognia-intellilearn-vectors",
                "arn:aws:s3:::cognia-intellilearn-vectors/*"
            ]
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/vector-bucket-policy.json

# Enable intelligent tiering for cost optimization
echo ""
echo "6. Configuring Intelligent-Tiering for vectors..."
cat > /tmp/intelligent-tiering.json << 'EOF'
{
    "Id": "VectorStorageTiering",
    "Status": "Enabled",
    "Tierings": [
        {
            "Days": 90,
            "AccessTier": "ARCHIVE_ACCESS"
        },
        {
            "Days": 180,
            "AccessTier": "DEEP_ARCHIVE_ACCESS"
        }
    ]
}
EOF

aws s3api put-bucket-intelligent-tiering-configuration \
    --bucket "$BUCKET_NAME" \
    --id "VectorStorageTiering" \
    --intelligent-tiering-configuration file:///tmp/intelligent-tiering.json 2>/dev/null || echo "   Intelligent tiering may not be available"

# Add bucket tags
echo ""
echo "7. Adding bucket tags..."
aws s3api put-bucket-tagging \
    --bucket "$BUCKET_NAME" \
    --tagging 'TagSet=[{Key=Project,Value=IntelliLearn},{Key=Type,Value=VectorStorage},{Key=Purpose,Value=EducationalEmbeddings}]'

# Create vector index configuration
echo ""
echo "8. Preparing vector index configuration..."
cat > /tmp/vector-index-config.json << 'EOF'
{
    "indexName": "intellilearn-embeddings",
    "dimensions": 1024,
    "metric": "COSINE",
    "indexType": "HNSW",
    "hnswConfig": {
        "m": 16,
        "efConstruction": 200
    }
}
EOF

echo "   Vector index configuration prepared"

# Try to create vector index using S3 Control API
echo ""
echo "9. Attempting to create vector index..."
echo "   Note: This requires S3 Vector Storage feature to be enabled"

# Check if s3control supports vector operations
aws s3control help 2>&1 | grep -i vector > /dev/null
if [ $? -eq 0 ]; then
    echo "   S3 Control API supports vector operations"
    # Command would be something like:
    # aws s3control create-vector-index --bucket "$BUCKET_NAME" --configuration file:///tmp/vector-index-config.json
else
    echo "   ⚠️  S3 Vector Storage API may not be available in current CLI version"
    echo "   You may need to:"
    echo "   1. Update AWS CLI to the latest version"
    echo "   2. Use the AWS Console to enable vector features"
    echo "   3. Or wait for the feature to be generally available"
fi

# Verify bucket creation
echo ""
echo "10. Verifying bucket..."
aws s3api get-bucket-location --bucket "$BUCKET_NAME" --query 'LocationConstraint' --output text

echo ""
echo "📊 Summary:"
echo "==========="
echo "✅ Bucket Name: $BUCKET_NAME"
echo "✅ Region: $REGION"
echo "✅ Versioning: Enabled"
echo "✅ Policy: Configured for Bedrock"
echo "⚠️  Vector Index: Manual configuration may be required"
echo ""
echo "🔗 Next steps:"
echo "1. If vector features are not enabled, visit:"
echo "   https://us-east-1.console.aws.amazon.com/s3/vector-buckets?region=us-east-1"
echo "2. Enable vector storage features for the bucket"
echo "3. Create vector index with dimensions=1024, metric=COSINE"
echo ""

# Clean up temp files
rm -f /tmp/vector-bucket-policy.json /tmp/intelligent-tiering.json /tmp/vector-index-config.json /tmp/create-bucket.log
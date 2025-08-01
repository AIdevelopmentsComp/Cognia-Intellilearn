# Secure deployment script for IntelliLearn
# This script loads credentials from .env.aws file

Write-Host "🚀 Starting secure deployment process..." -ForegroundColor Cyan

# Load environment variables from secure file
$envAwsPath = Join-Path $PSScriptRoot ".env.aws"
$envLocalPath = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envAwsPath)) {
    Write-Host "❌ ERROR: .env.aws file not found!" -ForegroundColor Red
    Write-Host "Please create .env.aws with your AWS credentials" -ForegroundColor Yellow
    exit 1
}

# Load AWS credentials
Get-Content $envAwsPath | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Load local environment variables
if (Test-Path $envLocalPath) {
    Get-Content $envLocalPath | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$' -and $matches[1] -notlike "*AWS*KEY*") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Validate credentials are loaded
if (-not $env:AWS_ACCESS_KEY_ID -or -not $env:AWS_SECRET_ACCESS_KEY) {
    Write-Host "❌ ERROR: AWS credentials not loaded properly!" -ForegroundColor Red
    exit 1
}

# Get S3 bucket name from environment
$s3Bucket = "intellilearn-prod-app"
Write-Host "📦 Target S3 bucket: $s3Bucket" -ForegroundColor Green

# Build the application
Write-Host "`n📨 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to S3
Write-Host "`n📤 Uploading to S3..." -ForegroundColor Yellow
aws s3 sync out/ s3://$s3Bucket --delete --region us-east-1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed!" -ForegroundColor Red
    exit 1
}

# Get CloudFront distribution ID
Write-Host "`n🔍 Finding CloudFront distribution..." -ForegroundColor Yellow
$distributions = aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$s3Bucket.s3.amazonaws.com']].Id" --output text --region us-east-1

if ($distributions) {
    $distributionId = $distributions.Trim()
    Write-Host "🌐 CloudFront Distribution ID: $distributionId" -ForegroundColor Green
    
    # Invalidate CloudFront cache
    Write-Host "`n🧹 Invalidating CloudFront cache..." -ForegroundColor Yellow
    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --region us-east-1
    
    # Get CloudFront domain
    $domain = aws cloudfront get-distribution --id $distributionId --query "Distribution.DomainName" --output text --region us-east-1
    Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🌐 Your application is available at: https://$domain" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  No CloudFront distribution found for this S3 bucket" -ForegroundColor Yellow
    Write-Host "✅ Files uploaded to S3 successfully" -ForegroundColor Green
}

Write-Host "`n📝 Security reminder: Rotate your AWS credentials regularly!" -ForegroundColor Yellow
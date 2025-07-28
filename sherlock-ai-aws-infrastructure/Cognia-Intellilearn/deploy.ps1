# CognIA IntelliLearn - Secure Deployment Script
# Security: Uses environment variables for AWS credentials

Write-Host "🚀 CognIA IntelliLearn - Secure Deployment" -ForegroundColor Cyan
Write-Host "Loading credentials from .env.local..." -ForegroundColor Yellow

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "✅ Loaded: $name" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your AWS credentials" -ForegroundColor Red
    exit 1
}

# Validate required environment variables
$requiredVars = @(
    "NEXT_PUBLIC_AWS_ACCESS_KEY_ID",
    "NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY",
    "NEXT_PUBLIC_AWS_REGION"
)

foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        Write-Host "❌ ERROR: Missing required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required environment variables are present" -ForegroundColor Green

# Set AWS credentials from environment variables
$env:AWS_ACCESS_KEY_ID = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_ACCESS_KEY_ID")
$env:AWS_SECRET_ACCESS_KEY = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY")
$env:AWS_DEFAULT_REGION = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_REGION")

Write-Host "🔐 Using credentials from environment variables" -ForegroundColor Green
Write-Host "📍 Region: $env:AWS_DEFAULT_REGION" -ForegroundColor Cyan

# Build and deploy
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "☁️  Syncing to S3..." -ForegroundColor Yellow
aws s3 sync out/ s3://intellilearn-final --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Invalidating CloudFront..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E1UF9C891JJD1F --paths "/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 URL: https://d2sn3lk5751y3y.cloudfront.net" -ForegroundColor Cyan
} else {
    Write-Host "CloudFront invalidation failed, but deployment completed" -ForegroundColor Yellow
} 
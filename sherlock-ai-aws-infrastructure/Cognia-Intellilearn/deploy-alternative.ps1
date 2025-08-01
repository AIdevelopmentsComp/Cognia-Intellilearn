# CognIA IntelliLearn - Alternative Secure Deployment Script
# Security: Uses environment variables for AWS credentials

Write-Host "🚀 CognIA IntelliLearn - Alternative Secure Deployment" -ForegroundColor Cyan

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "❌ ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

# Set AWS credentials from environment variables
$env:AWS_ACCESS_KEY_ID = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_ACCESS_KEY_ID")
$env:AWS_SECRET_ACCESS_KEY = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY")
$env:AWS_DEFAULT_REGION = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AWS_REGION")

Write-Host "🔐 Using secure credentials from environment" -ForegroundColor Green

# Build and deploy with secure configuration
npm run build
aws s3 sync out/ s3://intellilearn-final --delete

Write-Host "✅ Secure deployment completed!" -ForegroundColor Green 
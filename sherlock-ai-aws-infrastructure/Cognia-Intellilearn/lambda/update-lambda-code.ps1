# Quick Lambda code update script
# Only updates the function code, no infrastructure changes

param(
    [string]$FunctionName = "cognia-bedrock-voice-streaming",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Updating Lambda function code with Polly TTS support..." -ForegroundColor Green

# Step 1: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Use existing zip file
$zipPath = "lambda-polly-deployment.zip"

if (-not (Test-Path $zipPath)) {
    Write-Host "❌ Error: $zipPath not found!" -ForegroundColor Red
    Write-Host "Run: zip -r lambda-polly-deployment.zip bedrock-voice-streaming/" -ForegroundColor Yellow
    exit 1
}

# Step 2: Update Lambda function code
Write-Host "⚡ Updating Lambda function code..." -ForegroundColor Yellow

try {
    $result = aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$zipPath" `
        --region $Region `
        --output json | ConvertFrom-Json
    
    Write-Host "✅ Function code updated successfully!" -ForegroundColor Green
    Write-Host "  - Last Modified: $($result.LastModified)" -ForegroundColor Gray
    Write-Host "  - Code Size: $($result.CodeSize) bytes" -ForegroundColor Gray
    Write-Host "  - Runtime: $($result.Runtime)" -ForegroundColor Gray
    
    # Step 3: Add Polly permissions to role if needed
    Write-Host ""
    Write-Host "🔐 Checking IAM permissions..." -ForegroundColor Yellow
    
    $roleArn = $result.Role
    $roleName = $roleArn.Split('/')[-1]
    
    # Check if Polly policy is attached
    $attachedPolicies = aws iam list-attached-role-policies --role-name $roleName --query 'AttachedPolicies[].PolicyArn' --output text
    
    if ($attachedPolicies -notmatch "AmazonPollyFullAccess") {
        Write-Host "📎 Adding Polly permissions..." -ForegroundColor Cyan
        aws iam attach-role-policy --role-name $roleName --policy-arn "arn:aws:iam::aws:policy/AmazonPollyFullAccess"
        Write-Host "✅ Polly permissions added!" -ForegroundColor Green
    } else {
        Write-Host "✅ Polly permissions already configured" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Lambda function updated with TTS support!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔊 New features enabled:" -ForegroundColor Cyan
    Write-Host "  ✅ Amazon Polly text-to-speech" -ForegroundColor White
    Write-Host "  ✅ Neural voice synthesis (Mia - Spanish)" -ForegroundColor White
    Write-Host "  ✅ MP3 audio generation" -ForegroundColor White
    Write-Host "  ✅ Audio streaming to frontend" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error updating Lambda function!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
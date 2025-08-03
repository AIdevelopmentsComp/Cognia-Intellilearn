# Simple deployment script for Cognia Intellilearn
Write-Host "🚀 Starting simple deployment process..." -ForegroundColor Cyan

# Step 1: Build
Write-Host "`n📦 Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 2: Export (if the command exists)
Write-Host "`n📤 Exporting static files..." -ForegroundColor Yellow
# Next.js 13+ uses output: 'export' in next.config.js instead of npm run export
# The build command already generates the 'out' folder with static export

# Step 3: Sync to S3
Write-Host "`n☁️ Syncing to S3..." -ForegroundColor Yellow
aws s3 sync out s3://intellilearn-prod-app --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ S3 sync completed!" -ForegroundColor Green

# Step 4: CloudFront Invalidation
Write-Host "`n🔄 Creating CloudFront invalidation..." -ForegroundColor Yellow
$invalidationId = aws cloudfront create-invalidation --distribution-id EAGB3KBNKHJYZ --paths "/*" --query "Invalidation.Id" --output text
Write-Host "✅ CloudFront invalidation created: $invalidationId" -ForegroundColor Green

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your app will be available at: https://d2j7zvp3tz528c.cloudfront.net" -ForegroundColor Cyan
Write-Host "⏱️ Note: CloudFront invalidation may take a few minutes to complete." -ForegroundColor Yellow
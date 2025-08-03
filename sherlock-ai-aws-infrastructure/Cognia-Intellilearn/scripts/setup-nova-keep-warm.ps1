# Setup Nova Keep-Warm Lambda
Write-Host "🔥 Setting up Nova Sonic Keep-Warm Lambda..." -ForegroundColor Cyan

# Create Lambda function
Write-Host "Creating Lambda function..." -ForegroundColor Yellow
aws lambda create-function `
    --function-name NovaKeepWarm `
    --runtime nodejs18.x `
    --role arn:aws:iam::304936889025:role/NovaWebSocketLambdaRole `
    --handler index.handler `
    --timeout 60 `
    --memory-size 256 `
    --environment Variables="{NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0}" `
    --zip-file fileb://lambda/nova-keep-warm/deployment.zip `
    --region us-east-1

# Create EventBridge rule to run every 5 minutes
Write-Host "Creating EventBridge rule..." -ForegroundColor Yellow
aws events put-rule `
    --name nova-keep-warm-schedule `
    --schedule-expression "rate(5 minutes)" `
    --description "Keep Nova Sonic model warm" `
    --region us-east-1

# Get Lambda ARN
$lambdaArn = aws lambda get-function --function-name NovaKeepWarm --query Configuration.FunctionArn --output text --region us-east-1

# Add permission for EventBridge to invoke Lambda
Write-Host "Adding EventBridge permissions..." -ForegroundColor Yellow
aws lambda add-permission `
    --function-name NovaKeepWarm `
    --statement-id nova-keep-warm-event `
    --action lambda:InvokeFunction `
    --principal events.amazonaws.com `
    --source-arn arn:aws:events:us-east-1:304936889025:rule/nova-keep-warm-schedule `
    --region us-east-1

# Add Lambda as target to EventBridge rule
Write-Host "Setting Lambda as EventBridge target..." -ForegroundColor Yellow
aws events put-targets `
    --rule nova-keep-warm-schedule `
    --targets "Id=1,Arn=$lambdaArn" `
    --region us-east-1

Write-Host "✅ Nova Keep-Warm Lambda setup complete!" -ForegroundColor Green
Write-Host "Nova Sonic will be kept warm every 5 minutes to avoid cold starts" -ForegroundColor Cyan
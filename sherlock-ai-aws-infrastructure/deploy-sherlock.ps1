# Sherlock AI Legal Database - Complete Deployment Script (PowerShell)
# Watts Law Firm - Mass Tort Case Management System

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Header
Write-ColorOutput Magenta "=============================================================="
Write-ColorOutput Magenta "                SHERLOCK AI DEPLOYMENT                       "
Write-ColorOutput Magenta "             Legal Case Management System                    "
Write-ColorOutput Magenta "                   Watts Law Firm                           "
Write-ColorOutput Magenta "=============================================================="
Write-Output ""

# Step 1: Validate Prerequisites
Write-ColorOutput Cyan "Step 1: Validando prerrequisitos..."

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    if ($nodeVersion -match "v(\d+)") {
        $majorVersion = [int]$Matches[1]
        if ($majorVersion -lt 18) {
            Write-ColorOutput Red "ERROR: Node.js version 18+ required. Current version: $nodeVersion"
            exit 1
        }
        Write-ColorOutput Green "SUCCESS: Node.js $nodeVersion detected"
    }
} catch {
    Write-ColorOutput Red "ERROR: Node.js not installed. Please install Node.js 18+ before continuing."
    exit 1
}

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-ColorOutput Green "SUCCESS: AWS CLI available"
} catch {
    Write-ColorOutput Yellow "WARNING: AWS CLI not detected. Installing via winget..."
    try {
        winget install Amazon.AWSCLI
        Write-ColorOutput Green "SUCCESS: AWS CLI installed"
    } catch {
        Write-ColorOutput Red "ERROR: Could not install AWS CLI automatically."
        Write-ColorOutput Yellow "Please install manually from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    }
}

# Step 2: Install Dependencies
Write-ColorOutput Cyan "Step 2: Installing dependencies..."

if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Yellow "Installing NPM packages..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "ERROR: Failed to install NPM dependencies"
        exit 1
    }
} else {
    Write-ColorOutput Green "SUCCESS: node_modules already exists"
}

# Step 3: Configure AWS Credentials
Write-ColorOutput Cyan "Step 3: Configuring AWS credentials..."

npm run configure-aws
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "ERROR: Failed to configure AWS credentials"
    exit 1
}

# Verify AWS configuration
Write-ColorOutput Cyan "Verifying AWS configuration..."
$awsIdentity = aws sts get-caller-identity
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "ERROR: AWS configuration failed. Please verify credentials."
    exit 1
}
Write-ColorOutput Green "SUCCESS: AWS configuration verified"

# Step 4: Bootstrap CDK (if needed)
Write-ColorOutput Cyan "Step 4: Preparing CDK Bootstrap..."

$accountId = (aws sts get-caller-identity --query Account --output text).Trim()
$region = "us-east-1"

Write-ColorOutput White "Account ID: $accountId"
Write-ColorOutput White "Region: $region"

# Check if CDK is already bootstrapped
$null = aws cloudformation describe-stacks --stack-name CDKToolkit --region $region 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "SUCCESS: CDK already bootstrapped in this account/region"
} else {
    Write-ColorOutput Yellow "WARNING: Running CDK Bootstrap..."
    npx cdk bootstrap "aws://$accountId/$region"
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "ERROR: CDK Bootstrap failed"
        exit 1
    }
    Write-ColorOutput Green "SUCCESS: CDK Bootstrap completed"
}

# Step 5: Build TypeScript
Write-ColorOutput Cyan "Step 5: Compiling TypeScript..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "ERROR: TypeScript compilation failed"
    exit 1
}

# Step 6: Synthesize CloudFormation
Write-ColorOutput Cyan "Step 6: Generating CloudFormation template..."
npx cdk synth
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "ERROR: CloudFormation template generation failed"
    exit 1
}

# Step 7: Review changes (diff)
Write-ColorOutput Cyan "Step 7: Reviewing changes..."
npx cdk diff
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Yellow "WARNING: First run - no existing stack to compare"
}

# Step 8: Deploy with confirmation
Write-ColorOutput Magenta "Step 8: Proceed with Sherlock AI deployment?"
Write-ColorOutput Yellow "This process will create:"
Write-ColorOutput White "  - 7 Encrypted DynamoDB tables"
Write-ColorOutput White "  - 3 S3 buckets with legal retention policies"
Write-ColorOutput White "  - KMS Key for encryption"
Write-ColorOutput White "  - IAM Roles for different access levels"
Write-ColorOutput White "  - API Gateway for Salesforce integration"
Write-ColorOutput White "  - Lambda functions for SOL monitoring"
Write-ColorOutput White ""
Write-ColorOutput Yellow "Estimated cost: $275-550/month"
Write-ColorOutput White ""

$confirmation = Read-Host "Confirm deployment? (y/N)"

if ($confirmation -eq "y" -or $confirmation -eq "Y") {
    Write-ColorOutput Green "Starting Sherlock AI deployment..."
    
    # Deploy with verbose logging
    npx cdk deploy --require-approval never --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green ""
        Write-ColorOutput Green "=============================================================="
        Write-ColorOutput Green "                DEPLOYMENT SUCCESSFUL                        "
        Write-ColorOutput Green "             Sherlock AI is ready to use                     "
        Write-ColorOutput Green "=============================================================="
        Write-ColorOutput Green ""
        
        # Display important outputs
        Write-ColorOutput Cyan "Important information for Salesforce:"
        Write-Output ""
        
        # Get stack outputs
        try {
            $stackOutputs = aws cloudformation describe-stacks --stack-name SherlockAILegalDatabaseStack --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
            
            # Parse and display key outputs
            Write-ColorOutput Blue "API Gateway Endpoint:"
            $apiEndpoint = ($stackOutputs | Where-Object { $_.OutputKey -eq "SherlockAPIEndpoint" }).OutputValue
            Write-ColorOutput White "$apiEndpoint"
            Write-Output ""
            
            Write-ColorOutput Blue "API Key ID for Named Credential:"
            $apiKeyId = ($stackOutputs | Where-Object { $_.OutputKey -eq "SalesforceAPIKeyId" }).OutputValue
            Write-ColorOutput White "$apiKeyId"
            Write-Output ""
            
            Write-ColorOutput Blue "KMS Key ARN:"
            $kmsKeyArn = ($stackOutputs | Where-Object { $_.OutputKey -eq "KMSKeyArn" }).OutputValue
            Write-ColorOutput White "$kmsKeyArn"
            Write-Output ""
        } catch {
            Write-ColorOutput Yellow "Could not retrieve stack outputs. Please check AWS Console."
        }
        
        # Next steps
        Write-ColorOutput Magenta "Next steps:"
        Write-ColorOutput White "1. Configure Named Credential in Salesforce with the API Key"
        Write-ColorOutput White "2. Implement Apex classes for DynamoDB communication"
        Write-ColorOutput White "3. Migrate existing data using Lambda functions"
        Write-ColorOutput White "4. Configure user permissions by role (Attorney/Paralegal)"
        Write-ColorOutput White "5. Implement DocuSign integration"
        Write-Output ""
        
        Write-ColorOutput Green "Sherlock AI Legal Database is operational!"
        
    } else {
        Write-ColorOutput Red ""
        Write-ColorOutput Red "=============================================================="
        Write-ColorOutput Red "                    DEPLOYMENT FAILED                        "
        Write-ColorOutput Red "              Please check logs for details                  "
        Write-ColorOutput Red "=============================================================="
        Write-ColorOutput Red ""
        exit 1
    }
    
} else {
    Write-ColorOutput Yellow "Deployment cancelled by user"
    exit 0
}

# Step 9: Optional - Setup monitoring alerts
$monitoringChoice = Read-Host "Configure monitoring alerts? (y/N)"

if ($monitoringChoice -eq "y" -or $monitoringChoice -eq "Y") {
    Write-ColorOutput Cyan "Configuring CloudWatch alerts for SOL monitoring..."
    
    # Create CloudWatch alarms for critical deadlines
    try {
        aws cloudwatch put-metric-alarm --alarm-name "SherlockAI-SOL-Critical-Deadlines" --alarm-description "Alert when cases are within 30 days of SOL expiry" --metric-name "SOLDeadlinesApproaching" --namespace "SherlockAI/Legal" --statistic "Sum" --period 86400 --threshold 1 --comparison-operator "GreaterThanOrEqualToThreshold" --evaluation-periods 1
        
        Write-ColorOutput Green "SUCCESS: Alerts configured"
    } catch {
        Write-ColorOutput Yellow "WARNING: SOL alert could not be configured"
    }
}

Write-ColorOutput Magenta "Sherlock AI installation completed successfully!"
Write-ColorOutput Cyan "For technical support or legal system queries, contact the development team." 
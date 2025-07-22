"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SherlockAILegalDatabaseStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const s3 = require("aws-cdk-lib/aws-s3");
const kms = require("aws-cdk-lib/aws-kms");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
class SherlockAILegalDatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // === KMS KEY FOR ENCRYPTION ===
        const sherlockKMSKey = new kms.Key(this, 'SherlockKMSKey', {
            description: 'KMS Key for Sherlock AI Legal Database encryption',
            keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
            keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Never delete legal data
        });
        // KMS Key Alias
        new kms.Alias(this, 'SherlockKMSKeyAlias', {
            aliasName: 'alias/sherlock-ai-legal-db',
            targetKey: sherlockKMSKey,
        });
        // === S3 BUCKETS FOR DOCUMENT STORAGE ===
        // Privileged Documents Bucket
        const privilegedDocsBucket = new s3.Bucket(this, 'SherlockPrivilegedDocsBucket', {
            bucketName: 'sherlock-ai-privileged-documents',
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: sherlockKMSKey,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            lifecycleRules: [
                {
                    id: 'LegalRetentionRule',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(90),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(365),
                        },
                        {
                            storageClass: s3.StorageClass.DEEP_ARCHIVE,
                            transitionAfter: cdk.Duration.days(2555), // 7 years
                        },
                    ],
                },
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // Medical Records Bucket
        const medicalRecordsBucket = new s3.Bucket(this, 'SherlockMedicalRecordsBucket', {
            bucketName: 'sherlock-ai-medical-records',
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: sherlockKMSKey,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            lifecycleRules: [
                {
                    id: 'HIPAARetentionRule',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(730), // 2 years
                        },
                    ],
                },
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // Communications Archive Bucket
        const communicationsBucket = new s3.Bucket(this, 'SherlockCommunicationsBucket', {
            bucketName: 'sherlock-ai-communications',
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: sherlockKMSKey,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // === DYNAMODB TABLES ===
        // Main Cases Table
        const sherlockCasesMain = new dynamodb.Table(this, 'SherlockCasesMain', {
            tableName: 'sherlock-cases-main',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // GSI1: Litigation Status & Critical Dates
        sherlockCasesMain.addGlobalSecondaryIndex({
            indexName: 'GSI1-LitigationStatus',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        // GSI2: Attorney Workload Management  
        sherlockCasesMain.addGlobalSecondaryIndex({
            indexName: 'GSI2-AttorneyWorkload',
            partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        });
        // GSI3: Jurisdiction & Case Type Analysis
        sherlockCasesMain.addGlobalSecondaryIndex({
            indexName: 'GSI3-JurisdictionCaseType',
            partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
        });
        // GSI4: Client-Matter Relationship
        sherlockCasesMain.addGlobalSecondaryIndex({
            indexName: 'GSI4-ClientMatter',
            partitionKey: { name: 'GSI4PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI4SK', type: dynamodb.AttributeType.STRING },
        });
        // Parties & Roles Table
        const sherlockPartiesRoles = new dynamodb.Table(this, 'SherlockPartiesRoles', {
            tableName: 'sherlock-parties-roles',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        sherlockPartiesRoles.addGlobalSecondaryIndex({
            indexName: 'GSI1-PartyType',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        // Legal Representatives Table
        const sherlockLegalReps = new dynamodb.Table(this, 'SherlockLegalRepresentatives', {
            tableName: 'sherlock-legal-representatives',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // Witnesses Table
        const sherlockWitnesses = new dynamodb.Table(this, 'SherlockWitnesses', {
            tableName: 'sherlock-witnesses',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        sherlockWitnesses.addGlobalSecondaryIndex({
            indexName: 'GSI1-WitnessType',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        // Medical Records Table
        const sherlockMedicalRecords = new dynamodb.Table(this, 'SherlockMedicalRecords', {
            tableName: 'sherlock-medical-records',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        sherlockMedicalRecords.addGlobalSecondaryIndex({
            indexName: 'GSI1-ProviderSpecialty',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        sherlockMedicalRecords.addGlobalSecondaryIndex({
            indexName: 'GSI2-CausationOpinion',
            partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        });
        // Financial Ledger Table
        const sherlockFinancialLedger = new dynamodb.Table(this, 'SherlockFinancialLedger', {
            tableName: 'sherlock-financial-ledger',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        sherlockFinancialLedger.addGlobalSecondaryIndex({
            indexName: 'GSI1-TransactionType',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        sherlockFinancialLedger.addGlobalSecondaryIndex({
            indexName: 'GSI2-TrustAccount',
            partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        });
        // Documents Table
        const sherlockDocuments = new dynamodb.Table(this, 'SherlockDocuments', {
            tableName: 'sherlock-documents',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: sherlockKMSKey,
            pointInTimeRecovery: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        sherlockDocuments.addGlobalSecondaryIndex({
            indexName: 'GSI1-PrivilegeType',
            partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        });
        sherlockDocuments.addGlobalSecondaryIndex({
            indexName: 'GSI2-DocumentCategory',
            partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        });
        // === IAM ROLES FOR LEGAL STAFF ===
        // Attorney Role - Full Access
        const attorneyRole = new iam.Role(this, 'SherlockAttorneyRole', {
            roleName: 'sherlock-attorney-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Full access role for attorneys in Sherlock AI system',
        });
        // Paralegal Role - Limited Access
        const paralegalRole = new iam.Role(this, 'SherlockParalegalRole', {
            roleName: 'sherlock-paralegal-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Limited access role for paralegals in Sherlock AI system',
        });
        // Admin Role - System Management
        const adminRole = new iam.Role(this, 'SherlockAdminRole', {
            roleName: 'sherlock-admin-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Administrative access role for system management',
        });
        // Grant permissions to roles
        const allTables = [
            sherlockCasesMain,
            sherlockPartiesRoles,
            sherlockLegalReps,
            sherlockWitnesses,
            sherlockMedicalRecords,
            sherlockFinancialLedger,
            sherlockDocuments,
        ];
        // Attorney - Full Access
        allTables.forEach(table => {
            table.grantFullAccess(attorneyRole);
        });
        [privilegedDocsBucket, medicalRecordsBucket, communicationsBucket].forEach(bucket => {
            bucket.grantReadWrite(attorneyRole);
        });
        // Paralegal - Read/Write but no delete
        allTables.forEach(table => {
            table.grantReadWriteData(paralegalRole);
        });
        [privilegedDocsBucket, medicalRecordsBucket, communicationsBucket].forEach(bucket => {
            bucket.grantRead(paralegalRole);
        });
        // === LAMBDA FUNCTIONS ===
        // Statute of Limitations Monitor
        const solMonitorFunction = new lambda.Function(this, 'SOLMonitorFunction', {
            functionName: 'sherlock-sol-monitor',
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'sol_monitor.handler',
            code: lambda.Code.fromInline(`
import json
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

def handler(event, context):
    """
    Monitor cases approaching statute of limitations deadlines.
    Send alerts for cases within 90, 60, 30, and 7 days of SOL expiry.
    """
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('sherlock-cases-main')
    
    # Calculate alert thresholds
    today = datetime.now().date()
    alert_thresholds = [90, 60, 30, 7]  # Days before expiry
    
    alerts = []
    
    for days in alert_thresholds:
        alert_date = today + timedelta(days=days)
        
        # Query GSI1 for cases by SOL date
        response = table.query(
            IndexName='GSI1-LitigationStatus',
            KeyConditionExpression='GSI1PK = :status AND begins_with(GSI1SK, :sol_prefix)',
            ExpressionAttributeValues={
                ':status': 'LITIGATION_STATUS#ACTIVE_DISCOVERY',
                ':sol_prefix': f'STATUTE_EXPIRY#{alert_date.strftime("%Y-%m-%d")}'
            }
        )
        
        for item in response['Items']:
            alert = {
                'matter_number': item['matter_number'],
                'case_caption': item['case_caption'],
                'sol_expiry_date': item['statute_of_limitations_expiry'],
                'days_remaining': days,
                'lead_counsel': item['lead_counsel_id'],
                'alert_level': 'CRITICAL' if days <= 30 else 'HIGH'
            }
            alerts.append(alert)
    
    # Send alerts (implement SNS notification here)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'alerts_generated': len(alerts),
            'alerts': alerts
        })
    }
      `),
            role: attorneyRole,
            timeout: cdk.Duration.minutes(5),
            logRetention: logs.RetentionDays.ONE_YEAR,
        });
        // Case Data Migration Function
        const dataMigrationFunction = new lambda.Function(this, 'DataMigrationFunction', {
            functionName: 'sherlock-data-migration',
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'data_migration.handler',
            code: lambda.Code.fromInline(`
import json
import boto3
import pandas as pd
from decimal import Decimal
from datetime import datetime

def handler(event, context):
    """
    Migrate case data from Excel files to Sherlock AI DynamoDB structure.
    Expected to receive S3 event with Excel file location.
    """
    
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
    
    # Extract bucket and key from event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    # Download and process Excel file
    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_excel(obj['Body'].read())
    
    # Determine case type from filename
    case_type = determine_case_type(key)
    
    # Process each row
    cases_main_table = dynamodb.Table('sherlock-cases-main')
    parties_table = dynamodb.Table('sherlock-parties-roles')
    
    for index, row in df.iterrows():
        # Generate matter number
        matter_number = generate_matter_number(case_type, index)
        
        # Create main case record
        case_item = transform_to_sherlock_format(row, matter_number, case_type)
        cases_main_table.put_item(Item=case_item)
        
        # Create party records
        party_item = create_party_record(row, matter_number)
        parties_table.put_item(Item=party_item)
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully migrated {len(df)} cases')
    }

def determine_case_type(filename):
    if 'hair_relaxer' in filename.lower():
        return 'HAIR_RELAXER'
    elif 'nec' in filename.lower():
        return 'NEC'
    elif 'solar' in filename.lower():
        return 'SOLAR'
    elif 'tesla' in filename.lower():
        return 'TESLA'
    elif 'zantac' in filename.lower():
        return 'ZANTAC'
    else:
        return 'UNKNOWN'

def generate_matter_number(case_type, index):
    year = datetime.now().year
    return f"{case_type[:2]}{year}{index:04d}"

def transform_to_sherlock_format(row, matter_number, case_type):
    # Transform Excel row to Sherlock AI format
    return {
        'PK': f'MATTER#{case_type}#{matter_number}',
        'SK': f'CASE_META#{datetime.now().isoformat()}',
        'matter_number': matter_number,
        'case_type': case_type,
        'matter_type': 'MASS_TORT',
        # Add more field mappings based on Excel structure
    }

def create_party_record(row, matter_number):
    # Create injured party record
    return {
        'PK': f'MATTER#{matter_number}',
        'SK': f'PARTY#INJURED_PARTY#IP001#{datetime.now().isoformat()}',
        'party_type': 'INJURED_PARTY',
        # Add more party field mappings
    }
      `),
            role: adminRole,
            timeout: cdk.Duration.minutes(15),
            memorySize: 1024,
            logRetention: logs.RetentionDays.ONE_YEAR,
        });
        // === API GATEWAY FOR SALESFORCE INTEGRATION ===
        const sherlockAPI = new apigateway.RestApi(this, 'SherlockAPI', {
            restApiName: 'Sherlock AI Legal Database API',
            description: 'API for Salesforce integration with Sherlock AI legal database',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
            },
            apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
        });
        // API Key for Salesforce
        const salesforceApiKey = new apigateway.ApiKey(this, 'SalesforceAPIKey', {
            apiKeyName: 'salesforce-sherlock-integration',
            description: 'API Key for Salesforce integration',
        });
        // Usage Plan
        const usagePlan = new apigateway.UsagePlan(this, 'SherlockUsagePlan', {
            name: 'sherlock-salesforce-usage-plan',
            throttle: {
                rateLimit: 100,
                burstLimit: 200,
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.MONTH,
            },
        });
        usagePlan.addApiKey(salesforceApiKey);
        usagePlan.addApiStage({
            stage: sherlockAPI.deploymentStage,
        });
        // === OUTPUTS ===
        new cdk.CfnOutput(this, 'SherlockAPIEndpoint', {
            value: sherlockAPI.url,
            description: 'Sherlock AI API Gateway endpoint for Salesforce integration',
        });
        new cdk.CfnOutput(this, 'SalesforceAPIKeyId', {
            value: salesforceApiKey.keyId,
            description: 'API Key ID for Salesforce Named Credential',
        });
        new cdk.CfnOutput(this, 'KMSKeyArn', {
            value: sherlockKMSKey.keyArn,
            description: 'KMS Key ARN for encryption',
        });
        new cdk.CfnOutput(this, 'PrivilegedDocsBucketName', {
            value: privilegedDocsBucket.bucketName,
            description: 'S3 bucket for privileged legal documents',
        });
        new cdk.CfnOutput(this, 'MedicalRecordsBucketName', {
            value: medicalRecordsBucket.bucketName,
            description: 'S3 bucket for medical records (HIPAA compliant)',
        });
    }
}
exports.SherlockAILegalDatabaseStack = SherlockAILegalDatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyxxREFBcUQ7QUFDckQseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUN6RCw2Q0FBNkM7QUFHN0MsTUFBYSw0QkFBNkIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3pELFdBQVcsRUFBRSxtREFBbUQ7WUFDaEUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZTtZQUN0QyxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUI7WUFDdEMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsMEJBQTBCO1NBQ3BFLENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3pDLFNBQVMsRUFBRSw0QkFBNEI7WUFDdkMsU0FBUyxFQUFFLGNBQWM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsMENBQTBDO1FBRTFDLDhCQUE4QjtRQUM5QixNQUFNLG9CQUFvQixHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsOEJBQThCLEVBQUU7WUFDL0UsVUFBVSxFQUFFLGtDQUFrQztZQUM5QyxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7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QUFXLEVBQUUsNEJBQTRCO1NBQzFDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDbEQsS0FBSyxFQUFFLG9CQUFvQixDQUFDLFVBQVU7WUFDdEMsV0FBVyxFQUFFLDBDQUEwQztTQUN4RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ2xELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxVQUFVO1lBQ3RDLFdBQVcsRUFBRSxpREFBaUQ7U0FDL0QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOWdCRCxvRUE4Z0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcclxuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcclxuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBTaGVybG9ja0FJTGVnYWxEYXRhYmFzZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvLyA9PT0gS01TIEtFWSBGT1IgRU5DUllQVElPTiA9PT1cclxuICAgIGNvbnN0IHNoZXJsb2NrS01TS2V5ID0gbmV3IGttcy5LZXkodGhpcywgJ1NoZXJsb2NrS01TS2V5Jywge1xyXG4gICAgICBkZXNjcmlwdGlvbjogJ0tNUyBLZXkgZm9yIFNoZXJsb2NrIEFJIExlZ2FsIERhdGFiYXNlIGVuY3J5cHRpb24nLFxyXG4gICAgICBrZXlVc2FnZToga21zLktleVVzYWdlLkVOQ1JZUFRfREVDUllQVCxcclxuICAgICAga2V5U3BlYzoga21zLktleVNwZWMuU1lNTUVUUklDX0RFRkFVTFQsXHJcbiAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sIC8vIE5ldmVyIGRlbGV0ZSBsZWdhbCBkYXRhXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBLTVMgS2V5IEFsaWFzXHJcbiAgICBuZXcga21zLkFsaWFzKHRoaXMsICdTaGVybG9ja0tNU0tleUFsaWFzJywge1xyXG4gICAgICBhbGlhc05hbWU6ICdhbGlhcy9zaGVybG9jay1haS1sZWdhbC1kYicsXHJcbiAgICAgIHRhcmdldEtleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT0gUzMgQlVDS0VUUyBGT1IgRE9DVU1FTlQgU1RPUkFHRSA9PT1cclxuICAgIFxyXG4gICAgLy8gUHJpdmlsZWdlZCBEb2N1bWVudHMgQnVja2V0XHJcbiAgICBjb25zdCBwcml2aWxlZ2VkRG9jc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1NoZXJsb2NrUHJpdmlsZWdlZERvY3NCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6ICdzaGVybG9jay1haS1wcml2aWxlZ2VkLWRvY3VtZW50cycsXHJcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxyXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxyXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxyXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAnTGVnYWxSZXRlbnRpb25SdWxlJyxcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB0cmFuc2l0aW9uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuSU5GUkVRVUVOVF9BQ0NFU1MsXHJcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyg5MCksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5HTEFDSUVSLFxyXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzY1KSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkRFRVBfQVJDSElWRSxcclxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDI1NTUpLCAvLyA3IHllYXJzXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE1lZGljYWwgUmVjb3JkcyBCdWNrZXRcclxuICAgIGNvbnN0IG1lZGljYWxSZWNvcmRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnU2hlcmxvY2tNZWRpY2FsUmVjb3Jkc0J1Y2tldCcsIHtcclxuICAgICAgYnVja2V0TmFtZTogJ3NoZXJsb2NrLWFpLW1lZGljYWwtcmVjb3JkcycsXHJcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxyXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxyXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxyXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAnSElQQUFSZXRlbnRpb25SdWxlJyxcclxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB0cmFuc2l0aW9uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcclxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDczMCksIC8vIDIgeWVhcnNcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ29tbXVuaWNhdGlvbnMgQXJjaGl2ZSBCdWNrZXRcclxuICAgIGNvbnN0IGNvbW11bmljYXRpb25zQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnU2hlcmxvY2tDb21tdW5pY2F0aW9uc0J1Y2tldCcsIHtcclxuICAgICAgYnVja2V0TmFtZTogJ3NoZXJsb2NrLWFpLWNvbW11bmljYXRpb25zJyxcclxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5LTVMsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXHJcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXHJcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PSBEWU5BTU9EQiBUQUJMRVMgPT09XHJcblxyXG4gICAgLy8gTWFpbiBDYXNlcyBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tDYXNlc01haW4gPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrQ2FzZXNNYWluJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay1jYXNlcy1tYWluJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHU0kxOiBMaXRpZ2F0aW9uIFN0YXR1cyAmIENyaXRpY2FsIERhdGVzXHJcbiAgICBzaGVybG9ja0Nhc2VzTWFpbi5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEtTGl0aWdhdGlvblN0YXR1cycsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMVBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMVNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdTSTI6IEF0dG9ybmV5IFdvcmtsb2FkIE1hbmFnZW1lbnQgIFxyXG4gICAgc2hlcmxvY2tDYXNlc01haW4uYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kyLUF0dG9ybmV5V29ya2xvYWQnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTJQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTJTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHU0kzOiBKdXJpc2RpY3Rpb24gJiBDYXNlIFR5cGUgQW5hbHlzaXNcclxuICAgIHNoZXJsb2NrQ2FzZXNNYWluLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMy1KdXJpc2RpY3Rpb25DYXNlVHlwZScsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJM1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJM1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdTSTQ6IENsaWVudC1NYXR0ZXIgUmVsYXRpb25zaGlwXHJcbiAgICBzaGVybG9ja0Nhc2VzTWFpbi5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTQtQ2xpZW50TWF0dGVyJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0k0UEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0k0U0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGFydGllcyAmIFJvbGVzIFRhYmxlXHJcbiAgICBjb25zdCBzaGVybG9ja1BhcnRpZXNSb2xlcyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2hlcmxvY2tQYXJ0aWVzUm9sZXMnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogJ3NoZXJsb2NrLXBhcnRpZXMtcm9sZXMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIHNoZXJsb2NrUGFydGllc1JvbGVzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMS1QYXJ0eVR5cGUnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMZWdhbCBSZXByZXNlbnRhdGl2ZXMgVGFibGVcclxuICAgIGNvbnN0IHNoZXJsb2NrTGVnYWxSZXBzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTaGVybG9ja0xlZ2FsUmVwcmVzZW50YXRpdmVzJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay1sZWdhbC1yZXByZXNlbnRhdGl2ZXMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdpdG5lc3NlcyBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tXaXRuZXNzZXMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrV2l0bmVzc2VzJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay13aXRuZXNzZXMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIHNoZXJsb2NrV2l0bmVzc2VzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMS1XaXRuZXNzVHlwZScsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMVBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMVNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE1lZGljYWwgUmVjb3JkcyBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tNZWRpY2FsUmVjb3JkcyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2hlcmxvY2tNZWRpY2FsUmVjb3JkcycsIHtcclxuICAgICAgdGFibGVOYW1lOiAnc2hlcmxvY2stbWVkaWNhbC1yZWNvcmRzJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja01lZGljYWxSZWNvcmRzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMS1Qcm92aWRlclNwZWNpYWx0eScsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMVBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMVNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIHNoZXJsb2NrTWVkaWNhbFJlY29yZHMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kyLUNhdXNhdGlvbk9waW5pb24nLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTJQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTJTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBGaW5hbmNpYWwgTGVkZ2VyIFRhYmxlXHJcbiAgICBjb25zdCBzaGVybG9ja0ZpbmFuY2lhbExlZGdlciA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2hlcmxvY2tGaW5hbmNpYWxMZWRnZXInLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogJ3NoZXJsb2NrLWZpbmFuY2lhbC1sZWRnZXInLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIHNoZXJsb2NrRmluYW5jaWFsTGVkZ2VyLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMS1UcmFuc2FjdGlvblR5cGUnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja0ZpbmFuY2lhbExlZGdlci5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTItVHJ1c3RBY2NvdW50JyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kyUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kyU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG9jdW1lbnRzIFRhYmxlXHJcbiAgICBjb25zdCBzaGVybG9ja0RvY3VtZW50cyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2hlcmxvY2tEb2N1bWVudHMnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogJ3NoZXJsb2NrLWRvY3VtZW50cycsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2hlcmxvY2tEb2N1bWVudHMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kxLVByaXZpbGVnZVR5cGUnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja0RvY3VtZW50cy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTItRG9jdW1lbnRDYXRlZ29yeScsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMlBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMlNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PSBJQU0gUk9MRVMgRk9SIExFR0FMIFNUQUZGID09PVxyXG5cclxuICAgIC8vIEF0dG9ybmV5IFJvbGUgLSBGdWxsIEFjY2Vzc1xyXG4gICAgY29uc3QgYXR0b3JuZXlSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdTaGVybG9ja0F0dG9ybmV5Um9sZScsIHtcclxuICAgICAgcm9sZU5hbWU6ICdzaGVybG9jay1hdHRvcm5leS1yb2xlJyxcclxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRnVsbCBhY2Nlc3Mgcm9sZSBmb3IgYXR0b3JuZXlzIGluIFNoZXJsb2NrIEFJIHN5c3RlbScsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQYXJhbGVnYWwgUm9sZSAtIExpbWl0ZWQgQWNjZXNzXHJcbiAgICBjb25zdCBwYXJhbGVnYWxSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdTaGVybG9ja1BhcmFsZWdhbFJvbGUnLCB7XHJcbiAgICAgIHJvbGVOYW1lOiAnc2hlcmxvY2stcGFyYWxlZ2FsLXJvbGUnLCBcclxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGltaXRlZCBhY2Nlc3Mgcm9sZSBmb3IgcGFyYWxlZ2FscyBpbiBTaGVybG9jayBBSSBzeXN0ZW0nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWRtaW4gUm9sZSAtIFN5c3RlbSBNYW5hZ2VtZW50XHJcbiAgICBjb25zdCBhZG1pblJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1NoZXJsb2NrQWRtaW5Sb2xlJywge1xyXG4gICAgICByb2xlTmFtZTogJ3NoZXJsb2NrLWFkbWluLXJvbGUnLFxyXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgZGVzY3JpcHRpb246ICdBZG1pbmlzdHJhdGl2ZSBhY2Nlc3Mgcm9sZSBmb3Igc3lzdGVtIG1hbmFnZW1lbnQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgdG8gcm9sZXNcclxuICAgIGNvbnN0IGFsbFRhYmxlcyA9IFtcclxuICAgICAgc2hlcmxvY2tDYXNlc01haW4sXHJcbiAgICAgIHNoZXJsb2NrUGFydGllc1JvbGVzLFxyXG4gICAgICBzaGVybG9ja0xlZ2FsUmVwcyxcclxuICAgICAgc2hlcmxvY2tXaXRuZXNzZXMsXHJcbiAgICAgIHNoZXJsb2NrTWVkaWNhbFJlY29yZHMsXHJcbiAgICAgIHNoZXJsb2NrRmluYW5jaWFsTGVkZ2VyLFxyXG4gICAgICBzaGVybG9ja0RvY3VtZW50cyxcclxuICAgIF07XHJcblxyXG4gICAgLy8gQXR0b3JuZXkgLSBGdWxsIEFjY2Vzc1xyXG4gICAgYWxsVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICB0YWJsZS5ncmFudEZ1bGxBY2Nlc3MoYXR0b3JuZXlSb2xlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIFtwcml2aWxlZ2VkRG9jc0J1Y2tldCwgbWVkaWNhbFJlY29yZHNCdWNrZXQsIGNvbW11bmljYXRpb25zQnVja2V0XS5mb3JFYWNoKGJ1Y2tldCA9PiB7XHJcbiAgICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShhdHRvcm5leVJvbGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGFyYWxlZ2FsIC0gUmVhZC9Xcml0ZSBidXQgbm8gZGVsZXRlXHJcbiAgICBhbGxUYWJsZXMuZm9yRWFjaCh0YWJsZSA9PiB7XHJcbiAgICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShwYXJhbGVnYWxSb2xlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIFtwcml2aWxlZ2VkRG9jc0J1Y2tldCwgbWVkaWNhbFJlY29yZHNCdWNrZXQsIGNvbW11bmljYXRpb25zQnVja2V0XS5mb3JFYWNoKGJ1Y2tldCA9PiB7XHJcbiAgICAgIGJ1Y2tldC5ncmFudFJlYWQocGFyYWxlZ2FsUm9sZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT0gTEFNQkRBIEZVTkNUSU9OUyA9PT1cclxuXHJcbiAgICAvLyBTdGF0dXRlIG9mIExpbWl0YXRpb25zIE1vbml0b3JcclxuICAgIGNvbnN0IHNvbE1vbml0b3JGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1NPTE1vbml0b3JGdW5jdGlvbicsIHtcclxuICAgICAgZnVuY3Rpb25OYW1lOiAnc2hlcmxvY2stc29sLW1vbml0b3InLFxyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcclxuICAgICAgaGFuZGxlcjogJ3NvbF9tb25pdG9yLmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcclxuaW1wb3J0IGpzb25cclxuaW1wb3J0IGJvdG8zXHJcbmZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGV0aW1lLCB0aW1lZGVsdGFcclxuZnJvbSBkZWNpbWFsIGltcG9ydCBEZWNpbWFsXHJcblxyXG5kZWYgaGFuZGxlcihldmVudCwgY29udGV4dCk6XHJcbiAgICBcIlwiXCJcclxuICAgIE1vbml0b3IgY2FzZXMgYXBwcm9hY2hpbmcgc3RhdHV0ZSBvZiBsaW1pdGF0aW9ucyBkZWFkbGluZXMuXHJcbiAgICBTZW5kIGFsZXJ0cyBmb3IgY2FzZXMgd2l0aGluIDkwLCA2MCwgMzAsIGFuZCA3IGRheXMgb2YgU09MIGV4cGlyeS5cclxuICAgIFwiXCJcIlxyXG4gICAgXHJcbiAgICBkeW5hbW9kYiA9IGJvdG8zLnJlc291cmNlKCdkeW5hbW9kYicpXHJcbiAgICB0YWJsZSA9IGR5bmFtb2RiLlRhYmxlKCdzaGVybG9jay1jYXNlcy1tYWluJylcclxuICAgIFxyXG4gICAgIyBDYWxjdWxhdGUgYWxlcnQgdGhyZXNob2xkc1xyXG4gICAgdG9kYXkgPSBkYXRldGltZS5ub3coKS5kYXRlKClcclxuICAgIGFsZXJ0X3RocmVzaG9sZHMgPSBbOTAsIDYwLCAzMCwgN10gICMgRGF5cyBiZWZvcmUgZXhwaXJ5XHJcbiAgICBcclxuICAgIGFsZXJ0cyA9IFtdXHJcbiAgICBcclxuICAgIGZvciBkYXlzIGluIGFsZXJ0X3RocmVzaG9sZHM6XHJcbiAgICAgICAgYWxlcnRfZGF0ZSA9IHRvZGF5ICsgdGltZWRlbHRhKGRheXM9ZGF5cylcclxuICAgICAgICBcclxuICAgICAgICAjIFF1ZXJ5IEdTSTEgZm9yIGNhc2VzIGJ5IFNPTCBkYXRlXHJcbiAgICAgICAgcmVzcG9uc2UgPSB0YWJsZS5xdWVyeShcclxuICAgICAgICAgICAgSW5kZXhOYW1lPSdHU0kxLUxpdGlnYXRpb25TdGF0dXMnLFxyXG4gICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uPSdHU0kxUEsgPSA6c3RhdHVzIEFORCBiZWdpbnNfd2l0aChHU0kxU0ssIDpzb2xfcHJlZml4KScsXHJcbiAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM9e1xyXG4gICAgICAgICAgICAgICAgJzpzdGF0dXMnOiAnTElUSUdBVElPTl9TVEFUVVMjQUNUSVZFX0RJU0NPVkVSWScsXHJcbiAgICAgICAgICAgICAgICAnOnNvbF9wcmVmaXgnOiBmJ1NUQVRVVEVfRVhQSVJZI3thbGVydF9kYXRlLnN0cmZ0aW1lKFwiJVktJW0tJWRcIil9J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciBpdGVtIGluIHJlc3BvbnNlWydJdGVtcyddOlxyXG4gICAgICAgICAgICBhbGVydCA9IHtcclxuICAgICAgICAgICAgICAgICdtYXR0ZXJfbnVtYmVyJzogaXRlbVsnbWF0dGVyX251bWJlciddLFxyXG4gICAgICAgICAgICAgICAgJ2Nhc2VfY2FwdGlvbic6IGl0ZW1bJ2Nhc2VfY2FwdGlvbiddLFxyXG4gICAgICAgICAgICAgICAgJ3NvbF9leHBpcnlfZGF0ZSc6IGl0ZW1bJ3N0YXR1dGVfb2ZfbGltaXRhdGlvbnNfZXhwaXJ5J10sXHJcbiAgICAgICAgICAgICAgICAnZGF5c19yZW1haW5pbmcnOiBkYXlzLFxyXG4gICAgICAgICAgICAgICAgJ2xlYWRfY291bnNlbCc6IGl0ZW1bJ2xlYWRfY291bnNlbF9pZCddLFxyXG4gICAgICAgICAgICAgICAgJ2FsZXJ0X2xldmVsJzogJ0NSSVRJQ0FMJyBpZiBkYXlzIDw9IDMwIGVsc2UgJ0hJR0gnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWxlcnRzLmFwcGVuZChhbGVydClcclxuICAgIFxyXG4gICAgIyBTZW5kIGFsZXJ0cyAoaW1wbGVtZW50IFNOUyBub3RpZmljYXRpb24gaGVyZSlcclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAnc3RhdHVzQ29kZSc6IDIwMCxcclxuICAgICAgICAnYm9keSc6IGpzb24uZHVtcHMoe1xyXG4gICAgICAgICAgICAnYWxlcnRzX2dlbmVyYXRlZCc6IGxlbihhbGVydHMpLFxyXG4gICAgICAgICAgICAnYWxlcnRzJzogYWxlcnRzXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgICAgYCksXHJcbiAgICAgIHJvbGU6IGF0dG9ybmV5Um9sZSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9ZRUFSLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2FzZSBEYXRhIE1pZ3JhdGlvbiBGdW5jdGlvblxyXG4gICAgY29uc3QgZGF0YU1pZ3JhdGlvbkZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRGF0YU1pZ3JhdGlvbkZ1bmN0aW9uJywge1xyXG4gICAgICBmdW5jdGlvbk5hbWU6ICdzaGVybG9jay1kYXRhLW1pZ3JhdGlvbicsXHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzExLFxyXG4gICAgICBoYW5kbGVyOiAnZGF0YV9taWdyYXRpb24uaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxyXG5pbXBvcnQganNvblxyXG5pbXBvcnQgYm90bzNcclxuaW1wb3J0IHBhbmRhcyBhcyBwZFxyXG5mcm9tIGRlY2ltYWwgaW1wb3J0IERlY2ltYWxcclxuZnJvbSBkYXRldGltZSBpbXBvcnQgZGF0ZXRpbWVcclxuXHJcbmRlZiBoYW5kbGVyKGV2ZW50LCBjb250ZXh0KTpcclxuICAgIFwiXCJcIlxyXG4gICAgTWlncmF0ZSBjYXNlIGRhdGEgZnJvbSBFeGNlbCBmaWxlcyB0byBTaGVybG9jayBBSSBEeW5hbW9EQiBzdHJ1Y3R1cmUuXHJcbiAgICBFeHBlY3RlZCB0byByZWNlaXZlIFMzIGV2ZW50IHdpdGggRXhjZWwgZmlsZSBsb2NhdGlvbi5cclxuICAgIFwiXCJcIlxyXG4gICAgXHJcbiAgICBkeW5hbW9kYiA9IGJvdG8zLnJlc291cmNlKCdkeW5hbW9kYicpXHJcbiAgICBzMyA9IGJvdG8zLmNsaWVudCgnczMnKVxyXG4gICAgXHJcbiAgICAjIEV4dHJhY3QgYnVja2V0IGFuZCBrZXkgZnJvbSBldmVudFxyXG4gICAgYnVja2V0ID0gZXZlbnRbJ1JlY29yZHMnXVswXVsnczMnXVsnYnVja2V0J11bJ25hbWUnXVxyXG4gICAga2V5ID0gZXZlbnRbJ1JlY29yZHMnXVswXVsnczMnXVsnb2JqZWN0J11bJ2tleSddXHJcbiAgICBcclxuICAgICMgRG93bmxvYWQgYW5kIHByb2Nlc3MgRXhjZWwgZmlsZVxyXG4gICAgb2JqID0gczMuZ2V0X29iamVjdChCdWNrZXQ9YnVja2V0LCBLZXk9a2V5KVxyXG4gICAgZGYgPSBwZC5yZWFkX2V4Y2VsKG9ialsnQm9keSddLnJlYWQoKSlcclxuICAgIFxyXG4gICAgIyBEZXRlcm1pbmUgY2FzZSB0eXBlIGZyb20gZmlsZW5hbWVcclxuICAgIGNhc2VfdHlwZSA9IGRldGVybWluZV9jYXNlX3R5cGUoa2V5KVxyXG4gICAgXHJcbiAgICAjIFByb2Nlc3MgZWFjaCByb3dcclxuICAgIGNhc2VzX21haW5fdGFibGUgPSBkeW5hbW9kYi5UYWJsZSgnc2hlcmxvY2stY2FzZXMtbWFpbicpXHJcbiAgICBwYXJ0aWVzX3RhYmxlID0gZHluYW1vZGIuVGFibGUoJ3NoZXJsb2NrLXBhcnRpZXMtcm9sZXMnKVxyXG4gICAgXHJcbiAgICBmb3IgaW5kZXgsIHJvdyBpbiBkZi5pdGVycm93cygpOlxyXG4gICAgICAgICMgR2VuZXJhdGUgbWF0dGVyIG51bWJlclxyXG4gICAgICAgIG1hdHRlcl9udW1iZXIgPSBnZW5lcmF0ZV9tYXR0ZXJfbnVtYmVyKGNhc2VfdHlwZSwgaW5kZXgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgIyBDcmVhdGUgbWFpbiBjYXNlIHJlY29yZFxyXG4gICAgICAgIGNhc2VfaXRlbSA9IHRyYW5zZm9ybV90b19zaGVybG9ja19mb3JtYXQocm93LCBtYXR0ZXJfbnVtYmVyLCBjYXNlX3R5cGUpXHJcbiAgICAgICAgY2FzZXNfbWFpbl90YWJsZS5wdXRfaXRlbShJdGVtPWNhc2VfaXRlbSlcclxuICAgICAgICBcclxuICAgICAgICAjIENyZWF0ZSBwYXJ0eSByZWNvcmRzXHJcbiAgICAgICAgcGFydHlfaXRlbSA9IGNyZWF0ZV9wYXJ0eV9yZWNvcmQocm93LCBtYXR0ZXJfbnVtYmVyKVxyXG4gICAgICAgIHBhcnRpZXNfdGFibGUucHV0X2l0ZW0oSXRlbT1wYXJ0eV9pdGVtKVxyXG4gICAgXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgICdzdGF0dXNDb2RlJzogMjAwLFxyXG4gICAgICAgICdib2R5JzoganNvbi5kdW1wcyhmJ1N1Y2Nlc3NmdWxseSBtaWdyYXRlZCB7bGVuKGRmKX0gY2FzZXMnKVxyXG4gICAgfVxyXG5cclxuZGVmIGRldGVybWluZV9jYXNlX3R5cGUoZmlsZW5hbWUpOlxyXG4gICAgaWYgJ2hhaXJfcmVsYXhlcicgaW4gZmlsZW5hbWUubG93ZXIoKTpcclxuICAgICAgICByZXR1cm4gJ0hBSVJfUkVMQVhFUidcclxuICAgIGVsaWYgJ25lYycgaW4gZmlsZW5hbWUubG93ZXIoKTpcclxuICAgICAgICByZXR1cm4gJ05FQydcclxuICAgIGVsaWYgJ3NvbGFyJyBpbiBmaWxlbmFtZS5sb3dlcigpOlxyXG4gICAgICAgIHJldHVybiAnU09MQVInXHJcbiAgICBlbGlmICd0ZXNsYScgaW4gZmlsZW5hbWUubG93ZXIoKTpcclxuICAgICAgICByZXR1cm4gJ1RFU0xBJ1xyXG4gICAgZWxpZiAnemFudGFjJyBpbiBmaWxlbmFtZS5sb3dlcigpOlxyXG4gICAgICAgIHJldHVybiAnWkFOVEFDJ1xyXG4gICAgZWxzZTpcclxuICAgICAgICByZXR1cm4gJ1VOS05PV04nXHJcblxyXG5kZWYgZ2VuZXJhdGVfbWF0dGVyX251bWJlcihjYXNlX3R5cGUsIGluZGV4KTpcclxuICAgIHllYXIgPSBkYXRldGltZS5ub3coKS55ZWFyXHJcbiAgICByZXR1cm4gZlwie2Nhc2VfdHlwZVs6Ml19e3llYXJ9e2luZGV4OjA0ZH1cIlxyXG5cclxuZGVmIHRyYW5zZm9ybV90b19zaGVybG9ja19mb3JtYXQocm93LCBtYXR0ZXJfbnVtYmVyLCBjYXNlX3R5cGUpOlxyXG4gICAgIyBUcmFuc2Zvcm0gRXhjZWwgcm93IHRvIFNoZXJsb2NrIEFJIGZvcm1hdFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAnUEsnOiBmJ01BVFRFUiN7Y2FzZV90eXBlfSN7bWF0dGVyX251bWJlcn0nLFxyXG4gICAgICAgICdTSyc6IGYnQ0FTRV9NRVRBI3tkYXRldGltZS5ub3coKS5pc29mb3JtYXQoKX0nLFxyXG4gICAgICAgICdtYXR0ZXJfbnVtYmVyJzogbWF0dGVyX251bWJlcixcclxuICAgICAgICAnY2FzZV90eXBlJzogY2FzZV90eXBlLFxyXG4gICAgICAgICdtYXR0ZXJfdHlwZSc6ICdNQVNTX1RPUlQnLFxyXG4gICAgICAgICMgQWRkIG1vcmUgZmllbGQgbWFwcGluZ3MgYmFzZWQgb24gRXhjZWwgc3RydWN0dXJlXHJcbiAgICB9XHJcblxyXG5kZWYgY3JlYXRlX3BhcnR5X3JlY29yZChyb3csIG1hdHRlcl9udW1iZXIpOlxyXG4gICAgIyBDcmVhdGUgaW5qdXJlZCBwYXJ0eSByZWNvcmRcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgJ1BLJzogZidNQVRURVIje21hdHRlcl9udW1iZXJ9JyxcclxuICAgICAgICAnU0snOiBmJ1BBUlRZI0lOSlVSRURfUEFSVFkjSVAwMDEje2RhdGV0aW1lLm5vdygpLmlzb2Zvcm1hdCgpfScsXHJcbiAgICAgICAgJ3BhcnR5X3R5cGUnOiAnSU5KVVJFRF9QQVJUWScsXHJcbiAgICAgICAgIyBBZGQgbW9yZSBwYXJ0eSBmaWVsZCBtYXBwaW5nc1xyXG4gICAgfVxyXG4gICAgICBgKSxcclxuICAgICAgcm9sZTogYWRtaW5Sb2xlLFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxNSksXHJcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9ZRUFSLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09IEFQSSBHQVRFV0FZIEZPUiBTQUxFU0ZPUkNFIElOVEVHUkFUSU9OID09PVxyXG4gICAgY29uc3Qgc2hlcmxvY2tBUEkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdTaGVybG9ja0FQSScsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6ICdTaGVybG9jayBBSSBMZWdhbCBEYXRhYmFzZSBBUEknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgU2FsZXNmb3JjZSBpbnRlZ3JhdGlvbiB3aXRoIFNoZXJsb2NrIEFJIGxlZ2FsIGRhdGFiYXNlJyxcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXHJcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLUFtei1EYXRlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BcGktS2V5J10sXHJcbiAgICAgIH0sXHJcbiAgICAgIGFwaUtleVNvdXJjZVR5cGU6IGFwaWdhdGV3YXkuQXBpS2V5U291cmNlVHlwZS5IRUFERVIsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBUEkgS2V5IGZvciBTYWxlc2ZvcmNlXHJcbiAgICBjb25zdCBzYWxlc2ZvcmNlQXBpS2V5ID0gbmV3IGFwaWdhdGV3YXkuQXBpS2V5KHRoaXMsICdTYWxlc2ZvcmNlQVBJS2V5Jywge1xyXG4gICAgICBhcGlLZXlOYW1lOiAnc2FsZXNmb3JjZS1zaGVybG9jay1pbnRlZ3JhdGlvbicsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEtleSBmb3IgU2FsZXNmb3JjZSBpbnRlZ3JhdGlvbicsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVc2FnZSBQbGFuXHJcbiAgICBjb25zdCB1c2FnZVBsYW4gPSBuZXcgYXBpZ2F0ZXdheS5Vc2FnZVBsYW4odGhpcywgJ1NoZXJsb2NrVXNhZ2VQbGFuJywge1xyXG4gICAgICBuYW1lOiAnc2hlcmxvY2stc2FsZXNmb3JjZS11c2FnZS1wbGFuJyxcclxuICAgICAgdGhyb3R0bGU6IHtcclxuICAgICAgICByYXRlTGltaXQ6IDEwMCxcclxuICAgICAgICBidXJzdExpbWl0OiAyMDAsXHJcbiAgICAgIH0sXHJcbiAgICAgIHF1b3RhOiB7XHJcbiAgICAgICAgbGltaXQ6IDEwMDAwLFxyXG4gICAgICAgIHBlcmlvZDogYXBpZ2F0ZXdheS5QZXJpb2QuTU9OVEgsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICB1c2FnZVBsYW4uYWRkQXBpS2V5KHNhbGVzZm9yY2VBcGlLZXkpO1xyXG4gICAgdXNhZ2VQbGFuLmFkZEFwaVN0YWdlKHtcclxuICAgICAgc3RhZ2U6IHNoZXJsb2NrQVBJLmRlcGxveW1lbnRTdGFnZSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PSBPVVRQVVRTID09PVxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NoZXJsb2NrQVBJRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBzaGVybG9ja0FQSS51cmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2hlcmxvY2sgQUkgQVBJIEdhdGV3YXkgZW5kcG9pbnQgZm9yIFNhbGVzZm9yY2UgaW50ZWdyYXRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NhbGVzZm9yY2VBUElLZXlJZCcsIHtcclxuICAgICAgdmFsdWU6IHNhbGVzZm9yY2VBcGlLZXkua2V5SWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEtleSBJRCBmb3IgU2FsZXNmb3JjZSBOYW1lZCBDcmVkZW50aWFsJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdLTVNLZXlBcm4nLCB7XHJcbiAgICAgIHZhbHVlOiBzaGVybG9ja0tNU0tleS5rZXlBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnS01TIEtleSBBUk4gZm9yIGVuY3J5cHRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1ByaXZpbGVnZWREb2NzQnVja2V0TmFtZScsIHtcclxuICAgICAgdmFsdWU6IHByaXZpbGVnZWREb2NzQnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBwcml2aWxlZ2VkIGxlZ2FsIGRvY3VtZW50cycsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTWVkaWNhbFJlY29yZHNCdWNrZXROYW1lJywge1xyXG4gICAgICB2YWx1ZTogbWVkaWNhbFJlY29yZHNCdWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGljYWwgcmVjb3JkcyAoSElQQUEgY29tcGxpYW50KScsXHJcbiAgICB9KTtcclxuICB9XHJcbn0gIl19
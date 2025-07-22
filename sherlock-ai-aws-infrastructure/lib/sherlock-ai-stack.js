"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SherlockAILegalDatabaseStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const s3 = require("aws-cdk-lib/aws-s3");
const kms = require("aws-cdk-lib/aws-kms");
const iam = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlcmxvY2stYWktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaGVybG9jay1haS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMscURBQXFEO0FBQ3JELHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBRTNDLHlEQUF5RDtBQUl6RCxNQUFhLDRCQUE2QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3pELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUNBQWlDO1FBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDekQsV0FBVyxFQUFFLG1EQUFtRDtZQUNoRSxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlO1lBQ3RDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQjtZQUN0QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSwwQkFBMEI7U0FDcEUsQ0FBQyxDQUFDO1FBRUgsZ0JBQWdCO1FBQ2hCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDekMsU0FBUyxFQUFFLDRCQUE0QjtZQUN2QyxTQUFTLEVBQUUsY0FBYztTQUMxQixDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFFMUMsOEJBQThCO1FBQzlCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSw4QkFBOEIsRUFBRTtZQUMvRSxVQUFVLEVBQUUsa0NBQWtDO1lBQzlDLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsR0FBRztZQUNuQyxhQUFhLEVBQUUsY0FBYztZQUM3QixTQUFTLEVBQUUsSUFBSTtZQUNmLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxFQUFFLEVBQUUsb0JBQW9CO29CQUN4QixPQUFPLEVBQUUsSUFBSTtvQkFDYixXQUFXLEVBQUU7d0JBQ1g7NEJBQ0UsWUFBWSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsaUJBQWlCOzRCQUMvQyxlQUFlLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3lCQUN2Qzt3QkFDRDs0QkFDRSxZQUFZLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPOzRCQUNyQyxlQUFlLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO3lCQUN4Qzt3QkFDRDs0QkFDRSxZQUFZLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZOzRCQUMxQyxlQUFlLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVTt5QkFDckQ7cUJBQ0Y7aUJBQ0Y7YUFDRjtZQUNELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO1FBRUgseUJBQXlCO1FBQ3pCLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSw4QkFBOEIsRUFBRTtZQUMvRSxVQUFVLEVBQUUsNkJBQTZCO1lBQ3pDLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsR0FBRztZQUNuQyxhQUFhLEVBQUUsY0FBYztZQUM3QixTQUFTLEVBQUUsSUFBSTtZQUNmLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxFQUFFLEVBQUUsb0JBQW9CO29CQUN4QixPQUFPLEVBQUUsSUFBSTtvQkFDYixXQUFXLEVBQUU7d0JBQ1g7NEJBQ0UsWUFBWSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTzs0QkFDckMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFVBQVU7eUJBQ3BEO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILGdDQUFnQztRQUNoQyxNQUFNLG9CQUFvQixHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsOEJBQThCLEVBQUU7WUFDL0UsVUFBVSxFQUFFLDRCQUE0QjtZQUN4QyxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7WUFDbkMsYUFBYSxFQUFFLGNBQWM7WUFDN0IsU0FBUyxFQUFFLElBQUk7WUFDZixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxVQUFVLEVBQUUsSUFBSTtZQUNoQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUUxQixtQkFBbUI7UUFDbkIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3RFLFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0I7WUFDckQsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILDJDQUEyQztRQUMzQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQztZQUN4QyxTQUFTLEVBQUUsdUJBQXVCO1lBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ2pFLENBQUMsQ0FBQztRQUVILHVDQUF1QztRQUN2QyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQztZQUN4QyxTQUFTLEVBQUUsdUJBQXVCO1lBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ2pFLENBQUMsQ0FBQztRQUVILDBDQUEwQztRQUMxQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQztZQUN4QyxTQUFTLEVBQUUsMkJBQTJCO1lBQ3RDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ2pFLENBQUMsQ0FBQztRQUVILG1DQUFtQztRQUNuQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQztZQUN4QyxTQUFTLEVBQUUsbUJBQW1CO1lBQzlCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ2pFLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixNQUFNLG9CQUFvQixHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDNUUsU0FBUyxFQUFFLHdCQUF3QjtZQUNuQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUM1RCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLGdCQUFnQjtZQUNyRCxhQUFhLEVBQUUsY0FBYztZQUM3QixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CLENBQUMsdUJBQXVCLENBQUM7WUFDM0MsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNqRSxDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1lBQ2pGLFNBQVMsRUFBRSxnQ0FBZ0M7WUFDM0MsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0I7WUFDckQsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLGlCQUFpQixHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDdEUsU0FBUyxFQUFFLG9CQUFvQjtZQUMvQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUM1RCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLGdCQUFnQjtZQUNyRCxhQUFhLEVBQUUsY0FBYztZQUM3QixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCLENBQUMsdUJBQXVCLENBQUM7WUFDeEMsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNqRSxDQUFDLENBQUM7UUFFSCx3QkFBd0I7UUFDeEIsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ2hGLFNBQVMsRUFBRSwwQkFBMEI7WUFDckMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0I7WUFDckQsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILHNCQUFzQixDQUFDLHVCQUF1QixDQUFDO1lBQzdDLFNBQVMsRUFBRSx3QkFBd0I7WUFDbkMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDakUsQ0FBQyxDQUFDO1FBRUgsc0JBQXNCLENBQUMsdUJBQXVCLENBQUM7WUFDN0MsU0FBUyxFQUFFLHVCQUF1QjtZQUNsQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNqRSxDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQ2xGLFNBQVMsRUFBRSwyQkFBMkI7WUFDdEMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0I7WUFDckQsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILHVCQUF1QixDQUFDLHVCQUF1QixDQUFDO1lBQzlDLFNBQVMsRUFBRSxzQkFBc0I7WUFDakMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDakUsQ0FBQyxDQUFDO1FBRUgsdUJBQXVCLENBQUMsdUJBQXVCLENBQUM7WUFDOUMsU0FBUyxFQUFFLG1CQUFtQjtZQUM5QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNqRSxDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3RFLFNBQVMsRUFBRSxvQkFBb0I7WUFDL0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0I7WUFDckQsYUFBYSxFQUFFLGNBQWM7WUFDN0IsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILGlCQUFpQixDQUFDLHVCQUF1QixDQUFDO1lBQ3hDLFNBQVMsRUFBRSxvQkFBb0I7WUFDL0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDakUsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCLENBQUMsdUJBQXVCLENBQUM7WUFDeEMsU0FBUyxFQUFFLHVCQUF1QjtZQUNsQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNqRSxDQUFDLENBQUM7UUFFSCxvQ0FBb0M7UUFFcEMsOEJBQThCO1FBQzlCLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDOUQsUUFBUSxFQUFFLHdCQUF3QjtZQUNsQyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUM7WUFDM0QsV0FBVyxFQUFFLHNEQUFzRDtTQUNwRSxDQUFDLENBQUM7UUFFSCxrQ0FBa0M7UUFDbEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUNoRSxRQUFRLEVBQUUseUJBQXlCO1lBQ25DLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxXQUFXLEVBQUUsMERBQTBEO1NBQ3hFLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3hELFFBQVEsRUFBRSxxQkFBcUI7WUFDL0IsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELFdBQVcsRUFBRSxrREFBa0Q7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsNkJBQTZCO1FBQzdCLE1BQU0sU0FBUyxHQUFHO1lBQ2hCLGlCQUFpQjtZQUNqQixvQkFBb0I7WUFDcEIsaUJBQWlCO1lBQ2pCLGlCQUFpQjtZQUNqQixzQkFBc0I7WUFDdEIsdUJBQXVCO1lBQ3ZCLGlCQUFpQjtTQUNsQixDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsS0FBSyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILHVDQUF1QztRQUN2QyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILGlEQUFpRDtRQUNqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUM5RCxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLFdBQVcsRUFBRSxnRUFBZ0U7WUFDN0UsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxDQUFDLGNBQWMsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQzthQUMzRTtZQUNELGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO1NBQ3JELENBQUMsQ0FBQztRQUVILHlCQUF5QjtRQUN6QixNQUFNLGdCQUFnQixHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdkUsVUFBVSxFQUFFLGlDQUFpQztZQUM3QyxXQUFXLEVBQUUsb0NBQW9DO1NBQ2xELENBQUMsQ0FBQztRQUVILGFBQWE7UUFDYixNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3BFLElBQUksRUFBRSxnQ0FBZ0M7WUFDdEMsUUFBUSxFQUFFO2dCQUNSLFNBQVMsRUFBRSxHQUFHO2dCQUNkLFVBQVUsRUFBRSxHQUFHO2FBQ2hCO1lBQ0QsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxLQUFLO2dCQUNaLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUs7YUFDaEM7U0FDRixDQUFDLENBQUM7UUFFSCxTQUFTLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdEMsU0FBUyxDQUFDLFdBQVcsQ0FBQztZQUNwQixLQUFLLEVBQUUsV0FBVyxDQUFDLGVBQWU7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDN0MsS0FBSyxFQUFFLFdBQVcsQ0FBQyxHQUFHO1lBQ3RCLFdBQVcsRUFBRSw2REFBNkQ7U0FDM0UsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsS0FBSztZQUM3QixXQUFXLEVBQUUsNENBQTRDO1NBQzFELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ25DLEtBQUssRUFBRSxjQUFjLENBQUMsTUFBTTtZQUM1QixXQUFXLEVBQUUsNEJBQTRCO1NBQzFDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDbEQsS0FBSyxFQUFFLG9CQUFvQixDQUFDLFVBQVU7WUFDdEMsV0FBVyxFQUFFLDBDQUEwQztTQUN4RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ2xELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxVQUFVO1lBQ3RDLFdBQVcsRUFBRSxpREFBaUQ7U0FDL0QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMVdELG9FQTBXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xyXG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2hlcmxvY2tBSUxlZ2FsRGF0YWJhc2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy8gPT09IEtNUyBLRVkgRk9SIEVOQ1JZUFRJT04gPT09XHJcbiAgICBjb25zdCBzaGVybG9ja0tNU0tleSA9IG5ldyBrbXMuS2V5KHRoaXMsICdTaGVybG9ja0tNU0tleScsIHtcclxuICAgICAgZGVzY3JpcHRpb246ICdLTVMgS2V5IGZvciBTaGVybG9jayBBSSBMZWdhbCBEYXRhYmFzZSBlbmNyeXB0aW9uJyxcclxuICAgICAga2V5VXNhZ2U6IGttcy5LZXlVc2FnZS5FTkNSWVBUX0RFQ1JZUFQsXHJcbiAgICAgIGtleVNwZWM6IGttcy5LZXlTcGVjLlNZTU1FVFJJQ19ERUZBVUxULFxyXG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLCAvLyBOZXZlciBkZWxldGUgbGVnYWwgZGF0YVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gS01TIEtleSBBbGlhc1xyXG4gICAgbmV3IGttcy5BbGlhcyh0aGlzLCAnU2hlcmxvY2tLTVNLZXlBbGlhcycsIHtcclxuICAgICAgYWxpYXNOYW1lOiAnYWxpYXMvc2hlcmxvY2stYWktbGVnYWwtZGInLFxyXG4gICAgICB0YXJnZXRLZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09IFMzIEJVQ0tFVFMgRk9SIERPQ1VNRU5UIFNUT1JBR0UgPT09XHJcbiAgICBcclxuICAgIC8vIFByaXZpbGVnZWQgRG9jdW1lbnRzIEJ1Y2tldFxyXG4gICAgY29uc3QgcHJpdmlsZWdlZERvY3NCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdTaGVybG9ja1ByaXZpbGVnZWREb2NzQnVja2V0Jywge1xyXG4gICAgICBidWNrZXROYW1lOiAnc2hlcmxvY2stYWktcHJpdmlsZWdlZC1kb2N1bWVudHMnLFxyXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcclxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcclxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcclxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogJ0xlZ2FsUmV0ZW50aW9uUnVsZScsXHJcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgdHJhbnNpdGlvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxyXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoOTApLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcclxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5ERUVQX0FSQ0hJVkUsXHJcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cygyNTU1KSwgLy8gNyB5ZWFyc1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBNZWRpY2FsIFJlY29yZHMgQnVja2V0XHJcbiAgICBjb25zdCBtZWRpY2FsUmVjb3Jkc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1NoZXJsb2NrTWVkaWNhbFJlY29yZHNCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6ICdzaGVybG9jay1haS1tZWRpY2FsLXJlY29yZHMnLFxyXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcclxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcclxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcclxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogJ0hJUEFBUmV0ZW50aW9uUnVsZScsXHJcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgdHJhbnNpdGlvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkdMQUNJRVIsXHJcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyg3MzApLCAvLyAyIHllYXJzXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENvbW11bmljYXRpb25zIEFyY2hpdmUgQnVja2V0XHJcbiAgICBjb25zdCBjb21tdW5pY2F0aW9uc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1NoZXJsb2NrQ29tbXVuaWNhdGlvbnNCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6ICdzaGVybG9jay1haS1jb21tdW5pY2F0aW9ucycsXHJcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TLFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxyXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxyXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT0gRFlOQU1PREIgVEFCTEVTID09PVxyXG5cclxuICAgIC8vIE1haW4gQ2FzZXMgVGFibGVcclxuICAgIGNvbnN0IHNoZXJsb2NrQ2FzZXNNYWluID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTaGVybG9ja0Nhc2VzTWFpbicsIHtcclxuICAgICAgdGFibGVOYW1lOiAnc2hlcmxvY2stY2FzZXMtbWFpbicsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR1NJMTogTGl0aWdhdGlvbiBTdGF0dXMgJiBDcml0aWNhbCBEYXRlc1xyXG4gICAgc2hlcmxvY2tDYXNlc01haW4uYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kxLUxpdGlnYXRpb25TdGF0dXMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHU0kyOiBBdHRvcm5leSBXb3JrbG9hZCBNYW5hZ2VtZW50ICBcclxuICAgIHNoZXJsb2NrQ2FzZXNNYWluLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMi1BdHRvcm5leVdvcmtsb2FkJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kyUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kyU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR1NJMzogSnVyaXNkaWN0aW9uICYgQ2FzZSBUeXBlIEFuYWx5c2lzXHJcbiAgICBzaGVybG9ja0Nhc2VzTWFpbi5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTMtSnVyaXNkaWN0aW9uQ2FzZVR5cGUnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTNQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTNTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHU0k0OiBDbGllbnQtTWF0dGVyIFJlbGF0aW9uc2hpcFxyXG4gICAgc2hlcmxvY2tDYXNlc01haW4uYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0k0LUNsaWVudE1hdHRlcicsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJNFBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJNFNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFBhcnRpZXMgJiBSb2xlcyBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tQYXJ0aWVzUm9sZXMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrUGFydGllc1JvbGVzJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay1wYXJ0aWVzLXJvbGVzJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja1BhcnRpZXNSb2xlcy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEtUGFydHlUeXBlJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kxUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTGVnYWwgUmVwcmVzZW50YXRpdmVzIFRhYmxlXHJcbiAgICBjb25zdCBzaGVybG9ja0xlZ2FsUmVwcyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnU2hlcmxvY2tMZWdhbFJlcHJlc2VudGF0aXZlcycsIHtcclxuICAgICAgdGFibGVOYW1lOiAnc2hlcmxvY2stbGVnYWwtcmVwcmVzZW50YXRpdmVzJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXaXRuZXNzZXMgVGFibGVcclxuICAgIGNvbnN0IHNoZXJsb2NrV2l0bmVzc2VzID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTaGVybG9ja1dpdG5lc3NlcycsIHtcclxuICAgICAgdGFibGVOYW1lOiAnc2hlcmxvY2std2l0bmVzc2VzJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja1dpdG5lc3Nlcy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEtV2l0bmVzc1R5cGUnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBNZWRpY2FsIFJlY29yZHMgVGFibGVcclxuICAgIGNvbnN0IHNoZXJsb2NrTWVkaWNhbFJlY29yZHMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrTWVkaWNhbFJlY29yZHMnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogJ3NoZXJsb2NrLW1lZGljYWwtcmVjb3JkcycsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxyXG4gICAgICBlbmNyeXB0aW9uS2V5OiBzaGVybG9ja0tNU0tleSxcclxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2hlcmxvY2tNZWRpY2FsUmVjb3Jkcy5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEtUHJvdmlkZXJTcGVjaWFsdHknLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja01lZGljYWxSZWNvcmRzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMi1DYXVzYXRpb25PcGluaW9uJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kyUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kyU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRmluYW5jaWFsIExlZGdlciBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tGaW5hbmNpYWxMZWRnZXIgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrRmluYW5jaWFsTGVkZ2VyJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay1maW5hbmNpYWwtbGVkZ2VyJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXHJcbiAgICAgIGVuY3J5cHRpb25LZXk6IHNoZXJsb2NrS01TS2V5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBzaGVybG9ja0ZpbmFuY2lhbExlZGdlci5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ0dTSTEtVHJhbnNhY3Rpb25UeXBlJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kxUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2hlcmxvY2tGaW5hbmNpYWxMZWRnZXIuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kyLVRydXN0QWNjb3VudCcsXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMlBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMlNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvY3VtZW50cyBUYWJsZVxyXG4gICAgY29uc3Qgc2hlcmxvY2tEb2N1bWVudHMgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1NoZXJsb2NrRG9jdW1lbnRzJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdzaGVybG9jay1kb2N1bWVudHMnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQ1VTVE9NRVJfTUFOQUdFRCxcclxuICAgICAgZW5jcnlwdGlvbktleTogc2hlcmxvY2tLTVNLZXksXHJcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcclxuICAgIH0pO1xyXG5cclxuICAgIHNoZXJsb2NrRG9jdW1lbnRzLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnR1NJMS1Qcml2aWxlZ2VUeXBlJyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kxUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2hlcmxvY2tEb2N1bWVudHMuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdHU0kyLURvY3VtZW50Q2F0ZWdvcnknLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTJQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTJTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT0gSUFNIFJPTEVTIEZPUiBMRUdBTCBTVEFGRiA9PT1cclxuXHJcbiAgICAvLyBBdHRvcm5leSBSb2xlIC0gRnVsbCBBY2Nlc3NcclxuICAgIGNvbnN0IGF0dG9ybmV5Um9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnU2hlcmxvY2tBdHRvcm5leVJvbGUnLCB7XHJcbiAgICAgIHJvbGVOYW1lOiAnc2hlcmxvY2stYXR0b3JuZXktcm9sZScsXHJcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Z1bGwgYWNjZXNzIHJvbGUgZm9yIGF0dG9ybmV5cyBpbiBTaGVybG9jayBBSSBzeXN0ZW0nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGFyYWxlZ2FsIFJvbGUgLSBMaW1pdGVkIEFjY2Vzc1xyXG4gICAgY29uc3QgcGFyYWxlZ2FsUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnU2hlcmxvY2tQYXJhbGVnYWxSb2xlJywge1xyXG4gICAgICByb2xlTmFtZTogJ3NoZXJsb2NrLXBhcmFsZWdhbC1yb2xlJywgXHJcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0xpbWl0ZWQgYWNjZXNzIHJvbGUgZm9yIHBhcmFsZWdhbHMgaW4gU2hlcmxvY2sgQUkgc3lzdGVtJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkbWluIFJvbGUgLSBTeXN0ZW0gTWFuYWdlbWVudFxyXG4gICAgY29uc3QgYWRtaW5Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdTaGVybG9ja0FkbWluUm9sZScsIHtcclxuICAgICAgcm9sZU5hbWU6ICdzaGVybG9jay1hZG1pbi1yb2xlJyxcclxuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWRtaW5pc3RyYXRpdmUgYWNjZXNzIHJvbGUgZm9yIHN5c3RlbSBtYW5hZ2VtZW50JyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIHJvbGVzXHJcbiAgICBjb25zdCBhbGxUYWJsZXMgPSBbXHJcbiAgICAgIHNoZXJsb2NrQ2FzZXNNYWluLFxyXG4gICAgICBzaGVybG9ja1BhcnRpZXNSb2xlcyxcclxuICAgICAgc2hlcmxvY2tMZWdhbFJlcHMsXHJcbiAgICAgIHNoZXJsb2NrV2l0bmVzc2VzLFxyXG4gICAgICBzaGVybG9ja01lZGljYWxSZWNvcmRzLFxyXG4gICAgICBzaGVybG9ja0ZpbmFuY2lhbExlZGdlcixcclxuICAgICAgc2hlcmxvY2tEb2N1bWVudHMsXHJcbiAgICBdO1xyXG5cclxuICAgIC8vIEF0dG9ybmV5IC0gRnVsbCBBY2Nlc3NcclxuICAgIGFsbFRhYmxlcy5mb3JFYWNoKHRhYmxlID0+IHtcclxuICAgICAgdGFibGUuZ3JhbnRGdWxsQWNjZXNzKGF0dG9ybmV5Um9sZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBbcHJpdmlsZWdlZERvY3NCdWNrZXQsIG1lZGljYWxSZWNvcmRzQnVja2V0LCBjb21tdW5pY2F0aW9uc0J1Y2tldF0uZm9yRWFjaChidWNrZXQgPT4ge1xyXG4gICAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUoYXR0b3JuZXlSb2xlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFBhcmFsZWdhbCAtIFJlYWQvV3JpdGUgYnV0IG5vIGRlbGV0ZVxyXG4gICAgYWxsVGFibGVzLmZvckVhY2godGFibGUgPT4ge1xyXG4gICAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEocGFyYWxlZ2FsUm9sZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBbcHJpdmlsZWdlZERvY3NCdWNrZXQsIG1lZGljYWxSZWNvcmRzQnVja2V0LCBjb21tdW5pY2F0aW9uc0J1Y2tldF0uZm9yRWFjaChidWNrZXQgPT4ge1xyXG4gICAgICBidWNrZXQuZ3JhbnRSZWFkKHBhcmFsZWdhbFJvbGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09IEFQSSBHQVRFV0FZIEZPUiBTQUxFU0ZPUkNFIElOVEVHUkFUSU9OID09PVxyXG4gICAgY29uc3Qgc2hlcmxvY2tBUEkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdTaGVybG9ja0FQSScsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6ICdTaGVybG9jayBBSSBMZWdhbCBEYXRhYmFzZSBBUEknLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgU2FsZXNmb3JjZSBpbnRlZ3JhdGlvbiB3aXRoIFNoZXJsb2NrIEFJIGxlZ2FsIGRhdGFiYXNlJyxcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXHJcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLUFtei1EYXRlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BcGktS2V5J10sXHJcbiAgICAgIH0sXHJcbiAgICAgIGFwaUtleVNvdXJjZVR5cGU6IGFwaWdhdGV3YXkuQXBpS2V5U291cmNlVHlwZS5IRUFERVIsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBUEkgS2V5IGZvciBTYWxlc2ZvcmNlXHJcbiAgICBjb25zdCBzYWxlc2ZvcmNlQXBpS2V5ID0gbmV3IGFwaWdhdGV3YXkuQXBpS2V5KHRoaXMsICdTYWxlc2ZvcmNlQVBJS2V5Jywge1xyXG4gICAgICBhcGlLZXlOYW1lOiAnc2FsZXNmb3JjZS1zaGVybG9jay1pbnRlZ3JhdGlvbicsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEtleSBmb3IgU2FsZXNmb3JjZSBpbnRlZ3JhdGlvbicsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVc2FnZSBQbGFuXHJcbiAgICBjb25zdCB1c2FnZVBsYW4gPSBuZXcgYXBpZ2F0ZXdheS5Vc2FnZVBsYW4odGhpcywgJ1NoZXJsb2NrVXNhZ2VQbGFuJywge1xyXG4gICAgICBuYW1lOiAnc2hlcmxvY2stc2FsZXNmb3JjZS11c2FnZS1wbGFuJyxcclxuICAgICAgdGhyb3R0bGU6IHtcclxuICAgICAgICByYXRlTGltaXQ6IDEwMCxcclxuICAgICAgICBidXJzdExpbWl0OiAyMDAsXHJcbiAgICAgIH0sXHJcbiAgICAgIHF1b3RhOiB7XHJcbiAgICAgICAgbGltaXQ6IDEwMDAwLFxyXG4gICAgICAgIHBlcmlvZDogYXBpZ2F0ZXdheS5QZXJpb2QuTU9OVEgsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICB1c2FnZVBsYW4uYWRkQXBpS2V5KHNhbGVzZm9yY2VBcGlLZXkpO1xyXG4gICAgdXNhZ2VQbGFuLmFkZEFwaVN0YWdlKHtcclxuICAgICAgc3RhZ2U6IHNoZXJsb2NrQVBJLmRlcGxveW1lbnRTdGFnZSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PSBPVVRQVVRTID09PVxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NoZXJsb2NrQVBJRW5kcG9pbnQnLCB7XHJcbiAgICAgIHZhbHVlOiBzaGVybG9ja0FQSS51cmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2hlcmxvY2sgQUkgQVBJIEdhdGV3YXkgZW5kcG9pbnQgZm9yIFNhbGVzZm9yY2UgaW50ZWdyYXRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NhbGVzZm9yY2VBUElLZXlJZCcsIHtcclxuICAgICAgdmFsdWU6IHNhbGVzZm9yY2VBcGlLZXkua2V5SWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEtleSBJRCBmb3IgU2FsZXNmb3JjZSBOYW1lZCBDcmVkZW50aWFsJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdLTVNLZXlBcm4nLCB7XHJcbiAgICAgIHZhbHVlOiBzaGVybG9ja0tNU0tleS5rZXlBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnS01TIEtleSBBUk4gZm9yIGVuY3J5cHRpb24nLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1ByaXZpbGVnZWREb2NzQnVja2V0TmFtZScsIHtcclxuICAgICAgdmFsdWU6IHByaXZpbGVnZWREb2NzQnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBwcml2aWxlZ2VkIGxlZ2FsIGRvY3VtZW50cycsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTWVkaWNhbFJlY29yZHNCdWNrZXROYW1lJywge1xyXG4gICAgICB2YWx1ZTogbWVkaWNhbFJlY29yZHNCdWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGljYWwgcmVjb3JkcyAoSElQQUEgY29tcGxpYW50KScsXHJcbiAgICB9KTtcclxuICB9XHJcbn0gIl19
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class SherlockAILegalDatabaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class SherlockMultiTableStack extends cdk.Stack {
  public readonly casesTable: dynamodb.Table;
  public readonly partiesTable: dynamodb.Table;
  public readonly medicalTable: dynamodb.Table;
  public readonly courtTable: dynamodb.Table;
  public readonly documentsTable: dynamodb.Table;
  public readonly financialTable: dynamodb.Table;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // KMS KEY - ATTORNEY-CLIENT PRIVILEGE ENCRYPTION
    // =========================================================================
    
    this.kmsKey = new kms.Key(this, 'SherlockLegalKMSKey', {
      alias: 'sherlock-ai-legal-master-key',
      description: 'Master encryption key for Sherlock AI Legal System - Attorney-Client Privileged Data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // =========================================================================
    // TABLE 1: SHERLOCK_CASES - Core Case Metadata
    // =========================================================================
    
    this.casesTable = new dynamodb.Table(this, 'SherlockCasesTable', {
      tableName: 'sherlock-cases',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl_expire_at',
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // GSI1: Case Type + Status
    this.casesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-CaseTypeStatus',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI2: Attorney Assignment
    this.casesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-AttorneyWorkload',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['matter_number', 'case_type', 'status', 'client_name', 'sol_date', 'ai_case_strength']
    });

    // GSI3: SOL Date Monitoring
    this.casesTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-SOLMonitoring',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['matter_number', 'case_type', 'assigned_attorney', 'client_name', 'days_until_sol']
    });

    // =========================================================================
    // TABLE 2: SHERLOCK_PARTIES - Parties & Relationships
    // =========================================================================
    
    this.partiesTable = new dynamodb.Table(this, 'SherlockPartiesTable', {
      tableName: 'sherlock-parties',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    this.partiesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-PartyType',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    this.partiesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-ContactInfo',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['first_name', 'last_name', 'phone', 'email', 'party_type', 'matter_number']
    });

    // =========================================================================
    // TABLE 3: SHERLOCK_MEDICAL_RECORDS - High Volume Medical Data
    // =========================================================================
    
    this.medicalTable = new dynamodb.Table(this, 'SherlockMedicalTable', {
      tableName: 'sherlock-medical-records',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl_archive_at'
    });

    this.medicalTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-RecordTimeline',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['record_id', 'provider', 'diagnosis', 'ai_causation_score', 'document_s3_path']
    });

    this.medicalTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-ProviderRecords',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['record_type', 'diagnosis', 'treatment_details', 'matter_number']
    });

    this.medicalTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-CausationEvidence',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['record_type', 'provider', 'ai_summary', 'ai_key_findings']
    });

    // =========================================================================
    // TABLE 4: SHERLOCK_COURT_RELEASES - Court Filings & Deficiencies
    // =========================================================================
    
    this.courtTable = new dynamodb.Table(this, 'SherlockCourtTable', {
      tableName: 'sherlock-court-releases',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    this.courtTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-DeficiencyDeadlines',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    this.courtTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-AssignmentTracking',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['deficiency_type', 'description', 'severity', 'matter_number', 'cure_deadline']
    });

    this.courtTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-CourtJurisdiction',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['filing_type', 'filing_status', 'matter_number', 'filing_attorney']
    });

    // =========================================================================
    // TABLE 5: SHERLOCK_DOCUMENTS - Document Links & Metadata
    // =========================================================================
    
    this.documentsTable = new dynamodb.Table(this, 'SherlockDocumentsTable', {
      tableName: 'sherlock-documents',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-DocumentType',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['filename', 's3_path', 'file_size', 'confidentiality', 'document_id']
    });

    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-SecurityAudit',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['access_log', 'encryption_status', 'matter_number', 'document_type']
    });

    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-S3Integration',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY
    });

    // =========================================================================
    // TABLE 6: SHERLOCK_FINANCIAL - Financial Tracking
    // =========================================================================
    
    this.financialTable = new dynamodb.Table(this, 'SherlockFinancialTable', {
      tableName: 'sherlock-financial',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    this.financialTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-TransactionReporting',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['amount', 'matter_number', 'description', 'settlement_status']
    });

    this.financialTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-SettlementTracking',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['settlement_amount', 'offer_date', 'matter_number', 'attorney_fees', 'client_net']
    });

    this.financialTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-ExpenseAnalysis',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['amount', 'vendor', 'description', 'billable_to_client', 'reimbursement_status']
    });

    // =========================================================================
    // LAMBDA FUNCTIONS - Data Access Layer
    // =========================================================================

    const casesApiLambda = new lambda.Function(this, 'CasesApiLambda', {
      functionName: 'sherlock-cases-api',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
cases_table = dynamodb.Table('sherlock-cases')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        if http_method == 'GET' and '/cases/' in path:
            matter_number = path.split('/')[-1]
            response = cases_table.get_item(
                Key={
                    'PK': f'MATTER#{matter_number}',
                    'SK': 'CASE#METADATA'
                }
            )
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response.get('Item', {}), default=decimal_default)
            }
            
        elif http_method == 'GET' and path == '/cases':
            query_params = event.get('queryStringParameters', {}) or {}
            case_type = query_params.get('case_type')
            
            if case_type:
                response = cases_table.query(
                    IndexName='GSI1-CaseTypeStatus',
                    KeyConditionExpression='GSI1PK = :case_type',
                    ExpressionAttributeValues={':case_type': f'CASE_TYPE#{case_type}'}
                )
            else:
                response = cases_table.scan()
                
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response.get('Items', []), default=decimal_default)
            }
            
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        CASES_TABLE: this.casesTable.tableName,
        PARTIES_TABLE: this.partiesTable.tableName,
        MEDICAL_TABLE: this.medicalTable.tableName
      }
    });

    // Grant permissions
    this.casesTable.grantReadWriteData(casesApiLambda);
    this.partiesTable.grantReadData(casesApiLambda);
    this.medicalTable.grantReadData(casesApiLambda);

    // =========================================================================
    // API GATEWAY - REST API
    // =========================================================================
    
    const api = new apigateway.RestApi(this, 'SherlockAPI', {
      restApiName: 'sherlock-ai-legal-api',
      description: 'Sherlock AI Legal Case Management API',
      deployOptions: {
        stageName: 'prod'
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      }
    });

    const casesResource = api.root.addResource('cases');
    casesResource.addMethod('GET', new apigateway.LambdaIntegration(casesApiLambda));

    const caseResource = casesResource.addResource('{matter_number}');
    caseResource.addMethod('GET', new apigateway.LambdaIntegration(casesApiLambda));

    // Add tags to all resources
    const allTables = [this.casesTable, this.partiesTable, this.medicalTable, this.courtTable, this.documentsTable, this.financialTable];
    allTables.forEach(table => {
      cdk.Tags.of(table).add('Purpose', 'LegalCaseManagement');
      cdk.Tags.of(table).add('DataClassification', 'AttorneyClientPrivileged');
      cdk.Tags.of(table).add('ComplianceRequirement', 'ABA-Rules-HIPAA');
    });

    // =========================================================================
    // OUTPUTS
    // =========================================================================
    
    new cdk.CfnOutput(this, 'CasesTableName', {
      value: this.casesTable.tableName,
      description: 'Sherlock Cases Table Name'
    });

    new cdk.CfnOutput(this, 'PartiesTableName', {
      value: this.partiesTable.tableName,
      description: 'Sherlock Parties Table Name'
    });

    new cdk.CfnOutput(this, 'MedicalTableName', {
      value: this.medicalTable.tableName,
      description: 'Sherlock Medical Records Table Name'
    });

    new cdk.CfnOutput(this, 'CourtTableName', {
      value: this.courtTable.tableName,
      description: 'Sherlock Court Releases Table Name'
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: this.documentsTable.tableName,
      description: 'Sherlock Documents Table Name'
    });

    new cdk.CfnOutput(this, 'FinancialTableName', {
      value: this.financialTable.tableName,
      description: 'Sherlock Financial Table Name'
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'Sherlock AI API Gateway Endpoint'
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'Legal Data Encryption KMS Key ARN'
    });
  }
} 
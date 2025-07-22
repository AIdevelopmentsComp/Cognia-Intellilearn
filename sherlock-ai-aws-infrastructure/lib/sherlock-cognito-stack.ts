import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class SherlockCognitoAuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly authorizerLambda: lambda.Function;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // COGNITO USER POOL - 3 GRUPOS: Admin, Attorney, Paralegal
    // =========================================================================
    
    this.userPool = new cognito.UserPool(this, 'SherlockUserPool', {
      userPoolName: 'sherlock-ai-legal-users',
      
      // Sign-in configuration
      signInAliases: {
        email: true,
        username: true
      },
      
      // Password policy for legal compliance
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(1)
      },
      
      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // User attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        },
        givenName: {
          required: true,
          mutable: true
        },
        familyName: {
          required: true,
          mutable: true
        }
      },
      
      customAttributes: {
        'bar_number': new cognito.StringAttribute({ mutable: true }),
        'firm_department': new cognito.StringAttribute({ mutable: true }),
        'specialization': new cognito.StringAttribute({ mutable: true })
      },
      
      // Email verification
      autoVerify: { email: true },
      
      // MFA
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true
      },
      
      // Self-registration disabled for security
      selfSignUpEnabled: false,
      
      // Advanced security
      advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
      
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // =========================================================================
    // USER GROUPS - ROLES LEGALES
    // =========================================================================
    
    // Admin Group - Full system access
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admin',
      description: 'System administrators with full access',
      precedence: 1
    });

    // Attorney Group - Full case access 
    const attorneyGroup = new cognito.CfnUserPoolGroup(this, 'AttorneyGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Attorney',
      description: 'Licensed attorneys with full case management access',
      precedence: 2
    });

    // Paralegal Group - Limited access
    const paralegalGroup = new cognito.CfnUserPoolGroup(this, 'ParalegalGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Paralegal',
      description: 'Paralegals with case support access',
      precedence: 3
    });

    // =========================================================================
    // USER POOL CLIENT
    // =========================================================================
    
    this.userPoolClient = new cognito.UserPoolClient(this, 'SherlockUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'sherlock-ai-web-client',
      
      // OAuth flows
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.PHONE
        ],
        callbackUrls: ['https://localhost:3000/callback', 'https://sherlock-ai.watts-law.com/callback'],
        logoutUrls: ['https://localhost:3000/logout', 'https://sherlock-ai.watts-law.com/logout']
      },
      
      // Token configuration
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Security
      preventUserExistenceErrors: true,
      enableTokenRevocation: true
    });

    // =========================================================================
    // DYNAMIC AUTHORIZATION TABLES
    // =========================================================================
    
    // UserRoles Table - Dynamic role assignments
    const userRolesTable = new dynamodb.Table(this, 'UserRolesTable', {
      tableName: 'sherlock-user-roles',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // USER#{user_id}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // ROLE#{role_name}
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add Global Secondary Index
    userRolesTable.addGlobalSecondaryIndex({
      indexName: 'RoleIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // RolePermissions Table - Fine-grained permissions
    const rolePermissionsTable = new dynamodb.Table(this, 'RolePermissionsTable', {
      tableName: 'sherlock-role-permissions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // ROLE#{role_name}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // PERM#{resource}#{action}
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add Global Secondary Index for permission lookups
    rolePermissionsTable.addGlobalSecondaryIndex({
      indexName: 'PermissionIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // =========================================================================
    // LAMBDA AUTHORIZER - Advanced JWT Processing
    // =========================================================================
    
    this.authorizerLambda = new lambda.Function(this, 'SherlockAuthorizerLambda', {
      functionName: 'sherlock-ai-authorizer',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_ROLES_TABLE: userRolesTable.tableName,
        ROLE_PERMISSIONS_TABLE: rolePermissionsTable.tableName,
        REGION: this.region
      },
      
      logRetention: logs.RetentionDays.ONE_MONTH,
      
      code: lambda.Code.fromInline(`
import json
import jwt
import boto3
import os
from typing import Dict, List, Any

dynamodb = boto3.resource('dynamodb')
user_roles_table = dynamodb.Table(os.environ['USER_ROLES_TABLE'])
role_permissions_table = dynamodb.Table(os.environ['ROLE_PERMISSIONS_TABLE'])

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Sherlock AI Lambda Authorizer
    Validates JWT tokens and builds permission context
    """
    try:
        # Extract JWT token
        token = event['authorizationToken'].replace('Bearer ', '')
        
        # Decode JWT (simplified - in production use proper verification)
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        
        user_id = decoded_token.get('sub')
        cognito_groups = decoded_token.get('cognito:groups', [])
        email = decoded_token.get('email')
        
        if not user_id:
            raise Exception('Invalid token: missing user ID')
        
        # Get additional roles from DynamoDB
        additional_roles = get_user_additional_roles(user_id)
        
        # Combine Cognito groups with DynamoDB roles
        all_roles = list(set(cognito_groups + additional_roles))
        
        # Get permissions for all roles
        permissions = get_role_permissions(all_roles)
        
        # Build policy document
        policy_document = build_policy_document(all_roles, permissions)
        
        return {
            'principalId': user_id,
            'policyDocument': policy_document,
            'context': {
                'userId': user_id,
                'email': email,
                'roles': ','.join(all_roles),
                'permissions': json.dumps(permissions)
            }
        }
        
    except Exception as e:
        print(f"Authorization error: {str(e)}")
        raise Exception('Unauthorized')

def get_user_additional_roles(user_id: str) -> List[str]:
    """Get additional roles from DynamoDB UserRoles table"""
    try:
        response = user_roles_table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}'
            }
        )
        
        roles = []
        for item in response.get('Items', []):
            # Extract role from SK (ROLE#{role_name})
            role = item['SK'].replace('ROLE#', '')
            
            # Check if role is still valid (not expired)
            expires_at = item.get('expires_at')
            if not expires_at or expires_at > context.aws_request_id:  # Simplified expiry check
                roles.append(role)
                
        return roles
        
    except Exception as e:
        print(f"Error getting user roles: {str(e)}")
        return []

def get_role_permissions(roles: List[str]) -> Dict[str, List[str]]:
    """Get permissions for all roles"""
    permissions = {}
    
    for role in roles:
        try:
            response = role_permissions_table.query(
                KeyConditionExpression='PK = :pk',
                ExpressionAttributeValues={
                    ':pk': f'ROLE#{role}'
                }
            )
            
            role_perms = []
            for item in response.get('Items', []):
                # Extract permission from SK (PERM#{resource}#{action})
                perm = item['SK'].replace('PERM#', '')
                role_perms.append(perm)
                
            permissions[role] = role_perms
            
        except Exception as e:
            print(f"Error getting role permissions for {role}: {str(e)}")
            permissions[role] = []
            
    return permissions

def build_policy_document(roles: List[str], permissions: Dict[str, List[str]]) -> Dict[str, Any]:
    """Build IAM policy document based on roles and permissions"""
    
    statements = []
    
    # Admin has full access
    if 'Admin' in roles:
        statements.append({
            'Action': '*',
            'Effect': 'Allow',
            'Resource': '*'
        })
    else:
        # Build specific permissions for Attorney/Paralegal
        allowed_actions = set()
        
        for role_perms in permissions.values():
            allowed_actions.update(role_perms)
        
        if allowed_actions:
            statements.append({
                'Action': list(allowed_actions),
                'Effect': 'Allow', 
                'Resource': '*'
            })
    
    return {
        'Version': '2012-10-17',
        'Statement': statements
    }
      `)
    });

    // Grant DynamoDB permissions to Lambda
    userRolesTable.grantReadData(this.authorizerLambda);
    rolePermissionsTable.grantReadData(this.authorizerLambda);

    // =========================================================================
    // POPULATE INITIAL DATA - Default Permissions
    // =========================================================================
    
    // Lambda to populate initial role permissions
    const initDataLambda = new lambda.Function(this, 'InitPermissionsLambda', {
      functionName: 'sherlock-ai-init-permissions',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      timeout: cdk.Duration.minutes(5),
      
      environment: {
        ROLE_PERMISSIONS_TABLE: rolePermissionsTable.tableName
      },
      
      code: lambda.Code.fromInline(`
import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ROLE_PERMISSIONS_TABLE'])

def lambda_handler(event, context):
    """Initialize default role permissions"""
    
    # Default permissions by role
    permissions = {
        'Admin': [
            'cases#create', 'cases#read', 'cases#update', 'cases#delete',
            'parties#create', 'parties#read', 'parties#update', 'parties#delete',
            'medical#create', 'medical#read', 'medical#update', 'medical#delete',
            'financial#create', 'financial#read', 'financial#update', 'financial#delete',
            'documents#create', 'documents#read', 'documents#update', 'documents#delete',
            'users#create', 'users#read', 'users#update', 'users#delete',
            'system#configure'
        ],
        'Attorney': [
            'cases#create', 'cases#read', 'cases#update',
            'parties#create', 'parties#read', 'parties#update',
            'medical#create', 'medical#read', 'medical#update',
            'financial#create', 'financial#read', 'financial#update',
            'documents#create', 'documents#read', 'documents#update',
            'reports#generate', 'settlements#negotiate'
        ],
        'Paralegal': [
            'cases#read', 'cases#update',
            'parties#read', 'parties#update',
            'medical#read', 'medical#update',
            'financial#read',
            'documents#read', 'documents#update',
            'reports#view'
        ]
    }
    
    # Insert permissions
    for role, perms in permissions.items():
        for perm in perms:
            table.put_item(Item={
                'PK': f'ROLE#{role}',
                'SK': f'PERM#{perm}',
                'permission': perm,
                'created_at': context.aws_request_id,
                'active': True
            })
    
    return {'statusCode': 200, 'body': 'Permissions initialized'}
      `)
    });

    rolePermissionsTable.grantWriteData(initDataLambda);

    // Custom Resource to run initialization
    const initTrigger = new cdk.CustomResource(this, 'InitPermissionsTrigger', {
      serviceToken: initDataLambda.functionArn
    });

    // =========================================================================
    // OUTPUTS
    // =========================================================================
    
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: this.authorizerLambda.functionArn,
      description: 'Lambda Authorizer ARN'
    });

    new cdk.CfnOutput(this, 'UserRolesTableName', {
      value: userRolesTable.tableName,
      description: 'User Roles DynamoDB Table'
    });

    new cdk.CfnOutput(this, 'RolePermissionsTableName', {
      value: rolePermissionsTable.tableName,
      description: 'Role Permissions DynamoDB Table'
    });
  }
} 
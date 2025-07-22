"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SherlockCognitoAuthStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const logs = require("aws-cdk-lib/aws-logs");
class SherlockCognitoAuthStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
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
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
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
exports.SherlockCognitoAuthStack = SherlockCognitoAuthStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlcmxvY2stY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNoZXJsb2NrLWNvZ25pdG8tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLG1EQUFtRDtBQUNuRCxxREFBcUQ7QUFDckQsaURBQWlEO0FBR2pELDZDQUE2QztBQUc3QyxNQUFhLHdCQUF5QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBS3JELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNEVBQTRFO1FBQzVFLDJEQUEyRDtRQUMzRCw0RUFBNEU7UUFFNUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzdELFlBQVksRUFBRSx5QkFBeUI7WUFFdkMsd0JBQXdCO1lBQ3hCLGFBQWEsRUFBRTtnQkFDYixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsSUFBSTthQUNmO1lBRUQsdUNBQXVDO1lBQ3ZDLGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsRUFBRTtnQkFDYixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUMzQztZQUVELG1CQUFtQjtZQUNuQixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVO1lBRW5ELGtCQUFrQjtZQUNsQixrQkFBa0IsRUFBRTtnQkFDbEIsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxLQUFLO2lCQUNmO2dCQUNELFNBQVMsRUFB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QyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsY0FBYyxDQUFDLFNBQVM7WUFDL0IsV0FBVyxFQUFFLDJCQUEyQjtTQUN6QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ2xELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxTQUFTO1lBQ3JDLFdBQVcsRUFBRSxpQ0FBaUM7U0FDL0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbmNELDREQW1jQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBTaGVybG9ja0NvZ25pdG9BdXRoU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhvcml6ZXJMYW1iZGE6IGxhbWJkYS5GdW5jdGlvbjtcbiAgXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBDT0dOSVRPIFVTRVIgUE9PTCAtIDMgR1JVUE9TOiBBZG1pbiwgQXR0b3JuZXksIFBhcmFsZWdhbFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICB0aGlzLnVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1NoZXJsb2NrVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6ICdzaGVybG9jay1haS1sZWdhbC11c2VycycsXG4gICAgICBcbiAgICAgIC8vIFNpZ24taW4gY29uZmlndXJhdGlvblxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgdXNlcm5hbWU6IHRydWVcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFBhc3N3b3JkIHBvbGljeSBmb3IgbGVnYWwgY29tcGxpYW5jZVxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiAxMixcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICAgIHRlbXBQYXNzd29yZFZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygxKVxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQWNjb3VudCByZWNvdmVyeVxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxuICAgICAgXG4gICAgICAvLyBVc2VyIGF0dHJpYnV0ZXNcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGdpdmVuTmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZmFtaWx5TmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xuICAgICAgICAnYmFyX251bWJlcic6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7IG11dGFibGU6IHRydWUgfSksXG4gICAgICAgICdmaXJtX2RlcGFydG1lbnQnOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoeyBtdXRhYmxlOiB0cnVlIH0pLFxuICAgICAgICAnc3BlY2lhbGl6YXRpb24nOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoeyBtdXRhYmxlOiB0cnVlIH0pXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBFbWFpbCB2ZXJpZmljYXRpb25cbiAgICAgIGF1dG9WZXJpZnk6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIFxuICAgICAgLy8gTUZBXG4gICAgICBtZmE6IGNvZ25pdG8uTWZhLk9QVElPTkFMLFxuICAgICAgbWZhU2Vjb25kRmFjdG9yOiB7XG4gICAgICAgIHNtczogdHJ1ZSxcbiAgICAgICAgb3RwOiB0cnVlXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBTZWxmLXJlZ2lzdHJhdGlvbiBkaXNhYmxlZCBmb3Igc2VjdXJpdHlcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiBmYWxzZSxcbiAgICAgIFxuICAgICAgLy8gQWR2YW5jZWQgc2VjdXJpdHlcbiAgICAgIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiBjb2duaXRvLkFkdmFuY2VkU2VjdXJpdHlNb2RlLkVORk9SQ0VELFxuICAgICAgXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBVU0VSIEdST1VQUyAtIFJPTEVTIExFR0FMRVNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gQWRtaW4gR3JvdXAgLSBGdWxsIHN5c3RlbSBhY2Nlc3NcbiAgICBjb25zdCBhZG1pbkdyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cCh0aGlzLCAnQWRtaW5Hcm91cCcsIHtcbiAgICAgIHVzZXJQb29sSWQ6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGdyb3VwTmFtZTogJ0FkbWluJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3lzdGVtIGFkbWluaXN0cmF0b3JzIHdpdGggZnVsbCBhY2Nlc3MnLFxuICAgICAgcHJlY2VkZW5jZTogMVxuICAgIH0pO1xuXG4gICAgLy8gQXR0b3JuZXkgR3JvdXAgLSBGdWxsIGNhc2UgYWNjZXNzIFxuICAgIGNvbnN0IGF0dG9ybmV5R3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdBdHRvcm5leUdyb3VwJywge1xuICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZ3JvdXBOYW1lOiAnQXR0b3JuZXknLFxuICAgICAgZGVzY3JpcHRpb246ICdMaWNlbnNlZCBhdHRvcm5leXMgd2l0aCBmdWxsIGNhc2UgbWFuYWdlbWVudCBhY2Nlc3MnLFxuICAgICAgcHJlY2VkZW5jZTogMlxuICAgIH0pO1xuXG4gICAgLy8gUGFyYWxlZ2FsIEdyb3VwIC0gTGltaXRlZCBhY2Nlc3NcbiAgICBjb25zdCBwYXJhbGVnYWxHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgJ1BhcmFsZWdhbEdyb3VwJywge1xuICAgICAgdXNlclBvb2xJZDogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZ3JvdXBOYW1lOiAnUGFyYWxlZ2FsJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUGFyYWxlZ2FscyB3aXRoIGNhc2Ugc3VwcG9ydCBhY2Nlc3MnLFxuICAgICAgcHJlY2VkZW5jZTogM1xuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFVTRVIgUE9PTCBDTElFTlRcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdTaGVybG9ja1VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6ICdzaGVybG9jay1haS13ZWItY2xpZW50JyxcbiAgICAgIFxuICAgICAgLy8gT0F1dGggZmxvd3NcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiBbXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLkVNQUlMLFxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5PUEVOSUQsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLlBST0ZJTEUsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLlBIT05FXG4gICAgICAgIF0sXG4gICAgICAgIGNhbGxiYWNrVXJsczogWydodHRwczovL2xvY2FsaG9zdDozMDAwL2NhbGxiYWNrJywgJ2h0dHBzOi8vc2hlcmxvY2stYWkud2F0dHMtbGF3LmNvbS9jYWxsYmFjayddLFxuICAgICAgICBsb2dvdXRVcmxzOiBbJ2h0dHBzOi8vbG9jYWxob3N0OjMwMDAvbG9nb3V0JywgJ2h0dHBzOi8vc2hlcmxvY2stYWkud2F0dHMtbGF3LmNvbS9sb2dvdXQnXVxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gVG9rZW4gY29uZmlndXJhdGlvblxuICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgaWRUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgXG4gICAgICAvLyBTZWN1cml0eVxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXG4gICAgICBlbmFibGVUb2tlblJldm9jYXRpb246IHRydWVcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBEWU5BTUlDIEFVVEhPUklaQVRJT04gVEFCTEVTXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8vIFVzZXJSb2xlcyBUYWJsZSAtIER5bmFtaWMgcm9sZSBhc3NpZ25tZW50c1xuICAgIGNvbnN0IHVzZXJSb2xlc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2VyUm9sZXNUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3NoZXJsb2NrLXVzZXItcm9sZXMnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sIC8vIFVTRVIje3VzZXJfaWR9XG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sIC8vIFJPTEUje3JvbGVfbmFtZX1cbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR2xvYmFsIFNlY29uZGFyeSBJbmRleFxuICAgIHVzZXJSb2xlc1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ1JvbGVJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTFxuICAgIH0pO1xuXG4gICAgLy8gUm9sZVBlcm1pc3Npb25zIFRhYmxlIC0gRmluZS1ncmFpbmVkIHBlcm1pc3Npb25zXG4gICAgY29uc3Qgcm9sZVBlcm1pc3Npb25zVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1JvbGVQZXJtaXNzaW9uc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAnc2hlcmxvY2stcm9sZS1wZXJtaXNzaW9ucycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSwgLy8gUk9MRSN7cm9sZV9uYW1lfVxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LCAvLyBQRVJNI3tyZXNvdXJjZX0je2FjdGlvbn1cbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR2xvYmFsIFNlY29uZGFyeSBJbmRleCBmb3IgcGVybWlzc2lvbiBsb29rdXBzXG4gICAgcm9sZVBlcm1pc3Npb25zVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnUGVybWlzc2lvbkluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMVBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTEFNQkRBIEFVVEhPUklaRVIgLSBBZHZhbmNlZCBKV1QgUHJvY2Vzc2luZ1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICB0aGlzLmF1dGhvcml6ZXJMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdTaGVybG9ja0F1dGhvcml6ZXJMYW1iZGEnLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdzaGVybG9jay1haS1hdXRob3JpemVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzExLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmxhbWJkYV9oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVVNFUl9QT09MX0lEOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICAgIFVTRVJfUk9MRVNfVEFCTEU6IHVzZXJSb2xlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgUk9MRV9QRVJNSVNTSU9OU19UQUJMRTogcm9sZVBlcm1pc3Npb25zVGFibGUudGFibGVOYW1lLFxuICAgICAgICBSRUdJT046IHRoaXMucmVnaW9uXG4gICAgICB9LFxuICAgICAgXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEgsXG4gICAgICBcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21JbmxpbmUoYFxuaW1wb3J0IGpzb25cbmltcG9ydCBqd3RcbmltcG9ydCBib3RvM1xuaW1wb3J0IG9zXG5mcm9tIHR5cGluZyBpbXBvcnQgRGljdCwgTGlzdCwgQW55XG5cbmR5bmFtb2RiID0gYm90bzMucmVzb3VyY2UoJ2R5bmFtb2RiJylcbnVzZXJfcm9sZXNfdGFibGUgPSBkeW5hbW9kYi5UYWJsZShvcy5lbnZpcm9uWydVU0VSX1JPTEVTX1RBQkxFJ10pXG5yb2xlX3Blcm1pc3Npb25zX3RhYmxlID0gZHluYW1vZGIuVGFibGUob3MuZW52aXJvblsnUk9MRV9QRVJNSVNTSU9OU19UQUJMRSddKVxuXG5kZWYgbGFtYmRhX2hhbmRsZXIoZXZlbnQ6IERpY3Rbc3RyLCBBbnldLCBjb250ZXh0KSAtPiBEaWN0W3N0ciwgQW55XTpcbiAgICBcIlwiXCJcbiAgICBTaGVybG9jayBBSSBMYW1iZGEgQXV0aG9yaXplclxuICAgIFZhbGlkYXRlcyBKV1QgdG9rZW5zIGFuZCBidWlsZHMgcGVybWlzc2lvbiBjb250ZXh0XG4gICAgXCJcIlwiXG4gICAgdHJ5OlxuICAgICAgICAjIEV4dHJhY3QgSldUIHRva2VuXG4gICAgICAgIHRva2VuID0gZXZlbnRbJ2F1dGhvcml6YXRpb25Ub2tlbiddLnJlcGxhY2UoJ0JlYXJlciAnLCAnJylcbiAgICAgICAgXG4gICAgICAgICMgRGVjb2RlIEpXVCAoc2ltcGxpZmllZCAtIGluIHByb2R1Y3Rpb24gdXNlIHByb3BlciB2ZXJpZmljYXRpb24pXG4gICAgICAgIGRlY29kZWRfdG9rZW4gPSBqd3QuZGVjb2RlKHRva2VuLCBvcHRpb25zPXtcInZlcmlmeV9zaWduYXR1cmVcIjogRmFsc2V9KVxuICAgICAgICBcbiAgICAgICAgdXNlcl9pZCA9IGRlY29kZWRfdG9rZW4uZ2V0KCdzdWInKVxuICAgICAgICBjb2duaXRvX2dyb3VwcyA9IGRlY29kZWRfdG9rZW4uZ2V0KCdjb2duaXRvOmdyb3VwcycsIFtdKVxuICAgICAgICBlbWFpbCA9IGRlY29kZWRfdG9rZW4uZ2V0KCdlbWFpbCcpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgdXNlcl9pZDpcbiAgICAgICAgICAgIHJhaXNlIEV4Y2VwdGlvbignSW52YWxpZCB0b2tlbjogbWlzc2luZyB1c2VyIElEJylcbiAgICAgICAgXG4gICAgICAgICMgR2V0IGFkZGl0aW9uYWwgcm9sZXMgZnJvbSBEeW5hbW9EQlxuICAgICAgICBhZGRpdGlvbmFsX3JvbGVzID0gZ2V0X3VzZXJfYWRkaXRpb25hbF9yb2xlcyh1c2VyX2lkKVxuICAgICAgICBcbiAgICAgICAgIyBDb21iaW5lIENvZ25pdG8gZ3JvdXBzIHdpdGggRHluYW1vREIgcm9sZXNcbiAgICAgICAgYWxsX3JvbGVzID0gbGlzdChzZXQoY29nbml0b19ncm91cHMgKyBhZGRpdGlvbmFsX3JvbGVzKSlcbiAgICAgICAgXG4gICAgICAgICMgR2V0IHBlcm1pc3Npb25zIGZvciBhbGwgcm9sZXNcbiAgICAgICAgcGVybWlzc2lvbnMgPSBnZXRfcm9sZV9wZXJtaXNzaW9ucyhhbGxfcm9sZXMpXG4gICAgICAgIFxuICAgICAgICAjIEJ1aWxkIHBvbGljeSBkb2N1bWVudFxuICAgICAgICBwb2xpY3lfZG9jdW1lbnQgPSBidWlsZF9wb2xpY3lfZG9jdW1lbnQoYWxsX3JvbGVzLCBwZXJtaXNzaW9ucylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAncHJpbmNpcGFsSWQnOiB1c2VyX2lkLFxuICAgICAgICAgICAgJ3BvbGljeURvY3VtZW50JzogcG9saWN5X2RvY3VtZW50LFxuICAgICAgICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgICAgICAgICAgJ3VzZXJJZCc6IHVzZXJfaWQsXG4gICAgICAgICAgICAgICAgJ2VtYWlsJzogZW1haWwsXG4gICAgICAgICAgICAgICAgJ3JvbGVzJzogJywnLmpvaW4oYWxsX3JvbGVzKSxcbiAgICAgICAgICAgICAgICAncGVybWlzc2lvbnMnOiBqc29uLmR1bXBzKHBlcm1pc3Npb25zKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZTpcbiAgICAgICAgcHJpbnQoZlwiQXV0aG9yaXphdGlvbiBlcnJvcjoge3N0cihlKX1cIilcbiAgICAgICAgcmFpc2UgRXhjZXB0aW9uKCdVbmF1dGhvcml6ZWQnKVxuXG5kZWYgZ2V0X3VzZXJfYWRkaXRpb25hbF9yb2xlcyh1c2VyX2lkOiBzdHIpIC0+IExpc3Rbc3RyXTpcbiAgICBcIlwiXCJHZXQgYWRkaXRpb25hbCByb2xlcyBmcm9tIER5bmFtb0RCIFVzZXJSb2xlcyB0YWJsZVwiXCJcIlxuICAgIHRyeTpcbiAgICAgICAgcmVzcG9uc2UgPSB1c2VyX3JvbGVzX3RhYmxlLnF1ZXJ5KFxuICAgICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbj0nUEsgPSA6cGsnLFxuICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcz17XG4gICAgICAgICAgICAgICAgJzpwayc6IGYnVVNFUiN7dXNlcl9pZH0nXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIHJvbGVzID0gW11cbiAgICAgICAgZm9yIGl0ZW0gaW4gcmVzcG9uc2UuZ2V0KCdJdGVtcycsIFtdKTpcbiAgICAgICAgICAgICMgRXh0cmFjdCByb2xlIGZyb20gU0sgKFJPTEUje3JvbGVfbmFtZX0pXG4gICAgICAgICAgICByb2xlID0gaXRlbVsnU0snXS5yZXBsYWNlKCdST0xFIycsICcnKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAjIENoZWNrIGlmIHJvbGUgaXMgc3RpbGwgdmFsaWQgKG5vdCBleHBpcmVkKVxuICAgICAgICAgICAgZXhwaXJlc19hdCA9IGl0ZW0uZ2V0KCdleHBpcmVzX2F0JylcbiAgICAgICAgICAgIGlmIG5vdCBleHBpcmVzX2F0IG9yIGV4cGlyZXNfYXQgPiBjb250ZXh0LmF3c19yZXF1ZXN0X2lkOiAgIyBTaW1wbGlmaWVkIGV4cGlyeSBjaGVja1xuICAgICAgICAgICAgICAgIHJvbGVzLmFwcGVuZChyb2xlKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gcm9sZXNcbiAgICAgICAgXG4gICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOlxuICAgICAgICBwcmludChmXCJFcnJvciBnZXR0aW5nIHVzZXIgcm9sZXM6IHtzdHIoZSl9XCIpXG4gICAgICAgIHJldHVybiBbXVxuXG5kZWYgZ2V0X3JvbGVfcGVybWlzc2lvbnMocm9sZXM6IExpc3Rbc3RyXSkgLT4gRGljdFtzdHIsIExpc3Rbc3RyXV06XG4gICAgXCJcIlwiR2V0IHBlcm1pc3Npb25zIGZvciBhbGwgcm9sZXNcIlwiXCJcbiAgICBwZXJtaXNzaW9ucyA9IHt9XG4gICAgXG4gICAgZm9yIHJvbGUgaW4gcm9sZXM6XG4gICAgICAgIHRyeTpcbiAgICAgICAgICAgIHJlc3BvbnNlID0gcm9sZV9wZXJtaXNzaW9uc190YWJsZS5xdWVyeShcbiAgICAgICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uPSdQSyA9IDpwaycsXG4gICAgICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcz17XG4gICAgICAgICAgICAgICAgICAgICc6cGsnOiBmJ1JPTEUje3JvbGV9J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm9sZV9wZXJtcyA9IFtdXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiByZXNwb25zZS5nZXQoJ0l0ZW1zJywgW10pOlxuICAgICAgICAgICAgICAgICMgRXh0cmFjdCBwZXJtaXNzaW9uIGZyb20gU0sgKFBFUk0je3Jlc291cmNlfSN7YWN0aW9ufSlcbiAgICAgICAgICAgICAgICBwZXJtID0gaXRlbVsnU0snXS5yZXBsYWNlKCdQRVJNIycsICcnKVxuICAgICAgICAgICAgICAgIHJvbGVfcGVybXMuYXBwZW5kKHBlcm0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBwZXJtaXNzaW9uc1tyb2xlXSA9IHJvbGVfcGVybXNcbiAgICAgICAgICAgIFxuICAgICAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgICAgICBwcmludChmXCJFcnJvciBnZXR0aW5nIHJvbGUgcGVybWlzc2lvbnMgZm9yIHtyb2xlfToge3N0cihlKX1cIilcbiAgICAgICAgICAgIHBlcm1pc3Npb25zW3JvbGVdID0gW11cbiAgICAgICAgICAgIFxuICAgIHJldHVybiBwZXJtaXNzaW9uc1xuXG5kZWYgYnVpbGRfcG9saWN5X2RvY3VtZW50KHJvbGVzOiBMaXN0W3N0cl0sIHBlcm1pc3Npb25zOiBEaWN0W3N0ciwgTGlzdFtzdHJdXSkgLT4gRGljdFtzdHIsIEFueV06XG4gICAgXCJcIlwiQnVpbGQgSUFNIHBvbGljeSBkb2N1bWVudCBiYXNlZCBvbiByb2xlcyBhbmQgcGVybWlzc2lvbnNcIlwiXCJcbiAgICBcbiAgICBzdGF0ZW1lbnRzID0gW11cbiAgICBcbiAgICAjIEFkbWluIGhhcyBmdWxsIGFjY2Vzc1xuICAgIGlmICdBZG1pbicgaW4gcm9sZXM6XG4gICAgICAgIHN0YXRlbWVudHMuYXBwZW5kKHtcbiAgICAgICAgICAgICdBY3Rpb24nOiAnKicsXG4gICAgICAgICAgICAnRWZmZWN0JzogJ0FsbG93JyxcbiAgICAgICAgICAgICdSZXNvdXJjZSc6ICcqJ1xuICAgICAgICB9KVxuICAgIGVsc2U6XG4gICAgICAgICMgQnVpbGQgc3BlY2lmaWMgcGVybWlzc2lvbnMgZm9yIEF0dG9ybmV5L1BhcmFsZWdhbFxuICAgICAgICBhbGxvd2VkX2FjdGlvbnMgPSBzZXQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvbGVfcGVybXMgaW4gcGVybWlzc2lvbnMudmFsdWVzKCk6XG4gICAgICAgICAgICBhbGxvd2VkX2FjdGlvbnMudXBkYXRlKHJvbGVfcGVybXMpXG4gICAgICAgIFxuICAgICAgICBpZiBhbGxvd2VkX2FjdGlvbnM6XG4gICAgICAgICAgICBzdGF0ZW1lbnRzLmFwcGVuZCh7XG4gICAgICAgICAgICAgICAgJ0FjdGlvbic6IGxpc3QoYWxsb3dlZF9hY3Rpb25zKSxcbiAgICAgICAgICAgICAgICAnRWZmZWN0JzogJ0FsbG93JywgXG4gICAgICAgICAgICAgICAgJ1Jlc291cmNlJzogJyonXG4gICAgICAgICAgICB9KVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICAgICdWZXJzaW9uJzogJzIwMTItMTAtMTcnLFxuICAgICAgICAnU3RhdGVtZW50Jzogc3RhdGVtZW50c1xuICAgIH1cbiAgICAgIGApXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBEeW5hbW9EQiBwZXJtaXNzaW9ucyB0byBMYW1iZGFcbiAgICB1c2VyUm9sZXNUYWJsZS5ncmFudFJlYWREYXRhKHRoaXMuYXV0aG9yaXplckxhbWJkYSk7XG4gICAgcm9sZVBlcm1pc3Npb25zVGFibGUuZ3JhbnRSZWFkRGF0YSh0aGlzLmF1dGhvcml6ZXJMYW1iZGEpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFBPUFVMQVRFIElOSVRJQUwgREFUQSAtIERlZmF1bHQgUGVybWlzc2lvbnNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gTGFtYmRhIHRvIHBvcHVsYXRlIGluaXRpYWwgcm9sZSBwZXJtaXNzaW9uc1xuICAgIGNvbnN0IGluaXREYXRhTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnSW5pdFBlcm1pc3Npb25zTGFtYmRhJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnc2hlcmxvY2stYWktaW5pdC1wZXJtaXNzaW9ucycsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5sYW1iZGFfaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUk9MRV9QRVJNSVNTSU9OU19UQUJMRTogcm9sZVBlcm1pc3Npb25zVGFibGUudGFibGVOYW1lXG4gICAgICB9LFxuICAgICAgXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbmltcG9ydCBib3RvM1xuaW1wb3J0IGpzb25cblxuZHluYW1vZGIgPSBib3RvMy5yZXNvdXJjZSgnZHluYW1vZGInKVxudGFibGUgPSBkeW5hbW9kYi5UYWJsZShvcy5lbnZpcm9uWydST0xFX1BFUk1JU1NJT05TX1RBQkxFJ10pXG5cbmRlZiBsYW1iZGFfaGFuZGxlcihldmVudCwgY29udGV4dCk6XG4gICAgXCJcIlwiSW5pdGlhbGl6ZSBkZWZhdWx0IHJvbGUgcGVybWlzc2lvbnNcIlwiXCJcbiAgICBcbiAgICAjIERlZmF1bHQgcGVybWlzc2lvbnMgYnkgcm9sZVxuICAgIHBlcm1pc3Npb25zID0ge1xuICAgICAgICAnQWRtaW4nOiBbXG4gICAgICAgICAgICAnY2FzZXMjY3JlYXRlJywgJ2Nhc2VzI3JlYWQnLCAnY2FzZXMjdXBkYXRlJywgJ2Nhc2VzI2RlbGV0ZScsXG4gICAgICAgICAgICAncGFydGllcyNjcmVhdGUnLCAncGFydGllcyNyZWFkJywgJ3BhcnRpZXMjdXBkYXRlJywgJ3BhcnRpZXMjZGVsZXRlJyxcbiAgICAgICAgICAgICdtZWRpY2FsI2NyZWF0ZScsICdtZWRpY2FsI3JlYWQnLCAnbWVkaWNhbCN1cGRhdGUnLCAnbWVkaWNhbCNkZWxldGUnLFxuICAgICAgICAgICAgJ2ZpbmFuY2lhbCNjcmVhdGUnLCAnZmluYW5jaWFsI3JlYWQnLCAnZmluYW5jaWFsI3VwZGF0ZScsICdmaW5hbmNpYWwjZGVsZXRlJyxcbiAgICAgICAgICAgICdkb2N1bWVudHMjY3JlYXRlJywgJ2RvY3VtZW50cyNyZWFkJywgJ2RvY3VtZW50cyN1cGRhdGUnLCAnZG9jdW1lbnRzI2RlbGV0ZScsXG4gICAgICAgICAgICAndXNlcnMjY3JlYXRlJywgJ3VzZXJzI3JlYWQnLCAndXNlcnMjdXBkYXRlJywgJ3VzZXJzI2RlbGV0ZScsXG4gICAgICAgICAgICAnc3lzdGVtI2NvbmZpZ3VyZSdcbiAgICAgICAgXSxcbiAgICAgICAgJ0F0dG9ybmV5JzogW1xuICAgICAgICAgICAgJ2Nhc2VzI2NyZWF0ZScsICdjYXNlcyNyZWFkJywgJ2Nhc2VzI3VwZGF0ZScsXG4gICAgICAgICAgICAncGFydGllcyNjcmVhdGUnLCAncGFydGllcyNyZWFkJywgJ3BhcnRpZXMjdXBkYXRlJyxcbiAgICAgICAgICAgICdtZWRpY2FsI2NyZWF0ZScsICdtZWRpY2FsI3JlYWQnLCAnbWVkaWNhbCN1cGRhdGUnLFxuICAgICAgICAgICAgJ2ZpbmFuY2lhbCNjcmVhdGUnLCAnZmluYW5jaWFsI3JlYWQnLCAnZmluYW5jaWFsI3VwZGF0ZScsXG4gICAgICAgICAgICAnZG9jdW1lbnRzI2NyZWF0ZScsICdkb2N1bWVudHMjcmVhZCcsICdkb2N1bWVudHMjdXBkYXRlJyxcbiAgICAgICAgICAgICdyZXBvcnRzI2dlbmVyYXRlJywgJ3NldHRsZW1lbnRzI25lZ290aWF0ZSdcbiAgICAgICAgXSxcbiAgICAgICAgJ1BhcmFsZWdhbCc6IFtcbiAgICAgICAgICAgICdjYXNlcyNyZWFkJywgJ2Nhc2VzI3VwZGF0ZScsXG4gICAgICAgICAgICAncGFydGllcyNyZWFkJywgJ3BhcnRpZXMjdXBkYXRlJyxcbiAgICAgICAgICAgICdtZWRpY2FsI3JlYWQnLCAnbWVkaWNhbCN1cGRhdGUnLFxuICAgICAgICAgICAgJ2ZpbmFuY2lhbCNyZWFkJyxcbiAgICAgICAgICAgICdkb2N1bWVudHMjcmVhZCcsICdkb2N1bWVudHMjdXBkYXRlJyxcbiAgICAgICAgICAgICdyZXBvcnRzI3ZpZXcnXG4gICAgICAgIF1cbiAgICB9XG4gICAgXG4gICAgIyBJbnNlcnQgcGVybWlzc2lvbnNcbiAgICBmb3Igcm9sZSwgcGVybXMgaW4gcGVybWlzc2lvbnMuaXRlbXMoKTpcbiAgICAgICAgZm9yIHBlcm0gaW4gcGVybXM6XG4gICAgICAgICAgICB0YWJsZS5wdXRfaXRlbShJdGVtPXtcbiAgICAgICAgICAgICAgICAnUEsnOiBmJ1JPTEUje3JvbGV9JyxcbiAgICAgICAgICAgICAgICAnU0snOiBmJ1BFUk0je3Blcm19JyxcbiAgICAgICAgICAgICAgICAncGVybWlzc2lvbic6IHBlcm0sXG4gICAgICAgICAgICAgICAgJ2NyZWF0ZWRfYXQnOiBjb250ZXh0LmF3c19yZXF1ZXN0X2lkLFxuICAgICAgICAgICAgICAgICdhY3RpdmUnOiBUcnVlXG4gICAgICAgICAgICB9KVxuICAgIFxuICAgIHJldHVybiB7J3N0YXR1c0NvZGUnOiAyMDAsICdib2R5JzogJ1Blcm1pc3Npb25zIGluaXRpYWxpemVkJ31cbiAgICAgIGApXG4gICAgfSk7XG5cbiAgICByb2xlUGVybWlzc2lvbnNUYWJsZS5ncmFudFdyaXRlRGF0YShpbml0RGF0YUxhbWJkYSk7XG5cbiAgICAvLyBDdXN0b20gUmVzb3VyY2UgdG8gcnVuIGluaXRpYWxpemF0aW9uXG4gICAgY29uc3QgaW5pdFRyaWdnZXIgPSBuZXcgY2RrLkN1c3RvbVJlc291cmNlKHRoaXMsICdJbml0UGVybWlzc2lvbnNUcmlnZ2VyJywge1xuICAgICAgc2VydmljZVRva2VuOiBpbml0RGF0YUxhbWJkYS5mdW5jdGlvbkFyblxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE9VVFBVVFNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBJRCdcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgQ2xpZW50IElEJ1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0F1dGhvcml6ZXJMYW1iZGFBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hdXRob3JpemVyTGFtYmRhLmZ1bmN0aW9uQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgQXV0aG9yaXplciBBUk4nXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclJvbGVzVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHVzZXJSb2xlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciBSb2xlcyBEeW5hbW9EQiBUYWJsZSdcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdSb2xlUGVybWlzc2lvbnNUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogcm9sZVBlcm1pc3Npb25zVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdSb2xlIFBlcm1pc3Npb25zIER5bmFtb0RCIFRhYmxlJ1xuICAgIH0pO1xuICB9XG59ICJdfQ==
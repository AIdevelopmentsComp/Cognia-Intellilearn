const { 
  CognitoIdentityProviderClient, 
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
  UpdateUserPoolCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { 
  CognitoIdentityClient, 
  CreateIdentityPoolCommand,
  SetIdentityPoolRolesCommand 
} = require('@aws-sdk/client-cognito-identity');
const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, PutRolePolicyCommand } = require('@aws-sdk/client-iam');

const fs = require('fs').promises;
const path = require('path');

// Load environment variables from secure location
require('dotenv').config({ path: path.join(__dirname, '../.env.aws') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Validate AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ ERROR: AWS credentials not found!');
  console.error('Please ensure .env.aws file exists with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const region = process.env.AWS_REGION || 'us-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

// Initialize AWS clients
const cognitoProvider = new CognitoIdentityProviderClient({ region, credentials });
const cognitoIdentity = new CognitoIdentityClient({ region, credentials });
const s3 = new S3Client({ region, credentials });
const cloudfront = new CloudFrontClient({ region, credentials });
const dynamodb = new DynamoDBClient({ region, credentials });
const iam = new IAMClient({ region, credentials });

const newResources = {
  userPoolId: null,
  clientId: null,
  identityPoolId: null,
  s3BucketName: 'intellilearn-prod-app',
  s3VectorBucket: 'cognia-intellilearn-prod',
  s3ContentBucket: 'cognia-content-prod',
  cloudfrontDistributionId: null,
  dynamoTableName: 'IntelliLearn_Data_Prod',
  lambdaFunctionName: 'bedrock-voice-streaming-prod',
  apiGatewayId: null,
  apiGatewayUrl: null
};

async function createCognitoUserPool() {
  console.log('Creating Cognito User Pool...');
  
  try {
    const command = new CreateUserPoolCommand({
      PoolName: 'IntelliLearn-UserPool',
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false
        }
      },
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true
        },
        {
          Name: 'name',
          AttributeDataType: 'String',
          Required: false,
          Mutable: true
        }
      ]
    });
    
    const response = await cognitoProvider.send(command);
    newResources.userPoolId = response.UserPool.Id;
    console.log('User Pool created:', newResources.userPoolId);
    
    return newResources.userPoolId;
  } catch (error) {
    console.error('Error creating User Pool:', error);
    throw error;
  }
}

async function createCognitoUserPoolClient(userPoolId) {
  console.log('Creating Cognito User Pool Client...');
  
  try {
    const command = new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: 'IntelliLearn-WebClient',
      GenerateSecret: false,
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH'
      ],
      PreventUserExistenceErrors: 'ENABLED',
      AllowedOAuthFlows: ['implicit'],
      AllowedOAuthScopes: ['openid', 'email', 'profile'],
      CallbackURLs: ['http://localhost:3000/dashboard', 'https://d2sn3lk5751y3y.cloudfront.net/dashboard'],
      LogoutURLs: ['http://localhost:3000/', 'https://d2sn3lk5751y3y.cloudfront.net/']
    });
    
    const response = await cognitoProvider.send(command);
    newResources.clientId = response.UserPoolClient.ClientId;
    console.log('User Pool Client created:', newResources.clientId);
    
    return newResources.clientId;
  } catch (error) {
    console.error('Error creating User Pool Client:', error);
    throw error;
  }
}

async function createIdentityPool(userPoolId, clientId) {
  console.log('Creating Cognito Identity Pool...');
  
  try {
    const command = new CreateIdentityPoolCommand({
      IdentityPoolName: 'IntelliLearn_IdentityPool',
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ProviderName: `cognito-idp.${region}.amazonaws.com/${userPoolId}`,
          ClientId: clientId
        }
      ]
    });
    
    const response = await cognitoIdentity.send(command);
    newResources.identityPoolId = response.IdentityPoolId;
    console.log('Identity Pool created:', newResources.identityPoolId);
    
    return newResources.identityPoolId;
  } catch (error) {
    console.error('Error creating Identity Pool:', error);
    throw error;
  }
}

async function createS3Buckets() {
  console.log('Creating S3 buckets...');
  
  const buckets = [
    { name: newResources.s3BucketName, purpose: 'main app' },
    { name: newResources.s3VectorBucket, purpose: 'vectors' },
    { name: newResources.s3ContentBucket, purpose: 'content' }
  ];
  
  for (const bucket of buckets) {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket.name }));
      console.log(`S3 bucket created for ${bucket.purpose}:`, bucket.name);
      
      // Configure CORS for the main app bucket
      if (bucket.name === newResources.s3BucketName) {
        const corsConfig = {
          Bucket: bucket.name,
          CORSConfiguration: {
            CORSRules: [{
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000
            }]
          }
        };
        await s3.send(new PutBucketCorsCommand(corsConfig));
        
        // Configure bucket policy for public read
        const bucketPolicy = {
          Bucket: bucket.name,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucket.name}/*`
            }]
          })
        };
        await s3.send(new PutBucketPolicyCommand(bucketPolicy));
      }
    } catch (error) {
      if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
        console.log(`Bucket ${bucket.name} already exists`);
      } else {
        console.error(`Error creating bucket ${bucket.name}:`, error);
        throw error;
      }
    }
  }
}

async function createCloudFrontDistribution() {
  console.log('Creating CloudFront distribution...');
  
  try {
    const config = {
      CallerReference: Date.now().toString(),
      Comment: 'IntelliLearn CloudFront Distribution',
      DefaultRootObject: 'index.html',
      Origins: {
        Quantity: 1,
        Items: [{
          Id: 'S3-' + newResources.s3BucketName,
          DomainName: `${newResources.s3BucketName}.s3.amazonaws.com`,
          S3OriginConfig: {
            OriginAccessIdentity: ''
          }
        }]
      },
      DefaultCacheBehavior: {
        TargetOriginId: 'S3-' + newResources.s3BucketName,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD']
        },
        TrustedSigners: {
          Enabled: false,
          Quantity: 0
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' }
        },
        MinTTL: 0,
        DefaultTTL: 86400,
        MaxTTL: 31536000
      },
      Enabled: true,
      CustomErrorResponses: {
        Quantity: 1,
        Items: [{
          ErrorCode: 404,
          ResponsePagePath: '/index.html',
          ResponseCode: '200'
        }]
      }
    };
    
    const response = await cloudfront.send(new CreateDistributionCommand({ DistributionConfig: config }));
    newResources.cloudfrontDistributionId = response.Distribution.Id;
    newResources.cloudfrontDomain = response.Distribution.DomainName;
    console.log('CloudFront distribution created:', newResources.cloudfrontDistributionId);
    console.log('CloudFront domain:', newResources.cloudfrontDomain);
    
    return newResources.cloudfrontDistributionId;
  } catch (error) {
    console.error('Error creating CloudFront distribution:', error);
    throw error;
  }
}

async function createDynamoDBTables() {
  console.log('Creating DynamoDB tables...');
  
  const tables = [
    {
      TableName: newResources.dynamoTableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ];
  
  for (const table of tables) {
    try {
      await dynamodb.send(new CreateTableCommand(table));
      console.log('DynamoDB table created:', table.TableName);
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(`Table ${table.TableName} already exists`);
      } else {
        console.error(`Error creating table ${table.TableName}:`, error);
        throw error;
      }
    }
  }
}

async function updateEnvFile() {
  console.log('Updating .env.local file with new resources...');
  
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = await fs.readFile(envPath, 'utf8');
  
  // Update the environment variables
  const updates = {
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID': newResources.userPoolId,
    'NEXT_PUBLIC_COGNITO_CLIENT_ID': newResources.clientId,
    'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID': newResources.identityPoolId,
    'NEXT_PUBLIC_S3_VECTOR_BUCKET': newResources.s3VectorBucket,
    'NEXT_PUBLIC_S3_CONTENT_BUCKET': newResources.s3ContentBucket,
    'NEXT_PUBLIC_DYNAMODB_TABLE': newResources.dynamoTableName
  };
  
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      envContent = envContent.replace(regex, `${key}=${value}`);
    }
  }
  
  // Add CloudFront info as a comment
  if (newResources.cloudfrontDomain) {
    envContent += `\n# CloudFront Distribution: ${newResources.cloudfrontDistributionId}`;
    envContent += `\n# CloudFront Domain: https://${newResources.cloudfrontDomain}\n`;
  }
  
  await fs.writeFile(envPath, envContent);
  console.log('.env.local file updated successfully');
}

async function main() {
  try {
    console.log('Starting AWS resource setup...\n');
    
    // Create Cognito resources
    const userPoolId = await createCognitoUserPool();
    const clientId = await createCognitoUserPoolClient(userPoolId);
    const identityPoolId = await createIdentityPool(userPoolId, clientId);
    
    // Create S3 buckets
    await createS3Buckets();
    
    // Create CloudFront distribution
    await createCloudFrontDistribution();
    
    // Create DynamoDB tables
    await createDynamoDBTables();
    
    // Update environment file
    await updateEnvFile();
    
    console.log('\n✅ All AWS resources created successfully!');
    console.log('\nNew resource IDs:');
    console.log(JSON.stringify(newResources, null, 2));
    
    console.log('\n📋 Next steps:');
    console.log('1. Run "npm run build" to build the application');
    console.log('2. Run "./deploy.ps1" to deploy to the new S3 bucket');
    console.log(`3. Your app will be available at: https://${newResources.cloudfrontDomain}`);
    console.log('\n⚠️  IMPORTANT: Remember to revoke and rotate the AWS credentials that were exposed!');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
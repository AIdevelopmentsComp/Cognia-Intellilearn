const { S3Client, PutBucketPublicAccessBlockCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateDistributionCommand, CreateOriginAccessIdentityCommand } = require('@aws-sdk/client-cloudfront');
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.aws') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const region = process.env.AWS_REGION || 'us-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

// Initialize AWS clients
const s3 = new S3Client({ region, credentials });
const cloudfront = new CloudFrontClient({ region, credentials });
const dynamodb = new DynamoDBClient({ region, credentials });

// Resources from previous run
const resources = {
  userPoolId: 'us-east-1_BxbAO9DtG',
  clientId: '4dhimdt09osbal1l5fc75mo6j2',
  identityPoolId: 'us-east-1:d030a5b5-e950-493c-855f-a578cc578e39',
  s3BucketName: 'intellilearn-prod-app',
  s3VectorBucket: 'cognia-intellilearn-prod',
  s3ContentBucket: 'cognia-content-prod',
  cloudfrontDistributionId: null,
  cloudfrontDomain: null,
  dynamoTableName: 'IntelliLearn_Data_Prod'
};

async function configureBucketCors() {
  console.log('Configuring S3 bucket CORS...');
  
  const buckets = [
    resources.s3BucketName,
    resources.s3VectorBucket,
    resources.s3ContentBucket
  ];
  
  for (const bucket of buckets) {
    try {
      const corsConfig = {
        Bucket: bucket,
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
      console.log(`✅ CORS configured for bucket: ${bucket}`);
    } catch (error) {
      if (error.Code === 'NoSuchBucket') {
        console.log(`⚠️  Bucket ${bucket} doesn't exist, creating it...`);
        // Create bucket logic here if needed
      } else {
        console.error(`❌ Error configuring CORS for ${bucket}:`, error.message);
      }
    }
  }
}

async function disableBlockPublicAccess() {
  console.log('\nConfiguring S3 bucket public access settings...');
  
  try {
    const command = new PutBucketPublicAccessBlockCommand({
      Bucket: resources.s3BucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        BlockPublicPolicy: false,
        IgnorePublicAcls: false,
        RestrictPublicBuckets: false
      }
    });
    
    await s3.send(command);
    console.log('✅ Public access settings configured for main bucket');
  } catch (error) {
    console.error('❌ Error configuring public access:', error.message);
  }
}

async function createCloudFrontOAI() {
  console.log('\nCreating CloudFront Origin Access Identity...');
  
  try {
    const command = new CreateOriginAccessIdentityCommand({
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: Date.now().toString(),
        Comment: 'OAI for IntelliLearn S3 bucket'
      }
    });
    
    const response = await cloudfront.send(command);
    return response.CloudFrontOriginAccessIdentity.Id;
  } catch (error) {
    console.error('❌ Error creating OAI:', error.message);
    return null;
  }
}

async function createCloudFrontDistribution(oaiId) {
  console.log('\nCreating CloudFront distribution...');
  
  try {
    const config = {
      CallerReference: Date.now().toString(),
      Comment: 'IntelliLearn CloudFront Distribution Prod',
      DefaultRootObject: 'index.html',
      Origins: {
        Quantity: 1,
        Items: [{
          Id: 'S3-' + resources.s3BucketName,
          DomainName: `${resources.s3BucketName}.s3.amazonaws.com`,
          S3OriginConfig: {
            OriginAccessIdentity: oaiId ? `origin-access-identity/cloudfront/${oaiId}` : ''
          }
        }]
      },
      DefaultCacheBehavior: {
        TargetOriginId: 'S3-' + resources.s3BucketName,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 7,
          Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        TrustedSigners: {
          Enabled: false,
          Quantity: 0
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' },
          Headers: {
            Quantity: 1,
            Items: ['Access-Control-Request-Headers']
          }
        },
        MinTTL: 0,
        DefaultTTL: 86400,
        MaxTTL: 31536000,
        Compress: true
      },
      Enabled: true,
      CustomErrorResponses: {
        Quantity: 2,
        Items: [
          {
            ErrorCode: 404,
            ResponsePagePath: '/index.html',
            ResponseCode: '200',
            ErrorCachingMinTTL: 300
          },
          {
            ErrorCode: 403,
            ResponsePagePath: '/index.html',
            ResponseCode: '200',
            ErrorCachingMinTTL: 300
          }
        ]
      }
    };
    
    const response = await cloudfront.send(new CreateDistributionCommand({ DistributionConfig: config }));
    resources.cloudfrontDistributionId = response.Distribution.Id;
    resources.cloudfrontDomain = response.Distribution.DomainName;
    console.log('✅ CloudFront distribution created:', resources.cloudfrontDistributionId);
    console.log('🌐 CloudFront domain:', resources.cloudfrontDomain);
    
    return resources.cloudfrontDistributionId;
  } catch (error) {
    console.error('❌ Error creating CloudFront distribution:', error.message);
    throw error;
  }
}

async function createDynamoDBTables() {
  console.log('\nCreating DynamoDB tables...');
  
  const tables = [
    {
      TableName: resources.dynamoTableName,
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
      console.log('✅ DynamoDB table created:', table.TableName);
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log(`ℹ️  Table ${table.TableName} already exists`);
      } else {
        console.error(`❌ Error creating table ${table.TableName}:`, error.message);
        throw error;
      }
    }
  }
}

async function updateEnvFile() {
  console.log('\nUpdating .env.local file...');
  
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = await fs.readFile(envPath, 'utf8');
  
  // Update with all new resources
  const updates = {
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID': resources.userPoolId,
    'NEXT_PUBLIC_COGNITO_CLIENT_ID': resources.clientId,
    'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID': resources.identityPoolId,
    'NEXT_PUBLIC_S3_VECTOR_BUCKET': resources.s3VectorBucket,
    'NEXT_PUBLIC_S3_CONTENT_BUCKET': resources.s3ContentBucket,
    'NEXT_PUBLIC_DYNAMODB_TABLE': resources.dynamoTableName
  };
  
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
  }
  
  // Add CloudFront info
  if (resources.cloudfrontDomain) {
    envContent += `\n\n# New AWS Resources Created`;
    envContent += `\n# CloudFront Distribution: ${resources.cloudfrontDistributionId}`;
    envContent += `\n# CloudFront Domain: https://${resources.cloudfrontDomain}`;
    envContent += `\n# S3 Bucket: ${resources.s3BucketName}`;
    envContent += `\n# User Pool ID: ${resources.userPoolId}`;
    envContent += `\n# Identity Pool ID: ${resources.identityPoolId}\n`;
  }
  
  await fs.writeFile(envPath, envContent);
  console.log('✅ .env.local updated successfully');
}

async function main() {
  try {
    console.log('🚀 Continuing AWS setup...\n');
    
    // Configure bucket CORS
    await configureBucketCors();
    
    // Disable block public access for main bucket
    await disableBlockPublicAccess();
    
    // Create CloudFront OAI
    const oaiId = await createCloudFrontOAI();
    
    // Create CloudFront distribution
    await createCloudFrontDistribution(oaiId);
    
    // Create DynamoDB tables
    await createDynamoDBTables();
    
    // Update environment file
    await updateEnvFile();
    
    console.log('\n✅ AWS setup completed successfully!');
    console.log('\n📋 Resources summary:');
    console.log(JSON.stringify(resources, null, 2));
    
    console.log('\n📋 Next steps:');
    console.log('1. Run "npm run build" to build the application');
    console.log('2. Run "./deploy-secure.ps1" to deploy to S3');
    console.log(`3. Your app will be available at: https://${resources.cloudfrontDomain}`);
    console.log('\n⚠️  The CloudFront distribution may take 15-20 minutes to deploy globally');
    console.log('\n🔐 SECURITY: Remember to rotate the exposed AWS credentials!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
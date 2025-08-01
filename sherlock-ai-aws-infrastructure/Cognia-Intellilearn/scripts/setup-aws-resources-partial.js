const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

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
const s3 = new S3Client({ region, credentials });
const cloudfront = new CloudFrontClient({ region, credentials });
const dynamodb = new DynamoDBClient({ region, credentials });

const newResources = {
  s3BucketName: 'intellilearn-prod-app',
  s3VectorBucket: 'cognia-intellilearn-prod',
  s3ContentBucket: 'cognia-content-prod',
  cloudfrontDistributionId: null,
  cloudfrontDomain: null,
  dynamoTableName: 'IntelliLearn_Data_Prod'
};

async function createS3Buckets() {
  console.log('Creating S3 buckets...');
  
  const buckets = [
    { name: newResources.s3BucketName, purpose: 'main app' },
    { name: newResources.s3VectorBucket, purpose: 'vectors' },
    { name: newResources.s3ContentBucket, purpose: 'content' }
  ];
  
  for (const bucket of buckets) {
    try {
      // Try with a unique name if the bucket already exists globally
      let bucketName = bucket.name;
      const timestamp = Date.now();
      
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✅ S3 bucket created for ${bucket.purpose}: ${bucketName}`);
      } catch (error) {
        if (error.name === 'BucketAlreadyExists') {
          // Bucket name is taken globally, add timestamp
          bucketName = `${bucket.name}-${timestamp}`;
          await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
          console.log(`✅ S3 bucket created for ${bucket.purpose}: ${bucketName}`);
          
          // Update the resource name
          if (bucket.name === newResources.s3BucketName) {
            newResources.s3BucketName = bucketName;
          } else if (bucket.name === newResources.s3VectorBucket) {
            newResources.s3VectorBucket = bucketName;
          } else if (bucket.name === newResources.s3ContentBucket) {
            newResources.s3ContentBucket = bucketName;
          }
        } else {
          throw error;
        }
      }
      
      // Configure CORS for all buckets
      const corsConfig = {
        Bucket: bucketName,
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
      
      // Configure bucket policy for public read (main app bucket only)
      if (bucket.purpose === 'main app') {
        const bucketPolicy = {
          Bucket: bucketName,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucketName}/*`
            }]
          })
        };
        await s3.send(new PutBucketPolicyCommand(bucketPolicy));
      }
    } catch (error) {
      if (error.name === 'BucketAlreadyOwnedByYou') {
        console.log(`ℹ️  Bucket ${bucket.name} already exists in your account`);
      } else {
        console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
        throw error;
      }
    }
  }
}

async function createCloudFrontDistribution() {
  console.log('\nCreating CloudFront distribution...');
  
  try {
    const config = {
      CallerReference: Date.now().toString(),
      Comment: 'IntelliLearn CloudFront Distribution Prod',
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
    console.log('✅ CloudFront distribution created:', newResources.cloudfrontDistributionId);
    console.log('🌐 CloudFront domain:', newResources.cloudfrontDomain);
    
    return newResources.cloudfrontDistributionId;
  } catch (error) {
    console.error('❌ Error creating CloudFront distribution:', error.message);
    throw error;
  }
}

async function createDynamoDBTables() {
  console.log('\nCreating DynamoDB tables...');
  
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
  console.log('\nUpdating .env.local file with new resources...');
  
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = await fs.readFile(envPath, 'utf8');
  
  // Update the environment variables
  const updates = {
    'NEXT_PUBLIC_S3_VECTOR_BUCKET': newResources.s3VectorBucket,
    'NEXT_PUBLIC_S3_CONTENT_BUCKET': newResources.s3ContentBucket,
    'NEXT_PUBLIC_DYNAMODB_TABLE': newResources.dynamoTableName
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
  
  // Add CloudFront info as a comment
  if (newResources.cloudfrontDomain) {
    envContent += `\n\n# CloudFront Distribution: ${newResources.cloudfrontDistributionId}`;
    envContent += `\n# CloudFront Domain: https://${newResources.cloudfrontDomain}`;
    envContent += `\n# S3 Bucket: ${newResources.s3BucketName}\n`;
  }
  
  await fs.writeFile(envPath, envContent);
  console.log('✅ .env.local file updated successfully');
}

async function main() {
  try {
    console.log('🚀 Starting AWS resource setup (S3, CloudFront, DynamoDB)...\n');
    
    // Create S3 buckets
    await createS3Buckets();
    
    // Create CloudFront distribution
    await createCloudFrontDistribution();
    
    // Create DynamoDB tables
    await createDynamoDBTables();
    
    // Update environment file
    await updateEnvFile();
    
    console.log('\n✅ AWS resources created successfully!');
    console.log('\n📋 Resources created:');
    console.log(JSON.stringify(newResources, null, 2));
    
    console.log('\n⚠️  IMPORTANT: You still need to create Cognito resources manually!');
    console.log('Please add the following policies to your IAM user:');
    console.log('- AmazonCognitoPowerUser');
    console.log('- Or create Cognito resources using the AWS Console');
    
    console.log('\n📋 Next steps:');
    console.log('1. Create Cognito User Pool and Client manually in AWS Console');
    console.log('2. Update .env.local with Cognito IDs');
    console.log('3. Run "npm run build" to build the application');
    console.log('4. Run "./deploy-secure.ps1" to deploy to S3');
    console.log(`5. Your app will be available at: https://${newResources.cloudfrontDomain}`);
    console.log('\n⚠️  SECURITY: Remember to rotate the exposed AWS credentials!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
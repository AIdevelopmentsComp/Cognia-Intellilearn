// AWS Configuration for CognIA IntelliLearn
export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  cognito: {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_ZRhTo5zvG',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '37n270qpd9os6e92uadus8cqor',
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'us-east-1:88239e31-286e-4125-99f5-691dd32b45fe'
  },
  bedrock: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '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'
  }
};

export const APP_CONFIG = {
  name: 'CognIA IntelliLearn',
  url: 'https://d2sn3lk5751y3y.cloudfront.net',
  s3Bucket: process.env.S3_VECTOR_BUCKET || 'cognia-intellilearn',
  dynamoTable: process.env.DYNAMODB_TABLE || 'Intellilearn_Data'
};

export default AWS_CONFIG; 
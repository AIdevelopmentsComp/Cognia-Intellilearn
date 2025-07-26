// AWS Configuration for CognIA IntelliLearn
export const AWS_CONFIG = {
  region: 'us-east-1',
  cognito: {
    userPoolId: 'us-east-1_2moXjGxZ6',
    clientId: '3lsj6gq7erhqsfde90ot87rtk7',
    identityPoolId: 'us-east-1:88239e31-286e-4125-99f5-691dd32b45fe'
  },
  bedrock: {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  }
};

export const APP_CONFIG = {
  name: 'CognIA IntelliLearn',
  url: 'https://d2sn3lk5751y3y.cloudfront.net',
  s3Bucket: 'intellilearn-final'
};

export default AWS_CONFIG; 
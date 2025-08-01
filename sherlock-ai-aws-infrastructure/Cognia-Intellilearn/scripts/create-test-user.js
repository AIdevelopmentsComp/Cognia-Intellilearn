const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createTestUser() {
  const userPoolId = 'us-east-1_BxbAO9DtG'; // From your deployment
  const testUser = {
    email: 'demo@intellilearn.com',
    password: 'Demo2025!',
    name: 'Demo User'
  };

  try {
    console.log('🔐 Creating test user...');
    
    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: testUser.email,
      UserAttributes: [
        { Name: 'email', Value: testUser.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: testUser.name }
      ],
      MessageAction: 'SUPPRESS',
      TemporaryPassword: testUser.password
    });

    await client.send(createCommand);
    console.log('✅ User created successfully');

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: testUser.email,
      Password: testUser.password,
      Permanent: true
    });

    await client.send(setPasswordCommand);
    console.log('✅ Password set successfully');

    console.log('\n📧 Test User Credentials:');
    console.log('========================');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log('========================');
    console.log('\n🌐 Login at: https://d2j7zvp3tz528c.cloudfront.net/auth/login');

  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log('ℹ️  User already exists');
      console.log('\n📧 Test User Credentials:');
      console.log('========================');
      console.log(`Email: ${testUser.email}`);
      console.log(`Password: ${testUser.password}`);
      console.log('========================');
    } else {
      console.error('❌ Error creating user:', error.message);
    }
  }
}

createTestUser();
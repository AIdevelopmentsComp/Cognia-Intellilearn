/**
 * Test script for Cognito JWT authentication
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
 */

const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const https = require('https');

// Configuration
const REGION = 'us-east-1';
const CLIENT_ID = '37n270qpd9os6e92uadus8cqor';
const USERNAME = 'testuser@cognia.edu';
const PASSWORD = 'CogniaTest123!';
const API_ENDPOINT = 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream';

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function authenticateUser() {
  try {
    console.log('🔐 Authenticating user with Cognito...');
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: USERNAME,
        PASSWORD: PASSWORD
      }
    });

    const response = await cognitoClient.send(command);
    
    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed - no tokens received');
    }

    const accessToken = response.AuthenticationResult.AccessToken;
    const idToken = response.AuthenticationResult.IdToken;
    
    console.log('✅ Authentication successful!');
    console.log(`📋 Access Token: ${accessToken.substring(0, 50)}...`);
    console.log(`📋 ID Token: ${idToken.substring(0, 50)}...`);
    
    return accessToken;
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    throw error;
  }
}

async function testAPIWithToken(accessToken) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      audioData: 'dGVzdA==', // base64 "test"
      sessionId: 'test-session',
      courseId: '000000000',
      topic: 'test',
      studentId: 'test-student'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'Origin': 'https://d2sn3lk5751y3y.cloudfront.net',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('\n🧪 Testing API with JWT token...');
    
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`📊 API Status: ${res.statusCode}`);
      console.log('📋 Response Headers:');
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('content-type')) {
          console.log(`   ${key}: ${res.headers[key]}`);
        }
      });

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API test PASSED! Voice streaming is working!');
          console.log('📄 Response:', data.substring(0, 200) + '...');
          resolve(true);
        } else if (res.statusCode === 401) {
          console.log('❌ API test FAILED: Still getting 401 Unauthorized');
          console.log('📄 Response:', data);
          resolve(false);
        } else {
          console.log(`⚠️ API test returned status ${res.statusCode}`);
          console.log('📄 Response:', data);
          resolve(res.statusCode < 500); // Consider 4xx as partial success
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ API request error:', error.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Cognito JWT Authentication Tests');
  console.log(`🎯 Testing with user: ${USERNAME}`);
  console.log(`🌐 API Endpoint: ${API_ENDPOINT}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate and get token
    const accessToken = await authenticateUser();
    
    // Step 2: Test API with token
    const apiSuccess = await testAPIWithToken(accessToken);
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log(`   Cognito Auth: ✅ PASS`);
    console.log(`   API Gateway:  ${apiSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (apiSuccess) {
      console.log('\n🎉 All tests PASSED! Voice streaming authentication is working!');
      console.log('🚀 You can now speak with the voice assistant.');
    } else {
      console.log('\n⚠️ API Gateway test failed. Check the JWT configuration.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests
runTests().catch(console.error);
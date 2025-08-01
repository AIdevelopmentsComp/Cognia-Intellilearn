console.log('🚀 Testing Cognito Authentication...');

// Simular la obtención de un token (en producción vendría de Cognito)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlckBjb2duaWEuZWR1IiwiYXVkIjoiMzduMjcwcXBkOW9zNmU5MnVhZHVzOGNxb3IiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9aUmhUbzV6dkciLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTY0MDk5NTIwMH0.invalid-signature';

console.log('📋 Mock Token:', mockToken.substring(0, 50) + '...');

// Test API call
const https = require('https');

const payload = JSON.stringify({
  audioData: 'dGVzdA==',
  sessionId: 'test-session',
  courseId: '000000000',
  topic: 'test',
  studentId: 'test-student'
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockToken}`,
    'Origin': 'https://d2sn3lk5751y3y.cloudfront.net'
  }
};

console.log('🧪 Testing API with mock token...');

const req = https.request('https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream', options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📄 Response:', data);
    
    if (res.statusCode === 401) {
      console.log('❌ Still getting 401 - JWT validation is failing');
      console.log('🔧 Need to check JWT configuration in API Gateway');
    } else {
      console.log('✅ Authentication working!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(payload);
req.end();
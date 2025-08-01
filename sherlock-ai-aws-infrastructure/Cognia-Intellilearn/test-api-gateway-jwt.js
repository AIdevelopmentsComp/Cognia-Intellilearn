/**
 * Test API Gateway with real JWT authentication
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
 */

const https = require('https');

const API_ENDPOINT = 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream';

// Valid JWT token from our Cognito test
const JWT_TOKEN = 'eyJraWQiOiJEdGRHQnNwYUJTakpzNXIyUVwvMjB1RWFQVnBtXC83ZndWcVpDTTYxcHdIUGs9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJlNDI4OTQ0OC0xMDUxLTcwZGItOWUxYS1kNjEwYzkyYjgxMTIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfWlJoVG81enZHIiwiY29nbml0bzp1c2VybmFtZSI6ImU0Mjg5NDQ4LTEwNTEtNzBkYi05ZTFhLWQ2MTBjOTJiODExMiIsIm9yaWdpbl9qdGkiOiIzZmQ2YWQwNy04ODA1LTQwZTAtYjRjZS0zNmQ4MjYxMGQ5YzgiLCJhdWQiOiIzN24yNzBxcGQ5b3M2ZTkydWFkdXM4Y3FvciIsImV2ZW50X2lkIjoiMmE0NDY4ODUtMTg3MC00NWI4LTgwNTQtNGIwNzc1YjE1NDliIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTM3NDYyODgsImV4cCI6MTc1Mzc0OTg4OCwiaWF0IjoxNzUzNzQ2Mjg4LCJqdGkiOiI1MGM0NWRjMy0yMTU1LTQ4NDctYTg1ZS1hMDVkZmM5YWEwYjQiLCJlbWFpbCI6InRlc3R1c2VyQGNvZ25pYS5lZHUifQ.QkzwNrx5zBRZtH_R5EqPdQjS5yLy1zsn7Vf9-gd9PP3hCfPrJ-qZp1ey_q0S1583ATb2Rz-87o5k3s1S8SVPORvnawKjX0G9HMh2KAnCQ7S9SgFDxc7d3Eo8w2DRFyrAcABFL7o58mmYaFFFaU-HHM6DNSS2Vvx5xk05eVL1X_KiMYh3H3LqnHbj73AzDLx09TrkX3BJyhme_4H_kXbGxR2fJ1FvvAqSJtMXqSrhtNzw5hz9R2u0ZfG9Vcc_KP_m2VZv5eIzoYjXOYhljg2y8HNtwppS8xnZT8JcDC6r57V9b1X11Y8DPF8zpsPz0sG3SkMt4ipRVsWwgJ0uuE5SZw';

function testAPIGatewayWithJWT() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      audioData: 'SGVsbG8gQ29nbmlBIEludGVsbGlMZWFybg==', // base64 "Hello CognIA IntelliLearn"
      sessionId: 'test-jwt-session-' + Date.now(),
      courseId: '000000000',
      topic: 'Project Management Fundamentals',
      studentId: 'test-student',
      contextSources: [],
      timestamp: new Date().toISOString(),
      format: 'webm',
      sampleRate: 16000
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'X-Requested-With': 'CognIA-IntelliLearn',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('🧪 Testing API Gateway with JWT authentication...');
    console.log('🔑 Using JWT Token:', JWT_TOKEN.substring(0, 50) + '...');
    
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`✅ Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        console.log('📦 Received chunk:', chunk.toString().substring(0, 100) + '...');
      });

      res.on('end', () => {
        console.log('🏁 Response completed');
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log('📋 Parsed Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('📋 Raw Response:', data.substring(0, 500) + '...');
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Run the test
testAPIGatewayWithJWT();
/**
 * Direct Lambda test for CognIA IntelliLearn Voice Streaming
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// Initialize Lambda client
const lambdaClient = new LambdaClient({
  region: 'us-east-1'
});

async function testLambdaDirectly() {
  try {
    console.log('🧪 Testing Lambda function directly...');

    const payload = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJraWQiOiJEdGRHQnNwYUJTakpzNXIyUVwvMjB1RWFQVnBtXC83ZndWcVpDTTYxcHdIUGs9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJlNDI4OTQ0OC0xMDUxLTcwZGItOWUxYS1kNjEwYzkyYjgxMTIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfWlJoVG81enZHIiwiY29nbml0bzp1c2VybmFtZSI6ImU0Mjg5NDQ4LTEwNTEtNzBkYi05ZTFhLWQ2MTBjOTJiODExMiIsIm9yaWdpbl9qdGkiOiIzZmQ2YWQwNy04ODA1LTQwZTAtYjRjZS0zNmQ4MjYxMGQ5YzgiLCJhdWQiOiIzN24yNzBxcGQ5b3M2ZTkydWFkdXM4Y3FvciIsImV2ZW50X2lkIjoiMmE0NDY4ODUtMTg3MC00NWI4LTgwNTQtNGIwNzc1YjE1NDliIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTM3NDYyODgsImV4cCI6MTc1Mzc0OTg4OCwiaWF0IjoxNzUzNzQ2Mjg4LCJqdGkiOiI1MGM0NWRjMy0yMTU1LTQ4NDctYTg1ZS1hMDVkZmM5YWEwYjQiLCJlbWFpbCI6InRlc3R1c2VyQGNvZ25pYS5lZHUifQ.QkzwNrx5zBRZtH_R5EqPdQjS5yLy1zsn7Vf9-gd9PP3hCfPrJ-qZp1ey_q0S1583ATb2Rz-87o5k3s1S8SVPORvnawKjX0G9HMh2KAnCQ7S9SgFDxc7d3Eo8w2DRFyrAcABFL7o58mmYaFFFaU-HHM6DNSS2Vvx5xk05eVL1X_KiMYh3H3LqnHbj73AzDLx09TrkX3BJyhme_4H_kXbGxR2fJ1FvvAqSJtMXqSrhtNzw5hz9R2u0ZfG9Vcc_KP_m2VZv5eIzoYjXOYhljg2y8HNtwppS8xnZT8JcDC6r57V9b1X11Y8DPF8zpsPz0sG3SkMt4ipRVsWwgJ0uuE5SZw'
      },
      body: JSON.stringify({
        audioData: 'SGVsbG8gQ29nbmlBIEludGVsbGlMZWFybg==', // base64 "Hello CognIA IntelliLearn"
        sessionId: 'test-direct-session-' + Date.now(),
        courseId: '000000000',
        topic: 'Project Management Fundamentals',
        studentId: 'test-student',
        contextSources: [],
        timestamp: new Date().toISOString(),
        format: 'webm',
        sampleRate: 16000
      })
    };

    const command = new InvokeCommand({
      FunctionName: 'cognia-bedrock-voice-streaming',
      Payload: JSON.stringify(payload)
    });

    console.log('📤 Invoking Lambda function...');
    const response = await lambdaClient.send(command);

    // Decode response
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log('📋 Lambda Response Status:', response.StatusCode);
    console.log('📋 Lambda Response Payload:', JSON.stringify(responsePayload, null, 2));

    if (responsePayload.errorMessage) {
      console.error('❌ Lambda Error:', responsePayload.errorMessage);
      console.error('❌ Error Type:', responsePayload.errorType);
      console.error('❌ Stack Trace:', responsePayload.trace);
    }

  } catch (error) {
    console.error('❌ Direct Lambda test failed:', error);
  }
}

// Run the test
testLambdaDirectly();
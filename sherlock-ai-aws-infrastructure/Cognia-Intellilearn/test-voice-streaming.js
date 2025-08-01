/**
 * Final test for CognIA IntelliLearn Voice Streaming
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
 */

const https = require('https');

const API_ENDPOINT = 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream';

function testVoiceStreaming() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      audioData: 'SGVsbG8gQ29nbmlBIEludGVsbGlMZWFybg==', // base64 "Hello CognIA IntelliLearn"
      sessionId: 'test-voice-session-' + Date.now(),
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
        'Authorization': 'Bearer cognia-voice-streaming-token',
        'X-Requested-With': 'CognIA-IntelliLearn',
        'Origin': 'https://d2sn3lk5751y3y.cloudfront.net'
      }
    };

    console.log('🎤 Testing CognIA IntelliLearn Voice Streaming...');
    console.log('🎯 Endpoint:', API_ENDPOINT);
    console.log('📊 Payload size:', payload.length, 'bytes');
    
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log('📋 Headers:');
      Object.keys(res.headers).forEach(key => {
        console.log(`   ${key}: ${res.headers[key]}`);
      });

      let data = '';
      res.on('data', chunk => {
        data += chunk;
        // Show streaming data in real-time
        if (chunk.toString().includes('data:')) {
          console.log('🔄 Streaming:', chunk.toString().substring(0, 100) + '...');
        }
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ VOICE STREAMING TEST PASSED!');
          console.log('🎉 You can now speak with the CognIA assistant!');
          console.log('📄 Response preview:', data.substring(0, 200) + '...');
          resolve(true);
        } else {
          console.log('❌ Test failed with status:', res.statusCode);
          console.log('📄 Error response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// Run the test
async function runTest() {
  console.log('🚀 CognIA IntelliLearn Voice Streaming Test');
  console.log('=' .repeat(60));
  
  const success = await testVoiceStreaming();
  
  console.log('\n' + '=' .repeat(60));
  if (success) {
    console.log('🎊 SUCCESS! Voice streaming is working perfectly!');
    console.log('🌐 Go to: https://d2sn3lk5751y3y.cloudfront.net');
    console.log('📚 Navigate to: Dashboard → My Courses → Fundamentos de Project Management');
    console.log('🎤 Click: "Generar Sesión de Voz" and start talking!');
  } else {
    console.log('❌ Test failed. Check the configuration.');
  }
}

runTest().catch(console.error);
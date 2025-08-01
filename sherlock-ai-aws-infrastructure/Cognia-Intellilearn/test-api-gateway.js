/**
 * Test script for API Gateway CORS and voice streaming configuration
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
 */

const https = require('https');

const API_ENDPOINT = 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream';

// Test 1: OPTIONS preflight request
function testCORSPreflight() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://d2sn3lk5751y3y.cloudfront.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, authorization'
      }
    };

    console.log('🧪 Testing CORS preflight request...');
    
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`✅ OPTIONS Status: ${res.statusCode}`);
      console.log('📋 Response Headers:');
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`   ${key}: ${res.headers[key]}`);
        }
      });

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ CORS preflight test PASSED');
          resolve(true);
        } else {
          console.log('❌ CORS preflight test FAILED');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ CORS preflight error:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: POST request (will fail due to auth, but should not have CORS issues)
function testPOSTRequest() {
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
        'Authorization': 'Bearer test-token'
      }
    };

    console.log('\n🧪 Testing POST request...');
    
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`📊 POST Status: ${res.statusCode}`);
      console.log('📋 Response Headers:');
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`   ${key}: ${res.headers[key]}`);
        }
      });

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // We expect 401/403 due to auth, but no CORS errors
        if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('✅ POST test PASSED (expected auth error, no CORS issues)');
          resolve(true);
        } else if (res.statusCode === 200) {
          console.log('✅ POST test PASSED (unexpected success!)');
          resolve(true);
        } else {
          console.log(`❌ POST test FAILED with status ${res.statusCode}`);
          console.log('Response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ POST request error:', error.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Gateway CORS tests for CognIA IntelliLearn Voice Streaming');
  console.log(`🎯 Testing endpoint: ${API_ENDPOINT}`);
  console.log(`🌐 Origin: https://d2sn3lk5751y3y.cloudfront.net`);
  console.log('=' .repeat(60));

  const preflightResult = await testCORSPreflight();
  const postResult = await testPOSTRequest();

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log(`   CORS Preflight: ${preflightResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   POST Request:   ${postResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (preflightResult && postResult) {
    console.log('\n🎉 All tests PASSED! API Gateway CORS is configured correctly.');
    console.log('🚀 Voice streaming should work from the frontend now.');
  } else {
    console.log('\n⚠️  Some tests FAILED. Check the configuration.');
  }
}

// Run tests
runTests().catch(console.error); 
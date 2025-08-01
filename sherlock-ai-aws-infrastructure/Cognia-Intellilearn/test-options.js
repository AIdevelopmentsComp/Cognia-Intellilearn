/**
 * Test OPTIONS preflight request for CORS
 */

const https = require('https');

const API_ENDPOINT = 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream';

async function testOptionsRequest() {
  console.log('🧪 Testing OPTIONS preflight request...');
  
  const options = {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://d2sn3lk5751y3y.cloudfront.net',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(API_ENDPOINT, options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log('📋 Response Headers:');
      
      // Check specifically for CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods', 
        'access-control-allow-headers',
        'access-control-allow-credentials',
        'access-control-max-age'
      ];
      
      corsHeaders.forEach(header => {
        if (res.headers[header]) {
          console.log(`✅ ${header}: ${res.headers[header]}`);
        } else {
          console.log(`❌ ${header}: MISSING`);
        }
      });

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (data) {
          console.log('📄 Response Body:', data);
        }
        console.log('🏁 OPTIONS test completed');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve();
    });

    req.end();
  });
}

testOptionsRequest();
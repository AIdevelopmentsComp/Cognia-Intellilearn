/**
 * Simple CORS headers test for API Gateway
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 1.0.0
 * @created 2025-01-28
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
            console.log(`📊 OPTIONS Status Code: ${res.statusCode}`);
            console.log('📋 OPTIONS Response Headers:');
            
            const corsHeaders = [
                'access-control-allow-origin',
                'access-control-allow-methods', 
                'access-control-allow-headers',
                'access-control-allow-credentials'
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
                    console.log('📄 OPTIONS Response Body:', data);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ OPTIONS Request error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

async function testPostRequest() {
    console.log('\n🧪 Testing POST request...');
    
    const postData = JSON.stringify({
        audioData: 'SGVsbG8=',
        sessionId: 'test-cors-post',
        courseId: '000000000',
        topic: 'Test CORS',
        studentId: 'test'
    });
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Origin': 'https://d2sn3lk5751y3y.cloudfront.net'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(API_ENDPOINT, options, (res) => {
            console.log(`📊 POST Status Code: ${res.statusCode}`);
            console.log('📋 POST Response Headers:');
            
            const corsHeaders = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers', 
                'access-control-allow-credentials'
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
                    console.log('📄 POST Response Body:', data.substring(0, 200) + '...');
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ POST Request error:', error.message);
            resolve();
        });
        
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting CORS Tests...\n');
    
    await testOptionsRequest();
    await testPostRequest();
    
    console.log('\n🏁 CORS Tests completed!');
}

runTests();
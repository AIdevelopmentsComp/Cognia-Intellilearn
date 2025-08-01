import json
import requests

# Lambda endpoint URL
url = "https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream"

# Test payload
payload = {
    "audioData": "test audio data",
    "sessionId": "test_session_123",
    "courseId": "000000000",
    "topic": "Test TTS",
    "studentId": "test_student",
    "contextSources": [],
    "timestamp": "2025-07-29T05:00:00Z",
    "format": "webm",
    "sampleRate": 16000
}

# Headers
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer test-token"
}

# Make request
print("🚀 Testing Lambda TTS function...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\n📡 Response Status: {response.status_code}")
    print(f"📨 Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Response Data:")
        print(json.dumps(data, indent=2))
        
        # Check for audio URLs
        if "audioUrls" in data:
            print(f"\n🎵 Audio URLs found: {len(data['audioUrls'])}")
            for url in data["audioUrls"]:
                print(f"  - {url}")
        else:
            print("\n❌ No audioUrls found in response")
            
        # Check chunks for audio URLs
        if "chunks" in data:
            audio_chunks = [chunk for chunk in data["chunks"] if "audioUrl" in chunk]
            print(f"\n🎵 Audio chunks found: {len(audio_chunks)}")
            for chunk in audio_chunks:
                print(f"  - {chunk['audioUrl']}")
    else:
        print(f"\n❌ Error Response:")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ Request failed: {e}")
$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    audioData = 'SGVsbG8='
    sessionId = 'test-ps-simple'
    courseId = '000000000'
    topic = 'Test'
    studentId = 'test'
} | ConvertTo-Json

try {
    Write-Host "🧪 Testing API Gateway without JWT..."
    $response = Invoke-WebRequest -Uri 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream' -Method POST -Headers $headers -Body $body
    Write-Host "✅ Status: $($response.StatusCode)"
    Write-Host "📋 CORS Headers:"
    $response.Headers.GetEnumerator() | Where-Object { $_.Key -like '*access-control*' } | ForEach-Object { 
        Write-Host "  $($_.Key): $($_.Value)" 
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "📊 Status Code: $($_.Exception.Response.StatusCode)"
        Write-Host "📋 Response Headers:"
        $_.Exception.Response.Headers.GetEnumerator() | Where-Object { $_.Key -like '*access-control*' } | ForEach-Object { 
            Write-Host "  $($_.Key): $($_.Value)" 
        }
    }
}
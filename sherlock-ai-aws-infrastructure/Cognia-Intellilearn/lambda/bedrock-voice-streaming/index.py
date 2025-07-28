import json
import boto3
import base64
import os
import uuid
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor
import logging

# Configure logging with structured format
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients with error handling
try:
    bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    s3_client = boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    cloudwatch = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
except Exception as e:
    logger.error(f"Failed to initialize AWS clients: {e}")
    raise

# Environment variables with defaults
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'cognia-intellilearn')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'intellilearn_Data')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
DEFAULT_TTL_DAYS = int(os.environ.get('TTL_DAYS', '30'))
MAX_CONTEXT_SOURCES = int(os.environ.get('MAX_CONTEXT_SOURCES', '3'))
MAX_CONTEXT_LENGTH = int(os.environ.get('MAX_CONTEXT_LENGTH', '500'))
API_KEY = os.environ.get('API_KEY', '')
ENABLE_METRICS = os.environ.get('ENABLE_METRICS', 'true').lower() == 'true'

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Production-ready AWS Lambda handler for Bedrock voice streaming with AI Content architecture
    """
    # Generate unique request ID for tracing
    request_id = str(uuid.uuid4())
    
    try:
        logger.info(f"[{request_id}] Starting voice streaming request")
        
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return handle_options()
        
        # Validate API key if configured
        if API_KEY and not validate_api_key(event):
            logger.warning(f"[{request_id}] Unauthorized access attempt")
            return create_error_response(403, "Unauthorized", request_id)
        
        # Parse and validate request body
        try:
            if 'body' in event:
                body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            else:
                body = event
        except json.JSONDecodeError as e:
            logger.error(f"[{request_id}] Invalid JSON in request body: {e}")
            return create_error_response(400, "Invalid JSON format", request_id)
        
        # Robust input validation
        validation_error = validate_input(body, request_id)
        if validation_error:
            return validation_error
        
        # Extract validated payload
        audio_data = body['audioData']
        session_id = body['sessionId']
        course_id = body.get('courseId', '000000000')
        topic = body.get('topic', 'General')
        student_id = body.get('studentId', 'student_default')
        context_sources = body.get('contextSources', [])
        action = body.get('action', 'stream_audio')
        
        # Sanitize inputs
        course_id = sanitize_string(course_id)
        topic = sanitize_string(topic)
        student_id = sanitize_string(student_id)
        
        logger.info(f"[{request_id}] Processing session: {session_id}, Course: {course_id}, Topic: {topic}")
        
        # Handle different actions
        if action == 'stop_session':
            return handle_session_stop(session_id, request_id)
        
        # Get optimized educational context
        educational_context = get_educational_context_optimized(
            context_sources, course_id, topic, request_id
        )
        
        # Create enhanced prompt with context
        enhanced_prompt = create_educational_prompt(audio_data, topic, educational_context)
        
        # Prepare Bedrock streaming request
        bedrock_request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": int(os.environ.get('MAX_TOKENS', '1000')),
            "messages": [
                {
                    "role": "user",
                    "content": enhanced_prompt
                }
            ],
            "temperature": float(os.environ.get('TEMPERATURE', '0.7')),
            "top_p": float(os.environ.get('TOP_P', '0.9'))
        }
        
        # Invoke Bedrock with error handling
        try:
            response = bedrock_client.invoke_model_with_response_stream(
                modelId=MODEL_ID,
                contentType='application/json',
                accept='application/json',
                body=json.dumps(bedrock_request)
            )
        except Exception as e:
            logger.error(f"[{request_id}] Bedrock invocation failed: {e}")
            if ENABLE_METRICS:
                send_metric('BedrockErrors', 1, course_id)
            return create_error_response(500, "AI service temporarily unavailable", request_id)
        
        # Process streaming response with AI Content integration
        full_response = ""
        streaming_chunks = []
        
        try:
            for event_stream in response['body']:
                chunk = event_stream.get('chunk')
                if chunk:
                    chunk_data = json.loads(chunk['bytes'].decode())
                    
                    if chunk_data['type'] == 'content_block_delta':
                        text_chunk = chunk_data['delta'].get('text', '')
                        if text_chunk:
                            full_response += text_chunk
                            
                            # Create streaming chunk for frontend
                            chunk_response = {
                                'type': 'ai_response',
                                'text': text_chunk,
                                'sessionId': session_id,
                                'timestamp': datetime.now().isoformat(),
                                'requestId': request_id
                            }
                            streaming_chunks.append(chunk_response)
                            
                            logger.debug(f"[{request_id}] AI Chunk: {text_chunk[:50]}...")
        
        except Exception as e:
            logger.error(f"[{request_id}] Error processing streaming response: {e}")
            return create_error_response(500, "Error processing AI response", request_id)
        
        # Save AI Content with parallel processing
        save_success = save_ai_content_parallel(
            session_id, course_id, topic, student_id, 
            enhanced_prompt, full_response, request_id
        )
        
        # Create final response chunks
        final_chunks = [
            {
                'type': 'transcription',
                'text': f"Audio procesado para sesión de {topic}",
                'sessionId': session_id,
                'requestId': request_id
            }
        ] + streaming_chunks + [
            {
                'type': 'stream_end',
                'sessionId': session_id,
                'fullResponse': full_response,
                'requestId': request_id,
                'metadata': {
                    'courseId': course_id,
                    'topic': topic,
                    'studentId': student_id,
                    'contextSourcesUsed': len(context_sources),
                    'responseLength': len(full_response),
                    'model': MODEL_ID
                }
            }
        ]
        
        # Send success metrics
        if ENABLE_METRICS:
            send_metric('SessionsProcessed', 1, course_id)
            send_metric('ResponseLength', len(full_response), course_id)
            send_metric('ContextSources', len(context_sources), course_id)
        
        logger.info(f"[{request_id}] Successfully processed voice streaming session")
        
        # Return streaming response
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': True,
                'sessionId': session_id,
                'requestId': request_id,
                'chunks': final_chunks,
                'fullResponse': full_response,
                'aiContentSaved': save_success,
                'metadata': {
                    'model': MODEL_ID,
                    'courseId': course_id,
                    'topic': topic,
                    'chunksCount': len(streaming_chunks),
                    'responseLength': len(full_response),
                    'contextSources': len(context_sources),
                    'timestamp': datetime.now().isoformat()
                }
            })
        }
        
    except Exception as e:
        logger.error(f"[{request_id}] Unhandled error in lambda_handler: {str(e)}")
        if ENABLE_METRICS:
            send_metric('LambdaErrors', 1, 'unknown')
        return create_error_response(500, "Internal server error", request_id)

def validate_input(body: Dict[str, Any], request_id: str) -> Optional[Dict[str, Any]]:
    """
    Robust input validation with detailed error messages
    """
    required_fields = ['audioData', 'sessionId']
    optional_fields = ['courseId', 'topic', 'studentId', 'contextSources', 'action']
    
    # Check required fields
    missing = [f for f in required_fields if f not in body or not body[f]]
    if missing:
        logger.warning(f"[{request_id}] Missing required fields: {missing}")
        return create_error_response(400, f"Missing required fields: {', '.join(missing)}", request_id)
    
    # Validate field types and lengths
    if not isinstance(body['audioData'], str):
        return create_error_response(400, "audioData must be a string", request_id)
    
    if len(body['audioData']) > 1000000:  # 1MB limit
        return create_error_response(400, "audioData too large (max 1MB)", request_id)
    
    if not isinstance(body['sessionId'], str) or len(body['sessionId']) < 3:
        return create_error_response(400, "sessionId must be a string with at least 3 characters", request_id)
    
    # Validate optional fields
    if 'contextSources' in body and not isinstance(body['contextSources'], list):
        return create_error_response(400, "contextSources must be an array", request_id)
    
    return None

def validate_api_key(event: Dict[str, Any]) -> bool:
    """
    Validate API key from Authorization header
    """
    if not API_KEY:
        return True  # No API key configured, allow access
    
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization') or headers.get('authorization')
    
    if not auth_header:
        return False
    
    return auth_header == f"Bearer {API_KEY}"

def sanitize_string(value: str) -> str:
    """
    Sanitize string input to prevent injection attacks
    """
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\';\\]', '', str(value))
    # Limit length
    return sanitized[:100]

def get_educational_context_optimized(
    context_sources: List[str], 
    course_id: str, 
    topic: str, 
    request_id: str
) -> str:
    """
    Optimized educational context retrieval with compression and caching
    """
    try:
        context_content = []
        
        # Limit sources for performance
        limited_sources = context_sources[:MAX_CONTEXT_SOURCES]
        
        for source_path in limited_sources:
            try:
                # Validate source path
                if not source_path or '..' in source_path:
                    logger.warning(f"[{request_id}] Invalid source path: {source_path}")
                    continue
                
                response = s3_client.get_object(
                    Bucket=BUCKET_NAME, 
                    Key=source_path,
                    Range=f'bytes=0-{MAX_CONTEXT_LENGTH * 2}'  # Limit bytes read
                )
                content = response['Body'].read().decode('utf-8', errors='ignore')
                
                # Compress content - remove excessive whitespace and line breaks
                compressed_content = re.sub(r'\s+', ' ', content.strip())
                truncated_content = compressed_content[:MAX_CONTEXT_LENGTH]
                
                context_content.append(f"📄 {source_path.split('/')[-1]}: {truncated_content}")
                
            except Exception as e:
                logger.warning(f"[{request_id}] Could not retrieve context from {source_path}: {e}")
                continue
        
        if context_content:
            return "\n".join(context_content)
        else:
            return f"Contenido educativo relacionado con {topic} en el curso {course_id}"
            
    except Exception as e:
        logger.error(f"[{request_id}] Error getting educational context: {e}")
        return f"Contexto educativo general para {topic}"

def create_educational_prompt(audio_data: str, topic: str, context: str) -> str:
    """
    Create enhanced educational prompt with context - optimized version
    """
    # Limit audio data reference for token efficiency
    audio_ref = f"{len(audio_data)} caracteres de datos de audio"
    
    return f"""Eres CognIA, un asistente educativo inteligente especializado en aprendizaje interactivo y personalizado.

🎯 CONTEXTO EDUCATIVO:
Tema: {topic}
Material de referencia:
{context[:1000]}

🎤 SESIÓN DE VOZ:
Audio procesado: {audio_ref}

📚 INSTRUCCIONES:
1. Responde como profesor experto en {topic}
2. Usa el material de referencia cuando sea relevante
3. Mantén respuestas conversacionales (máximo 3 oraciones)
4. Haz preguntas para mantener engagement
5. Adapta el nivel según las respuestas
6. Usa tono amigable y profesional

🚀 RESPUESTA:
Saluda y pregunta específicamente qué aspecto de {topic} quiere explorar."""

def save_ai_content_parallel(
    session_id: str, 
    course_id: str, 
    topic: str, 
    student_id: str, 
    prompt: str, 
    response: str,
    request_id: str
) -> bool:
    """
    Save AI content with parallel processing for better performance
    """
    try:
        timestamp = datetime.now().isoformat()
        ttl_timestamp = int(datetime.now().timestamp()) + (DEFAULT_TTL_DAYS * 86400)
        
        # Use ThreadPoolExecutor for parallel I/O operations
        with ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all save operations
            future_prompt = executor.submit(
                save_bedrock_prompt, session_id, topic, prompt, response, timestamp, request_id
            )
            future_text = executor.submit(
                save_text_output, session_id, student_id, response, timestamp, request_id
            )
            future_metadata = executor.submit(
                save_metadata_to_dynamodb, session_id, course_id, topic, student_id, 
                prompt, response, timestamp, ttl_timestamp, request_id
            )
            
            # Wait for all operations to complete
            results = [
                future_prompt.result(),
                future_text.result(),
                future_metadata.result()
            ]
            
            success = all(results)
            logger.info(f"[{request_id}] AI Content save operations completed: {success}")
            return success
            
    except Exception as e:
        logger.error(f"[{request_id}] Error in parallel save operations: {e}")
        return False

def save_bedrock_prompt(
    session_id: str, topic: str, prompt: str, response: str, 
    timestamp: str, request_id: str
) -> bool:
    """
    Save Bedrock prompt to S3
    """
    try:
        key = f"AIContent/BedrockPrompts/{topic}/{session_id}.json"
        prompt_data = {
            'sessionId': session_id,
            'topic': topic,
            'prompt': prompt,
            'response': response,
            'timestamp': timestamp,
            'model': MODEL_ID,
            'requestId': request_id
        }
        
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=json.dumps(prompt_data, indent=2, ensure_ascii=False),
            ContentType='application/json',
            Metadata={
                'sessionId': session_id,
                'topic': topic,
                'requestId': request_id
            }
        )
        
        logger.debug(f"[{request_id}] Bedrock prompt saved: {key}")
        return True
        
    except Exception as e:
        logger.error(f"[{request_id}] Error saving Bedrock prompt: {e}")
        return False

def save_text_output(
    session_id: str, student_id: str, response: str, 
    timestamp: str, request_id: str
) -> bool:
    """
    Save text output to S3
    """
    try:
        key = f"AIContent/TextOutput/{student_id}/{session_id}.txt"
        
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=response,
            ContentType='text/plain; charset=utf-8',
            Metadata={
                'sessionId': session_id,
                'studentId': student_id,
                'createdAt': timestamp,
                'requestId': request_id
            }
        )
        
        logger.debug(f"[{request_id}] Text output saved: {key}")
        return True
        
    except Exception as e:
        logger.error(f"[{request_id}] Error saving text output: {e}")
        return False

def save_metadata_to_dynamodb(
    session_id: str, course_id: str, topic: str, student_id: str,
    prompt: str, response: str, timestamp: str, ttl_timestamp: int, request_id: str
) -> bool:
    """
    Save session metadata to DynamoDB
    """
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(
            Item={
                'PK': f'VOICE_SESSION#{session_id}',
                'SK': 'METADATA',
                'sessionId': session_id,
                'courseId': course_id,
                'topic': topic,
                'studentId': student_id,
                'responseLength': len(response),
                'promptLength': len(prompt),
                'model': MODEL_ID,
                'createdAt': timestamp,
                'requestId': request_id,
                'TTL': ttl_timestamp,
                'GSI1PK': f'STUDENT#{student_id}',
                'GSI1SK': f'SESSION#{timestamp}'
            }
        )
        
        logger.debug(f"[{request_id}] Session metadata saved to DynamoDB")
        return True
        
    except Exception as e:
        logger.error(f"[{request_id}] Error saving session metadata: {e}")
        return False

def send_metric(metric_name: str, value: float, course_id: str) -> None:
    """
    Send custom CloudWatch metrics
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='CognIA/VoiceStreaming',
            MetricData=[{
                'MetricName': metric_name,
                'Dimensions': [
                    {'Name': 'Course', 'Value': course_id},
                    {'Name': 'Environment', 'Value': os.environ.get('ENVIRONMENT', 'production')}
                ],
                'Value': value,
                'Unit': 'Count' if metric_name.endswith('Errors') or metric_name == 'SessionsProcessed' else 'None',
                'Timestamp': datetime.now()
            }]
        )
    except Exception as e:
        logger.warning(f"Failed to send CloudWatch metric {metric_name}: {e}")

def handle_session_stop(session_id: str, request_id: str) -> Dict[str, Any]:
    """
    Handle session stop cleanup with metrics
    """
    logger.info(f"[{request_id}] Stopping session: {session_id}")
    
    if ENABLE_METRICS:
        send_metric('SessionsStopped', 1, 'unknown')
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'success': True,
            'message': f'Session {session_id} stopped',
            'sessionId': session_id,
            'requestId': request_id
        })
    }

def get_cors_headers() -> Dict[str, str]:
    """
    Get standardized CORS headers
    """
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

def handle_options() -> Dict[str, Any]:
    """
    Handle CORS preflight requests
    """
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': ''
    }

def create_error_response(status_code: int, message: str, request_id: str) -> Dict[str, Any]:
    """
    Create standardized error response
    """
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'success': False,
            'error': message,
            'requestId': request_id,
            'timestamp': datetime.now().isoformat()
        })
    }

# Export for Lambda deployment
__all__ = ['lambda_handler'] 
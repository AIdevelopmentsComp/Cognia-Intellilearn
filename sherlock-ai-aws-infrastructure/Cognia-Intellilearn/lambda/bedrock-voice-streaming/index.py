import json
import boto3
import base64
from typing import Dict, Any, Generator
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client with IAM role credentials (automatic STS)
bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    AWS Lambda handler for Bedrock voice streaming
    Handles secure streaming with automatic IAM authentication
    """
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
            
        audio_data = body.get('audioData', '')
        session_id = body.get('sessionId', 'unknown')
        
        logger.info(f"🎤 Processing voice session: {session_id}")
        
        # Prepare Bedrock streaming request
        bedrock_request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"""Eres CognIA, un asistente educativo inteligente especializado en aprendizaje interactivo.

🎯 CONTEXTO:
- El usuario está en una sesión de voz educativa
- Debes responder de manera conversacional y pedagógica
- Mantén respuestas concisas pero informativas (máximo 3 oraciones)
- Usa un tono amigable y profesional

🎤 AUDIO RECIBIDO: {audio_data[:100] if audio_data else 'Iniciando conversación'}...

Responde como un profesor experto que está teniendo una conversación educativa natural con el estudiante. Pregunta qué tema quiere aprender o en qué puedes ayudarle."""
                        }
                    ]
                }
            ],
            "stream": True,
            "temperature": 0.7,
            "top_p": 0.9
        }
        
        # Invoke Bedrock with streaming
        response = bedrock_client.invoke_model_with_response_stream(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(bedrock_request)
        )
        
        # Process streaming response
        full_response = ""
        chunks = []
        
        for event_stream in response['body']:
            chunk = event_stream.get('chunk')
            if chunk:
                chunk_data = json.loads(chunk['bytes'].decode())
                
                if chunk_data['type'] == 'content_block_delta':
                    text_chunk = chunk_data['delta'].get('text', '')
                    if text_chunk:
                        full_response += text_chunk
                        chunks.append({
                            'type': 'text_chunk',
                            'text': text_chunk,
                            'sessionId': session_id
                        })
                        logger.info(f"📝 Chunk: {text_chunk[:50]}...")
        
        # Add completion marker
        chunks.append({
            'type': 'stream_end',
            'sessionId': session_id,
            'fullResponse': full_response
        })
        
        logger.info(f"✅ Completed streaming for session: {session_id}")
        
        # Return response for API Gateway
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'sessionId': session_id,
                'chunks': chunks,
                'fullResponse': full_response,
                'metadata': {
                    'model': 'claude-3-haiku',
                    'chunksCount': len(chunks) - 1,  # Exclude end marker
                    'responseLength': len(full_response)
                }
            })
        }
        
    except Exception as e:
        logger.error(f"❌ Lambda error: {str(e)}")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Error procesando solicitud de voz',
                'details': str(e),
                'sessionId': session_id if 'session_id' in locals() else 'unknown'
            })
        }

def handle_options():
    """Handle CORS preflight requests"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': ''
    }

# Export for Lambda deployment
__all__ = ['lambda_handler'] 
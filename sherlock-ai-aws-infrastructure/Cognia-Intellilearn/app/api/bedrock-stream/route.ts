import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Bedrock client with environment credentials
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  }
})

export async function POST(request: NextRequest) {
  try {
    const { audioData, sessionId } = await request.json()

    console.log('🎤 Processing voice session:', sessionId)
    console.log('🔑 Using AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION)
    console.log('🔑 Access Key ID:', process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID?.substring(0, 8) + '...')

    // Prepare Bedrock streaming request
    const input = {
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Eres CognIA, un asistente educativo inteligente especializado en aprendizaje interactivo.

🎯 CONTEXTO:
- El usuario está en una sesión de voz educativa
- Debes responder de manera conversacional y pedagógica  
- Mantén respuestas concisas pero informativas (máximo 3 oraciones)
- Usa un tono amigable y profesional

🎤 AUDIO RECIBIDO: ${audioData ? 'Audio procesado' : 'Iniciando conversación'}

Responde como un profesor experto que está teniendo una conversación educativa natural con el estudiante. Pregunta qué tema quiere aprender o en qué puedes ayudarle.`
              }
            ]
          }
        ],
        stream: true,
        temperature: 0.7,
        top_p: 0.9
      })
    }

    console.log('📡 Sending request to Bedrock...')

    // Send streaming request to Bedrock
    const command = new InvokeModelWithResponseStreamCommand(input)
    const response = await bedrockClient.send(command)

    console.log('✅ Bedrock response received, starting stream...')

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (response.body) {
            for await (const chunk of response.body) {
              if (chunk.chunk?.bytes) {
                const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes))
                
                if (chunkData.delta?.text) {
                  // Send chunk to client
                  const data = JSON.stringify({
                    type: 'text_chunk',
                    text: chunkData.delta.text,
                    sessionId
                  })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  console.log('📝 Streaming chunk:', chunkData.delta.text.substring(0, 50) + '...')
                }
                
                if (chunkData.type === 'message_stop') {
                  // Send completion signal
                  const data = JSON.stringify({
                    type: 'stream_end',
                    sessionId
                  })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  console.log('🏁 Stream completed for session:', sessionId)
                  controller.close()
                  return
                }
              }
            }
          }
          controller.close()
        } catch (error) {
          console.error('❌ Error in Bedrock streaming:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Error en el streaming de Bedrock',
            details: error instanceof Error ? error.message : 'Error desconocido',
            sessionId
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ Error in Bedrock API:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Error al procesar la solicitud de voz',
        details: error instanceof Error ? error.message : 'Error desconocido',
        type: error instanceof Error ? error.name : 'UnknownError'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 
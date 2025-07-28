import { NextRequest, NextResponse } from 'next/server'
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'

// AWS Configuration
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
}

const pollyClient = new PollyClient(awsConfig)

const getPollyVoiceId = (voiceStyle: string): 'Matthew' | 'Joanna' | 'Justin' | 'Amy' | 'Brian' => {
  const voiceMap: Record<string, 'Matthew' | 'Joanna' | 'Justin' | 'Amy' | 'Brian'> = {
    'formal': 'Matthew',
    'casual': 'Joanna',
    'energetic': 'Justin',
    'calm': 'Amy',
    'professional': 'Brian'
  }
  
  return voiceMap[voiceStyle] || 'Matthew'
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceStyle = 'professional' } = await request.json()

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    // Synthesize speech with Polly
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: getPollyVoiceId(voiceStyle),
      Engine: 'neural',
      SampleRate: '22050'
    })

    const pollyResponse = await pollyClient.send(command)
    
    if (pollyResponse.AudioStream) {
      // Convert stream to bytes
      const chunks: Uint8Array[] = []
      
      // Handle the stream properly
      const stream = pollyResponse.AudioStream as any
      for await (const chunk of stream) {
        chunks.push(new Uint8Array(chunk))
      }
      
      // Calculate total length and combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      const audioBuffer = new Uint8Array(totalLength)
      let offset = 0
      
      for (const chunk of chunks) {
        audioBuffer.set(chunk, offset)
        offset += chunk.length
      }
      
      // Convert to base64
      const base64Audio = Buffer.from(audioBuffer).toString('base64')
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`
      
      return NextResponse.json({ success: true, audioUrl: audioDataUrl })
    }
    
    throw new Error('No audio stream received from Polly')

  } catch (error) {
    console.error('Polly API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to synthesize speech' },
      { status: 500 }
    )
  }
} 
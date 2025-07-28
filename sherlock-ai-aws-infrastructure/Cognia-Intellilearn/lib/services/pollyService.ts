import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// AWS Configuration
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
}

// AWS Clients
const pollyClient = new PollyClient(awsConfig)
const s3Client = new S3Client(awsConfig)

// Configuration
const AUDIO_BUCKET = 'intellilearn-final'
const AUDIO_PREFIX = 'voice-responses'

/**
 * Get appropriate Polly voice ID based on style
 */
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

/**
 * Convert stream to buffer
 */
const streamToBuffer = async (stream: any): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = []
  
  for await (const chunk of stream) {
    chunks.push(new Uint8Array(chunk))
  }
  
  // Calculate total length
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  
  // Create a new Uint8Array and copy all chunks into it
  const result = new Uint8Array(totalLength)
  let offset = 0
  
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  
  return result
}

/**
 * Synthesize speech using Amazon Polly and return audio URL
 */
export const synthesizeSpeech = async (
  text: string,
  voiceStyle: string = 'professional'
): Promise<string> => {
  try {
    // Generate unique audio key
    const audioKey = `${AUDIO_PREFIX}/response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
    
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
      // Convert stream to buffer
      const audioBuffer = await streamToBuffer(pollyResponse.AudioStream)
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: AUDIO_BUCKET,
        Key: audioKey,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        Metadata: {
          voiceStyle,
          generatedAt: new Date().toISOString(),
          textLength: text.length.toString()
        }
      }))

      // Return CloudFront URL
      return `https://d2sn3lk5751y3y.cloudfront.net/${audioKey}`
    }
    
    throw new Error('No audio stream received from Polly')

  } catch (error) {
    console.error('Error synthesizing speech:', error)
    throw new Error(`Failed to synthesize speech: ${error}`)
  }
}

/**
 * Synthesize speech and return as blob URL (for immediate playback)
 */
export const synthesizeSpeechBlob = async (
  text: string,
  voiceStyle: string = 'professional'
): Promise<string> => {
  try {
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
      // Convert stream to buffer
      const audioBuffer = await streamToBuffer(pollyResponse.AudioStream)
      
      // Create blob and return blob URL for immediate playback
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      return URL.createObjectURL(audioBlob)
    }
    
    throw new Error('No audio stream received from Polly')

  } catch (error) {
    console.error('Error synthesizing speech blob:', error)
    throw new Error(`Failed to synthesize speech: ${error}`)
  }
} 
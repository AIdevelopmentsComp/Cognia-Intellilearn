/**
 * Lambda function to keep Nova Sonic warm
 * Schedule this with EventBridge to run every 5 minutes
 */

const { BedrockRuntimeClient, InvokeModelWithBidirectionalStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const NOVA_SONIC_MODEL_ID = 'amazon.nova-sonic-v1:0';

exports.handler = async (event) => {
  console.log('[WARM] Starting Nova Sonic warm-up...');
  
  try {
    // Create minimal bidirectional event generator
    const eventGenerator = async function* () {
      // Send session start
      yield {
        event: {
          sessionStartEvent: {
            conversationParameters: {
              voiceId: 'matthew',
              systemPrompt: 'You are a test assistant. Keep responses brief.'
            }
          }
        }
      };
      
      // Send minimal audio (1 second of silence)
      const silentAudio = Buffer.alloc(16000 * 2); // 1 second at 16kHz
      yield {
        event: {
          audioInputEvent: {
            audioData: silentAudio.toString('base64'),
            endOfUtterance: true
          }
        }
      };
      
      // End session immediately
      yield {
        event: {
          sessionEndEvent: {}
        }
      };
    };
    
    const command = new InvokeModelWithBidirectionalStreamCommand({
      modelId: NOVA_SONIC_MODEL_ID,
      body: eventGenerator()
    });
    
    const response = await bedrockClient.send(command);
    
    // Process minimal response
    let responseCount = 0;
    for await (const chunk of response.body) {
      responseCount++;
      if (responseCount > 2) break; // Exit early
    }
    
    console.log('[WARM] Nova Sonic warm-up completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Nova Sonic warmed up' })
    };
    
  } catch (error) {
    console.error('[WARM-ERROR]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
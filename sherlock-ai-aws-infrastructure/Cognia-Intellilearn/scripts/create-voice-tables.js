const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb')

// AWS Configuration
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
}

const dynamoClient = new DynamoDBClient(awsConfig)

// Table definitions
const tables = [
  {
    TableName: 'intellilearn-voice-sessions',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'studentId', AttributeType: 'S' },
      { AttributeName: 'lessonId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudentLessonIndex',
        KeySchema: [
          { AttributeName: 'studentId', KeyType: 'HASH' },
          { AttributeName: 'lessonId', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'intellilearn-voice-conversations',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
      { AttributeName: 'studentId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudentIndex',
        KeySchema: [
          { AttributeName: 'studentId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'intellilearn-voice-content',
    KeySchema: [
      { AttributeName: 'lessonId', KeyType: 'HASH' },
      { AttributeName: 'contentId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'lessonId', AttributeType: 'S' },
      { AttributeName: 'contentId', AttributeType: 'S' },
      { AttributeName: 'topic', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TopicIndex',
        KeySchema: [
          { AttributeName: 'topic', KeyType: 'HASH' },
          { AttributeName: 'contentId', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
]

async function tableExists(tableName) {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }
    throw error
  }
}

async function createTable(tableConfig) {
  try {
    console.log(`Creating table: ${tableConfig.TableName}`)
    
    const command = new CreateTableCommand(tableConfig)
    const result = await dynamoClient.send(command)
    
    console.log(`✅ Table ${tableConfig.TableName} created successfully`)
    return result
    
  } catch (error) {
    console.error(`❌ Error creating table ${tableConfig.TableName}:`, error.message)
    throw error
  }
}

async function createVoiceTables() {
  console.log('🚀 Starting DynamoDB Voice Tables Creation...\n')
  
  try {
    for (const tableConfig of tables) {
      const exists = await tableExists(tableConfig.TableName)
      
      if (exists) {
        console.log(`⏭️  Table ${tableConfig.TableName} already exists, skipping...`)
      } else {
        await createTable(tableConfig)
        
        // Wait a bit between table creations
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log('\n🎉 All voice tables have been processed successfully!')
    console.log('\nTables created:')
    tables.forEach(table => {
      console.log(`  - ${table.TableName}`)
    })
    
  } catch (error) {
    console.error('\n💥 Error creating voice tables:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  createVoiceTables()
    .then(() => {
      console.log('\n✨ Voice tables setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { createVoiceTables } 
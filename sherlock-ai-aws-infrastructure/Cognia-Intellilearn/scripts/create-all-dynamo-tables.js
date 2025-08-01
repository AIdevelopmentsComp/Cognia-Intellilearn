const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Definición completa de TODAS las tablas encontradas en el código
const TABLES = {
  // Tablas principales de cursos (de courseService.ts y setup-dynamo-tables.js)
  COURSES: {
    TableName: 'intellilearn-courses',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'Courses' }
    ]
  },
  
  MODULES: {
    TableName: 'intellilearn-modules',
    KeySchema: [
      { AttributeName: 'courseId', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'courseId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'Modules' }
    ]
  },
  
  LESSONS: {
    TableName: 'intellilearn-lessons',
    KeySchema: [
      { AttributeName: 'moduleId', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'moduleId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'Lessons' }
    ]
  },
  
  USER_PROGRESS: {
    TableName: 'intellilearn-user-progress',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'courseId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'courseId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'UserProgress' }
    ]
  },
  
  // Tablas de voice sessions (de voiceSessionService.ts)
  VOICE_SESSIONS: {
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
        Keys: [
          { AttributeName: 'studentId', KeyType: 'HASH' },
          { AttributeName: 'lessonId', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'VoiceSessions' }
    ]
  },
  
  VOICE_CONVERSATIONS: {
    TableName: 'intellilearn-voice-conversations',
    KeySchema: [
      { AttributeName: 'sessionId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'VoiceConversations' }
    ]
  },
  
  VOICE_CONTENT: {
    TableName: 'intellilearn-voice-content',
    KeySchema: [
      { AttributeName: 'contentId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'contentId', AttributeType: 'S' },
      { AttributeName: 'lessonId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'LessonContentIndex',
        Keys: [
          { AttributeName: 'lessonId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'VoiceContent' }
    ]
  },
  
  // Tabla principal con GSI (de config.ts y otros servicios)
  INTELLILEARN_DATA: {
    TableName: 'IntelliLearn_Data_Prod',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        Keys: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    Tags: [
      { Key: 'Project', Value: 'IntelliLearn' },
      { Key: 'Type', Value: 'MainData' },
      { Key: 'Purpose', Value: 'MultiTenant' }
    ]
  }
};

async function createTable(tableName, tableConfig) {
  try {
    console.log(`\n📋 Procesando tabla: ${tableName}`);
    
    // Verificar si la tabla ya existe
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
      console.log(`✅ La tabla ${tableName} ya existe`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }
    
    // Crear la tabla
    console.log(`🔨 Creando tabla ${tableName}...`);
    
    // Ajustar configuración para GSI
    if (tableConfig.GlobalSecondaryIndexes) {
      tableConfig.GlobalSecondaryIndexes = tableConfig.GlobalSecondaryIndexes.map(gsi => ({
        IndexName: gsi.IndexName,
        Keys: gsi.Keys,
        Projection: gsi.Projection,
        ...(tableConfig.BillingMode === 'PROVISIONED' ? {
          ProvisionedThroughput: gsi.ProvisionedThroughput
        } : {})
      }));
    }
    
    await client.send(new CreateTableCommand(tableConfig));
    console.log(`✅ Tabla ${tableName} creada exitosamente`);
    
    // Esperar a que la tabla esté activa
    console.log('⏳ Esperando que la tabla esté activa...');
    await waitForTableActive(tableName);
    
  } catch (error) {
    console.error(`❌ Error con tabla ${tableName}:`, error.message);
  }
}

async function waitForTableActive(tableName, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
      
      if (result.Table.TableStatus === 'ACTIVE') {
        console.log(`✅ Tabla ${tableName} está activa`);
        return;
      }
      
      console.log(`⏳ Estado: ${result.Table.TableStatus} (intento ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error verificando tabla ${tableName}:`, error.message);
      throw error;
    }
  }
  
  throw new Error(`Timeout esperando que la tabla ${tableName} esté activa`);
}

async function main() {
  try {
    console.log('🚀 Creando todas las tablas DynamoDB para IntelliLearn');
    console.log('=====================================================\n');
    
    // Verificar conexión
    console.log('🔍 Verificando conexión a DynamoDB...');
    const tables = await client.send(new ListTablesCommand({}));
    console.log(`✅ Conexión exitosa. Tablas existentes: ${tables.TableNames.length}`);
    
    // Crear todas las tablas
    console.log('\n📦 Creando tablas necesarias...');
    
    for (const [key, config] of Object.entries(TABLES)) {
      await createTable(config.TableName, config);
    }
    
    console.log('\n🎉 PROCESO COMPLETADO');
    console.log('===================');
    console.log('\n📊 Resumen de tablas creadas:');
    console.log('1. intellilearn-courses → Información de cursos');
    console.log('2. intellilearn-modules → Módulos de cursos');
    console.log('3. intellilearn-lessons → Lecciones');
    console.log('4. intellilearn-user-progress → Progreso de usuarios');
    console.log('5. intellilearn-voice-sessions → Sesiones de voz');
    console.log('6. intellilearn-voice-conversations → Conversaciones');
    console.log('7. intellilearn-voice-content → Contenido de voz');
    console.log('8. IntelliLearn_Data_Prod → Tabla principal multi-propósito');
    
    console.log('\n✅ Todas las tablas están listas para usar!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

main();
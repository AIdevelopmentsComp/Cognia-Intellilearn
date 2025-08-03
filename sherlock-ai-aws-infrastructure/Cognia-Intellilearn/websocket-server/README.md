# Intellilearn Nova Sonic WebSocket Server

## 🚀 Arquitectura Oficial AWS

Este servidor implementa la **arquitectura oficial de AWS** para Nova Sonic, basado en los [ejemplos oficiales de AWS](https://docs.aws.amazon.com/nova/latest/userguide/speech-code-examples.html).

```
Frontend (React) ↔ WebSocket ↔ Node.js Server ↔ Nova Sonic
```

### ❌ Arquitectura Anterior (Problemática)
```
Frontend → SDK Direct → Nova Sonic (Solo lectura)
```

### ✅ Nueva Arquitectura (Oficial AWS)
```
Frontend ↔ WebSocket Server ↔ Nova Sonic (Bidireccional completo)
```

## 📋 Características

- **✅ Streaming Bidireccional**: Comunicación completa con Nova Sonic
- **✅ Manejo de Sesiones**: Gestión de múltiples usuarios simultáneos
- **✅ Audio Streaming**: Procesamiento de audio en tiempo real
- **✅ Autenticación Cognito**: Integración con AWS Cognito Identity Pool
- **✅ Reconexión Automática**: Manejo robusto de conexiones
- **✅ Event-Driven**: Arquitectura basada en eventos de Nova Sonic

## 🛠️ Instalación

### 1. Instalar Dependencias

```bash
cd websocket-server
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de configuración
cp config.example.env .env

# Editar con tus valores
nano .env
```

### 3. Configuración Requerida

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Cognito Configuration (desde Intellilearn)
COGNITO_IDENTITY_POOL_ID=us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe
COGNITO_USER_POOL_ID=us-east-1_BxbAO9DtG
COGNITO_CLIENT_ID=4dhimdt09osbal1l5fc75mo6j2

# Server Configuration
PORT=8080
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Logs de Ejemplo
```
🚀 Nova Sonic WebSocket Server started on port 8080
🔗 Architecture: Frontend ↔ WebSocket ↔ Node.js Server ↔ Nova Sonic
🔌 New WebSocket connection from: ::1
📝 Session created: 12345678-1234-1234-1234-123456789012
🚀 Initializing Nova Sonic stream for session: 12345678...
✅ Nova Sonic stream established for session: 12345678...
🎤 Processing audio input for session: 12345678...
📨 Nova response event: audioOutput
🔊 Playing Nova Sonic audio response
```

## 📡 API WebSocket

### Conexión
```javascript
const ws = new WebSocket('ws://localhost:8080');
```

### Mensajes del Cliente

#### 1. Inicializar Sesión
```json
{
  "type": "initialize_session",
  "authToken": "cognito-jwt-token",
  "courseId": "course_123",
  "studentId": "student_456"
}
```

#### 2. Enviar Audio
```json
{
  "type": "audio_input",
  "sessionId": "session-uuid",
  "audioData": {
    "base64": "base64-audio-data",
    "format": "webm"
  }
}
```

#### 3. Finalizar Sesión
```json
{
  "type": "end_session",
  "sessionId": "session-uuid"
}
```

### Mensajes del Servidor

#### 1. Sesión Lista
```json
{
  "type": "session_initialized",
  "sessionId": "session-uuid",
  "message": "Nova Sonic session ready"
}
```

#### 2. Respuesta de Nova Sonic
```json
{
  "type": "nova_response",
  "sessionId": "session-uuid",
  "event": {
    "audioOutput": {
      "content": "base64-audio-response"
    }
  }
}
```

#### 3. Error
```json
{
  "type": "error",
  "error": "Error message",
  "sessionId": "session-uuid"
}
```

## 🏗️ Arquitectura del Código

### Archivos Principales

- **`server.js`**: Servidor WebSocket principal
- **`NovaStreamManager.js`**: Gestor avanzado de streams Nova Sonic
- **`package.json`**: Dependencias y scripts

### Clases Principales

1. **`NovaWebSocketServer`**: Maneja conexiones WebSocket
2. **`NovaSessionManager`**: Gestiona sesiones de usuario
3. **`NovaStreamHandler`**: Maneja comunicación con Nova Sonic
4. **`NovaStreamManager`**: Gestor avanzado con colas de eventos dinámicas

## 🔧 Integración Frontend

### React Hook
```typescript
import { useNovaWebSocket } from '../hooks/useNovaWebSocket';

const nova = useNovaWebSocket({
  wsUrl: 'ws://localhost:8080',
  autoConnect: true
});

// Inicializar sesión
const sessionId = await nova.initializeSession({
  courseId: 'course_123',
  studentId: 'student_456'
});

// Iniciar captura de audio
await nova.startAudioCapture();
```

### Eventos
```typescript
nova.state.connectionState // 'connected' | 'disconnected' | 'error'
nova.state.isSessionActive // boolean
nova.state.lastAudioResponse // string | null
nova.state.error // string | null
```

## 🌐 Despliegue en Producción

### Variables de Entorno
```bash
NODE_ENV=production
PORT=8080
AWS_REGION=us-east-1
COGNITO_IDENTITY_POOL_ID=us-east-1:71aecbbb-2419-4ce0-8951-439207a8e2fe
```

### Frontend Configuration
```typescript
// .env.local
NEXT_PUBLIC_NOVA_WEBSOCKET_URL=wss://your-websocket-server.com
```

### Servidor WebSocket
```bash
# PM2 para producción
npm install -g pm2
pm2 start server.js --name "nova-websocket"
pm2 save
pm2 startup
```

## 🐛 Debugging

### Logs Detallados
```bash
LOG_LEVEL=debug npm start
```

### Testing WebSocket
```bash
# Instalar wscat
npm install -g wscat

# Conectar al servidor
wscat -c ws://localhost:8080

# Enviar mensaje de test
{"type":"initialize_session","authToken":"test-token"}
```

### Estados Comunes

- **✅ Conexión exitosa**: `Nova Sonic stream established`
- **⚠️ Audio encolado**: `StreamWriter no inicializado, encolando evento`
- **❌ Error de autenticación**: `Auth token required`
- **❌ Sesión no encontrada**: `Session not found`

## 📚 Referencias

- [AWS Nova Sonic Documentation](https://docs.aws.amazon.com/nova/latest/userguide/speech-code-examples.html)
- [AWS WebSocket Examples](https://github.com/aws-samples/amazon-nova-samples/tree/main/speech-to-speech/sample-codes/websocket-nodejs)
- [Bedrock Runtime Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-bedrock-runtime/)

## 🤝 Contribución

1. Fork el repositorio
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

---

**🎯 Developed for Intellilearn Platform**  
**Based on Official AWS Nova Sonic WebSocket Architecture**
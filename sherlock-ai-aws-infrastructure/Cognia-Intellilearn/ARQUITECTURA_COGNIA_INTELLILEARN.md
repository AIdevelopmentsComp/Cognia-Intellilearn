# Arquitectura Completa de CognIA IntelliLearn

## Arquitectura General del Sistema

```mermaid
graph TB
    subgraph "Frontend (Next.js 15)"
        UI["Interfaz de Usuario<br/>Next.js 15 + React 19"]
        AuthContext["AuthContext<br/>Gestión de Autenticación"]
        WebSocketClient["NovaWebSocketClient<br/>Comunicación bidireccional"]
        AudioCapture["Captura de Audio<br/>MediaRecorder API"]
        AudioPlayback["Reproducción de Audio<br/>Web Audio API"]
    end

    subgraph "AWS CloudFront"
        CF["CloudFront<br/>CDN y Distribución"]
    end

    subgraph "AWS S3"
        S3["S3 Bucket<br/>Alojamiento Estático"]
        S3Vectors["S3 Vectors<br/>Almacenamiento Vectorial"]
    end

    subgraph "AWS Cognito"
        Cognito["Servicio de Autenticación<br/>Gestión de Usuarios"]
        IdentityPool["Identity Pool<br/>Credenciales temporales"]
    end

    subgraph "AWS API Gateway"
        APIGW["API Gateway<br/>WebSocket API"]
    end

    subgraph "AWS Lambda"
        NovaHandler["NovaWebSocketHandler<br/>Gestión de conexiones"]
    end

    subgraph "Amazon Bedrock"
        NovaSonic["Nova Sonic<br/>Modelo Speech-to-Speech"]
        Titan["Titan Embeddings<br/>Vectorización"]
    end

    subgraph "AWS DynamoDB"
        DynamoDB["Tablas DynamoDB<br/>Sesiones y Metadatos"]
    end

    UI --> AuthContext
    UI --> WebSocketClient
    WebSocketClient --> AudioCapture
    WebSocketClient --> AudioPlayback
    
    AuthContext --> Cognito
    Cognito --> IdentityPool
    IdentityPool --> S3
    IdentityPool --> APIGW
    
    UI --> CF
    CF --> S3
    
    WebSocketClient --> APIGW
    APIGW --> NovaHandler
    
    NovaHandler --> DynamoDB
    NovaHandler --> NovaSonic
    UI --> S3Vectors
    
    subgraph "Flujo de Voz"
        AudioCapture --> WebSocketClient
        WebSocketClient --> APIGW
        APIGW --> NovaHandler
        NovaHandler --> NovaSonic
        NovaSonic --> NovaHandler
        NovaHandler --> APIGW
        APIGW --> WebSocketClient
        WebSocketClient --> AudioPlayback
    end
```

## Flujo de Comunicación Speech-to-Speech

```mermaid
sequenceDiagram
    participant Usuario
    participant UI as Interfaz de Usuario
    participant Auth as AuthContext
    participant WS as NovaWebSocketClient
    participant APIGW as API Gateway WebSocket
    participant Lambda as NovaWebSocketHandler
    participant DynamoDB as DynamoDB
    participant Bedrock as Amazon Bedrock Nova Sonic
    
    Usuario->>UI: Inicia sesión
    UI->>Auth: Solicita autenticación
    Auth->>Cognito: Autentica credenciales
    Cognito-->>Auth: Token JWT
    Auth-->>UI: Usuario autenticado
    
    Usuario->>UI: Inicia sesión de voz
    UI->>WS: Conectar WebSocket
    WS->>APIGW: Conexión WebSocket + Token
    APIGW->>Lambda: Evento $connect
    Lambda->>DynamoDB: Almacena connectionId
    Lambda-->>APIGW: Conexión aceptada
    APIGW-->>WS: Conexión establecida
    
    WS->>APIGW: Inicializar sesión Nova Sonic
    APIGW->>Lambda: Mensaje initialize_session
    Lambda->>Bedrock: Invocar Nova Sonic (stream)
    Lambda->>DynamoDB: Crear sesión Nova
    
    Note over Lambda,Bedrock: Espera primera respuesta (30-45s)
    
    Bedrock-->>Lambda: Primera respuesta
    Lambda-->>APIGW: session_initialized
    APIGW-->>WS: session_initialized
    WS-->>UI: Sesión lista
    
    Usuario->>UI: Habla al micrófono
    UI->>WS: Audio capturado (chunks)
    WS->>APIGW: Envío audio (base64)
    APIGW->>Lambda: Mensaje audio_input
    Lambda->>Bedrock: Stream audio a Nova Sonic
    
    Bedrock-->>Lambda: Transcripción
    Lambda-->>APIGW: Mensaje transcription
    APIGW-->>WS: Transcripción
    WS-->>UI: Mostrar transcripción
    
    Bedrock-->>Lambda: Respuesta texto
    Lambda-->>APIGW: Mensaje text_response
    APIGW-->>WS: Respuesta texto
    WS-->>UI: Mostrar respuesta texto
    
    Bedrock-->>Lambda: Audio respuesta (base64)
    Lambda-->>APIGW: Mensaje audio_response
    APIGW-->>WS: Audio respuesta (base64)
    WS->>UI: Reproducir audio
    UI-->>Usuario: Escucha respuesta
    
    Usuario->>UI: Finaliza sesión
    UI->>WS: Finalizar sesión
    WS->>APIGW: Mensaje end_session
    APIGW->>Lambda: Finalizar sesión
    Lambda->>Bedrock: Cerrar stream
    Lambda->>DynamoDB: Actualizar estado sesión
    Lambda-->>APIGW: session_ended
    APIGW-->>WS: session_ended
    WS-->>UI: Sesión finalizada
```

## Componentes y Servicios

```mermaid
graph LR
    subgraph "Componentes Frontend"
        VoiceSessionViewer["VoiceSessionViewer<br/>Interfaz de sesión de voz"]
        useNovaWebSocket["useNovaWebSocket<br/>Hook WebSocket"]
        AuthContext["AuthContext<br/>Contexto de autenticación"]
        FloatingAssistant["FloatingAssistant<br/>Botón asistente flotante"]
        Sidebar["Sidebar<br/>Navegación principal"]
        StaticLink["StaticLink<br/>Componente de navegación"]
        CourseComponents["Componentes de Cursos<br/>Gestión de contenido"]
    end
    
    subgraph "Servicios Frontend"
        NovaWebSocketClient["NovaWebSocketClient<br/>Cliente WebSocket"]
        CognitoAuthService["CognitoAuthService<br/>Servicio de autenticación"]
        VoiceSessionService["VoiceSessionService<br/>Gestión de sesiones de voz"]
        VoiceStreamingService["VoiceStreamingService<br/>Streaming de audio"]
        VectorizationService["VectorizationService<br/>Generación de embeddings"]
        S3ContentService["S3ContentService<br/>Gestión de contenido"]
    end
    
    subgraph "Lambda Handlers"
        NovaWebSocketHandler["NovaWebSocketHandler<br/>Gestión de WebSockets"]
        NovaSonicManager["NovaSonicManager<br/>Integración con Nova Sonic"]
    end
    
    VoiceSessionViewer --> useNovaWebSocket
    useNovaWebSocket --> NovaWebSocketClient
    NovaWebSocketClient --> CognitoAuthService
    VoiceSessionViewer --> VoiceSessionService
    VoiceSessionService --> VoiceStreamingService
    VoiceStreamingService --> NovaWebSocketClient
    
    CourseComponents --> VectorizationService
    CourseComponents --> S3ContentService
    
    Sidebar --> StaticLink
    FloatingAssistant --> VoiceSessionViewer
    
    NovaWebSocketHandler --> NovaSonicManager
    
    subgraph "Flujo de Datos"
        AudioCapture["Captura de Audio<br/>MediaRecorder"]
        AudioProcessing["Procesamiento<br/>ArrayBuffer → Base64"]
        WebSocketSend["Envío WebSocket<br/>API Gateway"]
        NovaProcessing["Procesamiento Nova<br/>Bedrock"]
        AudioResponse["Respuesta Audio<br/>Base64 → AudioBuffer"]
        AudioPlayback["Reproducción<br/>Audio API"]
    end
    
    AudioCapture --> AudioProcessing
    AudioProcessing --> WebSocketSend
    WebSocketSend --> NovaProcessing
    NovaProcessing --> AudioResponse
    AudioResponse --> AudioPlayback
```

## Arquitectura de Despliegue

```mermaid
graph TB
    subgraph "Arquitectura de Despliegue"
        subgraph "Desarrollo Local"
            NextDev["Next.js Dev Server<br/>npm run dev"]
            TailwindBuild["Tailwind CSS<br/>Compilación JIT"]
            TypeScriptCheck["TypeScript<br/>Verificación de tipos"]
        end
        
        subgraph "CI/CD Pipeline"
            Build["Next.js Build<br/>npm run build"]
            Export["Exportación Estática<br/>npm run export"]
            S3Sync["Sincronización S3<br/>aws s3 sync"]
            CFInvalidation["Invalidación CloudFront<br/>aws cloudfront create-invalidation"]
        end
        
        subgraph "Infraestructura AWS"
            S3Bucket["S3 Bucket<br/>intellilearn-prod-app"]
            CloudFront["CloudFront<br/>Distribución CDN"]
            APIGateway["API Gateway<br/>WebSocket API"]
            Lambda["Lambda<br/>NovaWebSocketHandler"]
            Cognito["Cognito<br/>User Pool + Identity Pool"]
            IAMRoles["IAM Roles<br/>Permisos de servicio"]
            DynamoDB["DynamoDB<br/>Tablas de sesión"]
            S3VectorBucket["S3 Vector Bucket<br/>intellilearn-vectors"]
        end
    end
    
    NextDev --> Build
    TailwindBuild --> Build
    TypeScriptCheck --> Build
    Build --> Export
    Export --> S3Sync
    S3Sync --> S3Bucket
    S3Sync --> CFInvalidation
    CFInvalidation --> CloudFront
    
    CloudFront --> S3Bucket
    APIGateway --> Lambda
    Lambda --> Cognito
    Lambda --> DynamoDB
    Lambda --> S3VectorBucket
    
    subgraph "Configuración Lambda"
        NodeRuntime["Node.js 18.x<br/>Runtime"]
        MemoryConfig["512 MB RAM<br/>300s Timeout"]
        Permissions["IAM Permisos<br/>Bedrock, DynamoDB, CloudWatch"]
        Environment["Variables de entorno<br/>Configuración"]
    end
    
    Lambda --> NodeRuntime
    Lambda --> MemoryConfig
    Lambda --> Permissions
    Lambda --> Environment
```

## Descripción de Componentes Principales

### Frontend (Next.js 15)

- **Next.js 15**: Framework React con App Router, Server Components y exportación estática
- **React 19**: Biblioteca UI con características concurrentes y Suspense
- **TypeScript**: Tipado estático para desarrollo robusto
- **TailwindCSS**: Framework CSS utilitario para diseño neumórfico
- **Framer Motion**: Animaciones y transiciones fluidas

### Componentes Clave

- **VoiceSessionViewer**: Interfaz principal para sesiones de voz con Nova Sonic
- **useNovaWebSocket**: Hook personalizado para gestionar conexiones WebSocket
- **AuthContext**: Contexto global para autenticación con Cognito
- **StaticLink**: Componente para navegación compatible con exportación estática
- **FloatingAssistant**: Botón asistente flotante para acceso rápido al chat

### Servicios Backend

- **NovaWebSocketHandler (Lambda)**: Gestiona conexiones WebSocket y sesiones Nova Sonic
- **NovaSonicManager**: Integración con Amazon Bedrock Nova Sonic
- **Amazon Bedrock**: Servicios de IA para Speech-to-Speech y embeddings
- **DynamoDB**: Almacenamiento de sesiones y metadatos
- **S3 Vectors**: Almacenamiento vectorial para búsqueda semántica

### Flujo de Comunicación

1. **Autenticación**: Cognito proporciona tokens JWT para autenticación
2. **Conexión WebSocket**: Establecimiento de conexión bidireccional vía API Gateway
3. **Inicialización de Sesión**: Lambda inicia sesión con Nova Sonic (30-45s)
4. **Streaming de Audio**: Captura y envío de audio en tiempo real
5. **Procesamiento Nova Sonic**: Conversión speech-to-speech en Bedrock
6. **Respuesta**: Devolución de transcripción, texto y audio de respuesta
7. **Reproducción**: Decodificación y reproducción del audio de respuesta

### Despliegue

- **Build**: Compilación Next.js con exportación estática
- **S3**: Alojamiento de archivos estáticos
- **CloudFront**: CDN para distribución global
- **Lambda**: Funciones serverless para WebSocket
- **API Gateway**: Endpoint WebSocket para comunicación bidireccional

## Consideraciones Técnicas

### Rendimiento

- **Cold Start**: Nova Sonic puede tardar 30-45s en inicializar
- **Timeout**: Configuración de timeout de 60s en frontend y 30s en Lambda
- **Chunking**: Procesamiento de audio en chunks para evitar sobrecarga

### Seguridad

- **Cognito**: Autenticación y autorización de usuarios
- **IAM**: Permisos granulares para servicios AWS
- **Identity Pool**: Credenciales temporales para acceso a servicios AWS

### Escalabilidad

- **Serverless**: Arquitectura sin servidor para escalar automáticamente
- **CloudFront**: Distribución global de contenido
- **S3 Vectors**: Almacenamiento vectorial escalable para búsqueda semántica
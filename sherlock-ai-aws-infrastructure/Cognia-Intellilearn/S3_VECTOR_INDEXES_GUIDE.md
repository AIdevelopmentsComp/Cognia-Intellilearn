# 📚 S3 Vector Indexes - Guía de Implementación

## 🎯 Estado Actual

### ✅ Completado
1. **Bucket S3 Vector Storage creado**: `intellilearn-vector-storage`
2. **Configuración en `.env.local`** actualizada
3. **Scripts de creación de índices** preparados
4. **Servicio de vectorización** implementado con Amazon Titan
5. **Scripts de prueba** listos

### ⚠️ Pendiente
- **AWS CLI s3vectors**: Comando no disponible en la versión actual de AWS CLI
- **Creación de índices vectoriales**: Esperando disponibilidad del comando s3vectors

## 🏗️ Arquitectura de Vector Storage

### Estructura de Datos
```
intellilearn-vector-storage/
├── educational-content-index/
│   ├── lesson_pm_101.json
│   ├── lesson_pm_102.json
│   └── ...
├── quiz-assessment-index/
│   ├── quiz_pm_phases.json
│   └── ...
├── semantic-search-index/
│   └── ...
└── voice-session-index/
    └── ...
```

### Formato de Vector
```json
{
  "id": "lesson_pm_101",
  "vector": [0.123, -0.456, ...], // 1024 dimensiones
  "metadata": {
    "title": "Introducción a la Gestión de Proyectos",
    "type": "lesson",
    "courseId": "1",
    "moduleId": "module_1",
    "content": "...",
    "duration": "15 min"
  },
  "timestamp": "2025-01-28T12:00:00Z"
}
```

## 🚀 Pasos para Activar Vector Indexes

### 1. Actualizar AWS CLI
```bash
# Verificar versión actual
aws --version

# Instalar/actualizar AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install --update
```

### 2. Crear Índices Vectoriales
```bash
# Ejecutar script de creación
chmod +x scripts/create-s3-vector-indexes.sh
./scripts/create-s3-vector-indexes.sh
```

### 3. Verificar Índices
```bash
# Listar índices creados
aws s3vectors list-indexes \
  --vector-bucket-name intellilearn-vector-storage \
  --region us-east-1
```

## 📊 Índices Planificados

### 1. educational-content-index
- **Propósito**: Documentos y materiales del curso
- **Dimensiones**: 1024
- **Métrica**: Cosine similarity
- **Uso**: Búsqueda de contenido similar, recomendaciones

### 2. quiz-assessment-index  
- **Propósito**: Evaluaciones y preguntas
- **Dimensiones**: 1024
- **Métrica**: Cosine similarity
- **Uso**: Encontrar preguntas relacionadas, generar evaluaciones

### 3. semantic-search-index
- **Propósito**: Búsqueda semántica general
- **Dimensiones**: 1024
- **Métrica**: Cosine similarity
- **Uso**: Búsqueda inteligente en toda la plataforma

### 4. voice-session-index
- **Propósito**: Transcripciones de sesiones de voz
- **Dimensiones**: 1024
- **Métrica**: Euclidean distance
- **Uso**: Búsqueda en conversaciones, análisis de temas

## 🔧 Integración en la Aplicación

### Servicio de Vectorización (`lib/services/vectorizationService.ts`)
```typescript
// Generar embedding
const embedding = await vectorizationService.generateEmbedding(text);

// Almacenar vector
await vectorizationService.storeVector(documentId, embedding, metadata);

// Buscar similares (cuando s3vectors esté disponible)
const results = await vectorizationService.searchSimilar(queryText, k);
```

### Flujo de Datos
1. **Contenido nuevo** → Amazon Titan → Embedding (1024d)
2. **Embedding + Metadata** → S3 Vector Storage
3. **Query de usuario** → Embedding → s3vectors search
4. **Resultados** → Ranking → UI

## 🧪 Pruebas

### Ejecutar Pruebas de Vectores
```bash
cd /mnt/c/Users/cogni/Downloads/database/sherlock-ai-aws-infrastructure/Cognia-Intellilearn
node scripts/test-s3-vector-indexes.js
```

### Verificar Almacenamiento
```bash
# Listar vectores almacenados
aws s3 ls s3://intellilearn-vector-storage/educational-content-index/

# Ver contenido de un vector
aws s3 cp s3://intellilearn-vector-storage/educational-content-index/lesson_pm_101.json -
```

## 📝 Notas Importantes

1. **Amazon Titan Embeddings**:
   - Modelo: `amazon.titan-embed-text-v1`
   - Dimensiones: 1024
   - Límite de texto: 8192 tokens

2. **Costos Estimados**:
   - Almacenamiento S3: ~$0.023/GB/mes
   - Bedrock Embeddings: ~$0.0001/1K tokens
   - S3 Vector Search: Pendiente de pricing oficial

3. **Mejores Prácticas**:
   - Normalizar embeddings antes de almacenar
   - Usar batch processing para grandes volúmenes
   - Implementar caché para consultas frecuentes
   - Monitorear uso y costos

## 🚨 Troubleshooting

### Error: "s3vectors command not found"
```bash
# Verificar si el comando está disponible
aws s3vectors help

# Si no está disponible, verificar actualizaciones
pip install --upgrade awscli
```

### Error: "Access Denied" en S3
```bash
# Verificar permisos del bucket
aws s3api get-bucket-policy --bucket intellilearn-vector-storage

# Verificar credenciales
aws sts get-caller-identity
```

## 📅 Timeline Estimado

1. **Inmediato**: Usar almacenamiento de vectores manual
2. **Cuando s3vectors esté disponible**: 
   - Crear índices con el script
   - Migrar búsqueda a s3vectors
   - Optimizar rendimiento
3. **Futuro**: Implementar features avanzadas (filtros, re-ranking)

---
**Última actualización**: 2025-01-28  
**Estado**: Esperando disponibilidad de AWS CLI s3vectors
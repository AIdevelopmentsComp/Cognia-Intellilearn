#!/bin/bash

echo "🚀 Creando índices vectoriales S3..."
echo "===================================="

# Cargar credenciales
source .env.aws

BUCKET_NAME="intellilearn-vector-storage"
REGION="us-east-1"

echo "Bucket: $BUCKET_NAME"
echo "Región: $REGION"
echo ""

# Verificar si el comando s3vectors está disponible
echo "1. Verificando AWS CLI para s3vectors..."
if aws s3vectors help 2>&1 | grep -q "s3vectors"; then
    echo "✅ AWS CLI soporta s3vectors"
else
    echo "⚠️  AWS CLI puede necesitar actualización para s3vectors"
    echo "   Instalando/actualizando AWS CLI v2..."
    
    # Intentar actualizar AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" 2>/dev/null
    unzip -q awscliv2.zip 2>/dev/null
    sudo ./aws/install --update 2>/dev/null || echo "   No se pudo actualizar automáticamente"
    rm -rf awscliv2.zip aws/
fi

echo ""
echo "2. Creando índice principal para contenido educativo..."

# Índice principal para embeddings de documentos educativos
aws s3vectors create-index \
  --vector-bucket-name "$BUCKET_NAME" \
  --index-name "educational-content-index" \
  --data-type "float32" \
  --dimension 1024 \
  --distance-metric "cosine" \
  --metadata-configuration '{"nonFilterableMetadataKeys":["content","lastModified"]}' \
  --region "$REGION" 2>&1 | tee /tmp/vector-index-1.log

if [ $? -eq 0 ]; then
    echo "✅ Índice 'educational-content-index' creado"
else
    echo "❌ Error creando índice principal (ver /tmp/vector-index-1.log)"
fi

echo ""
echo "3. Creando índice para evaluaciones y quizzes..."

# Índice para quizzes y evaluaciones
aws s3vectors create-index \
  --vector-bucket-name "$BUCKET_NAME" \
  --index-name "quiz-assessment-index" \
  --data-type "float32" \
  --dimension 1024 \
  --distance-metric "cosine" \
  --metadata-configuration '{"nonFilterableMetadataKeys":["questionText","answerOptions"]}' \
  --region "$REGION" 2>&1 | tee /tmp/vector-index-2.log

if [ $? -eq 0 ]; then
    echo "✅ Índice 'quiz-assessment-index' creado"
else
    echo "❌ Error creando índice de quizzes (ver /tmp/vector-index-2.log)"
fi

echo ""
echo "4. Creando índice para búsqueda semántica de cursos..."

# Índice para búsqueda semántica
aws s3vectors create-index \
  --vector-bucket-name "$BUCKET_NAME" \
  --index-name "semantic-search-index" \
  --data-type "float32" \
  --dimension 1024 \
  --distance-metric "cosine" \
  --region "$REGION" 2>&1 | tee /tmp/vector-index-3.log

if [ $? -eq 0 ]; then
    echo "✅ Índice 'semantic-search-index' creado"
else
    echo "❌ Error creando índice de búsqueda (ver /tmp/vector-index-3.log)"
fi

echo ""
echo "5. Creando índice para sesiones de voz..."

# Índice para transcripciones de voz
aws s3vectors create-index \
  --vector-bucket-name "$BUCKET_NAME" \
  --index-name "voice-session-index" \
  --data-type "float32" \
  --dimension 1024 \
  --distance-metric "euclidean" \
  --metadata-configuration '{"nonFilterableMetadataKeys":["transcript","audioUrl"]}' \
  --region "$REGION" 2>&1 | tee /tmp/vector-index-4.log

if [ $? -eq 0 ]; then
    echo "✅ Índice 'voice-session-index' creado"
else
    echo "❌ Error creando índice de voz (ver /tmp/vector-index-4.log)"
fi

echo ""
echo "📊 Resumen de índices vectoriales:"
echo "=================================="
echo "1. educational-content-index - Documentos y materiales del curso (1024d, cosine)"
echo "2. quiz-assessment-index - Evaluaciones y preguntas (1024d, cosine)"
echo "3. semantic-search-index - Búsqueda semántica general (1024d, cosine)"
echo "4. voice-session-index - Transcripciones de voz (1024d, euclidean)"
echo ""
echo "✅ Configuración de vectores completada"
echo ""
echo "Para verificar los índices creados:"
echo "aws s3vectors list-indexes --vector-bucket-name $BUCKET_NAME --region $REGION"
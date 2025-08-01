# Entrenamiento de Modelo Gemini Personalizado para CognIA

Esta guía detalla el proceso para entrenar un modelo Gemini personalizado que se adapte específicamente a las necesidades de CognIA.

## Inicio Rápido para Entrenamiento Remoto

Para entrenar rápidamente un modelo en Google Cloud:

1. **Instala Google Cloud CLI** (si no lo tienes): [Instrucciones de instalación](https://cloud.google.com/sdk/docs/install)

2. **Autentícate y configura el proyecto**:
   ```bash
   gcloud auth login
   gcloud config set project cogniaintellilearn-ebdb3
   ```

3. **Habilita las APIs necesarias**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

4. **Entrena el modelo directamente desde la consola de Google Cloud**:
   
   a. Ve a [Vertex AI en Google Cloud Console](https://console.cloud.google.com/vertex-ai?project=cogniaintellilearn-ebdb3)
   
   b. Selecciona "Tuning" en el menú lateral
   
   c. Haz clic en "Create" y sigue el asistente:
      - Selecciona el modelo base `gemini-1.5-flash`
      - Sube tus datos de entrenamiento en formato JSONL
      - Configura los hiperparámetros (epochs: 3, batch size: 4, learning rate: 1e-5)
      - Inicia el entrenamiento
   
5. **Configura la aplicación para usar tu modelo entrenado**:
   
   Actualiza `lib/gemini-config.ts`:
   ```typescript
   export const geminiConfig = {
     // ...
     model: 'projects/cogniaintellilearn-ebdb3/locations/us-central1/models/TU_MODELO_ENTRENADO',
     isCustomModel: true,
     // ...
   };
   ```

## Índice
1. [Visión General](#visión-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Recopilación de Datos de Entrenamiento](#recopilación-de-datos-de-entrenamiento)
5. [Preparación de Datos](#preparación-de-datos)
6. [Entrenamiento del Modelo](#entrenamiento-del-modelo)
7. [Uso del Modelo Entrenado](#uso-del-modelo-entrenado)
8. [Solución de Problemas](#solución-de-problemas)
9. [Recursos Adicionales](#recursos-adicionales)

## Visión General

El entrenamiento de un modelo Gemini personalizado permite:
- Mejorar respuestas específicas sobre CognIA y sus servicios
- Personalizar el tono y estilo de las respuestas
- Adaptar el modelo a casos de uso educativos específicos
- Reducir respuestas incorrectas o genéricas

## Requisitos Previos

Para entrenar un modelo Gemini personalizado, necesitas:

1. **Cuenta de Google Cloud** con facturación habilitada
2. **Permisos** en el proyecto `cogniaintellilearn-ebdb3`
3. **Google Cloud SDK** instalado localmente
4. **Python 3.7+** instalado
5. **Datos de entrenamiento** (conversaciones existentes o ejemplos creados)

## Configuración del Entorno

Sigue estos pasos para preparar tu entorno:

1. **Instala las dependencias**:
   ```bash
   pip install google-cloud-aiplatform firebase-admin
   ```

2. **Autentica con Google Cloud**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project cogniaintellilearn-ebdb3
   ```

3. **Habilita las APIs necesarias**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

Alternativamente, puedes usar el script `setup-training.bat` para una configuración guiada:
```bash
scripts/setup-training.bat
```

## Recopilación de Datos de Entrenamiento

Para un modelo efectivo, necesitas datos de entrenamiento de calidad. Puedes:

1. **Recopilar conversaciones existentes** de Firestore:
   ```bash
   python scripts/collect-training-data.py --project=cogniaintellilearn-ebdb3
   ```

2. **Crear datos de ejemplo** si no tienes suficientes conversaciones reales:
   - El script `collect-training-data.py` creará ejemplos si no encuentra datos
   - Estos ejemplos se pueden editar manualmente para mejorar su calidad

3. **Preparar datos manualmente** siguiendo el formato JSONL:
   ```json
   {"messages": [{"role": "user", "content": "¿Qué es CognIA?"}, {"role": "assistant", "content": "CognIA es una plataforma educativa..."}]}
   ```

### Buenas Prácticas para Datos de Entrenamiento:

- Incluye al menos 50 ejemplos de conversación para resultados óptimos
- Asegúrate de cubrir diversas preguntas y escenarios
- Incluye respuestas largas y cortas para que el modelo aprenda ambos estilos
- Usa un lenguaje consistente con la marca CognIA
- Revisa los datos para evitar respuestas incorrectas o inapropiadas

## Preparación de Datos

El formato de los datos debe seguir estas pautas:

1. **Formato JSONL** (JSON Lines) con un ejemplo por línea
2. **Estructura de mensajes** alternando entre `user` y `assistant`
3. **Contenido claro y útil** en las respuestas del asistente

El script `train-gemini-model.py` procesará automáticamente los datos antes del entrenamiento.

## Entrenamiento del Modelo

Para iniciar el entrenamiento:

```bash
python scripts/train-gemini-model.py --project=cogniaintellilearn-ebdb3 --data-file=training_data.jsonl
```

Parámetros importantes:

- `--base-model`: Modelo base a ajustar (predeterminado: `gemini-1.5-flash`)
- `--epochs`: Número de iteraciones de entrenamiento (predeterminado: `3`)
- `--batch-size`: Tamaño del lote para entrenamiento (predeterminado: `4`)
- `--learning-rate`: Tasa de aprendizaje (predeterminado: `1e-5`)

El proceso de entrenamiento:
1. Prepara y valida los datos de entrenamiento
2. Sube los datos a Google Cloud Storage
3. Inicia un trabajo de ajuste fino en Vertex AI
4. Monitorea el progreso (puede tardar varias horas)

## Uso del Modelo Entrenado

Una vez que el modelo esté entrenado:

1. **Actualiza la configuración** en `lib/gemini-config.ts`:
   ```typescript
   export const geminiConfig = {
     // ...
     model: 'projects/cogniaintellilearn-ebdb3/locations/us-central1/models/TU_MODELO_ENTRENADO',
     isCustomModel: true,
     // ...
   };
   ```

2. **Reconstruye y despliega** la aplicación:
   ```bash
   npm run build
   firebase deploy
   ```

## Solución de Problemas

### Problemas Comunes:

1. **Error de permisos**: Asegúrate de tener los permisos correctos en Google Cloud
   ```bash
   gcloud projects add-iam-policy-binding cogniaintellilearn-ebdb3 --member=user:tu-email@dominio.com --role=roles/aiplatform.user
   ```

2. **Error de facturación**: Verifica que la facturación esté habilitada para el proyecto

3. **Problemas con los datos**: Asegúrate de que tus datos sigan el formato correcto

4. **Errores de entrenamiento**: Revisa los registros en la consola de Google Cloud

## Recursos Adicionales

- [Documentación de Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Guía de ajuste fino de Gemini](https://cloud.google.com/vertex-ai/docs/generative-ai/models/tune-gemini-models)
- [Mejores prácticas para el ajuste fino de LLMs](https://cloud.google.com/vertex-ai/docs/generative-ai/models/tune-llm-best-practices)

## Asistencia

Si encuentras problemas durante el proceso de entrenamiento, contacta al equipo de desarrollo o consulta la documentación de Google Cloud.

---

**Nota**: El entrenamiento de modelos Gemini personalizados implica costos adicionales en Google Cloud. Consulta la [página de precios](https://cloud.google.com/vertex-ai/pricing) para más detalles. 
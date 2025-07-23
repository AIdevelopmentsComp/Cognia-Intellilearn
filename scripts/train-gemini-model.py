#!/usr/bin/env python3
"""
Script para entrenar un modelo Gemini personalizado usando Vertex AI
Este script prepara los datos, crea un trabajo de ajuste fino y entrena un modelo personalizado.

Prerrequisitos:
1. Tener instalado Google Cloud SDK
2. Autenticación con 'gcloud auth application-default login'
3. Tener permisos en el proyecto para usar Vertex AI
4. Tener datos de entrenamiento listos

Uso:
python train-gemini-model.py --project=cogniaintellilearn-ebdb3 --region=us-central1
"""

import argparse
import json
import os
import time
from typing import List, Dict, Any
import uuid

from google.cloud import aiplatform
from google.cloud.aiplatform.tuning import TuningJob

# Configuración de argumentos
parser = argparse.ArgumentParser(description="Entrenar un modelo Gemini personalizado")
parser.add_argument("--project", type=str, required=True, help="ID del proyecto de Google Cloud")
parser.add_argument("--region", type=str, default="us-central1", help="Región de Google Cloud")
parser.add_argument("--data-file", type=str, default="training_data.jsonl", help="Archivo de datos de entrenamiento")
parser.add_argument("--base-model", type=str, default="gemini-1.5-flash", help="Modelo base para el ajuste fino")
parser.add_argument("--tuned-model-name", type=str, default=f"cognia-assistant-{int(time.time())}", help="Nombre del modelo ajustado")
parser.add_argument("--epochs", type=int, default=3, help="Número de épocas para el entrenamiento")
parser.add_argument("--batch-size", type=int, default=4, help="Tamaño del lote para el entrenamiento")
parser.add_argument("--learning-rate", type=float, default=1e-5, help="Tasa de aprendizaje")

def prepare_training_data(data_file: str) -> str:
    """
    Prepara los datos de entrenamiento en el formato requerido por Vertex AI
    
    Args:
        data_file: Ruta al archivo de datos en formato JSONL
    
    Returns:
        Ruta al archivo de datos procesado listo para el entrenamiento
    """
    print(f"Preparando datos de entrenamiento desde {data_file}...")
    
    processed_data = []
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            for line in f:
                example = json.loads(line.strip())
                
                # Convertir al formato requerido por Vertex AI para Gemini
                processed_example = {
                    "messages": []
                }
                
                # Procesar mensajes de la conversación
                for message in example.get("messages", []):
                    role = message.get("role", "user")
                    content = message.get("content", "")
                    
                    # Convertir roles al formato esperado por Gemini
                    if role == "assistant":
                        role = "model"
                    
                    processed_example["messages"].append({
                        "role": role,
                        "content": content
                    })
                
                processed_data.append(processed_example)
    except Exception as e:
        print(f"Error al procesar datos de entrenamiento: {e}")
        raise
    
    # Guardar datos procesados
    processed_file = f"processed_training_data_{uuid.uuid4().hex[:8]}.jsonl"
    with open(processed_file, 'w', encoding='utf-8') as f:
        for example in processed_data:
            f.write(json.dumps(example) + "\n")
    
    print(f"Datos procesados guardados en {processed_file}")
    return processed_file

def upload_to_gcs(local_file: str, project_id: str, region: str) -> str:
    """
    Sube el archivo de datos de entrenamiento a Google Cloud Storage
    
    Args:
        local_file: Ruta al archivo local
        project_id: ID del proyecto de Google Cloud
        region: Región de Google Cloud
    
    Returns:
        URI de GCS para el archivo subido
    """
    # Crear un nombre de bucket único para el proyecto
    bucket_name = f"{project_id}-tuning-data"
    bucket_uri = f"gs://{bucket_name}"
    
    # Ejecutar comandos de gsutil para crear el bucket y subir los datos
    try:
        print(f"Creando bucket {bucket_name} si no existe...")
        os.system(f"gsutil mb -l {region} -p {project_id} {bucket_uri}")
        
        destination = f"{bucket_uri}/{os.path.basename(local_file)}"
        print(f"Subiendo datos a {destination}...")
        os.system(f"gsutil cp {local_file} {destination}")
        
        return destination
    except Exception as e:
        print(f"Error al subir datos a GCS: {e}")
        raise

def train_model(
    project_id: str,
    region: str,
    gcs_data_uri: str,
    base_model: str,
    tuned_model_name: str,
    epochs: int,
    batch_size: int,
    learning_rate: float
) -> str:
    """
    Inicia un trabajo de ajuste fino para el modelo Gemini
    
    Args:
        project_id: ID del proyecto de Google Cloud
        region: Región de Google Cloud
        gcs_data_uri: URI de GCS al archivo de datos de entrenamiento
        base_model: Modelo base para el ajuste fino
        tuned_model_name: Nombre del modelo ajustado
        epochs: Número de épocas para el entrenamiento
        batch_size: Tamaño del lote
        learning_rate: Tasa de aprendizaje
    
    Returns:
        Nombre del modelo ajustado
    """
    # Inicializar Vertex AI
    aiplatform.init(project=project_id, location=region)
    
    # Configurar hiperparámetros para el ajuste fino
    hyperparameters = {
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate
    }
    
    print(f"Iniciando trabajo de ajuste fino para {base_model}...")
    
    # Crear un trabajo de ajuste fino
    tuning_job = TuningJob.create(
        base_model=base_model,
        tuning_job_display_name=f"tune-{tuned_model_name}",
        training_data=gcs_data_uri,
        target_model_display_name=tuned_model_name,
        hyperparameters=hyperparameters
    )
    
    print(f"Trabajo de ajuste fino iniciado: {tuning_job.display_name}")
    print("Este proceso puede tardar varias horas. Puedes monitorear el progreso en la consola de Google Cloud.")
    print(f"URL de seguimiento: https://console.cloud.google.com/vertex-ai/tuning/{region}/jobs?project={project_id}")
    
    # Esperar a que el trabajo se complete (opcional, puede tardar horas)
    # tuning_job.wait()
    
    return tuned_model_name

def create_sample_data():
    """
    Crea un archivo de ejemplo con datos de entrenamiento
    """
    sample_data = [
        {
            "messages": [
                {"role": "user", "content": "¿Qué es CognIA?"},
                {"role": "assistant", "content": "CognIA es una plataforma educativa avanzada que utiliza inteligencia artificial para personalizar el aprendizaje. Ofrecemos cursos adaptativos que se ajustan a las necesidades individuales de cada estudiante, potenciando su desarrollo académico y profesional."}
            ]
        },
        {
            "messages": [
                {"role": "user", "content": "Explícame cómo funcionan los cursos adaptativos"},
                {"role": "assistant", "content": "Los cursos adaptativos de CognIA funcionan analizando tu progreso y comportamiento de aprendizaje. El sistema identifica tus fortalezas y áreas de mejora, ajustando automáticamente el contenido, la dificultad y el ritmo del curso. Si dominas un tema rápidamente, avanzarás a material más desafiante. Si necesitas más práctica en algún concepto, recibirás contenido adicional y ejercicios específicos hasta que lo domines. Todo esto ocurre en tiempo real, creando una experiencia educativa personalizada para maximizar tu aprendizaje."}
            ]
        },
        {
            "messages": [
                {"role": "user", "content": "¿Cuáles son los beneficios de usar CognIA?"},
                {"role": "assistant", "content": "Los beneficios de usar CognIA incluyen: 1) Aprendizaje personalizado que se adapta a tu ritmo y estilo, 2) Retroalimentación inmediata sobre tu progreso, 3) Contenido interactivo que mantiene alta la motivación, 4) Analíticas detalladas sobre tu desempeño, 5) Acceso a mentores expertos en cada área, 6) Certificaciones reconocidas en la industria, y 7) Una comunidad de aprendizaje colaborativa donde puedes interactuar con otros estudiantes."}
            ]
        }
    ]
    
    filename = "training_data.jsonl"
    with open(filename, 'w', encoding='utf-8') as f:
        for example in sample_data:
            f.write(json.dumps(example) + "\n")
    
    print(f"Archivo de ejemplo creado: {filename}")
    return filename

def main():
    args = parser.parse_args()
    
    # Verificar si existe el archivo de datos o crear uno de ejemplo
    if not os.path.exists(args.data_file):
        print(f"No se encontró el archivo {args.data_file}, creando datos de ejemplo...")
        args.data_file = create_sample_data()
    
    # Preparar datos de entrenamiento
    processed_file = prepare_training_data(args.data_file)
    
    # Subir datos a GCS
    gcs_data_uri = upload_to_gcs(processed_file, args.project, args.region)
    
    # Entrenar modelo
    tuned_model = train_model(
        project_id=args.project,
        region=args.region,
        gcs_data_uri=gcs_data_uri,
        base_model=args.base_model,
        tuned_model_name=args.tuned_model_name,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate
    )
    
    print(f"\nResumen del proceso de entrenamiento:")
    print(f"- Proyecto: {args.project}")
    print(f"- Región: {args.region}")
    print(f"- Datos de entrenamiento: {gcs_data_uri}")
    print(f"- Modelo base: {args.base_model}")
    print(f"- Modelo ajustado: {tuned_model}")
    print(f"- Épocas: {args.epochs}")
    print(f"- Tamaño de lote: {args.batch_size}")
    print(f"- Tasa de aprendizaje: {args.learning_rate}")
    
    print("\nUna vez completado el entrenamiento, podrás usar tu modelo personalizado en la aplicación.")
    print("Para usar tu modelo entrenado, actualiza el archivo lib/gemini-config.ts con el nombre del modelo.")

if __name__ == "__main__":
    main() 
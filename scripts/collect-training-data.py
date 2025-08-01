#!/usr/bin/env python3
"""
Script para recopilar y procesar datos de entrenamiento desde Firestore
Este script extrae conversaciones existentes de Firestore y las convierte en datos de entrenamiento.

Prerrequisitos:
1. Tener instalado Google Cloud SDK y Firebase Admin SDK
2. Autenticación con 'gcloud auth application-default login'
3. Tener permisos en el proyecto para acceder a Firestore

Uso:
python collect-training-data.py --project=cogniaintellilearn-ebdb3 --output=training_data.jsonl
"""

import argparse
import json
import os
import datetime
from typing import List, Dict, Any

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Configuración de argumentos
parser = argparse.ArgumentParser(description="Recopilar datos de entrenamiento desde Firestore")
parser.add_argument("--project", type=str, required=True, help="ID del proyecto de Google Cloud")
parser.add_argument("--output", type=str, default="training_data.jsonl", help="Archivo de salida para los datos de entrenamiento")
parser.add_argument("--min-quality", type=float, default=0.7, help="Puntuación mínima de calidad para incluir una conversación (0-1)")
parser.add_argument("--max-conversations", type=int, default=1000, help="Número máximo de conversaciones a recopilar")
parser.add_argument("--collection", type=str, default="conversations", help="Nombre de la colección de Firestore")

def initialize_firestore(project_id: str):
    """
    Inicializa la conexión con Firestore
    
    Args:
        project_id: ID del proyecto de Google Cloud
    
    Returns:
        Cliente de Firestore
    """
    try:
        # Inicializar Firebase con credenciales predeterminadas
        firebase_admin.initialize_app(options={
            'projectId': project_id,
        })
        
        # Obtener cliente de Firestore
        db = firestore.client()
        return db
    except Exception as e:
        print(f"Error al inicializar Firestore: {e}")
        raise

def fetch_conversations(
    db,
    collection_name: str,
    min_quality: float,
    max_conversations: int
) -> List[Dict]:
    """
    Obtiene conversaciones de Firestore
    
    Args:
        db: Cliente de Firestore
        collection_name: Nombre de la colección
        min_quality: Puntuación mínima de calidad
        max_conversations: Número máximo de conversaciones
    
    Returns:
        Lista de conversaciones
    """
    print(f"Obteniendo conversaciones desde la colección {collection_name}...")
    
    try:
        # Consultar conversaciones con calidad mínima
        query = db.collection(collection_name)
        
        # Si existe el campo quality, filtrar por él
        if min_quality > 0:
            query = query.where("quality", ">=", min_quality)
        
        # Limitar el número de resultados
        query = query.limit(max_conversations)
        
        # Ejecutar consulta
        results = query.stream()
        
        # Procesar resultados
        conversations = []
        for doc in results:
            conversation = doc.to_dict()
            conversation['id'] = doc.id
            conversations.append(conversation)
        
        print(f"Se encontraron {len(conversations)} conversaciones")
        return conversations
    except Exception as e:
        print(f"Error al obtener conversaciones: {e}")
        return []

def process_conversations(conversations: List[Dict]) -> List[Dict]:
    """
    Procesa las conversaciones para convertirlas en datos de entrenamiento
    
    Args:
        conversations: Lista de conversaciones
    
    Returns:
        Lista de ejemplos de entrenamiento
    """
    print("Procesando conversaciones...")
    
    training_examples = []
    
    for conversation in conversations:
        # Obtener mensajes de la conversación
        messages = conversation.get("messages", [])
        
        if len(messages) < 2:
            continue  # Ignorar conversaciones con menos de 2 mensajes
        
        # Convertir mensajes al formato requerido
        formatted_messages = []
        
        for message in messages:
            role = message.get("sender", "user").lower()
            content = message.get("text", "")
            
            # Convertir roles al formato esperado
            if role == "ai":
                role = "assistant"
            
            formatted_messages.append({
                "role": role,
                "content": content
            })
        
        # Crear ejemplo de entrenamiento
        training_example = {
            "messages": formatted_messages
        }
        
        training_examples.append(training_example)
    
    print(f"Se procesaron {len(training_examples)} ejemplos de entrenamiento")
    return training_examples

def save_training_data(examples: List[Dict], output_file: str):
    """
    Guarda los ejemplos de entrenamiento en un archivo JSONL
    
    Args:
        examples: Lista de ejemplos de entrenamiento
        output_file: Ruta del archivo de salida
    """
    print(f"Guardando datos de entrenamiento en {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for example in examples:
            f.write(json.dumps(example) + "\n")
    
    print(f"Se guardaron {len(examples)} ejemplos en {output_file}")

def create_firestore_schema():
    """
    Crea un archivo de ejemplo con la estructura de Firestore para conversaciones
    """
    schema = {
        "collections": [
            {
                "name": "conversations",
                "fields": [
                    {"name": "userId", "type": "string"},
                    {"name": "startTime", "type": "timestamp"},
                    {"name": "endTime", "type": "timestamp"},
                    {"name": "quality", "type": "number"},
                    {"name": "messages", "type": "array", "items": {
                        "type": "object",
                        "properties": {
                            "sender": {"type": "string"},
                            "text": {"type": "string"},
                            "timestamp": {"type": "timestamp"}
                        }
                    }}
                ]
            }
        ]
    }
    
    schema_file = "firestore_schema.json"
    with open(schema_file, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2)
    
    print(f"Esquema de Firestore guardado en {schema_file}")

def main():
    args = parser.parse_args()
    
    # Crear esquema de ejemplo
    create_firestore_schema()
    
    try:
        # Inicializar Firestore
        db = initialize_firestore(args.project)
        
        # Obtener conversaciones
        conversations = fetch_conversations(
            db,
            args.collection,
            args.min_quality,
            args.max_conversations
        )
        
        if not conversations:
            print("No se encontraron conversaciones. Creando datos de ejemplo...")
            # Simular algunos datos de ejemplo
            current_time = datetime.datetime.now()
            conversations = [
                {
                    "id": "example1",
                    "userId": "user123",
                    "startTime": current_time,
                    "endTime": current_time + datetime.timedelta(minutes=5),
                    "quality": 0.9,
                    "messages": [
                        {"sender": "user", "text": "¿Qué es CognIA?", "timestamp": current_time},
                        {"sender": "ai", "text": "CognIA es una plataforma educativa avanzada que utiliza inteligencia artificial para personalizar el aprendizaje. Ofrecemos cursos adaptativos que se ajustan a las necesidades individuales de cada estudiante.", "timestamp": current_time + datetime.timedelta(seconds=30)}
                    ]
                },
                {
                    "id": "example2",
                    "userId": "user456",
                    "startTime": current_time,
                    "endTime": current_time + datetime.timedelta(minutes=10),
                    "quality": 0.85,
                    "messages": [
                        {"sender": "user", "text": "¿Cómo puedo acceder a mis cursos?", "timestamp": current_time},
                        {"sender": "ai", "text": "Puedes acceder a tus cursos iniciando sesión en la plataforma y yendo a la sección 'Mis Cursos'. Allí encontrarás todos los cursos en los que estás inscrito.", "timestamp": current_time + datetime.timedelta(seconds=30)},
                        {"sender": "user", "text": "¿Y si olvido mi contraseña?", "timestamp": current_time + datetime.timedelta(minutes=1)},
                        {"sender": "ai", "text": "Si olvidas tu contraseña, puedes usar la opción 'Olvidé mi contraseña' en la página de inicio de sesión. Te enviaremos un enlace a tu correo electrónico para restablecerla.", "timestamp": current_time + datetime.timedelta(minutes=1, seconds=30)}
                    ]
                }
            ]
        
        # Procesar conversaciones
        training_examples = process_conversations(conversations)
        
        # Guardar datos de entrenamiento
        save_training_data(training_examples, args.output)
        
        print("\nPróximos pasos:")
        print("1. Revisa y refina los datos de entrenamiento en:", os.path.abspath(args.output))
        print("2. Usa estos datos para entrenar tu modelo con el script train-gemini-model.py")
        print(f"   python train-gemini-model.py --project={args.project} --data-file={args.output}")
    
    except Exception as e:
        print(f"Error en la ejecución: {e}")

if __name__ == "__main__":
    main() 
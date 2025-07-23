#!/usr/bin/env python3
"""
Test script for Gemini API using Python
Based on the user's provided code but simplified for testing

To use:
1. Install Google AI Python SDK: pip install google-generativeai
2. Run this script: python test-gemini.py
"""

import os
from google import genai
from google.genai import types

def generate_response():
    """Generate a response using Gemini model"""
    
    # Configure the client - either with an API key or with Google Cloud credentials
    # Uncomment one of these two methods:
    
    # Method 1: Using API key
    # genai.configure(api_key="YOUR_API_KEY_HERE")
    
    # Method 2: Using Google Cloud credentials
    client = genai.Client(
        vertexai=True,
        project="cogniaintellilearn-ebdb3",  # Update with your project ID
        location="global",
    )

    # Configure the model and request
    model = "gemini-2.5-flash-preview-05-20"
    
    # Example of a chat message
    contents = [
        types.Content(
            role="user",
            parts=[types.Part(text="Hola, ¿cómo estás? Explícame qué es la inteligencia artificial.")]
        )
    ]

    # Generation configuration
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        max_output_tokens=8192,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
        ],
    )

    print("Enviando solicitud a Gemini...\n")
    
    try:
        # For streamed response
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            print(chunk.text, end="")
        print("\n\nRespuesta completa recibida con éxito.")
        
        # For non-streamed response (alternative)
        # response = client.models.generate_content(
        #     model=model,
        #     contents=contents,
        #     config=generate_content_config,
        # )
        # print(response.text)
        
    except Exception as e:
        print(f"Error al llamar a la API de Gemini: {e}")

if __name__ == "__main__":
    generate_response() 
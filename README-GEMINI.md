# Gemini AI Integration for CognIA

This document provides instructions for setting up and using the Gemini AI integration in the CognIA IntelliLearn platform.

## Table of Contents
1. [Overview](#overview)
2. [Setup Options](#setup-options)
3. [Configuration Steps](#configuration-steps)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

## Overview

The Floating Assistant component in CognIA uses Google's Gemini AI models to provide intelligent responses to user queries. There are two ways to integrate with Gemini:

1. **Server-side integration** (recommended): Uses a Next.js API route to securely call the Gemini API from the server.
2. **Client-side integration**: Directly calls the Gemini API from the client using an API key.

## Setup Options

### Option A: Using a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Sign in with your Google account
3. Go to "API Keys" in the settings
4. Create a new API key
5. Copy the key for configuration

### Option B: Using Google Cloud Authentication

1. Authenticate with Google Cloud using the gcloud CLI:
   ```
   gcloud auth application-default login
   ```
2. Set your project:
   ```
   gcloud config set project cogniaintellilearn-ebdb3
   ```

## Configuration Steps

1. Open `lib/gemini-config.ts` and configure:
   - If using an API key, add it to the `apiKey` field
   - Set `useServerEndpoint` to `true` for server-side integration (recommended) or `false` for client-side

2. If using environment variables (recommended for production):
   - Create a `.env.local` file in the project root
   - Add your API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - Update `app/api/gemini/route.ts` to use `process.env.GEMINI_API_KEY`

## Testing

### Python Test Script

A Python script is provided to test your Gemini integration directly:

1. Install the required package:
   ```
   pip install google-generativeai
   ```

2. Edit `scripts/test-gemini.py` to configure your authentication method:
   - For API key: Uncomment and update the `genai.configure(api_key="...")` line
   - For Google Cloud auth: Update the project ID if needed

3. Run the script:
   ```
   python scripts/test-gemini.py
   ```

### Browser Testing

1. Run the Next.js development server:
   ```
   npm run dev
   ```

2. Open the application in your browser
3. Test the Floating Assistant by sending a message

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify your API key or authentication is set up correctly
3. Ensure you have the right permissions for the Gemini API
4. Check if you're using the correct model name (`gemini-2.5-flash-preview-05-20`)
5. Verify your Google Cloud project has the Gemini API enabled

For billing-related issues, check your Google Cloud Console and ensure you have billing set up for the Vertex AI API.

---

For more information, refer to the [Google AI documentation](https://ai.google.dev/docs) or the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/quickstart-multimodal). 
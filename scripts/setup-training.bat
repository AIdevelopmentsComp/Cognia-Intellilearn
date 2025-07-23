@echo off
echo ===================================
echo Configuración para Entrenamiento de Modelo Gemini
echo ===================================
echo.

echo Verificando requisitos...
python --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Python no está instalado o no está en el PATH.
    echo Por favor, instala Python desde https://www.python.org/downloads/
    echo y asegúrate de que se agregue al PATH.
    pause
    exit /b 1
)

gcloud --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Google Cloud SDK no está instalado o no está en el PATH.
    echo Por favor, instala Google Cloud SDK desde https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo.
echo Instalando dependencias necesarias...
pip install google-cloud-aiplatform firebase-admin

echo.
echo Por favor, ingresa el ID de tu proyecto de Google Cloud:
set /p PROJECT_ID=

echo.
echo Autenticando con Google Cloud...
gcloud auth application-default login
gcloud config set project %PROJECT_ID%

echo.
echo Verificando y habilitando APIs necesarias...
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com

echo.
echo ===================================
echo MENU DE ENTRENAMIENTO
echo ===================================
echo.
echo 1. Recolectar datos de entrenamiento de Firestore
echo 2. Crear datos de entrenamiento de ejemplo
echo 3. Entrenar modelo con datos existentes
echo 4. Entrenar modelo con datos de ejemplo
echo 5. Salir
echo.

:MENU_CHOICE
set /p CHOICE=Elige una opción (1-5): 

if "%CHOICE%"=="1" (
    echo.
    echo Recolectando datos de entrenamiento de Firestore...
    python collect-training-data.py --project=%PROJECT_ID% --output=training_data.jsonl
    goto END_MENU
)

if "%CHOICE%"=="2" (
    echo.
    echo Creando datos de entrenamiento de ejemplo...
    python collect-training-data.py --project=%PROJECT_ID% --output=training_data_example.jsonl
    goto END_MENU
)

if "%CHOICE%"=="3" (
    echo.
    echo Por favor, especifica el archivo de datos de entrenamiento:
    set /p DATA_FILE=

    if not exist "%DATA_FILE%" (
        echo El archivo %DATA_FILE% no existe.
        goto MENU_CHOICE
    )

    echo.
    echo Entrenando modelo con datos existentes...
    python train-gemini-model.py --project=%PROJECT_ID% --data-file=%DATA_FILE%
    goto END_MENU
)

if "%CHOICE%"=="4" (
    echo.
    echo Entrenando modelo con datos de ejemplo...
    python train-gemini-model.py --project=%PROJECT_ID%
    goto END_MENU
)

if "%CHOICE%"=="5" (
    echo Saliendo...
    goto END_MENU
)

echo Opción no válida. Por favor, elige una opción entre 1 y 5.
goto MENU_CHOICE

:END_MENU
echo.
echo Proceso completado.
echo.
echo Para usar tu modelo entrenado en la aplicación:
echo 1. Espera a que el entrenamiento termine (puede tardar varias horas)
echo 2. Actualiza el archivo lib/gemini-config.ts con el nombre de tu modelo entrenado
echo 3. Reconstruye y despliega la aplicación
echo.
pause 
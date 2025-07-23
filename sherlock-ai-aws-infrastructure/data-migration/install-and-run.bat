@echo off
echo ========================================
echo SHERLOCK AI - ZANTAC DATA LOADER
echo ========================================

echo Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python no encontrado. Por favor instala Python primero.
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
pip install boto3 pandas openpyxl

echo.
echo Ejecutando carga de datos Zantac...
python zantac-simple-loader.py

echo.
echo ========================================
echo PROCESO COMPLETADO
echo ========================================
pause 
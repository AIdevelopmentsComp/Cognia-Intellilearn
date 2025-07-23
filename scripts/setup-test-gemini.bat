@echo off
echo ===================================
echo Gemini API Test Setup and Runner
echo ===================================
echo.

echo Checking for Python installation...
python --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in your PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo and make sure it's added to your PATH.
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install google-generativeai

echo.
echo Ready to run the Gemini API test script!
echo.
echo Before running, make sure you have:
echo 1. Set up your Google Cloud credentials with 'gcloud auth application-default login'
echo    OR
echo 2. Added your API key in the test-gemini.py script
echo.
echo Press any key to run the test script or Ctrl+C to cancel...
pause > nul

echo.
echo Running Gemini API test...
python %~dp0\test-gemini.py

echo.
echo Test completed.
echo.
echo If you encountered errors, please check:
echo - Your Google Cloud authentication
echo - Your API key configuration
echo - Network connectivity to Google's APIs
echo.
pause 
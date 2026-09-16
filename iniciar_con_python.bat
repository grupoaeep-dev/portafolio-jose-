@echo off
title Servidor Localhost Python - Portafolio Jose Humberto
cls
cd /d "%~dp0"
echo ================================================================
echo   INICIANDO SERVIDOR LOCALHOST INMEDIATO CON PYTHON
echo ================================================================
echo.
python server.py
if %ERRORLEVEL% NEQ 0 (
    py server.py
)
if %ERRORLEVEL% NEQ 0 (
    echo No se pudo iniciar con Python. Por favor usa "instalar_nodejs.bat".
)
pause

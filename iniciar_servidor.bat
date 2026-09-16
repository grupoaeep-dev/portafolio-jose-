@echo off
title Servidor Localhost - Portafolio Jose Humberto
cls
cd /d "%~dp0"
echo ================================================================
echo   INICIANDO SERVIDOR LOCALHOST (PORTAFOLIO DINAMICO CON SQLITE)
echo ================================================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] npm no se detecto en esta sesion.
    echo Cierra esta ventana y vuelve a abrirla para que Windows actualice las rutas.
    echo.
    pause
    exit /b
)

echo [1/3] Instalando dependencias necesarias (express, cors, bcryptjs, jwt)...
call npm install --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo Hubo un problema con npm install. Intentando continuar...
)
echo.

echo [2/3] Verificando base de datos SQLite...
call npm run seed
echo.

echo [3/3] Iniciando servidor web en http://localhost:3000...
echo.
call npm start
pause

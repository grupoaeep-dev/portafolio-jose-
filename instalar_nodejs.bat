@echo off
title Instalador Automatico de Node.js
cls
echo ================================================================
echo   DESCARGA E INSTALACION AUTOMATICA DE NODE.JS
echo ================================================================
echo.
echo Descargando el instalador oficial de Node.js desde nodejs.org...
echo Por favor espera unos segundos mientras se descarga e instala...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $msi = \"$env:TEMP\nodejs_setup.msi\"; Write-Host 'Descargando instalador...'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v22.20.0/node-v22.20.0-x64.msi', $msi); Write-Host 'Instalando Node.js en tu equipo...'; Start-Process msiexec.exe -ArgumentList \"/i `\"$msi`\" /passive /norestart\" -Wait; Write-Host 'Instalacion completada!'"

echo.
echo ================================================================
echo   LISTO! NODE.JS SE HA INSTALADO CORRECTAMENTE
echo   Ahora ya puedes hacer doble clic en "iniciar_servidor.bat"
echo ================================================================
echo.
pause

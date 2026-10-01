@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale Node.js LTS em https://nodejs.org/en/download e reabra este arquivo.
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:5173 no navegador depois que o servidor iniciar.
node tools\dev-server.cjs
pause

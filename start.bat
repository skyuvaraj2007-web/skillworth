@echo off
setlocal enabledelayedexpansion
title SkillNexus Launcher
color 0A

echo ========================================================
echo               STARTING SKILLNEXUS SYSTEM                
echo ========================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found on your system!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Ensure backend dependencies exist
if not exist "%~dp0backend\node_modules\" (
    echo [INFO] Installing backend dependencies...
    pushd "%~dp0backend"
    call npm install
    popd
)

:: 3. Ensure frontend dependencies exist
if not exist "%~dp0frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    pushd "%~dp0frontend"
    call npm install
    popd
)

:: 4. Free ports 5000, 5173, 5174 to prevent port conflicts
echo [INFO] Ensuring ports 5000 and 5173 are available...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/2] Starting Backend Server (Port 5000)...
start "SkillNexus - Backend (Port 5000)" /D "%~dp0backend" cmd /k npm start

echo [2/2] Starting Frontend Client (Port 5173)...
start "SkillNexus - Frontend (Port 5173)" /D "%~dp0frontend" cmd /k npm run dev -- --open

echo.
echo ========================================================
echo   SkillNexus is starting up!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173 (opening automatically)
echo ========================================================
echo.
echo Leave the backend and frontend terminal windows open.
echo To stop all services later, run stop.bat.
echo.
pause

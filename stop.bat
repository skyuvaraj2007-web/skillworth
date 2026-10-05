@echo off
title Stop SkillNexus
color 0C

echo ========================================================
echo               STOPPING SKILLNEXUS SERVICES              
echo ========================================================
echo.

echo Stopping Node.js processes running on port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping Node.js processes running on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping any secondary processes on port 5174...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All SkillNexus services on ports 5000, 5173, and 5174 have been stopped.
echo.
pause

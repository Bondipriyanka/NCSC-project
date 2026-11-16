@echo off
title Launching NCSC Freshness Detector App
echo ===================================================
echo   NCSC 2026: SMART FRESHNESS DETECTOR LAUNCHER
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Python detected. Starting local server...
    start "" "http://localhost:8000"
    python -m http.server 8000
    goto end
)

:: Check if Node/npx is installed
npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Node.js/npx detected. Starting local server...
    start "" "http://localhost:8080"
    npx -y http-server -p 8080
    goto end
)

:: Fallback: Open index.html directly (Note: Webcam might be blocked by browser security on file:// protocol)
echo [!] No Python or Node.js server tools found.
echo [!] Opening file directly. (Note: File upload and demo buttons will work, but webcam may require a local server).
echo.
pause
start "" "index.html"

:end
pause

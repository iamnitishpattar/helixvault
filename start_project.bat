@echo off
title HelixVault Platform Launcher
echo =========================================================
echo              Starting HelixVault Platform
echo =========================================================
echo.

echo [1/2] Starting HelixVault Backend (FastAPI on Port 8000)...
start "HelixVault Backend (FastAPI)" cmd /k "cd /d %~dp0backend && (if exist .\.venv\Scripts\python.exe (.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload) else (.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload))"

echo [2/2] Starting HelixVault Frontend (Vite React)...
start "HelixVault Frontend (Vite React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================================
echo  Both servers are launching in 2 separate windows on your taskbar!
echo  - Window 1: HelixVault Backend (FastAPI)
echo  - Window 2: HelixVault Frontend (Vite React)
echo.
echo  Waiting for the dev server to initialize...
echo =========================================================
ping 127.0.0.1 -n 8 >nul

echo.
echo Opening browser...
start http://localhost:5173

echo.
echo NOTE: If port 5173 is occupied, Vite will automatically use:
echo       --^> http://localhost:5174 or http://localhost:5175
echo Check the "HelixVault Frontend" window on your taskbar for details!
echo =========================================================

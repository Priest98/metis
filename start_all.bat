@echo off
echo ===================================================
echo 🚀 METIS - SYSTEM LAUNCHER
echo ===================================================

echo.
echo 1. Cleaning up ports...
taskkill /IM python.exe /F >nul 2>&1
taskkill /IM uvicorn.exe /F >nul 2>&1
taskkill /IM node.exe /F >nul 2>&1

echo.
echo 2. Starting Backend (API + Triggers)...
start "Metis Backend" cmd /k "cd backend && python run.py"

echo.
echo 3. Starting Frontend (Dashboard)...
start "Metis Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo ✅ System is starting!
echo.
echo 📊 Dashboard:  http://localhost:3000
echo 🌍 API Docs:   http://localhost:8000/docs
echo.
echo Press any key to exit this launcher...
pause >nul

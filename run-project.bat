@echo off
echo ========================================
echo    Edufin Platform - Startup Script
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start cmd /k "python run.py"
cd ..

echo Starting Frontend Development Server...
cd frontend
start cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo    Services Starting...
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this script...
pause >nul
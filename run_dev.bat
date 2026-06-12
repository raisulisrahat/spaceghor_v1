@echo off
:: spaceghor Development Server Starter
:: This script starts both the Django backend and the Vite/React frontend in separate windows.

echo.
echo [1/2] Starting Django Backend...
start "spaceghor Backend" cmd /k "cd /d E:\DevOps\Production\spaceghor v1\backend\ && .venv\Scripts\activate && python manage.py runserver"

echo [2/2] Starting Vite Frontend...
start "spaceghor Web" cmd /k "cd /d E:\DevOps\Production\spaceghor v1\web && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo You can close this window now.
timeout /t 5

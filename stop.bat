@echo off
echo Stopping Next.js dev server on port 3000...
FOR /F "tokens=5" %%T IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %%T /F
echo Server stopped.

@echo off
if not exist logs mkdir logs
echo Starting Timesheet Automator in background...
start /B cmd /c "npm run dev > logs\app.log 2>&1"
echo Server started! Logs are being written to logs\app.log

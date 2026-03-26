#!/bin/bash
mkdir -p logs
echo "Starting Timesheet Automator in background..."
nohup npm run dev > logs/app.log 2>&1 &
echo "Server started! Logs are being written to logs/app.log"

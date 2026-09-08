@echo off
echo Starting LMAR Server...
start cmd /k "node backend/server.js"
timeout /t 2 /nobreak > NUL
start chrome "http://localhost:4000"
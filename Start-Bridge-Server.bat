@echo off
title McpDOM + Browser Forensic Bridge Server (Port 3847)
color 0B
cls
echo ====================================================================
echo  McpDOM + Browser Forensic Platform (v2.1.0)
echo  WebSocket Bridge Server (Port 3847) - 43 AI Agent Tools Active
echo ====================================================================
echo.
cd /d "%~dp0"
node bin/bridge-server.js
pause

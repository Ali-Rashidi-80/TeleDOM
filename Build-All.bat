@echo off
title Build McpDOM Complete Project
color 0E
cls
echo ====================================================================
echo  Building McpDOM Project (Extension + Server + Client)...
echo ====================================================================
echo.
cd /d "%~dp0"
call npm run build
echo.
echo Build complete!
pause

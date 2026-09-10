@echo off
title McpDOM Bridge Status Check
color 0A
cls
echo ====================================================================
echo  Checking McpDOM Bridge Status & Connected Chrome Tabs...
echo ====================================================================
echo.
cd /d "%~dp0"
node bin/cli.js status
echo.
pause

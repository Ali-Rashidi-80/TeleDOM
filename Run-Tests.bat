@echo off
title Run Unit & Integration Tests
color 0A
cls
echo ====================================================================
echo  Running Tests...
echo ====================================================================
echo.
cd /d "%~dp0"
call npm run test:unit
echo.
pause

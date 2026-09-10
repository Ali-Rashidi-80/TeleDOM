@echo off
title Install Dependencies
color 0D
cls
echo ====================================================================
echo  Installing NPM Dependencies...
echo ====================================================================
echo.
cd /d "%~dp0"
call npm install
echo.
echo Dependencies installed successfully!
pause

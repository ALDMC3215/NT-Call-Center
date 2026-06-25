@echo off
TITLE ALDMC's Smart App Launcher

echo.
echo  -=[ ALDMC's Smart App Launcher ]=-
echo.
echo  Detecting project type...
echo ===============================================================================

REM Check for project type and jump to the correct section
IF EXIST "package.json" GOTO NODE_PROJECT
IF EXIST "index.html" GOTO HTML_PROJECT
GOTO NOT_FOUND


:NODE_PROJECT
echo  Found 'package.json'. This is a Node.js project (React, Vue, etc.).
echo.
echo  [1/2] Installing dependencies with 'npm install'... (This might take a moment)
call npm install
echo.
echo  [2/2] Starting the development server and opening the browser...
call npm run dev -- --open
GOTO END


:HTML_PROJECT
echo  Found 'index.html' but no 'package.json'. Treating as a simple static site.
echo.
echo  Starting Python's simple web server...
echo  Open your browser to http://localhost:8000
where python >nul 2>nul
if %errorlevel% neq 0 GOTO PYTHON_NOT_FOUND
python -m http.server 8000
GOTO END


:PYTHON_NOT_FOUND
echo  ERROR: Python is not found in your system's PATH.
echo  Cannot start the simple server.
GOTO END


:NOT_FOUND
echo  No recognizable project found here.
echo  Make sure this script is in the root folder with your 'package.json' or 'index.html'.
GOTO END


:END
echo.
pause
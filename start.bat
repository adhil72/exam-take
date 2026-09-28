@echo off
echo Building GExam Image...
docker build -t gexam-app .
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
echo Running GExam Container...
docker run -p 3000:3000 -v gexam-data:/app/data -v "%cd%\..\gate-questions":/gate-questions:ro gexam-app
pause

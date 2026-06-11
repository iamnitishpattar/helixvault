@echo off
echo Starting HelixVault Backend...
start cmd /k "cd e:\new_project_main\backend && .\venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"

echo Starting HelixVault Frontend...
start cmd /k "cd e:\new_project_main\frontend && npm run dev"

echo Both servers are starting! 
echo Please wait a few seconds, then open http://localhost:5173 in your browser.
pause

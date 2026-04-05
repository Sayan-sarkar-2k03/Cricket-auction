@echo off
echo Starting Auction Backend (FastAPI)...
start cmd /k "cd /d D:\antigrsvity\auction\auction-backend && env\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Auction Frontend (React/Vite)...
start cmd /k "cd /d D:\antigrsvity\auction\auction-frontend && npm run dev"

echo Both servers are starting.
pause

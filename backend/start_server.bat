@echo off
echo Starting Natural Plylam Backend Server...
echo.

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    echo MONGO_URL=mongodb://localhost:27017 > .env
    echo DB_NAME=plylam_admin >> .env
    echo JWT_SECRET=plylam_secret_key_2024 >> .env
    echo.
    echo WARNING: Please update .env with your MongoDB connection string!
    echo.
)

REM Load environment variables from .env
for /f "tokens=*" %%a in (.env) do set %%a

echo.
echo Starting server on http://localhost:8001
echo Press Ctrl+C to stop
echo.

uvicorn server:app --host 0.0.0.0 --port 8001 --reload

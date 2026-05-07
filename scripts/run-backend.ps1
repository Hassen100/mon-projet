$ErrorActionPreference = 'Stop'

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

Write-Host "Installing backend dependencies..."
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt

Write-Host "Applying migrations..."
.\.venv\Scripts\python.exe .\backend\manage.py migrate

Write-Host "Starting Django backend on http://localhost:8000 ..."
.\.venv\Scripts\python.exe .\backend\manage.py runserver 0.0.0.0:8000

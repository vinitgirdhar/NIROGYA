# start_project.ps1

Write-Host "Starting Nirogya Project Setup..." -ForegroundColor Cyan

$root = Get-Location
$backend = Join-Path $root "backend"

# 1. Backend Setup
Write-Host "`n[1/4] Setting up Backend..." -ForegroundColor Yellow
Push-Location $backend

# Check/Create Venv
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    try {
        py -3.11 -m venv venv
    } catch {
        python -m venv venv
    }
}

# Activate and Install Deps
Write-Host "Installing backend dependencies..."
& ".\venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt

# Setup .env
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Write-Host "Creating .env from .env.example"
    Copy-Item ".env.example" ".env"
}

Pop-Location

# 2. Frontend Setup
Write-Host "`n[2/4] Setting up Frontend..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..."
    npm install
} else {
    Write-Host "node_modules exists, skipping npm install (run 'npm install' manually if needed)."
}

# 3. Start Servers
Write-Host "`n[3/4] Starting Servers..." -ForegroundColor Yellow

# Start Backend
Write-Host "Launching Backend (FastAPI)..."
Start-Process -FilePath (Join-Path $backend "venv\Scripts\python.exe") -ArgumentList "-m uvicorn backend.app:app --reload --port 8000" -WorkingDirectory $root

# Start Frontend
Write-Host "Launching Frontend (React)..."
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $root

Write-Host "`n[4/4] Done! Check the new terminal windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:3000"

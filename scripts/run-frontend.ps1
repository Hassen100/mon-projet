$ErrorActionPreference = 'Stop'

Push-Location .\seo-dashboard

Write-Host "Installing frontend dependencies..."
npm install

Write-Host "Starting Angular frontend on http://localhost:4200 ..."
npm start

Pop-Location

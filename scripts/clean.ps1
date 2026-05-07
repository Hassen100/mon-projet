$ErrorActionPreference = 'SilentlyContinue'

Write-Host "[1/5] Removing root logs..."
Remove-Item -Force .\backend-dev*.log, .\frontend-dev*.log, .\frontend-static*.log

Write-Host "[2/5] Removing frontend logs..."
Remove-Item -Force .\seo-dashboard\*.log

Write-Host "[3/5] Removing Python caches..."
Get-ChildItem -Recurse -Directory -Filter __pycache__ .\backend | Remove-Item -Recurse -Force
Remove-Item -Recurse -Force .\backend\.pytest_cache

Write-Host "[4/5] Removing frontend build caches..."
Remove-Item -Recurse -Force .\seo-dashboard\.angular, .\seo-dashboard\dist, .\seo-dashboard\node_modules\.cache

Write-Host "[5/5] Removing misplaced backend npm lockfile if present..."
Remove-Item -Force .\backend\package-lock.json

Write-Host "Cleanup completed."

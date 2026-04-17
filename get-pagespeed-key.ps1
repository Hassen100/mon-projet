# Script pour récupérer la clé PageSpeed API de Google Cloud
# Usage: .\get-pagespeed-key.ps1 -ProjectId 957640126032

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "🔍 Fetching PageSpeed API keys from project: $ProjectId" -ForegroundColor Cyan

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✓ gcloud CLI found: $gcloudVersion"
} catch {
    Write-Host "❌ gcloud CLI not found. Install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Set the project
Write-Host "`n📋 Setting project to $ProjectId..."
gcloud config set project $ProjectId

# List API keys
Write-Host "`n🔐 Available API Keys:"
$keys = gcloud services api-keys list --format="table(name,createTime,displayName)" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to list API keys. Make sure you're authenticated:" -ForegroundColor Red
    Write-Host "   Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

$keys

Write-Host "`n📌 To get the full key value, run:" -ForegroundColor Yellow
Write-Host "   gcloud services api-keys list --format='value(keyString)' --project=$ProjectId" -ForegroundColor White
Write-Host "`n   Then copy the key and run:" -ForegroundColor Yellow
Write-Host "   python update_pagespeed_key.py <KEY>" -ForegroundColor White

# Rebuild Synetiq images from current source (no stale Docker cache) and restart stack.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$revision = Get-Date -Format "yyyyMMdd-HHmmss"
$env:BUILD_REVISION = $revision

Write-Host "Rebuilding with BUILD_REVISION=$revision ..." -ForegroundColor Cyan

docker compose down --remove-orphans
docker compose build --no-cache --pull api frontend celery-worker
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker compose up -d --force-recreate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done. Open http://localhost:8080" -ForegroundColor Green
Write-Host "API build stamp:" -NoNewline
docker exec synetiq-api cat /app/.build_revision 2>$null
Write-Host "Hard-refresh browser (Ctrl+Shift+R) if UI looks old." -ForegroundColor Yellow

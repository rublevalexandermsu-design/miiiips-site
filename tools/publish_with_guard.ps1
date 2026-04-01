$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Write-Host 'Running site release guard...'
python (Join-Path $PSScriptRoot 'site_release_guard.py')
if ($LASTEXITCODE -ne 0) { throw 'site_release_guard failed' }
Write-Host 'Running site data guard...'
python (Join-Path $PSScriptRoot 'site_data_guard.py')
if ($LASTEXITCODE -ne 0) { throw 'site_data_guard failed' }
Write-Host 'release gates passed'

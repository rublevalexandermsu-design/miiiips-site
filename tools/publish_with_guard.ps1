param()
$ErrorActionPreference = 'Stop'
python tools/site_release_guard.py
if ($LASTEXITCODE -ne 0) { throw 'site_release_guard failed' }
python tools/site_data_guard.py
if ($LASTEXITCODE -ne 0) { throw 'site_data_guard failed' }
Write-Host 'release gates passed'

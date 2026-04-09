$ErrorActionPreference = 'Stop'

$bridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $bridgeDir

if (-not (Test-Path '.clasp.json')) {
  throw "Missing .clasp.json. Copy .clasp.json.sample to .clasp.json and paste the real Apps Script scriptId."
}

clasp push
clasp deploy --deploymentId $(clasp deployments | Select-String -Pattern 'web app' | ForEach-Object { $_.Line.Split()[-1] } | Select-Object -First 1)

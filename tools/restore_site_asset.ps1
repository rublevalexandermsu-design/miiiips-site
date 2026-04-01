param(
    [Parameter(Mandatory = $true)]
    [string]$Commit,

    [Parameter(Mandatory = $true)]
    [string]$RelativePath,

    [ValidateSet('preview', 'restore')]
    [string]$Mode = 'preview'
)

$ErrorActionPreference = 'Stop'

$SiteRoot = Split-Path -Parent $PSScriptRoot
$GitPath = Join-Path $SiteRoot '.git'

if (-not (Test-Path $GitPath)) {
    throw "Git repository not found at $SiteRoot"
}

$NormalizedPath = ($RelativePath -replace '\\', '/').TrimStart('./')
$TargetPath = Join-Path $SiteRoot $RelativePath

$ShowResult = git -C $SiteRoot show "$Commit`:$NormalizedPath" 2>$null
if (-not $?) {
    throw "Unable to read $NormalizedPath from commit $Commit"
}

if ($Mode -eq 'preview') {
    $PreviewRoot = Join-Path $SiteRoot 'runtime\restore-previews'
    $SafeDir = Split-Path $NormalizedPath -Parent
    $PreviewDir = if ($SafeDir) { Join-Path $PreviewRoot $SafeDir } else { $PreviewRoot }
    New-Item -ItemType Directory -Force -Path $PreviewDir | Out-Null
    $PreviewPath = Join-Path $PreviewRoot $NormalizedPath
    [System.IO.File]::WriteAllText($PreviewPath, $ShowResult, [System.Text.UTF8Encoding]::new($false))
    Write-Output "preview: $PreviewPath"
    exit 0
}

$Parent = Split-Path -Parent $TargetPath
if ($Parent -and -not (Test-Path $Parent)) {
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
}

[System.IO.File]::WriteAllText($TargetPath, $ShowResult, [System.Text.UTF8Encoding]::new($false))
Write-Output "restored: $TargetPath"

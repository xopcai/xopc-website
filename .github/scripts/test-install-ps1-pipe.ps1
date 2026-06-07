#Requires -Version 7.0
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Public = Join-Path $Root "public"
$Installer = Join-Path $Public "install.ps1"
$Port = if ($env:INSTALLER_TEST_PORT) { [int]$env:INSTALLER_TEST_PORT } else { 8765 }
$BaseUrl = "http://127.0.0.1:$Port/install.ps1"

$env:CI = "1"
$env:XOPC_NO_PROMPT = "1"
$env:XOPC_NO_REGISTRY_AUTODETECT = "1"

function Wait-InstallerServer {
    param([string]$Url)
    for ($attempt = 1; $attempt -le 40; $attempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $Url -Method Head | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    throw "Timed out waiting for installer HTTP server at $Url"
}

function Get-FileSha256Hex {
    param([string]$Path)
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-RemoteInstallerSha256Hex {
    param([string]$Url)
    $tempFile = [IO.Path]::GetTempFileName()
    try {
        Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $tempFile
        return (Get-FileHash -LiteralPath $tempFile -Algorithm SHA256).Hash.ToLowerInvariant()
    } finally {
        if (Test-Path $tempFile) {
            Remove-Item -Force $tempFile
        }
    }
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command python3 -ErrorAction SilentlyContinue
}
if (-not $python) {
    throw "python is required for pipe simulation"
}

Write-Host "==> Starting local installer HTTP server on port $Port"
$server = Start-Process -FilePath $python.Source `
    -ArgumentList @("-m", "http.server", "$Port", "--directory", $Public) `
    -PassThru `
    -WindowStyle Hidden

try {
    Wait-InstallerServer -Url $BaseUrl

    Write-Host "==> irm | scriptblock with env-based dry-run (homepage-style pipe)"
    $env:XOPC_DRY_RUN = "1"
    $env:XOPC_INSTALL_METHOD = "npm"
    $bytes = Invoke-WebRequest -UseBasicParsing -Uri $BaseUrl -Raw
    $block = [scriptblock]::Create($bytes)
    $out = (& $block 2>&1 | Out-String)
    if ($out -notmatch "Dry run") { throw "Expected dry-run output from env-based pipe execution" }
    if ($out -notmatch "npm") { throw "Expected npm method in env-based pipe output" }

    Write-Host "==> irm | scriptblock with -DryRun -InstallMethod git"
    Remove-Item Env:XOPC_DRY_RUN -ErrorAction SilentlyContinue
    $scriptText = Invoke-WebRequest -UseBasicParsing -Uri $BaseUrl -Raw
    $block = [scriptblock]::Create($scriptText)
    $out = (& $block -DryRun -NoPrompt -InstallMethod git 2>&1 | Out-String)
    if ($out -notmatch "Install plan") { throw "Expected install plan in git pipe dry-run" }
    if ($out -notmatch "git") { throw "Expected git method in pipe dry-run output" }

    Write-Host "==> Served install.ps1 matches local file (sha256)"
    $localHash = Get-FileSha256Hex -Path $Installer
    $remoteHash = Get-RemoteInstallerSha256Hex -Url $BaseUrl
    if ($localHash -ne $remoteHash) {
        throw "Served install.ps1 hash mismatch.`n  local:  $localHash`n  remote: $remoteHash"
    }

    Write-Host "All install.ps1 pipe simulation checks passed."
} finally {
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    }
}

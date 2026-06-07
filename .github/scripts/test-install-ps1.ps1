#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Installer = Join-Path $Root "public/install.ps1"

$env:CI = "1"
$env:XOPC_NO_PROMPT = "1"
$env:XOPC_NO_REGISTRY_AUTODETECT = "1"

function Invoke-Installer {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )
    & powershell -NoProfile -ExecutionPolicy Bypass -File $Installer @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "install.ps1 failed (exit $LASTEXITCODE): $($Arguments -join ' ')"
    }
}

Write-Host "==> install.ps1 -DryRun npm"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod npm 2>&1 | Out-String
if ($out -notmatch "Install plan") { throw "Expected Install plan in output" }
if ($out -notmatch "npm") { throw "Expected npm method in output" }

Write-Host "==> install.ps1 -DryRun git"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod git 2>&1 | Out-String
if ($out -notmatch "Install plan") { throw "Expected Install plan in git dry-run" }
if ($out -notmatch "git") { throw "Expected git method in output" }

Write-Host "==> install.ps1 -DryRun -Cn"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod npm -Cn 2>&1 | Out-String
if ($out -notmatch "registry.npmmirror.com") { throw "Expected npmmirror registry in -Cn output" }

Write-Host "==> install.ps1 -DryRun -Version latest"
Invoke-Installer -DryRun -NoPrompt -InstallMethod npm -Version latest | Out-Null

Write-Host "==> install.ps1 invalid -InstallMethod"
& powershell -NoProfile -ExecutionPolicy Bypass -File $Installer -DryRun -NoPrompt -InstallMethod bad 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    throw "Expected install.ps1 to fail for invalid -InstallMethod"
}

Write-Host "All install.ps1 behavioral checks passed."

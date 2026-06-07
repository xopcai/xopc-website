#Requires -Version 5.1

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
    $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $Installer @Arguments 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        Write-Error "install.ps1 failed (exit $exitCode): $($Arguments -join ' ')`nOutput: $output"
        exit 1
    }
    return $output
}

function Test-InstallerOutput {
    param(
        [string]$Output,
        [string]$Pattern,
        [string]$Description
    )
    if ($Output -notmatch $Pattern) {
        Write-Error "$Description`nOutput: $Output"
        exit 1
    }
}

Write-Host "==> install.ps1 -DryRun npm"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod npm
Test-InstallerOutput -Output $out -Pattern "Install plan" -Description "Expected Install plan in output"
Test-InstallerOutput -Output $out -Pattern "npm" -Description "Expected npm method in output"

Write-Host "==> install.ps1 -DryRun git"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod git
Test-InstallerOutput -Output $out -Pattern "Install plan" -Description "Expected Install plan in git dry-run"
Test-InstallerOutput -Output $out -Pattern "git" -Description "Expected git method in output"

Write-Host "==> install.ps1 -DryRun -Cn"
$out = Invoke-Installer -DryRun -NoPrompt -InstallMethod npm -Cn
Test-InstallerOutput -Output $out -Pattern "registry.npmmirror.com" -Description "Expected npmmirror registry in -Cn output"

Write-Host "==> install.ps1 -DryRun -Version latest"
Invoke-Installer -DryRun -NoPrompt -InstallMethod npm -Version latest | Out-Null

Write-Host "==> install.ps1 invalid -InstallMethod"
$null = & powershell -NoProfile -ExecutionPolicy Bypass -File $Installer -DryRun -NoPrompt -InstallMethod bad 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    Write-Error "Expected install.ps1 to fail for invalid -InstallMethod"
    exit 1
}

Write-Host "All install.ps1 behavioral checks passed."
exit 0

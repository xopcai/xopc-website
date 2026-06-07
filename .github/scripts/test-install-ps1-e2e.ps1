#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Installer = Join-Path $Root "public/install.ps1"
$PackageName = "@xopcai/xopc"
$BinName = "xopc"

$env:CI = "1"
$env:XOPC_NO_PROMPT = "1"
$env:XOPC_NO_REGISTRY_AUTODETECT = "1"

function Reset-XopcInstall {
    try {
        & npm uninstall -g $PackageName 2>$null | Out-Null
    } catch { }

    $gitWrapper = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin\$BinName.cmd"
    if (Test-Path $gitWrapper) {
        Remove-Item -Force $gitWrapper
    }
}

function Update-SessionPath {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Get-XopcExecutable {
    foreach ($candidate in @("$BinName.cmd", "$BinName.exe", $BinName)) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command -and $command.Source) { return $command.Source }
    }

    $localWrapper = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin\$BinName.cmd"
    if (Test-Path $localWrapper) { return $localWrapper }

    $npmPrefix = $null
    try {
        $npmPrefix = (& npm config get prefix 2>$null).Trim()
    } catch { $npmPrefix = $null }

    if ($npmPrefix -and $npmPrefix -notin @("null", "undefined", "")) {
        foreach ($dir in @($npmPrefix, (Join-Path $npmPrefix "bin"), (Join-Path $env:APPDATA "npm"))) {
            $cmdPath = Join-Path $dir "$BinName.cmd"
            if (Test-Path $cmdPath) { return $cmdPath }
        }
    }

    return $null
}

function Invoke-E2EInstall {
    & $Installer -InstallMethod npm -NoPrompt -Verify -NoOnboard
    if ($LASTEXITCODE -ne 0) {
        throw "install.ps1 failed with exit code $LASTEXITCODE"
    }
}

$maxAttempts = 2
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Write-Host "==> E2E attempt $attempt/$maxAttempts"
    Reset-XopcInstall

    try {
        Invoke-E2EInstall
        Update-SessionPath

        $xopcPath = Get-XopcExecutable
        if (-not $xopcPath) {
            throw "Installer succeeded but xopc command was not found on PATH."
        }

        Write-Host "==> Post-install smoke ($xopcPath)"
        $version = (& $xopcPath --version 2>$null)
        if ([string]::IsNullOrWhiteSpace($version)) {
            throw "xopc --version returned empty output."
        }
        Write-Host "Version: $($version.Trim())"
        & $xopcPath --help 2>$null | Select-Object -First 5 | ForEach-Object { Write-Host $_ }

        Write-Host "E2E npm install (install.ps1) passed."
        exit 0
    } catch {
        Write-Warning "install.ps1 E2E attempt $attempt failed: $($_.Exception.Message)"
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 5
        }
    }
}

throw "E2E npm install (install.ps1) failed after $maxAttempts attempts."

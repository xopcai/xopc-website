# xopc Installer for Windows
# Usage: powershell -c "irm https://xopc.ai/install.ps1 | iex"
#        powershell -c "& ([scriptblock]::Create((irm https://xopc.ai/install.ps1))) -Version beta -InstallMethod git -DryRun"

param(
    [string]$Version = "latest",
    [ValidateSet("npm", "git")]
    [string]$InstallMethod = "npm",
    [string]$GitDir,
    [string]$Registry,
    [switch]$Beta,
    [switch]$Cn,
    [switch]$NoGitUpdate,
    [switch]$NoOnboard,
    [switch]$NoPrompt,
    [switch]$Verify,
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

$script:InstallExitCode = 0
$script:PackageName = "@xopcai/xopc"
$script:BinName = "xopc"
$script:RepoUrl = "https://github.com/xopcai/xopc.git"
$script:RepoSlug = "xopcai/xopc"
$script:SiteUrl = "https://xopc.ai"
$script:NodeMinMajor = 22
$script:NodeMinMinor = 0
$script:NodeDefaultMajor = 22
$script:NpmRegistry = ""
$script:RegistrySource = "default"
$script:LastNpmInstallCommand = ""

$Taglines = @(
    "Your terminal just grew smarter — type something and let xopc handle the rest."
    "One CLI to run them all. Gateway online."
    "Personal OPC workstation: CLI, gateway, multi-channel. You're welcome."
    "Automation with taste: minimal fuss, maximal output."
    "If it's repetitive, xopc automates it. If it's hard, xopc brings a rollback plan."
)
$DefaultTagline = "Personal OPC workstation that grows with you."

if (-not $PSBoundParameters.ContainsKey("InstallMethod") -and $env:XOPC_INSTALL_METHOD) {
    $InstallMethod = $env:XOPC_INSTALL_METHOD
}
if (-not $PSBoundParameters.ContainsKey("Version") -and $env:XOPC_VERSION) {
    $Version = $env:XOPC_VERSION
}
if (-not $PSBoundParameters.ContainsKey("Beta") -and $env:XOPC_BETA -eq "1") {
    $Beta = $true
}
if (-not $PSBoundParameters.ContainsKey("GitDir") -and $env:XOPC_GIT_DIR) {
    $GitDir = $env:XOPC_GIT_DIR
}
if (-not $PSBoundParameters.ContainsKey("NoGitUpdate") -and $env:XOPC_GIT_UPDATE -eq "0") {
    $NoGitUpdate = $true
}
if (-not $PSBoundParameters.ContainsKey("Registry") -and $env:XOPC_NPM_REGISTRY) {
    $Registry = $env:XOPC_NPM_REGISTRY
}
if (-not $PSBoundParameters.ContainsKey("Cn") -and $env:XOPC_USE_CN -eq "1") {
    $Cn = $true
}
if (-not $PSBoundParameters.ContainsKey("NoOnboard") -and $env:XOPC_NO_ONBOARD -eq "1") {
    $NoOnboard = $true
}
if (-not $PSBoundParameters.ContainsKey("NoPrompt") -and $env:XOPC_NO_PROMPT -eq "1") {
    $NoPrompt = $true
}
if (-not $PSBoundParameters.ContainsKey("Verify") -and $env:XOPC_VERIFY_INSTALL -eq "1") {
    $Verify = $true
}
if (-not $PSBoundParameters.ContainsKey("DryRun") -and $env:XOPC_DRY_RUN -eq "1") {
    $DryRun = $true
}
if (-not $PSBoundParameters.ContainsKey("Verbose") -and $env:XOPC_VERBOSE -eq "1") {
    $Verbose = $true
}
if ([string]::IsNullOrWhiteSpace($GitDir)) {
    $GitDir = Join-Path ([Environment]::GetFolderPath("UserProfile")) "xopc"
}

function Get-RandomTagline {
    if ($Taglines.Count -eq 0) { return $DefaultTagline }
    return $Taglines[(Get-Random -Maximum $Taglines.Count)]
}

function Fail-Install {
    param([int]$Code = 1)
    $script:InstallExitCode = $Code
    return $false
}

function Test-BooleanSuccessResult {
    param([object[]]$Results)
    return ($Results.Count -gt 0 -and $Results[-1] -eq $true)
}

function Complete-Install {
    param([bool]$Succeeded)
    if ($Succeeded) { return }
    if ($PSCommandPath) {
        exit $script:InstallExitCode
    }
    throw "xopc installation failed with exit code $($script:InstallExitCode)."
}

function Write-Info { param([string]$Message) Write-Host "  $Message" -ForegroundColor DarkGray }
function Write-Step { param([string]$Message) Write-Host "[*] $Message" -ForegroundColor Yellow }
function Write-Ok { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-WarnMsg { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor Yellow }
function Write-ErrMsg { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor Red }

function Add-ToProcessPath {
    param([Parameter(Mandatory = $true)][string]$PathEntry)
    if ([string]::IsNullOrWhiteSpace($PathEntry)) { return }
    $currentEntries = @($env:Path -split ";" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($currentEntries | Where-Object { $_ -ieq $PathEntry }) { return }
    $env:Path = "$PathEntry;$env:Path"
}

function Add-ToUserPath {
    param([Parameter(Mandatory = $true)][string]$PathEntry)
    if ([string]::IsNullOrWhiteSpace($PathEntry)) { return $false }
    Add-ToProcessPath $PathEntry
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $userEntries = @($userPath -split ";" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($userEntries | Where-Object { $_ -ieq $PathEntry }) { return $false }
    $newUserPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $PathEntry } else { "$userPath;$PathEntry" }
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
    return $true
}

function Get-XopcDepsRoot {
    $localAppData = $env:LOCALAPPDATA
    if ([string]::IsNullOrWhiteSpace($localAppData)) {
        $localAppData = [Environment]::GetFolderPath("LocalApplicationData")
    }
    if ([string]::IsNullOrWhiteSpace($localAppData)) {
        $localAppData = Join-Path ([Environment]::GetFolderPath("UserProfile")) "AppData\Local"
    }
    return (Join-Path $localAppData "Xopc\deps")
}

function Get-WindowsNodeArchitecture {
    foreach ($architecture in @($env:PROCESSOR_ARCHITEW6432, $env:PROCESSOR_ARCHITECTURE)) {
        if ($architecture -match "ARM64") { return "arm64" }
    }
    return "x64"
}

function Check-Node {
    try {
        $nodeVersion = (node -v 2>$null)
        if (-not $nodeVersion) { return $false }
        $versionMatch = [regex]::Match($nodeVersion, '^v(?<major>\d+)\.(?<minor>\d+)\.')
        $major = if ($versionMatch.Success) { [int]$versionMatch.Groups["major"].Value } else { 0 }
        $minor = if ($versionMatch.Success) { [int]$versionMatch.Groups["minor"].Value } else { 0 }
        if (($major -gt $script:NodeMinMajor) -or (($major -eq $script:NodeMinMajor) -and ($minor -ge $script:NodeMinMinor))) {
            Write-Ok "Node.js $nodeVersion found"
            return $true
        }
        Write-WarnMsg "Node.js $nodeVersion found, but v$($script:NodeMinMajor).$($script:NodeMinMinor)+ required"
        return $false
    } catch {
        Write-WarnMsg "Node.js not found"
        return $false
    }
}

function Get-PortableNodeRoot { return (Join-Path (Get-XopcDepsRoot) "portable-node") }

function Get-PortableNodeCommandPath {
    $candidate = Join-Path (Get-PortableNodeRoot) "node.exe"
    if (Test-Path $candidate) { return $candidate }
    return $null
}

function Use-PortableNodeIfPresent {
    $nodeExe = Get-PortableNodeCommandPath
    if (-not $nodeExe) { return $false }
    Add-ToProcessPath (Split-Path -Parent $nodeExe)
    return (Check-Node)
}

function Ensure-PortableNodeOnUserPath {
    $nodeExe = Get-PortableNodeCommandPath
    if (-not $nodeExe) { return }
    $nodeDir = Split-Path -Parent $nodeExe
    if (Add-ToUserPath $nodeDir) {
        Write-WarnMsg "Added $nodeDir to user PATH (restart terminal if node or xopc is not found)"
    }
}

function Resolve-PortableNodeDownload {
    $architecture = Get-WindowsNodeArchitecture
    $index = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json"
    $release = $index |
        Where-Object { $_.version -match "^v$($script:NodeDefaultMajor)\." } |
        Select-Object -First 1
    if (-not $release -or -not $release.version) {
        throw "Could not resolve latest Node.js $($script:NodeDefaultMajor).x release metadata."
    }
    $fileKey = "win-$architecture-zip"
    if ($release.files -and -not ($release.files -contains $fileKey)) {
        throw "Node.js $($release.version) does not publish $fileKey."
    }
    $name = "node-$($release.version)-win-$architecture.zip"
    return @{
        Version = $release.version
        Name = $name
        Url = "https://nodejs.org/dist/$($release.version)/$name"
    }
}

function Expand-PortableNodeArchive {
    param(
        [Parameter(Mandatory = $true)][string]$ZipPath,
        [Parameter(Mandatory = $true)][string]$DestinationPath
    )
    $tarCommand = Get-Command tar -ErrorAction SilentlyContinue
    if ($tarCommand -and $tarCommand.Source) {
        New-Item -ItemType Directory -Force -Path $DestinationPath | Out-Null
        & $tarCommand.Source -xf $ZipPath -C $DestinationPath --strip-components 1
        if ($LASTEXITCODE -eq 0) { return }
        if (Test-Path $DestinationPath) { Remove-Item -Recurse -Force $DestinationPath }
        Write-WarnMsg "tar extraction failed; trying .NET zip extraction."
    }
    $fallbackExtract = Join-Path (Split-Path -Parent $DestinationPath) ("portable-node-extract-" + [guid]::NewGuid().ToString("N"))
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $fallbackExtract)
        $nodeDir = Get-ChildItem -Path $fallbackExtract -Directory |
            Where-Object { Test-Path (Join-Path $_.FullName "node.exe") } |
            Select-Object -First 1
        if (-not $nodeDir) { throw "Node.js archive did not contain node.exe." }
        Copy-Item -LiteralPath $nodeDir.FullName -Destination $DestinationPath -Recurse -Force
    } finally {
        if (Test-Path $fallbackExtract) { Remove-Item -Recurse -Force $fallbackExtract }
    }
}

function Install-PortableNode {
    if (Use-PortableNodeIfPresent) {
        Ensure-PortableNodeOnUserPath
        $nodeVersion = (& node -v 2>$null)
        if ($nodeVersion) { Write-Ok "User-local Node.js already available: $nodeVersion" }
        return
    }
    Write-Host "  No package manager found; bootstrapping user-local portable Node.js..." -ForegroundColor DarkGray
    $download = Resolve-PortableNodeDownload
    $portableRoot = Get-PortableNodeRoot
    $portableParent = Split-Path -Parent $portableRoot
    $tmpZip = Join-Path $env:TEMP $download.Name
    New-Item -ItemType Directory -Force -Path $portableParent | Out-Null
    if (Test-Path $portableRoot) { Remove-Item -Recurse -Force $portableRoot }
    try {
        Write-Info "Downloading Node.js $($download.Version)..."
        Invoke-WebRequest -UseBasicParsing -Uri $download.Url -OutFile $tmpZip
        Expand-PortableNodeArchive -ZipPath $tmpZip -DestinationPath $portableRoot
    } finally {
        if (Test-Path $tmpZip) { Remove-Item -Force $tmpZip }
    }
    if (-not (Use-PortableNodeIfPresent)) {
        throw "Portable Node.js bootstrap completed, but node is still unavailable."
    }
    Ensure-PortableNodeOnUserPath
    Write-Ok "User-local Node.js ready: $(& node -v 2>$null)"
}

function Install-Node {
    Write-Step "Installing Node.js..."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Info "Using winget..."
        winget install OpenJS.NodeJS.LTS --source winget --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        if (Check-Node) {
            Write-Ok "Node.js installed via winget"
            return $true
        }
        Write-WarnMsg "winget completed, but Node.js is still unavailable in this shell"
        Write-Host "Restart PowerShell and re-run the installer if Node.js was installed successfully." -ForegroundColor Yellow
        return $false
    }
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Info "Using Chocolatey..."
        choco install nodejs-lts -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Ok "Node.js installed via Chocolatey"
        return $true
    }
    if (Get-Command scoop -ErrorAction SilentlyContinue) {
        Write-Info "Using Scoop..."
        scoop install nodejs-lts
        Write-Ok "Node.js installed via Scoop"
        return $true
    }
    try {
        Install-PortableNode
        if (Check-Node) { return $true }
    } catch {
        Write-WarnMsg "Portable Node.js bootstrap failed: $($_.Exception.Message)"
    }
    Write-Host ""
    Write-Host "Error: Could not install Node.js automatically." -ForegroundColor Red
    Write-Host "Please install Node.js $($script:NodeMinMajor)+ manually:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/en/download/" -ForegroundColor Cyan
    return $false
}

function Get-PortableGitRoot { return (Join-Path (Get-XopcDepsRoot) "portable-git") }

function Get-PortableGitCommandPath {
    $root = Get-PortableGitRoot
    foreach ($candidate in @(
        (Join-Path $root "mingw64\bin\git.exe"),
        (Join-Path $root "cmd\git.exe"),
        (Join-Path $root "bin\git.exe"),
        (Join-Path $root "git.exe")
    )) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Get-PortableGitPathEntries {
    $gitExe = Get-PortableGitCommandPath
    if (-not $gitExe) { return @() }
    $portableRoot = Get-PortableGitRoot
    return @(
        (Join-Path $portableRoot "mingw64\bin"),
        (Join-Path $portableRoot "usr\bin"),
        (Split-Path -Parent $gitExe)
    ) | Where-Object { Test-Path $_ } | Select-Object -Unique
}

function Use-PortableGitIfPresent {
    $gitExe = Get-PortableGitCommandPath
    if (-not $gitExe) { return $false }
    foreach ($pathEntry in (Get-PortableGitPathEntries)) { Add-ToProcessPath $pathEntry }
    return (Check-Git)
}

function Ensure-PortableGitOnUserPath {
    $added = @()
    foreach ($pathEntry in (Get-PortableGitPathEntries)) {
        if (Add-ToUserPath $pathEntry) { $added += $pathEntry }
    }
    if ($added.Count -gt 0) {
        Write-WarnMsg "Added user-local Git to user PATH (restart terminal if git is not found)"
    }
}

function Resolve-PortableGitDownload {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/git-for-windows/git/releases/latest" -Headers @{
        "User-Agent" = "xopc-installer"
        "Accept" = "application/vnd.github+json"
    }
    if (-not $release -or -not $release.assets) {
        throw "Could not resolve latest git-for-windows release metadata."
    }
    $asset = $release.assets |
        Where-Object { $_.name -match '^MinGit-.*-64-bit\.zip$' -and $_.name -notmatch 'busybox' } |
        Select-Object -First 1
    if (-not $asset) { throw "Could not find a MinGit zip asset in the latest git-for-windows release." }
    return @{ Tag = $release.tag_name; Name = $asset.name; Url = $asset.browser_download_url }
}

function Install-PortableGit {
    if (Use-PortableGitIfPresent) {
        Ensure-PortableGitOnUserPath
        $v = (& git --version 2>$null)
        if ($v) { Write-Ok "User-local Git already available: $v" }
        return
    }
    Write-Step "Git not found; bootstrapping user-local portable Git..."
    $download = Resolve-PortableGitDownload
    $portableRoot = Get-PortableGitRoot
    $portableParent = Split-Path -Parent $portableRoot
    $tmpZip = Join-Path $env:TEMP $download.Name
    $tmpExtract = Join-Path $env:TEMP ("xopc-portable-git-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $portableParent | Out-Null
    if (Test-Path $portableRoot) { Remove-Item -Recurse -Force $portableRoot }
    if (Test-Path $tmpExtract) { Remove-Item -Recurse -Force $tmpExtract }
    New-Item -ItemType Directory -Force -Path $tmpExtract | Out-Null
    try {
        Write-Info "Downloading $($download.Tag)..."
        Invoke-WebRequest -UseBasicParsing -Uri $download.Url -OutFile $tmpZip
        Expand-Archive -Path $tmpZip -DestinationPath $tmpExtract -Force
        Move-Item -Path (Join-Path $tmpExtract "*") -Destination $portableRoot -Force
    } finally {
        if (Test-Path $tmpZip) { Remove-Item -Force $tmpZip }
        if (Test-Path $tmpExtract) { Remove-Item -Recurse -Force $tmpExtract }
    }
    if (-not (Use-PortableGitIfPresent)) { throw "Portable Git bootstrap completed, but git is still unavailable." }
    Ensure-PortableGitOnUserPath
    Write-Ok "User-local Git ready: $(& git --version 2>$null)"
}

function Check-Git {
    try {
        $null = Get-Command git -ErrorAction Stop
        return $true
    } catch { return $false }
}

function Ensure-Git {
    if (Check-Git) { return $true }
    if (Use-PortableGitIfPresent) {
        Ensure-PortableGitOnUserPath
        return $true
    }
    try {
        Install-PortableGit
        if (Check-Git) { return $true }
    } catch {
        Write-WarnMsg "Portable Git bootstrap failed: $($_.Exception.Message)"
    }
    Write-Host ""
    Write-Host "Error: Git is required for this install method." -ForegroundColor Red
    Write-Host "Install Git for Windows manually, then re-run:" -ForegroundColor Yellow
    Write-Host "  https://git-scm.com/download/win" -ForegroundColor Cyan
    return $false
}

function Resolve-CommandPath {
    param([Parameter(Mandatory = $true)][string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command -and $command.Source) { return $command.Source }
    }
    return $null
}

function Get-NpmCommandPath {
    $path = Resolve-CommandPath -Candidates @("npm.cmd", "npm.exe", "npm")
    if (-not $path) { throw "npm not found on PATH." }
    return $path
}

function Get-CorepackCommandPath {
    return (Resolve-CommandPath -Candidates @("corepack.cmd", "corepack.exe", "corepack"))
}

function Get-PnpmCommandPath {
    return (Resolve-CommandPath -Candidates @("pnpm.cmd", "pnpm.exe", "pnpm"))
}

function Get-WindowsCommandSafeDirectory {
    $userHome = [Environment]::GetFolderPath("UserProfile")
    if (-not [string]::IsNullOrWhiteSpace($userHome) -and (Test-Path $userHome)) { return $userHome }
    if (-not [string]::IsNullOrWhiteSpace($env:TEMP) -and (Test-Path $env:TEMP)) { return $env:TEMP }
    return $null
}

function Invoke-CommandFromWindowsSafeDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$CommandPath,
        [string[]]$Arguments = @()
    )
    $safeDir = Get-WindowsCommandSafeDirectory
    $pushedLocation = $false
    try {
        if (-not [string]::IsNullOrWhiteSpace($safeDir)) {
            Push-Location -LiteralPath $safeDir
            $pushedLocation = $true
        }
        & $CommandPath @Arguments
    } finally {
        if ($pushedLocation) { Pop-Location }
    }
}

function Invoke-NpmCommand {
    param([string[]]$Arguments = @())
    Invoke-CommandFromWindowsSafeDirectory -CommandPath (Get-NpmCommandPath) -Arguments $Arguments
}

function Invoke-CorepackCommand {
    param([string[]]$Arguments = @())
    $corepackCommand = Get-CorepackCommandPath
    if (-not $corepackCommand) { throw "corepack not found on PATH." }
    Invoke-CommandFromWindowsSafeDirectory -CommandPath $corepackCommand -Arguments $Arguments
}

function Get-NpmGlobalBinCandidates {
    param([string]$NpmPrefix)
    $candidates = @()
    if (-not [string]::IsNullOrWhiteSpace($NpmPrefix)) {
        $candidates += $NpmPrefix
        $candidates += (Join-Path $NpmPrefix "bin")
    }
    if (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
        $candidates += (Join-Path $env:APPDATA "npm")
    }
    return $candidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
}

function Get-XopcCommandPath {
    $cmd = Resolve-CommandPath -Candidates @("$($script:BinName).cmd", "$($script:BinName).exe", $script:BinName)
    if ($cmd) { return $cmd }
    $localBin = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin\$($script:BinName).cmd"
    if (Test-Path $localBin) { return $localBin }
    return $null
}

function Invoke-XopcCommand {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    $commandPath = Get-XopcCommandPath
    if (-not $commandPath) { throw "xopc command not found on PATH." }
    & $commandPath @Arguments
}

function Ensure-XopcOnPath {
    if (Get-XopcCommandPath) { return $true }
    $npmPrefix = $null
    try {
        $npmPrefix = (Invoke-NpmCommand -Arguments @("config", "get", "prefix") 2>$null).Trim()
    } catch { $npmPrefix = $null }
    foreach ($npmBin in (Get-NpmGlobalBinCandidates -NpmPrefix $npmPrefix)) {
        if (-not (Test-Path (Join-Path $npmBin "$($script:BinName).cmd"))) { continue }
        if (Add-ToUserPath $npmBin) {
            Write-WarnMsg "Added $npmBin to user PATH (restart terminal if command not found)"
        }
        return $true
    }
    $wrapper = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin\$($script:BinName).cmd"
    if (Test-Path $wrapper) {
        $wrapperDir = Split-Path -Parent $wrapper
        if (Add-ToUserPath $wrapperDir) {
            Write-WarnMsg "Added $wrapperDir to user PATH (restart terminal if command not found)"
        }
        return $true
    }
    Write-WarnMsg "xopc is not on PATH yet. Restart PowerShell or add the npm global bin folder to PATH."
    return $false
}

function Detect-NpmRegistry {
    if (-not [string]::IsNullOrWhiteSpace($Registry)) {
        $script:NpmRegistry = $Registry.Trim().TrimEnd("/")
        $script:RegistrySource = "explicit"
        return
    }
    if ($Cn) {
        $script:NpmRegistry = "https://registry.npmmirror.com"
        $script:RegistrySource = "explicit-cn"
        return
    }
    if ($env:XOPC_NO_REGISTRY_AUTODETECT -eq "1") {
        $script:NpmRegistry = "https://registry.npmjs.org"
        $script:RegistrySource = "default"
        return
    }
    try {
        $userRegistry = (Invoke-NpmCommand -Arguments @("config", "get", "registry") 2>$null).Trim().TrimEnd("/")
        if (
            $userRegistry -and
            $userRegistry -ne "null" -and
            $userRegistry -ne "undefined" -and
            $userRegistry -ne "https://registry.npmjs.org"
        ) {
            $script:NpmRegistry = $userRegistry
            $script:RegistrySource = "user-npmrc"
            return
        }
    } catch { }
    $culture = [System.Globalization.CultureInfo]::CurrentUICulture.Name
    if ($culture -notmatch '^zh') {
        $script:NpmRegistry = "https://registry.npmjs.org"
        $script:RegistrySource = "default"
        return
    }
    try {
        $npmjsTime = (Measure-Command {
            Invoke-WebRequest -UseBasicParsing -Uri "https://registry.npmjs.org/-/ping" -TimeoutSec 2 | Out-Null
        }).TotalSeconds
        $mirrorTime = (Measure-Command {
            Invoke-WebRequest -UseBasicParsing -Uri "https://registry.npmmirror.com/-/ping" -TimeoutSec 2 | Out-Null
        }).TotalSeconds
        if ($npmjsTime -ge ($mirrorTime * 2)) {
            $script:NpmRegistry = "https://registry.npmmirror.com"
            $script:RegistrySource = "auto-mirror"
            Write-Info "Auto-detected slow link to npmjs — using https://registry.npmmirror.com"
            return
        }
    } catch {
        $script:NpmRegistry = "https://registry.npmmirror.com"
        $script:RegistrySource = "auto-mirror"
        Write-Info "Using npm mirror for zh locale"
        return
    }
    $script:NpmRegistry = "https://registry.npmjs.org"
    $script:RegistrySource = "default"
}

function Resolve-NpmConfigPath {
    param([string]$RawPath)
    if ([string]::IsNullOrWhiteSpace($RawPath) -or $RawPath -eq "null" -or $RawPath -eq "undefined") { return $null }
    if (($RawPath.StartsWith("~/") -or $RawPath.StartsWith("~\")) -and $HOME) {
        return (Join-Path $HOME $RawPath.Substring(2))
    }
    return $RawPath
}

function Test-NpmConfigFileKey {
    param([string]$Path, [string]$Key)
    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $escapedKey = [regex]::Escape($Key)
    return [bool](Select-String -LiteralPath $Path -Pattern "^\s*$escapedKey\s*=" -Quiet)
}

function Test-NpmConfigRawKey {
    param([string]$Key)
    $files = New-Object System.Collections.Generic.List[string]
    $userConfig = if ($env:NPM_CONFIG_USERCONFIG) { $env:NPM_CONFIG_USERCONFIG } else { $env:npm_config_userconfig }
    if ($userConfig) {
        $resolved = Resolve-NpmConfigPath $userConfig
        if ($resolved) { $files.Add($resolved) }
    } elseif ($HOME) {
        $files.Add((Join-Path $HOME ".npmrc"))
    }
    foreach ($file in ($files | Select-Object -Unique)) {
        if (Test-NpmConfigFileKey -Path $file -Key $Key) { return $true }
    }
    return $false
}

function Get-NpmFreshnessArgs {
    $freshnessArgs = @("--min-release-age=0")
    $minReleaseAge = (Invoke-NpmCommand -Arguments @("config", "get", "min-release-age", "--global") 2>$null)
    if (Test-NpmConfigRawKey -Key "min-release-age") {
        return $freshnessArgs
    }
    if ($LASTEXITCODE -ne 0 -or -not $minReleaseAge -or $minReleaseAge.Trim() -in @("null", "undefined", "")) {
        $beforeValue = (Invoke-NpmCommand -Arguments @("config", "get", "before", "--global") 2>$null)
        if ($LASTEXITCODE -eq 0 -and $beforeValue -and $beforeValue.Trim() -notin @("null", "undefined", "")) {
            return @("--before=$((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))")
        }
    }
    return $freshnessArgs
}

function Resolve-NpmXopcInstallSpec {
    param([string]$RequestedVersion)
    if ($Beta) { return "$($script:PackageName)@beta" }
    if ([string]::IsNullOrWhiteSpace($RequestedVersion) -or $RequestedVersion -eq "latest") {
        return "$($script:PackageName)@latest"
    }
    $trimmed = $RequestedVersion.Trim()
    if (
        $trimmed -match '^(https?|file):' -or
        $trimmed -match '^(git\+|github:)' -or
        $trimmed -match '^[A-Za-z]:[\\/]' -or
        $trimmed -match '^\\\\' -or
        $trimmed -match '^\.\.?[\\/]' -or
        $trimmed -match '\.tgz($|[?#])' -or
        $trimmed -match '/'
    ) {
        return $trimmed
    }
    return "$($script:PackageName)@$trimmed"
}

function Test-XopcSourcePackageInstallSpec {
    param([string]$RequestedVersion)
    if ([string]::IsNullOrWhiteSpace($RequestedVersion)) { return $false }
    $normalized = $RequestedVersion.Trim().ToLowerInvariant()
    if ($normalized.StartsWith("@xopcai/xopc@")) { return $true }
    if ($normalized -eq "@xopcai/xopc") { return $true }
    if ($normalized -match '^github:xopcai/xopc($|[#/])') { return $true }
    if ($normalized.StartsWith("git+")) { $normalized = $normalized.Substring(4) }
    return (
        $normalized -match '^https?://github\.com/xopcai/xopc(\.git)?($|[?#])' -or
        $normalized -match '^git@github\.com:xopcai/xopc(\.git)?($|[?#])'
    )
}

function Invoke-NpmGlobalInstall {
    param(
        [string]$InstallSpec,
        [string[]]$ExtraArgs = @()
    )
    $freshnessArgs = Get-NpmFreshnessArgs
    $registryArgs = @()
    if ($script:NpmRegistry -and $script:NpmRegistry -ne "https://registry.npmjs.org") {
        $registryArgs = @("--registry", $script:NpmRegistry)
    }
    $logLevel = if ($Verbose) { "verbose" } else { "warn" }
    $args = @("install", "-g", "--loglevel", $logLevel, "--no-fund", "--no-audit") + $freshnessArgs + $registryArgs + $ExtraArgs + @($InstallSpec)
    $script:LastNpmInstallCommand = "npm $($args -join ' ')"
    $prevScriptShell = $env:NPM_CONFIG_SCRIPT_SHELL
    $env:NPM_CONFIG_SCRIPT_SHELL = "cmd.exe"
    try {
        Invoke-NpmCommand -Arguments $args
        return ($LASTEXITCODE -eq 0)
    } finally {
        $env:NPM_CONFIG_SCRIPT_SHELL = $prevScriptShell
    }
}

function Install-XopcNpm {
    $installSpec = Resolve-NpmXopcInstallSpec -RequestedVersion $Version
    if (
        $InstallMethod -eq "npm" -and
        -not $Beta -and
        $Version -match '^(main|beta)$' -and
        -not (Test-XopcSourcePackageInstallSpec -RequestedVersion $Version)
    ) {
        Write-ErrMsg "Version '$Version' is a git branch tag. Use -InstallMethod git or install a published npm version."
        return $false
    }
    if (-not (Ensure-Git)) { return $false }
    Write-Step "Installing xopc ($installSpec)..."
    if (Invoke-NpmGlobalInstall -InstallSpec $installSpec) {
        Write-Ok "xopc installed via npm"
        return $true
    }
    if ($script:RegistrySource -in @("auto-mirror", "explicit-cn")) {
        Write-WarnMsg "Mirror install failed; retrying with registry.npmjs.org"
        $prevRegistry = $script:NpmRegistry
        $script:NpmRegistry = "https://registry.npmjs.org"
        if (Invoke-NpmGlobalInstall -InstallSpec $installSpec) {
            Write-Ok "xopc installed via npm (registry.npmjs.org)"
            return $true
        }
        $script:NpmRegistry = $prevRegistry
    }
    Write-ErrMsg "npm install failed for $installSpec"
    if ($script:LastNpmInstallCommand) { Write-Host "  Command: $($script:LastNpmInstallCommand)" -ForegroundColor Gray }
    return $false
}

function Get-RepoPnpmVersion {
    param([string]$RepoDir)
    $packageJsonPath = Join-Path $RepoDir "package.json"
    if (-not (Test-Path $packageJsonPath)) { return $null }
    try {
        $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
        if ($packageJson.packageManager -match '^pnpm@(?<version>[^+]+)') {
            return $Matches["version"]
        }
    } catch { }
    return $null
}

function Test-PnpmCommandMatchesVersion {
    param([string]$PnpmVersion, [string]$RepoDir)
    $pnpmCommand = Get-PnpmCommandPath
    if (-not $pnpmCommand) { return $false }
    if ([string]::IsNullOrWhiteSpace($PnpmVersion)) { return $true }
    $pushed = $false
    try {
        if ($RepoDir -and (Test-Path $RepoDir)) {
            Push-Location -LiteralPath $RepoDir
            $pushed = $true
        }
        $currentVersion = (& $pnpmCommand --version 2>$null)
        return ($LASTEXITCODE -eq 0 -and $currentVersion -and $currentVersion.Trim() -eq $PnpmVersion)
    } catch { return $false }
    finally { if ($pushed) { Pop-Location } }
}

function Ensure-Pnpm {
    param([string]$RepoDir)
    $pnpmVersion = Get-RepoPnpmVersion -RepoDir $RepoDir
    $pnpmSpec = if ([string]::IsNullOrWhiteSpace($pnpmVersion)) { "pnpm@latest" } else { "pnpm@$pnpmVersion" }
    if (Test-PnpmCommandMatchesVersion -PnpmVersion $pnpmVersion -RepoDir $RepoDir) { return }
    $corepackCommand = Get-CorepackCommandPath
    if ($corepackCommand) {
        try {
            Invoke-CorepackCommand -Arguments @("enable") | Out-Null
            Invoke-CorepackCommand -Arguments @("prepare", $pnpmSpec, "--activate") | Out-Null
            if (Test-PnpmCommandMatchesVersion -PnpmVersion $pnpmVersion -RepoDir $RepoDir) {
                Write-Ok "pnpm installed via corepack ($pnpmSpec)"
                return
            }
        } catch { }
    }
    Write-Step "Installing pnpm..."
    $prevScriptShell = $env:NPM_CONFIG_SCRIPT_SHELL
    $env:NPM_CONFIG_SCRIPT_SHELL = "cmd.exe"
    try {
        Invoke-NpmCommand -Arguments @("install", "-g", $pnpmSpec)
        if ($LASTEXITCODE -ne 0) {
            Invoke-NpmCommand -Arguments @("install", "-g", "--force", $pnpmSpec)
        }
    } finally {
        $env:NPM_CONFIG_SCRIPT_SHELL = $prevScriptShell
    }
    if (-not (Test-PnpmCommandMatchesVersion -PnpmVersion $pnpmVersion -RepoDir $RepoDir)) {
        throw "pnpm install completed, but $pnpmSpec is not available."
    }
    Write-Ok "pnpm installed"
}

function Install-XopcFromGit {
    param([string]$RepoDir, [switch]$SkipUpdate)
    if (-not (Ensure-Git)) { return $false }
    $ref = $Version
    if ([string]::IsNullOrWhiteSpace($ref) -or $ref -eq "latest") { $ref = "main" }
    if ($Beta) { $ref = "beta" }
    Write-Step "Installing xopc from Git ($script:RepoUrl)..."
    if (-not (Test-Path $RepoDir)) {
        git clone --depth 1 --branch $ref $script:RepoUrl $RepoDir
        if ($LASTEXITCODE -ne 0) { return $false }
    } elseif (-not $SkipUpdate) {
        $dirty = $null
        try { $dirty = git -C $RepoDir status --porcelain 2>$null } catch {}
        if (-not $dirty) {
            git -C $RepoDir fetch --all --prune 2>$null
            git -C $RepoDir checkout $ref 2>$null
            if ($LASTEXITCODE -ne 0) { git -C $RepoDir checkout "origin/$ref" 2>$null }
            git -C $RepoDir pull --ff-only 2>$null
        } else {
            Write-WarnMsg "Repo is dirty; skipping git pull"
        }
    } else {
        Write-WarnMsg "Git update disabled; skipping git pull"
    }
    Ensure-Pnpm -RepoDir $RepoDir
    $pnpmCommand = Get-PnpmCommandPath
    if (-not $pnpmCommand) { throw "pnpm not found after installation." }
    $prevScriptShell = $env:NPM_CONFIG_SCRIPT_SHELL
    $env:NPM_CONFIG_SCRIPT_SHELL = "cmd.exe"
    $pushed = $false
    try {
        Push-Location -LiteralPath $RepoDir
        $pushed = $true
        $pnpmArgs = @("install", "--frozen-lockfile")
        if ($script:NpmRegistry -and $script:NpmRegistry -ne "https://registry.npmjs.org") {
            $pnpmArgs += @("--registry", $script:NpmRegistry)
        }
        & $pnpmCommand @pnpmArgs
        if ($LASTEXITCODE -ne 0) {
            if ($script:RegistrySource -in @("auto-mirror", "explicit-cn")) {
                Write-WarnMsg "Mirror install failed; retrying pnpm with registry.npmjs.org"
                & $pnpmCommand install --frozen-lockfile --registry "https://registry.npmjs.org"
            }
            if ($LASTEXITCODE -ne 0) { return $false }
        }
        & $pnpmCommand run build
        if ($LASTEXITCODE -ne 0) { return $false }
    } finally {
        if ($pushed) { Pop-Location }
        $env:NPM_CONFIG_SCRIPT_SHELL = $prevScriptShell
    }
    $entryPath = Join-Path $RepoDir "dist\src\cli\bin.js"
    if (-not (Test-Path $entryPath)) {
        Write-ErrMsg "Build did not produce $entryPath"
        return $false
    }
    $binDir = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin"
    if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Force -Path $binDir | Out-Null }
    $cmdPath = Join-Path $binDir "$($script:BinName).cmd"
    $cmdContents = "@echo off`r`nnode ""$entryPath"" %*`r`n"
    Set-Content -Path $cmdPath -Value $cmdContents -NoNewline -Encoding ASCII
    if (Add-ToUserPath $binDir) {
        Write-WarnMsg "Added $binDir to user PATH (restart terminal if command not found)"
    }
    Write-Ok "xopc wrapper installed to $cmdPath"
    return $true
}

function Test-GatewayServiceLoaded {
    try {
        $statusJson = (Invoke-XopcCommand gateway status --json --no-probe 2>$null)
        if ([string]::IsNullOrWhiteSpace($statusJson)) { return $false }
        $parsed = $statusJson | ConvertFrom-Json
        return ($parsed -and $parsed.service -and $parsed.service.loaded)
    } catch { return $false }
}

function Refresh-GatewayServiceIfLoaded {
    if (-not (Get-XopcCommandPath)) { return }
    if (-not (Test-GatewayServiceLoaded)) { return }
    Write-Step "Refreshing loaded gateway service..."
    try {
        Invoke-XopcCommand gateway service install --force | Out-Null
        Invoke-XopcCommand gateway restart | Out-Null
        Invoke-XopcCommand gateway status --no-probe | Out-Null
        Write-Ok "Gateway service refreshed"
    } catch {
        Write-WarnMsg "Gateway service refresh failed; continuing."
    }
}

function Verify-XopcInstallation {
    $commandPath = Get-XopcCommandPath
    if (-not $commandPath) {
        Write-ErrMsg "xopc binary not found after installation"
        return $false
    }
    Write-Info "Verifying: $commandPath"
    $versionOutput = (Invoke-XopcCommand --version 2>$null)
    if ([string]::IsNullOrWhiteSpace($versionOutput)) {
        Write-ErrMsg "xopc --version returned empty"
        return $false
    }
    Write-Ok "Version: $($versionOutput.Trim())"
    return $true
}

function Show-InstallPlan {
    Write-Host ""
    Write-Host "Install plan" -ForegroundColor Cyan
    Write-Host "  OS:              Windows"
    Write-Host "  Install method:  $InstallMethod"
    Write-Host "  Version:         $Version"
    if ($Beta) { Write-Host "  Beta channel:    enabled" }
    if ($InstallMethod -eq "git") {
        Write-Host "  Git directory:   $GitDir"
        Write-Host "  Git update:      $(if ($NoGitUpdate) { 'disabled' } else { 'enabled' })"
    }
    if ($script:NpmRegistry -and $script:NpmRegistry -ne "https://registry.npmjs.org") {
        Write-Host "  npm registry:    $($script:NpmRegistry) ($($script:RegistrySource))"
    }
    if ($DryRun) { Write-Host "  Dry run:         yes" }
    if ($NoOnboard) { Write-Host "  Onboarding:      skipped" }
    Write-Host ""
}

function Print-FirstRunHint {
    Write-Host ""
    Write-Host "Try one of:" -ForegroundColor Cyan
    Write-Host "  xopc tui --local                  # embedded agent, no gateway"
    Write-Host "  xopc gateway                      # web console + messengers"
    Write-Host "  xopc agent -i                     # classic interactive CLI"
    Write-Host ""
}

function Main {
    Write-Host ""
    Write-Host "  xopc Installer" -ForegroundColor Cyan
    Write-Host "  $(Get-RandomTagline)" -ForegroundColor DarkGray
    Write-Host ""

    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Host "Error: PowerShell 5+ required" -ForegroundColor Red
        return (Fail-Install -Code 2)
    }

    Write-Ok "Windows detected"

    if ($InstallMethod -notin @("npm", "git")) {
        Write-Host "Error: invalid -InstallMethod (use npm or git)." -ForegroundColor Red
        return (Fail-Install -Code 2)
    }

    Detect-NpmRegistry
    Show-InstallPlan

    if ($DryRun) {
        Write-Ok "Dry run complete"
        return $true
    }

    $isUpgrade = [bool](Get-XopcCommandPath)

    if (-not (Check-Node)) {
        if (-not (Install-Node)) { return (Fail-Install) }
        if (-not (Check-Node)) {
            Write-Host ""
            Write-Host "Error: Node.js may require a terminal restart." -ForegroundColor Red
            Write-Host "Close this window, open a new PowerShell, and run the installer again." -ForegroundColor Yellow
            return (Fail-Install)
        }
    }

    if ($InstallMethod -eq "git") {
        try {
            Invoke-NpmCommand -Arguments @("uninstall", "-g", $script:PackageName) 2>$null | Out-Null
        } catch { }
        if (-not (Install-XopcFromGit -RepoDir $GitDir -SkipUpdate:$NoGitUpdate)) {
            return (Fail-Install)
        }
    } else {
        $gitWrapper = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".local\bin\$($script:BinName).cmd"
        if (Test-Path $gitWrapper) {
            Remove-Item -Force $gitWrapper
            Write-Ok "Removed git wrapper (switching to npm)"
        }
        if (-not (Install-XopcNpm)) { return (Fail-Install) }
    }

    if (-not (Ensure-XopcOnPath)) {
        Write-Host "Install completed, but xopc is not on PATH yet." -ForegroundColor Yellow
        Write-Host "Open a new terminal, then run: xopc --version" -ForegroundColor Cyan
        return $true
    }

    Refresh-GatewayServiceIfLoaded

    if ($Verify) {
        if (-not (Verify-XopcInstallation)) { return (Fail-Install) }
    }

    $installedVersion = $null
    try { $installedVersion = (Invoke-XopcCommand --version 2>$null).Trim() } catch { }

    Write-Host ""
    if ($isUpgrade) {
        Write-Host "xopc upgraded successfully$(if ($installedVersion) { " ($installedVersion)" })!" -ForegroundColor Green
        Write-Host "Run 'xopc --version' to verify." -ForegroundColor Gray
    } else {
        Write-Host "xopc installed successfully$(if ($installedVersion) { " ($installedVersion)" })!" -ForegroundColor Green
        Print-FirstRunHint
    }

    if ($InstallMethod -eq "git") {
        Write-Host "Source checkout: $GitDir" -ForegroundColor Cyan
        Write-Host "Wrapper: $([Environment]::GetFolderPath('UserProfile'))\.local\bin\$($script:BinName).cmd" -ForegroundColor Cyan
        Write-Host ""
    }

    if ($NoOnboard) {
        Write-Host "Skipping onboard. Run 'xopc onboard' when ready." -ForegroundColor Gray
    }

    Write-Host "Docs: https://github.com/$($script:RepoSlug)#quick-start" -ForegroundColor DarkGray
    Write-Host ""
    return $true
}

$mainResults = @(Main)
$installSucceeded = Test-BooleanSuccessResult -Results $mainResults
Complete-Install -Succeeded:$installSucceeded

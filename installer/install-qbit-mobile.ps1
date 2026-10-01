param(
  [string]$PackageZip = '',
  [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'qBitMobile'),
  [switch]$EnableAutostart
)

$ErrorActionPreference = 'Stop'

function Resolve-SourceRoot {
  param([string]$PackageZip)

  if ($PackageZip) {
    $zipPath = Resolve-Path -LiteralPath $PackageZip
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("qbit-mobile-install-" + [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    Expand-Archive -LiteralPath $zipPath -DestinationPath $tempRoot -Force
    $candidate = Get-ChildItem -LiteralPath $tempRoot -Directory |
      Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'portable\host.mjs') } |
      Select-Object -First 1
    if (-not $candidate) {
      throw 'The qBit Mobile portable package was not found inside the installer payload.'
    }
    return $candidate.FullName
  }

  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Copy-Tree {
  param([string]$Source, [string]$Destination)

  if (Test-Path -LiteralPath $Destination) {
    Remove-Item -LiteralPath $Destination -Recurse -Force
  }
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

function New-Shortcut {
  param(
    [string]$Path,
    [string]$Target,
    [string]$WorkingDirectory,
    [string]$Arguments = '',
    [string]$Description = 'qBit Mobile'
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $Target
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.Arguments = $Arguments
  $shortcut.Description = $Description
  $shortcut.IconLocation = $Target
  $shortcut.Save()
}

$sourceRoot = Resolve-SourceRoot -PackageZip $PackageZip
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

$items = @(
  'portable',
  'www',
  'installer',
  'config.example.json',
  'start-qbit-mobile.cmd',
  'start-qbit-mobile-hidden.vbs',
  'install-autostart.cmd',
  'remove-autostart.cmd',
  'INSTALL-WINDOWS.md',
  'README.md',
  'LICENSE'
)

foreach ($item in $items) {
  $source = Join-Path $sourceRoot $item
  if (Test-Path -LiteralPath $source) {
    $destination = Join-Path $InstallDir $item
    if ((Get-Item -LiteralPath $source).PSIsContainer) {
      Copy-Tree -Source $source -Destination $destination
    }
    else {
      Copy-Item -LiteralPath $source -Destination $destination -Force
    }
  }
}

$configPath = Join-Path $InstallDir 'config.json'
if (-not (Test-Path -LiteralPath $configPath)) {
  Copy-Item -LiteralPath (Join-Path $InstallDir 'config.example.json') -Destination $configPath
}

$desktop = [Environment]::GetFolderPath('Desktop')
$programs = [Environment]::GetFolderPath('Programs')
$startMenuDir = Join-Path $programs 'qBit Mobile'
New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null

$startScript = Join-Path $InstallDir 'start-qbit-mobile.cmd'
$uninstallScript = Join-Path $InstallDir 'installer\uninstall-qbit-mobile.ps1'

New-Shortcut -Path (Join-Path $desktop 'qBit Mobile.lnk') -Target $startScript -WorkingDirectory $InstallDir -Description 'Start qBit Mobile'
New-Shortcut -Path (Join-Path $startMenuDir 'qBit Mobile.lnk') -Target $startScript -WorkingDirectory $InstallDir -Description 'Start qBit Mobile'
New-Shortcut -Path (Join-Path $startMenuDir 'Uninstall qBit Mobile.lnk') -Target 'powershell.exe' -WorkingDirectory $InstallDir -Arguments "-NoProfile -ExecutionPolicy Bypass -File `"$uninstallScript`" -InstallDir `"$InstallDir`"" -Description 'Uninstall qBit Mobile'

if ($EnableAutostart) {
  & (Join-Path $InstallDir 'portable\install-autostart.ps1')
}

Write-Host ''
Write-Host 'qBit Mobile installed successfully.'
Write-Host "Install folder: $InstallDir"
Write-Host 'Start it from the Desktop or Start Menu shortcut, then open http://127.0.0.1:8792'
Write-Host 'Use /qbit as the server address in the app.'

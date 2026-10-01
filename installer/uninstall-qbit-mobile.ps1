param(
  [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'qBitMobile'),
  [switch]$KeepConfig
)

$ErrorActionPreference = 'Stop'

$taskName = 'qBit Mobile Portable'
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$desktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'qBit Mobile.lnk'
$startMenuDir = Join-Path ([Environment]::GetFolderPath('Programs')) 'qBit Mobile'

if (Test-Path -LiteralPath $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
}
if (Test-Path -LiteralPath $startMenuDir) {
  Remove-Item -LiteralPath $startMenuDir -Recurse -Force
}

if (Test-Path -LiteralPath $InstallDir) {
  if ($KeepConfig) {
    Get-ChildItem -LiteralPath $InstallDir -Force |
      Where-Object { $_.Name -ne 'config.json' } |
      Remove-Item -Recurse -Force
  }
  else {
    Remove-Item -LiteralPath $InstallDir -Recurse -Force
  }
}

Write-Host 'qBit Mobile was uninstalled.'

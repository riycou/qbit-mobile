$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$releaseName = 'qbit-mobile-windows-portable-v1.1.0'
$releaseRoot = Join-Path $root 'release'
$packageDir = Join-Path $releaseRoot $releaseName
$zipPath = Join-Path $releaseRoot "$releaseName.zip"
$clientBuild = Join-Path $root 'dist\client'

if (-not (Test-Path -LiteralPath $clientBuild)) {
  throw "Production frontend not found: $clientBuild"
}

if (Test-Path -LiteralPath $packageDir) {
  Remove-Item -LiteralPath $packageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $packageDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $packageDir 'portable') | Out-Null

Copy-Item -LiteralPath $clientBuild -Destination (Join-Path $packageDir 'www') -Recurse
Copy-Item -LiteralPath (Join-Path $root 'portable\host.mjs') -Destination (Join-Path $packageDir 'portable\host.mjs')
Copy-Item -LiteralPath (Join-Path $root 'portable\install-autostart.ps1') -Destination (Join-Path $packageDir 'portable\install-autostart.ps1')
Copy-Item -LiteralPath (Join-Path $root 'portable\remove-autostart.ps1') -Destination (Join-Path $packageDir 'portable\remove-autostart.ps1')
Copy-Item -LiteralPath (Join-Path $root 'installer') -Destination (Join-Path $packageDir 'installer') -Recurse
Copy-Item -LiteralPath (Join-Path $root 'config.example.json') -Destination (Join-Path $packageDir 'config.example.json')
Copy-Item -LiteralPath (Join-Path $root 'start-qbit-mobile.cmd') -Destination (Join-Path $packageDir 'start-qbit-mobile.cmd')
Copy-Item -LiteralPath (Join-Path $root 'start-qbit-mobile-hidden.vbs') -Destination (Join-Path $packageDir 'start-qbit-mobile-hidden.vbs')
Copy-Item -LiteralPath (Join-Path $root 'install-qbit-mobile.cmd') -Destination (Join-Path $packageDir 'install-qbit-mobile.cmd')
Copy-Item -LiteralPath (Join-Path $root 'install-autostart.cmd') -Destination (Join-Path $packageDir 'install-autostart.cmd')
Copy-Item -LiteralPath (Join-Path $root 'remove-autostart.cmd') -Destination (Join-Path $packageDir 'remove-autostart.cmd')
Copy-Item -LiteralPath (Join-Path $root 'INSTALL-WINDOWS.md') -Destination (Join-Path $packageDir 'INSTALL-WINDOWS.md')
if (Test-Path -LiteralPath (Join-Path $root 'README.md')) {
  Copy-Item -LiteralPath (Join-Path $root 'README.md') -Destination (Join-Path $packageDir 'README.md')
}
if (Test-Path -LiteralPath (Join-Path $root 'LICENSE')) {
  Copy-Item -LiteralPath (Join-Path $root 'LICENSE') -Destination (Join-Path $packageDir 'LICENSE')
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -Force
Write-Host $zipPath

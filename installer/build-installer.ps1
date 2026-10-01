$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$releaseRoot = Join-Path $root 'release'
$version = 'v1.1.0'
$portableName = 'qbit-mobile-windows-portable-v1.1.0'
$zipPath = Join-Path $releaseRoot "$portableName.zip"
$setupPath = Join-Path $releaseRoot "qbit-mobile-windows-setup-$version.exe"
$stage = Join-Path $releaseRoot 'installer-stage'

& (Join-Path $root 'portable\package-release.ps1')

if (-not (Test-Path -LiteralPath $zipPath)) {
  throw "Portable package not found: $zipPath"
}

if (Test-Path -LiteralPath $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item -LiteralPath $zipPath -Destination (Join-Path $stage "$portableName.zip") -Force
Copy-Item -LiteralPath (Join-Path $root 'installer\install-qbit-mobile.ps1') -Destination (Join-Path $stage 'install-qbit-mobile.ps1') -Force

$sedPath = Join-Path $stage 'qbit-mobile-setup.sed'
$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=qBit Mobile was installed.
TargetName=$setupPath
FriendlyName=qBit Mobile Setup $version
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File install-qbit-mobile.ps1 -PackageZip "$portableName.zip"
PostInstallCmd=<None>
AdminQuietInstCmd=powershell.exe -NoProfile -ExecutionPolicy Bypass -File install-qbit-mobile.ps1 -PackageZip "$portableName.zip"
UserQuietInstCmd=powershell.exe -NoProfile -ExecutionPolicy Bypass -File install-qbit-mobile.ps1 -PackageZip "$portableName.zip"
SourceFiles=SourceFiles
[SourceFiles]
SourceFiles0=$stage\
[SourceFiles0]
%FILE0%=
%FILE1%=
[Strings]
FILE0="$portableName.zip"
FILE1="install-qbit-mobile.ps1"
"@

Set-Content -LiteralPath $sedPath -Value $sed -Encoding ASCII

$iexpress = Join-Path $env:WINDIR 'System32\iexpress.exe'
if (-not (Test-Path -LiteralPath $iexpress)) {
  Write-Warning 'IExpress is not available on this Windows installation. Portable ZIP was created, but setup EXE was skipped.'
  Write-Host $zipPath
  return
}

if (Test-Path -LiteralPath $setupPath) {
  Remove-Item -LiteralPath $setupPath -Force
}

& $iexpress /N $sedPath

for ($i = 0; $i -lt 20 -and -not (Test-Path -LiteralPath $setupPath); $i++) {
  Start-Sleep -Milliseconds 250
}

if (-not (Test-Path -LiteralPath $setupPath)) {
  throw "IExpress did not create $setupPath"
}

Write-Host $setupPath

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$taskName = 'qBit Mobile Portable'
$hiddenLauncher = Join-Path $root 'start-qbit-mobile-hidden.vbs'
$startScript = Join-Path $root 'start-qbit-mobile.cmd'

if (Test-Path -LiteralPath $hiddenLauncher) {
  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$hiddenLauncher`"" -WorkingDirectory $root
}
else {
  $action = New-ScheduledTaskAction -Execute $startScript -WorkingDirectory $root
}
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Starts qBit Mobile Portable after Windows sign-in.' -Force | Out-Null
Write-Host "Installed autostart task: $taskName"

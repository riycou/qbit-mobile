$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$taskName = 'qBit Mobile Portable'
$startScript = Join-Path $root 'start-qbit-mobile.cmd'

$action = New-ScheduledTaskAction -Execute $startScript -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Starts qBit Mobile Portable after Windows sign-in.' -Force | Out-Null
Write-Host "Installed autostart task: $taskName"

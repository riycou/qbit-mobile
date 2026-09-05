$ErrorActionPreference = 'Stop'

$taskName = 'qBit Mobile Portable'
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "Removed autostart task: $taskName"
}
else {
  Write-Host "Autostart task was not installed: $taskName"
}

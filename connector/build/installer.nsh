!macro customInstall
  ; Create scheduled task using PowerShell to handle spaces in executable path correctly
  ; The task runs at logon with highest privileges and Interactive logon type to show UI
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -Command "$action = New-ScheduledTaskAction -Execute \"$INSTDIR\${APP_EXECUTABLE_FILENAME}\" -Argument \"--startup\"; $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME; $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType Interactive; $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable; Register-ScheduledTask -TaskName \"OtagonConnectorStartup\" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force"'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Warning: Could not create scheduled task. Error code: $0"
  ${Else}
    DetailPrint "Created scheduled task for startup with elevated privileges"
  ${EndIf}
!macroend

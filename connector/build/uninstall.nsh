!macro preUninstall
  ; Kill any running instances
  ExecWait 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}"'
  
  ; Remove the scheduled task
  nsExec::ExecToLog 'schtasks /delete /tn "OtagonConnectorStartup" /f'
  Pop $0
  ${If} $0 == 0
    DetailPrint "Removed scheduled task"
  ${EndIf}
!macroend

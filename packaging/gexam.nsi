; GExam Windows installer. Built by build-exe.sh (makensis) — expects STAGE, VERSION, OUTFILE defines.
Unicode true
!include "MUI2.nsh"
!include "x64.nsh"

Name "GExam"
OutFile "${OUTFILE}"
InstallDir "$PROGRAMFILES64\GExam"
InstallDirRegKey HKLM "Software\GExam" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\GExam Server.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Start GExam server now"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "GExam requires 64-bit Windows."
    Abort
  ${EndIf}
  ; stop a running copy so files can be replaced on upgrade
  nsExec::Exec 'taskkill /F /IM gexam-node.exe'
  SetOutPath "$INSTDIR"
  File /r "${STAGE}\*.*"

  ; exam data lives outside Program Files so it is writable and survives upgrades
  ReadEnvStr $0 ProgramData
  CreateDirectory "$0\GExam"
  nsExec::Exec 'icacls "$0\GExam" /grant *S-1-5-32-545:(OI)(CI)M'

  nsExec::Exec 'netsh advfirewall firewall delete rule name="GExam Server"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="GExam Server" dir=in action=allow program="$INSTDIR\gexam-node.exe" enable=yes profile=private,domain'

  CreateDirectory "$SMPROGRAMS\GExam"
  CreateShortcut "$SMPROGRAMS\GExam\GExam Server.lnk" "$INSTDIR\GExam Server.bat" "" "$INSTDIR\gexam.ico"
  CreateShortcut "$SMPROGRAMS\GExam\GExam Admin.lnk" "$INSTDIR\GExam Admin.url"
  CreateShortcut "$SMPROGRAMS\GExam\Uninstall GExam.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\GExam Server.lnk" "$INSTDIR\GExam Server.bat" "" "$INSTDIR\gexam.ico"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\GExam" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GExam" "DisplayName" "GExam"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GExam" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GExam" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GExam" "DisplayIcon" "$INSTDIR\gexam.ico"
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM gexam-node.exe'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="GExam Server"'
  Delete "$DESKTOP\GExam Server.lnk"
  RMDir /r "$SMPROGRAMS\GExam"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\GExam"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GExam"
  ; exam data in ProgramData\GExam is intentionally kept
SectionEnd

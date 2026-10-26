!macro customInit
  ; Detect existing installation path from user or system registry to force in-place overwrite
  ; 1. Check official v1.0.1 natural GUID key
  ReadRegStr $0 HKCU "Software\9a0860ac-5b35-56d3-9062-a2697b0588fb" "InstallLocation"
  ${If} $0 == ""
    ReadRegStr $0 HKLM "Software\9a0860ac-5b35-56d3-9062-a2697b0588fb" "InstallLocation"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\9a0860ac-5b35-56d3-9062-a2697b0588fb" "InstallLocation"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\9a0860ac-5b35-56d3-9062-a2697b0588fb" "InstallLocation"
  ${EndIf}

  ; 2. Check fallback legacy GUID key if previous attempt was run
  ${If} $0 == ""
    ReadRegStr $0 HKCU "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa" "InstallLocation"
  ${EndIf}
  ${If} $0 == ""
    ReadRegStr $0 HKLM "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa" "InstallLocation"
  ${EndIf}

  ; 3. If found existing path, lock $INSTDIR to overwrite in place
  ${If} $0 != ""
    StrCpy $INSTDIR $0
  ${EndIf}
!macroend

!macro customInstall
  ; Persist install directory in registry to guarantee future in-place overwrite upgrades
  WriteRegStr HKCU "Software\9a0860ac-5b35-56d3-9062-a2697b0588fb" "InstallLocation" "$INSTDIR"

  ; Clean up duplicate legacy entries if present to prevent multiple versions in Windows Apps
  DeleteRegKey HKCU "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\e89f81a6-8025-4c07-b31a-e7c65349b1fa"
!macroend

!macro customInit
  ; Detect existing installation path from user or system registry to force in-place overwrite
  ReadRegStr $0 HKCU "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa" "InstallLocation"
  ${If} $0 == ""
    ReadRegStr $0 HKLM "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa" "InstallLocation"
  ${EndIf}
  ${If} $0 != ""
    StrCpy $INSTDIR $0
  ${EndIf}
!macroend

!macro customInstall
  ; Persist install directory in registry to guarantee future in-place overwrite upgrades
  WriteRegStr HKCU "Software\e89f81a6-8025-4c07-b31a-e7c65349b1fa" "InstallLocation" "$INSTDIR"
!macroend

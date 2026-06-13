$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("00021401-0000-0000-C000-000000000046")]
internal class ShellLink { }

[ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown),
 Guid("000214F9-0000-0000-C000-000000000046")]
internal interface IShellLinkW {
  void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] out string pszFile, int cch, IntPtr pfd, uint fFlags);
  void GetIDList(out IntPtr ppidl);
  void SetIDList(IntPtr pidl);
  void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] out string pszName, int cch);
  void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
  void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] out string pszDir, int cch);
  void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
  void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] out string pszArgs, int cch);
  void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
  void GetHotkey(out short pwHotkey);
  void SetHotkey(short wHotkey);
  void GetShowCmd(out int piShowCmd);
  void SetShowCmd(int iShowCmd);
  void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] out string pszIconPath, int cch, out int piIcon);
  void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
  void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, uint dwReserved);
  void Resolve(IntPtr hwnd, uint fFlags);
  void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
}

[ComImport, Guid("886D0EE1-CF2F-4C8E-9BA0-1E64E8E47B6C"),
 InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
public interface IShellLink { }

[ComImport, Guid("0000010B-0000-0000-C000-000000000046"),
 InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
public interface IPersistFile {
  void GetClassID(out Guid pClassID);
  [return: MarshalAs(UnmanagedType.Bool)]
  bool IsDirty();
  void Load([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, uint dwMode);
  void Save([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, [MarshalAs(UnmanagedType.Bool)] bool fRemember);
  void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string pszFileName);
  void GetCurFile([Out, MarshalAs(UnmanagedType.LPWStr)] out string ppszFileName);
}
"@ -ErrorAction SilentlyContinue

function New-DesktopShortcut {
  param(
    [string]$ShortcutName,
    [string]$TargetPath,
    [string]$IconPath,
    [string]$WorkingDir
  )
  $desktop = [Environment]::GetFolderPath('Desktop')
  $lnkPath = Join-Path $desktop "$ShortcutName.lnk"

  # Remove existing shortcut to avoid stale link.
  if (Test-Path $lnkPath) { Remove-Item $lnkPath -Force }

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($lnkPath)
  $shortcut.TargetPath = $TargetPath
  $shortcut.WorkingDirectory = $WorkingDir
  $shortcut.IconLocation = $IconPath
  $shortcut.Description = 'DailyTodo (最新构建)'
  $shortcut.WindowStyle = 7  # Minimized: only suppresses the initial cmd flash if any.
  $shortcut.Save()

  # Verify
  $verify = (Get-Item $lnkPath).FullName
  Write-Output "Created: $verify"
  Write-Output "Size: $((Get-Item $lnkPath).Length) bytes"
}

# Resolve absolute paths (no relative, in case shell expands cwd differently)
$repoRoot = (Get-Location).Path
$exe = Join-Path $repoRoot 'release\win-unpacked\DailyTodo.exe'
$icon = Join-Path $repoRoot 'build\icon.ico'
$work = Join-Path $repoRoot 'release\win-unpacked'

Write-Output "exe: $exe"
Write-Output "icon: $icon"
Write-Output "work: $work"

if (-not (Test-Path $exe)) { throw "exe not found: $exe" }
if (-not (Test-Path $icon)) { throw "icon not found: $icon" }

New-DesktopShortcut -ShortcutName 'DailyTodo' -TargetPath $exe -IconPath "$icon,0" -WorkingDir $work

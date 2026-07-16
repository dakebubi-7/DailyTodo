$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot 'native\win32-hit-test\win32-hit-test.cpp'
$outputDirectory = Join-Path $repoRoot 'native\win32-hit-test\bin'
$output = Join-Path $outputDirectory 'win32-hit-test.dll'
$vsDevCmd = 'C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat'

if (-not (Test-Path -LiteralPath $vsDevCmd)) {
  throw "Visual Studio C++ Build Tools were not found at $vsDevCmd"
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$object = Join-Path $outputDirectory 'win32-hit-test.obj'
$command = "`"$vsDevCmd`" -arch=x64 -host_arch=x64 && cl.exe /nologo /std:c++20 /EHsc /O2 /LD `"$source`" /Fo`"$object`" /Fe:`"$output`" user32.lib"
cmd.exe /d /s /c $command
if ($LASTEXITCODE -ne 0) {
  throw "win32 hit-test DLL build failed with exit code $LASTEXITCODE"
}

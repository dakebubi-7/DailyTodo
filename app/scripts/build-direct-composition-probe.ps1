$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot 'native\direct-composition-probe\direct-composition-probe.cpp'
$outputDirectory = Join-Path $repoRoot 'native\direct-composition-probe\bin'
$output = Join-Path $outputDirectory 'direct-composition-probe.exe'
$vsDevCmd = 'C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat'

if (-not (Test-Path -LiteralPath $vsDevCmd)) {
  throw "Visual Studio C++ Build Tools were not found at $vsDevCmd"
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$object = Join-Path $outputDirectory 'direct-composition-probe.obj'
$command = "`"$vsDevCmd`" -arch=x64 -host_arch=x64 && cl.exe /nologo /std:c++20 /EHsc /O2 `"$source`" /Fo`"$object`" /Fe:`"$output`" user32.lib gdi32.lib d3d11.lib dcomp.lib dxgi.lib"
cmd.exe /d /s /c $command
if ($LASTEXITCODE -ne 0) {
  throw "DirectComposition probe build failed with exit code $LASTEXITCODE"
}

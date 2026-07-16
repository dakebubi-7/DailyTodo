import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'win32Native.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron Win32/native helper module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export type Win32Api\b/, 'win32Native should export the Win32 bridge type.');
assert.match(helper, /export function createWin32NativeHelpers\b/, 'win32Native should export a Win32/native helper factory.');
assert.match(helper, /export function runWin32Operation\b/, 'win32Native should expose a guarded native operation wrapper.');
assert.match(helper, /diag\(`Win32 \$\{operation\} failed:/, 'win32Native should diagnose native operation failures with an operation name.');
assert.match(helper, /function createWin32Api\b/, 'win32Native should own Win32 binding creation.');
assert.match(helper, /export function isDesktopForeground\b/, 'win32Native should own desktop foreground detection.');
assert.match(helper, /function createHwndBuffer\b/, 'win32Native should own HWND buffer creation.');
assert.match(helper, /const GWL_EXSTYLE = -20;/, 'win32Native should keep the extended-style index constant.');
assert.match(helper, /const WS_EX_TOOLWINDOW = 0x00000080;/, 'win32Native should keep the tool-window style constant.');
assert.match(helper, /const HWND_TOPMOST = -1;/, 'win32Native should keep the topmost z-order constant.');
assert.match(helper, /const HWND_NOTOPMOST = -2;/, 'win32Native should keep the non-topmost z-order constant.');
assert.match(helper, /const HWND_BOTTOM = 1;/, 'win32Native should keep the bottom z-order constant.');
assert.match(helper, /const SWP_NOSIZE = 0x0001;/, 'win32Native should keep the no-size flag.');
assert.match(helper, /const SWP_NOMOVE = 0x0002;/, 'win32Native should keep the no-move flag.');
assert.match(helper, /const SWP_NOACTIVATE = 0x0010;/, 'win32Native should keep the no-activate flag.');
assert.match(helper, /const GWLP_HWNDPARENT = -8;/, 'win32Native should keep the owner-window index constant.');
assert.match(helper, /require\('koffi'\)/, 'win32Native should keep the koffi-based Win32 binding.');
assert.match(helper, /diag\('koffi user32 bound ok'\)/, 'win32Native should preserve successful binding diagnostics.');
assert.match(helper, /diag\(`koffi bind failed:/, 'win32Native should preserve binding failure diagnostics.');
assert.match(helper, /function applyToolWindowStyle\b/, 'win32Native should own the tool-window style helper.');
assert.match(helper, /function applyNativeBackgroundMaterial\b/, 'win32Native should own the background-material helper.');
assert.match(helper, /type NativeBackgroundMaterialWindow\b[\s\S]*setBackgroundMaterial/, 'win32Native should define the optional native material capability shape.');
assert.match(helper, /function hasNativeBackgroundMaterial\(\s*win:\s*unknown\s*\):\s*win is NativeBackgroundMaterialWindow/, 'win32Native should narrow native material support with a capability type guard.');
assert.doesNotMatch(helper, /win as BrowserWindow &/, 'win32Native should not cast BrowserWindow to access optional native material support.');
assert.match(helper, /setBackgroundMaterial\('none'\)/, 'win32Native should preserve CSS-owned blur behavior.');
assert.match(helper, /setBackgroundMaterial\('acrylic'\)/, 'win32Native should enable Windows Acrylic for the invisible theme.');
assert.match(helper, /export function applyInvisibleGlassBackgroundMaterial\b/, 'win32Native should expose the focused invisible-glass material helper for tests.');
assert.match(helper, /from '\.\.\/shared\/invisibleGlass'/, 'win32Native should share invisible-glass opacity/blur normalization with the renderer.');
assert.match(helper, /export function shouldPreferWin32AcrylicFallback\b/, 'win32Native should expose the OS-version Acrylic preference helper.');
assert.match(helper, /build < WINDOWS_11_BUILD/, 'win32Native should prefer Win32 Acrylic on Windows 10 builds.');
assert.match(helper, /createWin32AccentPolicyFromGlass/, 'win32Native Acrylic policy should come from shared glass opacity/blur settings.');
assert.match(helper, /native background material unavailable/, 'win32Native should preserve missing-material diagnostics.');

assert.match(main, /from '\.\/win32Native'/, 'main should import Win32/native helpers from win32Native.');
assert.match(main, /createWin32NativeHelpers\(\{/, 'main should create Win32/native helpers through the module.');
assert.match(main, /const \{\s*win32,[\s\S]*applyToolWindowStyle,[\s\S]*applyNativeBackgroundMaterial,[\s\S]*setInvisibleGlassBackgroundMaterial,[\s\S]*\} = createWin32NativeHelpers\(\{/s, 'main should destructure the Win32/native and invisible-glass helpers from the module.');
assert.match(main, /diag,/, 'main should pass diagnostics into the Win32/native helper factory.');
assert.match(main, /getWin32:\s*\(\)\s*=>\s*win32/, 'main should continue to inject the Win32 bridge into desktopWindowMode.');
assert.match(main, /applyNativeBackgroundMaterial,/, 'main should continue to pass the background-material helper into the main-window factory.');
assert.match(main, /applyToolWindowStyle,/, 'main should continue to pass the tool-window helper into the main-window factory.');

const preload = readFileSync(join(root, 'electron', 'preload.ts'), 'utf8');
const windowIpc = readFileSync(join(root, 'electron', 'windowIpc.ts'), 'utf8');
const appEffects = readFileSync(join(root, 'src', 'app', 'appShellEffects.ts'), 'utf8');
const runtimeEffects = readFileSync(join(root, 'src', 'app', 'useAppRuntimeEffects.ts'), 'utf8');

assert.match(preload, /setInvisibleGlass:\s*\(payload:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setInvisibleGlass', payload\)/, 'preload should expose the invisible-glass payload control.');
assert.match(windowIpc, /ipcMain\.handle\('window:setInvisibleGlass',[\s\S]*setInvisibleGlassBackgroundMaterial\(win, payload\)/, 'window IPC should forward the invisible-glass payload to the native helper.');
assert.match(appEffects, /setInvisibleGlass\?\.\([\s\S]*buildInvisibleGlassSettings|setInvisibleGlass\?\.\(/, 'renderer should synchronize invisible glass through the restricted preload API.');
assert.match(runtimeEffects, /syncInvisibleGlassTheme\([\s\S]*activeThemeId === 'invisible'[\s\S]*windowOpacity[\s\S]*blurStrength/, 'renderer should synchronize native material whenever the active theme, opacity, or blur changes.');

assert.doesNotMatch(main, /type Win32Api\b/, 'main should not keep the Win32 bridge type inline after extraction.');
assert.doesNotMatch(main, /function createHwndBuffer\b/, 'main should not keep HWND buffer creation inline after extraction.');
assert.doesNotMatch(main, /function isDesktopForeground\b/, 'main should not keep desktop foreground detection inline after extraction.');
assert.doesNotMatch(main, /function applyToolWindowStyle\b/, 'main should not keep the tool-window style helper inline after extraction.');
assert.doesNotMatch(main, /function applyNativeBackgroundMaterial\b/, 'main should not keep the background-material helper inline after extraction.');
assert.doesNotMatch(main, /const GWL_EXSTYLE = -20;/, 'main should not keep the extended-style index constant inline after extraction.');
assert.doesNotMatch(main, /require\('koffi'\)/, 'main should not bind koffi inline after extraction.');

assert.equal(
  scripts['verify:electron-win32-native-module'],
  'tsx scripts/verify-electron-win32-native-module.ts',
  'package.json should expose the focused Win32/native verifier.',
);
assertCleanupCoreIncludes('verify:electron-win32-native-module', 'cleanup-core should include the focused Win32/native verifier.');

console.log('electron Win32/native helper module verification passed');

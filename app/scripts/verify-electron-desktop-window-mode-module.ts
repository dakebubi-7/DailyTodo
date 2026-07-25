import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'desktopWindowMode.ts');
const desktopHostPath = join(root, 'electron', 'desktopWindowHost.ts');
const mainPath = join(root, 'electron', 'main.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const mainWindowModeControllerPath = join(root, 'electron', 'mainWindowModeController.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const mainWindowEventsPath = join(root, 'electron', 'mainWindowEvents.ts');
const windowModeVerifyPath = join(root, 'electron', 'windowMode.verify.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron desktop window mode module should exist.');
assert.ok(existsSync(desktopHostPath), 'Electron desktop Window host controller should exist.');

const helper = readFileSync(modulePath, 'utf8');
const desktopHost = readFileSync(desktopHostPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const mainWindowModeController = readFileSync(mainWindowModeControllerPath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const mainWindowEvents = readFileSync(mainWindowEventsPath, 'utf8');
const windowModeVerify = readFileSync(windowModeVerifyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createDesktopWindowModeController\b/, 'desktopWindowMode should export createDesktopWindowModeController.');
assert.match(helper, /type CreateDesktopWindowModeControllerOptions\b/, 'desktopWindowMode should define explicit controller dependencies.');
assert.match(helper, /from '\.\/desktopWindowHost'/, 'desktopWindowMode should delegate hosting through the focused controller.');
assert.match(helper, /createDesktopWindowHost\(\{ diag, getWin32 \}\)/, 'desktopWindowMode should inject the native bridge into the focused host controller.');
assert.match(helper, /type DesktopWindowModeWin32Like\b/, 'desktopWindowMode should define a focused Win32 dependency interface.');
assert.match(helper, /const DESKTOP_HOST_RECOVERY_INTERVAL_MS = 2_000;/, 'desktopWindowMode should retry only at a low frequency after Explorer restarts.');
assert.match(helper, /function startDesktopGuard\b/, 'desktopWindowMode should own desktop guard startup.');
assert.match(helper, /function stopDesktopGuard\b/, 'desktopWindowMode should own desktop guard shutdown.');
assert.match(desktopHost, /export function createDesktopWindowHost\b/, 'desktopWindowHost should export the Explorer host controller.');
assert.match(desktopHost, /function attach\b/, 'desktopWindowHost should own initial Explorer attachment.');
assert.match(desktopHost, /function ensureAttached\b/, 'desktopWindowHost should own Explorer restart recovery.');
assert.match(desktopHost, /function detach\b/, 'desktopWindowHost should own Explorer detachment.');
assert.match(helper, /function applyWindowMode\b/, 'desktopWindowMode should own window-mode application.');
assert.match(helper, /function reapplyWindowZOrder\b/, 'desktopWindowMode should own z-order reapplication.');
assert.match(helper, /function markDesktopInteractive\b/, 'desktopWindowMode should expose desktop-active state promotion for explicit user focus.');
assert.match(desktopHost, /win32\.attachToDesktop\(handle\)/, 'desktopWindowHost should attach to the Explorer desktop host.');
assert.match(desktopHost, /detachFromDesktop\(win\.getNativeWindowHandle\(\)\)/, 'desktopWindowHost should detach from the Explorer desktop host.');
assert.match(helper, /win\.setAlwaysOnTop\(false,\s*'normal'\)/, 'desktopWindowMode should preserve desktop mode z-order normalization.');
assert.match(helper, /win\.setSkipTaskbar\(mode !== 'normal'\)/, 'desktopWindowMode should preserve skipTaskbar behavior per mode.');
assert.match(helper, /setNativeWindowMinimizeProtection\(win, mode === 'onTop'\)/, 'desktopWindowMode should enable native minimize protection only in on-top mode.');
assert.match(helper, /diag\(`applyWindowMode mode=\$\{mode\}/, 'desktopWindowMode should preserve applyWindowMode diagnostics.');
assert.doesNotMatch(helper, /DESKTOP_GUARD_INTERVAL_MS = 64/, 'desktopWindowMode must not retain high-frequency desktop polling.');
assert.doesNotMatch(helper, /sendToBottom/, 'desktopWindowMode must not sink the desktop widget beneath applications.');

assert.match(main, /from '\.\/desktopWindowMode'/, 'main should import the desktop window mode controller from desktopWindowMode.');
assert.match(main, /const desktopWindowMode = createDesktopWindowModeController\(\{/, 'main should create the desktop window mode controller.');
assert.match(main, /from '\.\/windowModeState'/, 'main should import the shared window-mode state helper.');
assert.match(main, /const windowModeState = createWindowModeState\('onTop'\)/, 'main should create the shared window-mode state helper.');
assert.match(main, /setWindowModeState:\s*windowModeState\.setMode/, 'main should inject the shared window-mode setter into the desktop controller.');
assert.match(main, /getWin32:\s*\(\)\s*=>\s*win32/, 'main should inject the current Win32 bridge into the controller.');
assert.match(main, /desktopWindowMode,/, 'main should pass the desktop window mode controller into the main-window composition.');
assert.match(composition, /from '\.\/mainWindowModeController'/, 'main-window composition should import the main-window mode controller helper.');
assert.match(mainWindowModeController, /applyWindowMode\(win,\s*mode\)/, 'mainWindowModeController should delegate window-mode application through the desktop controller.');
assert.match(mainWindowModeController, /reapplyWindowZOrder\(win\)/, 'mainWindowModeController should delegate z-order reapplication through the desktop controller.');
assert.match(composition, /applyWindowMode:\s*desktopWindowMode\.applyWindowMode,/, 'main-window composition should inject desktopWindowMode.applyWindowMode into the mode controller.');
assert.match(composition, /reapplyWindowZOrder:\s*desktopWindowMode\.reapplyWindowZOrder,/, 'main-window composition should inject desktopWindowMode.reapplyWindowZOrder into the mode controller.');
assert.match(composition, /markDesktopInteractive:\s*desktopWindowMode\.markDesktopInteractive/, 'main-window composition should inject desktop-active promotion through the shell controller boundary.');
assert.match(shellController, /markDesktopInteractive\(\)/, 'mainShellController should delegate desktop-active promotion through the desktop window mode controller.');
assert.doesNotMatch(main, /function startDesktopGuard\b/, 'main should not keep desktop guard startup inline after extraction.');
assert.doesNotMatch(main, /function stopDesktopGuard\b/, 'main should not keep desktop guard shutdown inline after extraction.');
assert.doesNotMatch(main, /function applyWindowMode\b/, 'main should not keep applyWindowMode inline after extraction.');
assert.doesNotMatch(main, /function reapplyWindowZOrder\b/, 'main should not keep reapplyWindowZOrder inline after extraction.');

assert.match(composition, /stopDesktopGuard:\s*desktopWindowMode\.stopDesktopGuard/, 'main-window composition should pass controller stopDesktopGuard into main-window events.');
assert.match(windowModeVerify, /desktopWindowModeSource/, 'windowMode.verify should follow the extracted desktop window mode helper.');

assert.equal(
  scripts['verify:electron-desktop-window-mode-module'],
  'tsx scripts/verify-electron-desktop-window-mode-module.ts',
  'package.json should expose the focused desktop window mode verifier.',
);
assertCleanupCoreIncludes('verify:electron-desktop-window-mode-module', 'cleanup-core should include the focused desktop window mode verifier.');

console.log('electron desktop window mode module verification passed');

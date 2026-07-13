import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/mainWindowModeController.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const windowModeVerifyPath = join(root, 'electron/windowMode.verify.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window mode controller module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const windowModeVerify = readFileSync(windowModeVerifyPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainWindowModeController\b/, 'mainWindowModeController should export createMainWindowModeController.');
assert.match(helper, /type CreateMainWindowModeControllerOptions\b/, 'mainWindowModeController should define explicit controller dependencies.');
assert.match(helper, /ElectronStoreLike/, 'mainWindowModeController should depend on the small store interface.');
assert.match(helper, /windowModeKey:\s*string/, 'mainWindowModeController should receive the window-mode storage key explicitly.');
assert.match(helper, /getWindowMode\(\):\s*WindowMode/, 'mainWindowModeController should read the current runtime mode before applying changes.');
assert.match(helper, /applyWindowMode\(win:\s*BrowserWindow,\s*mode:\s*WindowMode\):\s*void/, 'mainWindowModeController should delegate mode application.');
assert.match(helper, /reapplyWindowZOrder\(win:\s*BrowserWindow\):\s*void/, 'mainWindowModeController should delegate z-order reapplication.');
assert.match(helper, /refreshTrayMenu\(\):\s*void/, 'mainWindowModeController should receive tray refresh as an injected dependency.');
assert.match(helper, /if \(mode === getWindowMode\(\)\) return;/, 'mainWindowModeController should skip redundant work when the requested mode is already active.');
assert.match(helper, /store\.set\(windowModeKey,\s*mode\)/, 'mainWindowModeController should persist the chosen window mode.');
assert.match(helper, /applyWindowMode\(win,\s*mode\)/, 'mainWindowModeController should apply the new mode through the desktop window mode controller.');
assert.match(helper, /setTimeout\(\(\)\s*=>\s*reapplyWindowZOrder\(win\),\s*80\)/, 'mainWindowModeController should preserve delayed z-order reapplication.');
assert.match(helper, /win\.webContents\.send\('window:modeChanged',\s*mode\)/, 'mainWindowModeController should preserve renderer mode-change broadcasts.');
assert.match(helper, /if \(getTray\(\)\)\s*refreshTrayMenu\(\)/, 'mainWindowModeController should refresh the tray only when it exists.');

assert.match(composition, /from '\.\/mainWindowModeController'/, 'main-window composition should import the main-window mode controller helper.');
assert.match(composition, /const\s*\{\s*setWindowMode\s*\}\s*=\s*createMainWindowModeController\(\{/, 'main-window composition should create and destructure the main-window mode controller.');
assert.match(composition, /windowModeKey,/, 'main-window composition should pass the window-mode storage key into the controller.');
assert.match(composition, /getWindowMode:\s*windowModeState\.getMode,/, 'main-window composition should pass the shared runtime mode reader into the controller.');
assert.match(composition, /applyWindowMode:\s*desktopWindowMode\.applyWindowMode,/, 'main-window composition should pass desktopWindowMode.applyWindowMode into the controller.');
assert.match(composition, /reapplyWindowZOrder:\s*desktopWindowMode\.reapplyWindowZOrder,/, 'main-window composition should pass desktopWindowMode.reapplyWindowZOrder into the controller.');
assert.match(composition, /getTray:\s*runtimeState\.getTray,/, 'main-window composition should inject runtimeState.getTray into the mode controller.');
assert.match(composition, /refreshTrayMenu:\s*trayRefreshBridge\.refreshTrayMenu,/, 'main-window composition should pass tray refresh through the bridge into the mode controller.');
assert.doesNotMatch(composition, /function setWindowMode\(\s*win:\s*BrowserWindow,\s*mode:\s*WindowMode\s*\)/, 'main-window composition should not keep setWindowMode inline after extraction.');

assert.match(windowModeVerify, /mainWindowModeController\.ts/, 'windowMode.verify should follow the extracted mode controller boundary.');

assert.equal(
  scripts['verify:electron-main-window-mode-controller-module'],
  'tsx scripts/verify-electron-main-window-mode-controller-module.ts',
  'package.json should expose the focused main-window mode controller verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-mode-controller-module', 'cleanup-core should include the focused main-window mode controller verifier.');

console.log('electron main-window mode controller module verification passed');

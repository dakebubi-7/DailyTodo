import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'desktopWindowMode.ts');
const desktopOwnerPath = join(root, 'electron', 'desktopWindowOwner.ts');
const widgetStateApplierPath = join(root, 'electron', 'desktopWidgetStateApplier.ts');
const mainPath = join(root, 'electron', 'main.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const mainWindowModeControllerPath = join(root, 'electron', 'mainWindowModeController.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const mainWindowEventsPath = join(root, 'electron', 'mainWindowEvents.ts');
const windowModeVerifyPath = join(root, 'electron', 'windowMode.verify.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron desktop window mode module should exist.');
assert.ok(existsSync(desktopOwnerPath), 'Electron desktop window owner controller should exist.');
assert.ok(existsSync(widgetStateApplierPath), 'Electron desktop widget state applier should exist.');

const helper = readFileSync(modulePath, 'utf8');
const desktopOwner = readFileSync(desktopOwnerPath, 'utf8');
const widgetStateApplier = readFileSync(widgetStateApplierPath, 'utf8');
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
assert.match(helper, /from '\.\/desktopWidgetStateApplier'/, 'desktopWindowMode should delegate state application through the focused applier.');
assert.match(helper, /createDesktopWidgetStateApplier\(\{ diag, getWindowMode, userHidden, getWin32 \}\)/, 'desktopWindowMode should inject user-hidden state into the focused applier.');
assert.match(helper, /type DesktopWindowModeWin32Like\b/, 'desktopWindowMode should define a focused Win32 dependency interface.');
assert.match(widgetStateApplier, /userHidden\.isHidden/, 'desktop widget state applier should read user-hidden state through the shared state object.');
assert.match(widgetStateApplier, /from '\.\/desktopWindowOwner'/, 'desktop widget state applier should delegate desktop owner state to the dedicated controller.');
assert.match(helper, /const DESKTOP_FG_CLASSES = new Set\(/, 'desktopWindowMode should own desktop foreground class tracking.');
assert.match(helper, /const DESKTOP_GUARD_INTERVAL_MS = 64;/, 'desktopWindowMode should preserve the desktop guard polling interval.');
assert.match(widgetStateApplier, /function apply\b/, 'desktop widget state applier should own desktop widget state application.');
assert.match(helper, /function applyDesktopTopmost\b/, 'desktopWindowMode should own desktop topmost polling logic.');
assert.match(helper, /function startDesktopGuard\b/, 'desktopWindowMode should own desktop guard startup.');
assert.match(helper, /function stopDesktopGuard\b/, 'desktopWindowMode should own desktop guard shutdown.');
assert.match(desktopOwner, /export function createDesktopWindowOwner\b/, 'desktopWindowOwner should export the owner state controller.');
assert.match(desktopOwner, /function applyDesktopOwner\b/, 'desktopWindowOwner should own desktop owner application.');
assert.match(desktopOwner, /function clearDesktopOwner\b/, 'desktopWindowOwner should own desktop owner cleanup.');
assert.match(helper, /function applyWindowMode\b/, 'desktopWindowMode should own window-mode application.');
assert.match(helper, /function reapplyWindowZOrder\b/, 'desktopWindowMode should own z-order reapplication.');
assert.match(helper, /function markDesktopInteractive\b/, 'desktopWindowMode should expose desktop-active state promotion for explicit user focus.');
assert.match(desktopOwner, /win32\.setDesktopOwner\(handle\)/, 'desktopWindowOwner should preserve Progman owner attachment.');
assert.match(widgetStateApplier, /win32\.sendToBottom\(handle\)/, 'desktop widget state applier should preserve app-background sink behavior.');
assert.match(helper, /win\.setAlwaysOnTop\(false,\s*'normal'\)/, 'desktopWindowMode should preserve desktop mode z-order normalization.');
assert.match(helper, /win\.setSkipTaskbar\(mode !== 'normal'\)/, 'desktopWindowMode should preserve skipTaskbar behavior per mode.');
assert.match(helper, /diag\(`applyWindowMode mode=\$\{mode\}/, 'desktopWindowMode should preserve applyWindowMode diagnostics.');
assert.doesNotMatch(helper, /function applyDesktopOwner\b/, 'desktopWindowMode should not retain owner application inline.');
assert.doesNotMatch(helper, /function clearDesktopOwner\b/, 'desktopWindowMode should not retain owner cleanup inline.');
assert.doesNotMatch(helper, /function applyDesktopWidgetState\b/, 'desktopWindowMode should not retain widget state application inline.');

assert.match(main, /from '\.\/desktopWindowMode'/, 'main should import the desktop window mode controller from desktopWindowMode.');
assert.match(main, /const desktopWindowMode = createDesktopWindowModeController\(\{/, 'main should create the desktop window mode controller.');
assert.match(main, /from '\.\/windowModeState'/, 'main should import the shared window-mode state helper.');
assert.match(main, /const windowModeState = createWindowModeState\('onTop'\)/, 'main should create the shared window-mode state helper.');
assert.match(main, /setWindowModeState:\s*windowModeState\.setMode/, 'main should inject the shared window-mode setter into the desktop controller.');
assert.match(main, /userHidden,/, 'main should inject the shared userHidden state into the desktop controller.');
assert.match(main, /getWin32:\s*\(\)\s*=>\s*win32/, 'main should inject the current Win32 bridge into the controller.');
assert.match(main, /desktopWindowMode,/, 'main should pass the desktop window mode controller into the main-window composition.');
assert.match(composition, /from '\.\/mainWindowModeController'/, 'main-window composition should import the main-window mode controller helper.');
assert.match(mainWindowModeController, /applyWindowMode\(win,\s*mode\)/, 'mainWindowModeController should delegate window-mode application through the desktop controller.');
assert.match(mainWindowModeController, /reapplyWindowZOrder\(win\)/, 'mainWindowModeController should delegate z-order reapplication through the desktop controller.');
assert.match(composition, /applyWindowMode:\s*desktopWindowMode\.applyWindowMode,/, 'main-window composition should inject desktopWindowMode.applyWindowMode into the mode controller.');
assert.match(composition, /reapplyWindowZOrder:\s*desktopWindowMode\.reapplyWindowZOrder,/, 'main-window composition should inject desktopWindowMode.reapplyWindowZOrder into the mode controller.');
assert.match(composition, /markDesktopInteractive:\s*desktopWindowMode\.markDesktopInteractive/, 'main-window composition should inject desktop-active promotion through the shell controller boundary.');
assert.match(shellController, /markDesktopInteractive\(\)/, 'mainShellController should delegate desktop-active promotion through the desktop window mode controller.');
assert.doesNotMatch(main, /function applyDesktopTopmost\b/, 'main should not keep desktop topmost polling inline after extraction.');
assert.doesNotMatch(main, /function startDesktopGuard\b/, 'main should not keep desktop guard startup inline after extraction.');
assert.doesNotMatch(main, /function stopDesktopGuard\b/, 'main should not keep desktop guard shutdown inline after extraction.');
assert.doesNotMatch(main, /function applyDesktopOwner\b/, 'main should not keep desktop owner application inline after extraction.');
assert.doesNotMatch(main, /function clearDesktopOwner\b/, 'main should not keep desktop owner cleanup inline after extraction.');
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

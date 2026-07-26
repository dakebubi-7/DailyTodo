import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/mainWindowEvents.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const mainPath = join(root, 'electron/main.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window events module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function registerMainWindowEventHandlers\b/, 'mainWindowEvents should export registerMainWindowEventHandlers.');
assert.match(helper, /hardenRendererNavigation\(win\)/, 'mainWindowEvents should harden renderer navigation.');
assert.match(helper, /from '\.\/windowNavigationSecurity'/, 'mainWindowEvents should import navigation hardening helper.');
assert.match(helper, /type RegisterMainWindowEventHandlersOptions\b/, 'mainWindowEvents should define explicit event-registration dependencies.');
assert.match(helper, /BrowserWindow/, 'mainWindowEvents should type the main window dependency.');
assert.match(helper, /win\.once\('ready-to-show'/, 'mainWindowEvents should own ready-to-show handling.');
assert.match(helper, /win\.webContents\.on\('did-finish-load'/, 'mainWindowEvents should own did-finish-load diagnostics.');
assert.match(helper, /win\.webContents\.on\('did-fail-load'/, 'mainWindowEvents should own did-fail-load diagnostics.');
assert.match(helper, /win\.webContents\.on\('preload-error'/, 'mainWindowEvents should own preload-error diagnostics.');
assert.match(helper, /win\.on\('hide'/, 'mainWindowEvents should own hide diagnostics.');
assert.match(helper, /win\.on\('minimize'/, 'mainWindowEvents should own minimize handling.');
assert.doesNotMatch(helper, /from '\.\/minimizeRecovery'/, 'mainWindowEvents should not bypass the explicit tray policy through minimize recovery.');
assert.match(helper, /win\.on\('minimize',[\s\S]*hideMainWindow\(\)/, 'native minimize should always hide the window to the tray.');
assert.match(helper, /win\.on\('blur'/, 'mainWindowEvents should own blur diagnostics.');
assert.match(helper, /win\.on\('focus'/, 'mainWindowEvents should own focus diagnostics.');
assert.match(helper, /ensureDesktopHosted\(win\)/, 'mainWindowEvents should immediately restore component hosting after window lifecycle changes.');
assert.match(helper, /win\.on\('show',[\s\S]*ensureDesktopHosted\(win\)/, 'show should immediately confirm component hosting.');
assert.match(helper, /win\.on\('restore',[\s\S]*ensureDesktopHosted\(win\)/, 'restore should immediately confirm component hosting.');
assert.match(helper, /win\.on\('blur',[\s\S]*ensureDesktopHosted\(win\)/, 'blur should immediately return a component window to its Explorer host.');
assert.match(helper, /win\.webContents\.on\('render-process-gone'/, 'mainWindowEvents should own renderer crash diagnostics.');
assert.match(helper, /win\.on\('unresponsive'/, 'mainWindowEvents should own unresponsive diagnostics.');
assert.match(helper, /win\.on\('move'/, 'mainWindowEvents should own window-state persistence event wiring.');
assert.match(helper, /win\.on\('resize'/, 'mainWindowEvents should own resize persistence event wiring.');
assert.match(helper, /win\.on\('close'/, 'mainWindowEvents should own minimize-to-tray close behavior.');
assert.match(helper, /event\.preventDefault\(\)/, 'mainWindowEvents should preserve preventDefault during minimize-to-tray close behavior.');
assert.match(helper, /hideMainWindow\(\)/, 'mainWindowEvents should preserve minimize-to-tray hide behavior.');
assert.match(helper, /getAppSettings\(\)\.closeToExit !== true/, 'mainWindowEvents should exit only when the advanced setting is explicitly enabled.');
assert.match(helper, /stopDesktopGuard\(\)/, 'mainWindowEvents should preserve desktop guard cleanup on close.');

assert.match(composition, /from '\.\/mainWindowBootstrap'/, 'main-window composition should import the bootstrap helper that wires main-window events.');
assert.match(bootstrap, /from '\.\/mainWindowEvents'/, 'mainWindowBootstrap should import main-window event helpers from mainWindowEvents.');
assert.match(bootstrap, /registerMainWindowEventHandlers\(\{/, 'mainWindowBootstrap should delegate event registration to mainWindowEvents.');
assert.doesNotMatch(main, /win\.on\('minimize'/, 'main should not keep minimize registration inline after extraction.');
assert.doesNotMatch(main, /win\.webContents\.on\('render-process-gone'/, 'main should not keep render-process-gone registration inline after extraction.');
assert.doesNotMatch(main, /win\.on\('close', \(event\) => \{/, 'main should not keep close handling inline after extraction.');

assert.equal(scripts['verify:electron-main-window-events-module'], 'tsx scripts/verify-electron-main-window-events-module.ts', 'package.json should expose the focused main-window events verifier.');
assertCleanupCoreIncludes('verify:electron-main-window-events-module', 'cleanup-core should include the focused main-window events verifier.');

console.log('electron main-window events module verification passed');

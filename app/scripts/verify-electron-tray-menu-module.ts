import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/trayMenu.ts');
const shellControllerPath = join(root, 'electron/mainShellController.ts');
const mainPath = join(root, 'electron/main.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron tray menu module should exist.');
assert.ok(existsSync(shellControllerPath), 'Electron main shell controller module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function refreshMainTrayMenu\b/, 'trayMenu should export refreshMainTrayMenu.');
assert.match(helper, /export function createMainTray\b/, 'trayMenu should export createMainTray.');
assert.match(helper, /type RefreshMainTrayMenuOptions\b/, 'trayMenu should define explicit menu refresh dependencies.');
assert.match(helper, /type CreateMainTrayOptions\b/, 'trayMenu should define explicit tray creation dependencies.');
assert.match(helper, /Menu\.buildFromTemplate\(/, 'trayMenu should own tray menu template construction.');
assert.match(helper, /new Tray\(/, 'trayMenu should own Tray creation.');
assert.match(helper, /tray\.setToolTip\('DailyTodo'\)/, 'trayMenu should preserve the tray tooltip.');
assert.match(helper, /tray\.on\('click',\s*onClick\)/, 'trayMenu should preserve tray click wiring.');
assert.match(helper, /setDesktopMode\(/, 'trayMenu should preserve desktop mode toggling from the tray.');
assert.match(helper, /checked:\s*getWindowMode\(\)\s*===\s*'desktop'/, 'trayMenu should preserve the desktop pin checked state.');
assert.match(helper, /zh\('\\u6253\\u5f00 DailyTodo'\)/, 'trayMenu should preserve the open label through localization.');
assert.match(helper, /zh\('\\u9690\\u85cf\\u7a97\\u53e3'\)/, 'trayMenu should preserve the hide label through localization.');
assert.match(helper, /zh\('\\u9000\\u51fa'\)/, 'trayMenu should preserve the quit label through localization.');

assert.match(composition, /from '\.\/mainShellController'/, 'main-window composition should delegate tray shell actions through mainShellController.');
assert.match(main, /from '\.\/mainRuntimeState'/, 'main should import runtime state for tray ownership.');
assert.match(composition, /getTray:\s*runtimeState\.getTray/, 'main-window composition should inject runtimeState tray reads.');
assert.match(composition, /setTray:\s*runtimeState\.setTray/, 'main-window composition should inject runtimeState tray writes.');
assert.match(shellController, /from '\.\/trayMenu'/, 'mainShellController should import tray helpers from trayMenu.');
assert.match(shellController, /refreshMainTrayMenu\(\{/, 'mainShellController should delegate tray menu refresh to trayMenu.');
assert.match(shellController, /quitApp,/, 'mainShellController should preserve injected quit ownership during tray menu refresh.');
assert.match(shellController, /const nextTray = createMainTray\(\{/, 'mainShellController should delegate Tray creation to trayMenu.');
assert.match(shellController, /icon:\s*getTrayIcon\(\)/, 'mainShellController should source the tray icon through injected appIcons helpers.');
assert.doesNotMatch(main, /function refreshTrayMenu\(\) \{/, 'main should not keep refreshTrayMenu inline after shell-controller extraction.');
assert.doesNotMatch(main, /function createTray\(\) \{/, 'main should not keep createTray inline after shell-controller extraction.');
assert.doesNotMatch(shellController, /Menu\.buildFromTemplate\(/, 'mainShellController should not build the tray menu template inline after trayMenu extraction.');
assert.doesNotMatch(shellController, /new Tray\(/, 'mainShellController should not construct Tray inline after trayMenu extraction.');

assert.equal(scripts['verify:electron-tray-menu-module'], 'tsx scripts/verify-electron-tray-menu-module.ts', 'package.json should expose the focused tray menu verifier.');
assertCleanupCoreIncludes('verify:electron-tray-menu-module', 'cleanup-core should include the focused tray menu verifier.');

console.log('electron tray menu module verification passed');

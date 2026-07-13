import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'mainRuntimeState.ts');
const mainPath = join(root, 'electron', 'main.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const startupPath = join(root, 'electron', 'mainWindowStartup.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const lifecyclePath = join(root, 'electron', 'appLifecycle.ts');
const modeControllerPath = join(root, 'electron', 'mainWindowModeController.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main runtime-state module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const startup = readFileSync(startupPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const lifecycle = readFileSync(lifecyclePath, 'utf8');
const modeController = readFileSync(modeControllerPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /import type \{ BrowserWindow, Tray \} from 'electron'/, 'mainRuntimeState should import only Electron runtime state types.');
assert.match(helper, /export type MainRuntimeState\b/, 'mainRuntimeState should export the shared MainRuntimeState type.');
assert.match(helper, /getMainWindow:\s*\(\)\s*=>\s*BrowserWindow \| null;/, 'MainRuntimeState should expose main-window reads.');
assert.match(helper, /setMainWindow:\s*\(win:\s*BrowserWindow \| null\)\s*=>\s*void;/, 'MainRuntimeState should expose main-window writes.');
assert.match(helper, /clearMainWindow:\s*\(\)\s*=>\s*void;/, 'MainRuntimeState should expose a named main-window clear operation.');
assert.match(helper, /getTray:\s*\(\)\s*=>\s*Tray \| null;/, 'MainRuntimeState should expose tray reads.');
assert.match(helper, /setTray:\s*\(tray:\s*Tray \| null\)\s*=>\s*void;/, 'MainRuntimeState should expose tray writes.');
assert.match(helper, /getTaskMenuWindow:\s*\(\)\s*=>\s*BrowserWindow \| null;/, 'MainRuntimeState should expose task-menu window reads.');
assert.match(helper, /setTaskMenuWindow:\s*\(win:\s*BrowserWindow \| null\)\s*=>\s*void;/, 'MainRuntimeState should expose task-menu window writes.');
assert.match(helper, /export function createMainRuntimeState\(\):\s*MainRuntimeState/, 'mainRuntimeState should export createMainRuntimeState.');
assert.match(helper, /let mainWindow:\s*BrowserWindow \| null = null;/, 'mainRuntimeState should own the main-window reference.');
assert.match(helper, /let tray:\s*Tray \| null = null;/, 'mainRuntimeState should own the tray reference.');
assert.match(helper, /let taskMenuWindow:\s*BrowserWindow \| null = null;/, 'mainRuntimeState should own the task-menu window reference.');
assert.match(helper, /getMainWindow:\s*\(\)\s*=>\s*mainWindow/, 'mainRuntimeState should expose main-window reads.');
assert.match(helper, /setMainWindow:\s*\(win\)\s*=>\s*\{\s*mainWindow = win;\s*\}/, 'mainRuntimeState should expose main-window writes.');
assert.match(helper, /clearMainWindow:\s*\(\)\s*=>\s*\{\s*mainWindow = null;\s*\}/, 'mainRuntimeState should expose main-window clearing.');
assert.match(helper, /getTray:\s*\(\)\s*=>\s*tray/, 'mainRuntimeState should expose tray reads.');
assert.match(helper, /setTray:\s*\(nextTray\)\s*=>\s*\{\s*tray = nextTray;\s*\}/, 'mainRuntimeState should expose tray writes.');
assert.match(helper, /getTaskMenuWindow:\s*\(\)\s*=>\s*taskMenuWindow/, 'mainRuntimeState should expose task-menu window reads.');
assert.match(helper, /setTaskMenuWindow:\s*\(nextWindow\)\s*=>\s*\{\s*taskMenuWindow = nextWindow;\s*\}/, 'mainRuntimeState should expose task-menu window writes.');

assert.match(main, /from '\.\/mainRuntimeState'/, 'main should import the runtime-state helper.');
assert.match(main, /const runtimeState = createMainRuntimeState\(\)/, 'main should create the runtime-state helper.');
assert.doesNotMatch(main, /let mainWindow:\s*BrowserWindow \| null = null;/, 'main should not keep the mainWindow reference as a bare variable after extraction.');
assert.doesNotMatch(main, /let tray:\s*Tray \| null = null;/, 'main should not keep the tray reference as a bare variable after extraction.');
assert.doesNotMatch(main, /let taskMenuWindow:\s*BrowserWindow \| null = null;/, 'main should not keep the taskMenuWindow reference as a bare variable after extraction.');
assert.doesNotMatch(main, /mainWindow = win;/, 'main should not assign the main-window reference inline after extraction.');
assert.doesNotMatch(main, /mainWindow = null;/, 'main should not clear the main-window reference inline after extraction.');
assert.doesNotMatch(main, /tray = nextTray;/, 'main should not assign the tray reference inline after extraction.');
assert.doesNotMatch(main, /taskMenuWindow = nextWindow;/, 'main should not assign the task-menu window reference inline after extraction.');
assert.match(main, /getMainWindow:\s*runtimeState\.getMainWindow/, 'main should pass runtimeState.getMainWindow through composition boundaries.');
assert.match(composition, /setMainWindow:\s*runtimeState\.setMainWindow/, 'main-window composition should pass runtimeState.setMainWindow into startup.');
assert.match(main, /clearMainWindow:\s*runtimeState\.clearMainWindow/, 'main should pass runtimeState.clearMainWindow into lifecycle.');
assert.match(composition, /getTray:\s*runtimeState\.getTray/, 'main-window composition should pass runtimeState.getTray into shell and mode-controller boundaries.');
assert.match(composition, /setTray:\s*runtimeState\.setTray/, 'main-window composition should pass runtimeState.setTray into shell.');
assert.match(composition, /getTaskMenuWindow:\s*runtimeState\.getTaskMenuWindow/, 'main-window composition should pass runtimeState.getTaskMenuWindow into shell/bootstrap boundaries.');
assert.match(composition, /setTaskMenuWindow:\s*runtimeState\.setTaskMenuWindow/, 'main-window composition should pass runtimeState.setTaskMenuWindow into shell.');
assert.doesNotMatch(main, /getMainWindow:\s*\(\)\s*=>\s*mainWindow/, 'main should not keep ad hoc main-window getter callbacks after extraction.');
assert.doesNotMatch(main, /getTray:\s*\(\)\s*=>\s*tray/, 'main should not keep ad hoc tray getter callbacks after extraction.');
assert.doesNotMatch(main, /getTaskMenuWindow:\s*\(\)\s*=>\s*taskMenuWindow/, 'main should not keep ad hoc task-menu-window getter callbacks after extraction.');

assert.match(shellController, /getMainWindow\(\):\s*BrowserWindow \| null;/, 'mainShellController should continue to depend on runtime main-window reads.');
assert.match(shellController, /getTray\(\):\s*Tray \| null;/, 'mainShellController should continue to depend on runtime tray reads.');
assert.match(shellController, /setTray\(nextTray:\s*Tray \| null\):\s*void;/, 'mainShellController should continue to depend on runtime tray writes.');
assert.match(shellController, /getTaskMenuWindow\(\):\s*BrowserWindow \| null;/, 'mainShellController should continue to depend on runtime task-menu-window reads.');
assert.match(shellController, /setTaskMenuWindow\(nextWindow:\s*BrowserWindow \| null\):\s*void;/, 'mainShellController should continue to depend on runtime task-menu-window writes.');
assert.match(startup, /setMainWindow\(win:\s*BrowserWindow\):\s*void;/, 'mainWindowStartup should continue to receive main-window writes.');
assert.match(bootstrap, /getTaskMenuWindow\(\):\s*BrowserWindow \| null;/, 'mainWindowBootstrap should continue to receive task-menu-window reads.');
assert.match(lifecycle, /clearMainWindow\(\):\s*void;/, 'appLifecycle should continue to receive main-window clearing.');
assert.match(modeController, /getTray\(\):\s*Tray \| null;/, 'mainWindowModeController should continue to receive tray reads.');

assert.equal(
  scripts['verify:electron-main-runtime-state-module'],
  'tsx scripts/verify-electron-main-runtime-state-module.ts',
  'package.json should expose the focused runtime-state verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-runtime-state-module', 'cleanup-core should include the focused runtime-state verifier.');

console.log('electron main runtime-state module verification passed');

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'windowModeState.ts');
const mainPath = join(root, 'electron', 'main.ts');
const compositionPath = join(root, 'electron', 'mainWindowComposition.ts');
const modeControllerPath = join(root, 'electron', 'mainWindowModeController.ts');
const desktopWindowModePath = join(root, 'electron', 'desktopWindowMode.ts');
const shellControllerPath = join(root, 'electron', 'mainShellController.ts');
const bootstrapPath = join(root, 'electron', 'mainWindowBootstrap.ts');
const lifecyclePath = join(root, 'electron', 'appLifecycle.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron window-mode state module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const modeController = readFileSync(modeControllerPath, 'utf8');
const desktopWindowMode = readFileSync(desktopWindowModePath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const lifecycle = readFileSync(lifecyclePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /import type \{ WindowMode \} from '\.\.\/shared\/windowMode'/, 'windowModeState should import only the shared WindowMode type.');
assert.match(helper, /export type WindowModeState\b/, 'windowModeState should export the shared WindowModeState type.');
assert.match(helper, /getMode:\s*\(\)\s*=>\s*WindowMode;/, 'WindowModeState should expose a mode reader.');
assert.match(helper, /setMode:\s*\(mode:\s*WindowMode\)\s*=>\s*void;/, 'WindowModeState should expose a mode writer.');
assert.match(helper, /export function createWindowModeState\(initialMode:\s*WindowMode\):\s*WindowModeState/, 'windowModeState should export createWindowModeState with an explicit initial mode.');
assert.match(helper, /let mode = initialMode;/, 'windowModeState should own the process-local window-mode truth source.');
assert.match(helper, /getMode:\s*\(\)\s*=>\s*mode/, 'windowModeState should expose current-mode reads.');
assert.match(helper, /setMode:\s*\(nextMode\)\s*=>\s*\{\s*mode = nextMode;\s*\}/, 'windowModeState should expose current-mode writes.');

assert.match(main, /from '\.\/windowModeState'/, 'main should import window-mode state helpers.');
assert.match(main, /const windowModeState = createWindowModeState\('onTop'\)/, 'main should create the shared window-mode state helper with the existing onTop default.');
assert.doesNotMatch(main, /let windowMode:\s*WindowMode\s*=\s*'onTop';/, 'main should not keep windowMode as a bare mutable variable after extraction.');
assert.doesNotMatch(main, /setWindowModeState:\s*\(mode\)\s*=>\s*\{\s*windowMode = mode;\s*\}/, 'main should not keep an inline windowMode setter after extraction.');
assert.doesNotMatch(main, /getWindowMode:\s*\(\)\s*=>\s*windowMode/, 'main should not keep ad hoc windowMode getter callbacks after extraction.');
assert.match(main, /getWindowMode:\s*windowModeState\.getMode/, 'main should pass the shared window-mode reader through composition boundaries.');
assert.match(main, /setWindowModeState:\s*windowModeState\.setMode/, 'main should pass the shared window-mode writer into desktopWindowMode.');
assert.match(composition, /createMainWindowModeController\(\{/, 'main-window composition should keep the extracted mode controller boundary.');
assert.match(main, /createDesktopWindowModeController\(\{/, 'main should keep the desktop-window mode controller boundary.');
assert.match(composition, /createMainShellController\(\{/, 'main-window composition should keep the shell controller boundary.');
assert.match(composition, /createMainWindowBootstrap\(\{/, 'main-window composition should keep the main-window bootstrap boundary.');
assert.match(main, /registerAppLifecycleHandlers\(\{/, 'main should keep the app lifecycle boundary.');

assert.match(desktopWindowMode, /getWindowMode\(\):\s*WindowMode;/, 'desktopWindowMode should continue to depend on a mode reader callback.');
assert.match(desktopWindowMode, /setWindowModeState\(mode:\s*WindowMode\):\s*void;/, 'desktopWindowMode should continue to depend on a mode writer callback.');
assert.match(modeController, /applyWindowMode\(win,\s*mode\)/, 'mode controller should continue to apply mode changes through desktopWindowMode.');
assert.match(shellController, /getWindowMode\(\):\s*WindowMode;/, 'mainShellController should continue to depend on a mode reader callback.');
assert.match(bootstrap, /getWindowMode\(\):\s*WindowMode;/, 'mainWindowBootstrap should continue to depend on a mode reader callback.');
assert.match(lifecycle, /getWindowMode\(\):\s*WindowMode;/, 'appLifecycle should continue to depend on a mode reader callback.');

assert.equal(
  scripts['verify:electron-window-mode-state-module'],
  'tsx scripts/verify-electron-window-mode-state-module.ts',
  'package.json should expose the focused window-mode state verifier.',
);
assertCleanupCoreIncludes('verify:electron-window-mode-state-module', 'cleanup-core should include the focused window-mode state verifier.');

console.log('electron window-mode state module verification passed');

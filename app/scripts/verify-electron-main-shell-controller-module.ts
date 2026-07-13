import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/mainShellController.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main shell controller module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainShellController\b/, 'mainShellController should export createMainShellController.');
assert.match(helper, /type CreateMainShellControllerOptions\b/, 'mainShellController should define explicit controller dependencies.');
assert.match(helper, /showMainWindow\(\)/, 'mainShellController should own showMainWindow.');
assert.match(helper, /hideMainWindow\(\)/, 'mainShellController should own hideMainWindow.');
assert.match(helper, /refreshTrayMenu\(\)/, 'mainShellController should own refreshTrayMenu.');
assert.match(helper, /createTray\(\)/, 'mainShellController should own createTray.');
assert.match(helper, /closeTaskMenuWindow\(\)/, 'mainShellController should own closeTaskMenuWindow.');
assert.match(helper, /openTaskMenuWindow\(payload: TaskMenuPayload\)/, 'mainShellController should own openTaskMenuWindow.');
assert.match(helper, /from '\.\/trayMenu'/, 'mainShellController should depend on trayMenu for tray creation and refresh.');
assert.match(helper, /from '\.\/taskMenuWindow'/, 'mainShellController should depend on taskMenuWindow for popup creation.');
assert.match(helper, /refreshMainTrayMenu\(\{/, 'mainShellController should delegate tray menu refresh to trayMenu.');
assert.match(helper, /createMainTray\(\{/, 'mainShellController should delegate tray creation to trayMenu.');
assert.match(helper, /createTaskMenuWindow\(payload,\s*\{/, 'mainShellController should delegate popup creation to taskMenuWindow.');
assert.match(helper, /userHidden\.setHidden\(false\)/, 'mainShellController should clear the user-hidden flag when showing the main window.');
assert.match(helper, /userHidden\.setHidden\(true\)/, 'mainShellController should set the user-hidden flag when hiding the main window.');
assert.match(helper, /markDesktopInteractive\(\)/, 'mainShellController should preserve desktop-mode interaction promotion when showing the main window.');

assert.match(composition, /from '\.\/mainShellController'/, 'main-window composition should import the main shell controller helper.');
assert.match(composition, /const\s*\{\s*hideMainWindow,\s*createTray,\s*closeTaskMenuWindow,\s*openTaskMenuWindow,\s*refreshTrayMenu,\s*\}\s*=\s*createMainShellController\(\{/, 'main-window composition should create and destructure the main shell controller.');
assert.match(composition, /getTray:\s*runtimeState\.getTray/, 'main-window composition should inject runtimeState tray reads into the shell controller.');
assert.match(composition, /setTray:\s*runtimeState\.setTray/, 'main-window composition should inject runtimeState tray writes into the shell controller.');
assert.match(composition, /getTaskMenuWindow:\s*runtimeState\.getTaskMenuWindow/, 'main-window composition should inject runtimeState task-menu window reads into the shell controller.');
assert.match(composition, /setTaskMenuWindow:\s*runtimeState\.setTaskMenuWindow/, 'main-window composition should inject runtimeState task-menu window writes into the shell controller.');
assert.match(composition, /userHidden,/, 'main-window composition should inject the shared userHidden state into the shell controller.');
assert.doesNotMatch(composition, /function showMainWindow\(\) \{/, 'main-window composition should not define showMainWindow inline after extraction.');
assert.doesNotMatch(composition, /function hideMainWindow\(\) \{/, 'main-window composition should not define hideMainWindow inline after extraction.');
assert.doesNotMatch(composition, /function refreshTrayMenu\(\) \{/, 'main-window composition should not define refreshTrayMenu inline after extraction.');
assert.doesNotMatch(composition, /function createTray\(\) \{/, 'main-window composition should not define createTray inline after extraction.');
assert.doesNotMatch(composition, /function closeTaskMenuWindow\(\) \{/, 'main-window composition should not define closeTaskMenuWindow inline after extraction.');
assert.doesNotMatch(composition, /function openTaskMenuWindow\(payload: TaskMenuPayload\) \{/, 'main-window composition should not define openTaskMenuWindow inline after extraction.');

assert.equal(
  scripts['verify:electron-main-shell-controller-module'],
  'tsx scripts/verify-electron-main-shell-controller-module.ts',
  'package.json should expose the focused main shell controller verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-shell-controller-module', 'cleanup-core should include the focused main shell controller verifier.');

console.log('electron main shell controller module verification passed');

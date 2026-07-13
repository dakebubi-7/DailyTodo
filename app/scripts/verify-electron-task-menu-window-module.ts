import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/taskMenuWindow.ts');
const shellControllerPath = join(root, 'electron/mainShellController.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const mainPath = join(root, 'electron/main.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron task-menu window module should exist.');
assert.ok(existsSync(shellControllerPath), 'Electron main shell controller module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const shellController = readFileSync(shellControllerPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export const TASK_MENU_WIDTH = 320;/, 'Task-menu window module should own TASK_MENU_WIDTH.');
assert.match(helper, /export const TASK_MENU_HEIGHT = 360;/, 'Task-menu window module should own TASK_MENU_HEIGHT.');
assert.match(helper, /export function createTaskMenuWindow\b/, 'Task-menu window module should export createTaskMenuWindow.');
assert.match(helper, /type CreateTaskMenuWindowOptions\b/, 'Task-menu window module should define explicit creation dependencies.');
assert.match(helper, /screen\.getDisplayNearestPoint\(/, 'Task-menu window module should select the display nearest the popup trigger point.');
assert.doesNotMatch(helper, /const \{ workArea \} = screen\.getPrimaryDisplay\(\);/, 'Task-menu window module should not always clamp popup placement to the primary display.');
assert.match(helper, /new BrowserWindow\(\{/, 'Task-menu window module should own popup BrowserWindow creation.');
assert.match(helper, /roundedCorners:\s*true/, 'Task-menu window module should preserve rounded popup corners.');
assert.match(helper, /hasShadow:\s*false/, 'Task-menu window module should preserve disabled native shadow for the popup.');
assert.match(helper, /path\.join\(__dirname,\s*'preloadTaskMenu\.js'\)/, 'Task-menu window module should own the popup preload path.');
assert.match(helper, /loadRenderer\(menu,\s*\{\s*view:\s*'task-menu'/, 'Task-menu window module should load the task-menu renderer route.');
assert.match(helper, /menu\.setAlwaysOnTop\(true,\s*'screen-saver'\)/, 'Task-menu window module should preserve popup z-order behavior.');
assert.match(helper, /menu\.once\('ready-to-show',\s*\(\)\s*=>\s*menu\.show\(\)\)/, 'Task-menu window module should preserve ready-to-show popup display.');
assert.match(helper, /menu\.on\('blur',\s*\(\)\s*=>\s*onBlur\(\)\)/, 'Task-menu window module should preserve blur-to-close wiring.');
assert.match(helper, /menu\.on\('closed',\s*\(\)\s*=>\s*onClosed\(\)\)/, 'Task-menu window module should preserve closed cleanup wiring.');

assert.match(ipcRegistration, /from '\.\/taskMenuWindow'/, 'mainWindowIpcRegistration should keep the task-menu window constants import.');
assert.match(composition, /from '\.\/mainShellController'/, 'main-window composition should delegate popup shell actions through mainShellController.');
assert.match(main, /from '\.\/mainRuntimeState'/, 'main should import runtime state for task-menu window ownership.');
assert.match(composition, /getTaskMenuWindow:\s*runtimeState\.getTaskMenuWindow/, 'main-window composition should inject runtimeState task-menu window reads.');
assert.match(composition, /setTaskMenuWindow:\s*runtimeState\.setTaskMenuWindow/, 'main-window composition should inject runtimeState task-menu window writes.');
assert.match(shellController, /from '\.\/taskMenuWindow'/, 'mainShellController should import task-menu window helpers from taskMenuWindow.');
assert.match(shellController, /const menu = createTaskMenuWindow\(payload,\s*\{/, 'mainShellController should delegate popup creation through createTaskMenuWindow.');
assert.match(shellController, /setTaskMenuWindow\(menu\);/, 'mainShellController should retain popup ownership in main through injected setters.');
assert.match(shellController, /if \(getTaskMenuWindow\(\) === menu\)\s*\{\s*setTaskMenuWindow\(null\);/, 'mainShellController should preserve guarded popup cleanup through injected state setters.');
assert.match(ipcRegistration, /defaultTaskMenuHeight:\s*TASK_MENU_HEIGHT,/, 'mainWindowIpcRegistration should keep using TASK_MENU_HEIGHT for resize fallback wiring.');
assert.doesNotMatch(main, /function openTaskMenuWindow\(payload: TaskMenuPayload\) \{/, 'main should not keep openTaskMenuWindow inline after shell-controller extraction.');
assert.doesNotMatch(main, /const TASK_MENU_WIDTH = 320;/, 'main should not inline TASK_MENU_WIDTH after extraction.');
assert.doesNotMatch(main, /const TASK_MENU_HEIGHT = 360;/, 'main should not inline TASK_MENU_HEIGHT after extraction.');
assert.doesNotMatch(shellController, /new BrowserWindow\(/, 'mainShellController should not create the task-menu popup BrowserWindow inline.');

assert.equal(scripts['verify:electron-task-menu-window-module'], 'tsx scripts/verify-electron-task-menu-window-module.ts', 'package.json should expose the focused task-menu window verifier.');
assertCleanupCoreIncludes('verify:electron-task-menu-window-module', 'cleanup-core should include the focused task-menu window verifier.');

assert.match(helper, /sandbox:\s*true/, 'Task-menu window module should enable renderer sandbox.');
assert.match(helper, /hardenRendererNavigation\(menu\)/, 'Task-menu window module should harden renderer navigation.');
console.log('electron task-menu window module verification passed');

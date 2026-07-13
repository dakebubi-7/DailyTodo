import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const mainPath = join(root, 'electron/main.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const preloadPath = join(root, 'electron/preload.ts');
const taskContextMenuIpcPath = join(root, 'electron/taskContextMenuIpc.ts');
const viteEnvPath = join(root, 'src/vite-env.d.ts');

const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');

assert.ok(existsSync(taskContextMenuIpcPath), 'Electron task context menu IPC module should exist.');

const taskContextMenuIpc = readFileSync(taskContextMenuIpcPath, 'utf8');

assert.match(taskContextMenuIpc, /export function registerTaskContextMenuIpcHandlers\b/, 'taskContextMenuIpc should export registerTaskContextMenuIpcHandlers.');
assert.match(taskContextMenuIpc, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'taskContextMenuIpc should reuse the Electron object-record predicate.');
assert.doesNotMatch(taskContextMenuIpc, /function isObjectRecord\(value: unknown\)/, 'taskContextMenuIpc should not retain a duplicate local object predicate.');
assert.match(taskContextMenuIpc, /type RegisterTaskContextMenuIpcHandlersOptions\b/, 'taskContextMenuIpc should define explicit registration dependencies.');
assert.match(taskContextMenuIpc, /getTaskMenuWindow\(\)/, 'taskContextMenuIpc should receive the current task menu window through dependency injection.');
assert.match(taskContextMenuIpc, /getMainWindow\(\)/, 'taskContextMenuIpc should receive the main window through dependency injection.');
assert.match(taskContextMenuIpc, /defaultTaskMenuHeight/, 'taskContextMenuIpc should receive the default task menu height instead of owning popup creation constants.');
assert.match(taskContextMenuIpc, /screen\.getPrimaryDisplay\(\)/, 'taskContextMenuIpc should preserve resize work-area clamping.');
assert.match(
  taskContextMenuIpc,
  /function isTaskMenuPayload\(value: unknown\): value is TaskMenuPayload/,
  'taskContextMenuIpc should define a runtime guard for task menu open payloads.',
);
assert.ok(
  !/function isTaskMenuPayload[\s\S]*?const record = value as Record<string, unknown>;[\s\S]*?function isTaskMenuActionPayload/.test(taskContextMenuIpc),
  'taskContextMenuIpc open payload guard should narrow with a record guard instead of casting value as Record<string, unknown>.',
);
assert.match(
  taskContextMenuIpc,
  /Number\.isFinite\(record\.screenX\)[\s\S]*Number\.isFinite\(record\.screenY\)/,
  'taskContextMenuIpc open payload guard should require finite screen coordinates before popup creation.',
);
assert.match(
  taskContextMenuIpc,
  /taskContextMenu:open'[\s\S]*payload: unknown[\s\S]*if \(!isTaskMenuPayload\(payload\)\) return;[\s\S]*openTaskMenuWindow\(payload\)/,
  'taskContextMenuIpc should reject malformed runtime open payloads before creating the popup window.',
);
assert.doesNotMatch(
  taskContextMenuIpc,
  /Number\(height\) \|\| defaultTaskMenuHeight/,
  'taskContextMenuIpc resize should not coerce malformed runtime height values with Number(...).',
);
assert.match(
  taskContextMenuIpc,
  /const rawHeight = typeof height === 'number' && Number\.isFinite\(height\) \? height : defaultTaskMenuHeight;/,
  'taskContextMenuIpc resize should accept only finite numeric runtime heights before clamping.',
);
assert.match(
  taskContextMenuIpc,
  /taskContextMenu:resize'[\s\S]*height: unknown[\s\S]*const rawHeight = typeof height === 'number'/,
  'taskContextMenuIpc resize handler should expose unknown runtime heights before narrowing.',
);
assert.match(taskContextMenuIpc, /Math\.round\(Math\.max\(80, Math\.min\(600, rawHeight\)\)\)/, 'taskContextMenuIpc should preserve resize height clamping and fallback.');
assert.match(taskContextMenuIpc, /const currentBounds = taskMenuWindow\.getBounds\(\);\s*if \(currentBounds\.height === h\) return;/, 'taskContextMenuIpc should avoid applying unchanged popup heights.');
assert.match(taskContextMenuIpc, /setBounds\(\{ x: bounds\.x, y, width: bounds\.width, height: h \}\)/, 'taskContextMenuIpc should resize the popup without changing x or width.');
assert.match(
  taskContextMenuIpc,
  /function isTaskMenuActionPayload\(value: unknown\): value is TaskMenuActionPayload/,
  'taskContextMenuIpc should define a runtime guard for forwarded menu action payloads.',
);
assert.ok(
  !/function isTaskMenuActionPayload[\s\S]*?const record = value as Record<string, unknown>;[\s\S]*?export function registerTaskContextMenuIpcHandlers/.test(taskContextMenuIpc),
  'taskContextMenuIpc action payload guard should narrow with a record guard instead of casting value as Record<string, unknown>.',
);
assert.match(
  taskContextMenuIpc,
  /typeof record\.taskId === 'string' && record\.taskId\.trim\(\)[\s\S]*isObjectRecord\(updates\)/,
  'taskContextMenuIpc action payload guard should require a non-empty taskId and object-shaped updates.',
);
assert.match(
  taskContextMenuIpc,
  /taskContextMenu:action'[\s\S]*if \(!isTaskMenuActionPayload\(payload\)\) \{[\s\S]*closeTaskMenuWindow\(\);[\s\S]*return;[\s\S]*\}[\s\S]*webContents\.send\('taskContextMenu:action', payload\)/,
  'taskContextMenuIpc should reject malformed action payloads before forwarding them to the main window.',
);
assert.match(taskContextMenuIpc, /webContents\.send\('taskContextMenu:action', payload\)/, 'taskContextMenuIpc should forward valid menu actions to the main window.');
assert.match(
  viteEnv,
  /openTaskContextMenu:\s*\(payload:\s*unknown\)\s*=>\s*Promise<void>/s,
  'openTaskContextMenu should expose unknown payloads at the ambient preload boundary.',
);
assert.match(
  preload,
  /resizeTaskContextMenu:\s*\(height:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('taskContextMenu:resize', height\)/,
  'preload resizeTaskContextMenu should forward unknown runtime heights.',
);
assert.match(
  viteEnv,
  /resizeTaskContextMenu:\s*\(height:\s*unknown\)\s*=>\s*Promise<void>/,
  'resizeTaskContextMenu should expose unknown heights at the ambient preload boundary.',
);

for (const channel of [
  'taskContextMenu:open',
  'taskContextMenu:close',
  'taskContextMenu:resize',
  'taskContextMenu:action',
]) {
  const registrationPattern = new RegExp("ipcMain\\.handle\\('" + channel + "'");
  assert.match(taskContextMenuIpc, registrationPattern, `taskContextMenuIpc should register ${channel}.`);
  assert.doesNotMatch(main, registrationPattern, `main should not register ${channel} inline.`);
}

assert.match(composition, /from '\.\/mainWindowBootstrap'/, 'main-window composition should import the bootstrap helper that wires task context menu IPC.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate task context-menu IPC registration through the focused IPC composition helper.');
assert.match(ipcRegistration, /from '\.\/taskContextMenuIpc'/, 'mainWindowIpcRegistration should import task context menu IPC registration from taskContextMenuIpc.');
assert.match(ipcRegistration, /registerTaskContextMenuIpcHandlers\(/, 'mainWindowIpcRegistration should call registerTaskContextMenuIpcHandlers.');
assert.doesNotMatch(taskContextMenuIpc, /new BrowserWindow\(/, 'taskContextMenuIpc should not create or own the popup BrowserWindow.');
assert.doesNotMatch(taskContextMenuIpc, /loadRenderer\(/, 'taskContextMenuIpc should not own renderer loading.');

console.log('electron task context menu IPC module verification passed');

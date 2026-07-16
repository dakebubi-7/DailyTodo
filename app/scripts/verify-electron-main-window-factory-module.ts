import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/mainWindowFactory.ts');
const bootstrapPath = join(root, 'electron/mainWindowBootstrap.ts');
const ipcRegistrationPath = join(root, 'electron/mainWindowIpcRegistration.ts');
const startupPath = join(root, 'electron/mainWindowStartup.ts');
const mainPath = join(root, 'electron/main.ts');
const compositionPath = join(root, 'electron/mainWindowComposition.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron main-window factory module should exist.');
assert.ok(existsSync(bootstrapPath), 'Electron main-window bootstrap module should exist.');
assert.ok(existsSync(startupPath), 'Electron main-window startup module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const startup = readFileSync(startupPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function createMainBrowserWindow\b/, 'mainWindowFactory should export createMainBrowserWindow.');
assert.match(helper, /export function setupMainBrowserWindow\b/, 'mainWindowFactory should export setupMainBrowserWindow.');
assert.match(helper, /type CreateMainBrowserWindowOptions\b/, 'mainWindowFactory should define explicit window-creation dependencies.');
assert.match(helper, /type SetupMainBrowserWindowOptions\b/, 'mainWindowFactory should define explicit setup dependencies.');
assert.match(helper, /new BrowserWindow\(\{/, 'mainWindowFactory should own main BrowserWindow creation.');
assert.match(helper, /minWidth:\s*minWindowWidth/, 'mainWindowFactory should preserve the minimum width wiring.');
assert.match(helper, /minHeight:\s*480/, 'mainWindowFactory should preserve the minimum height.');
assert.match(helper, /frame:\s*false/, 'mainWindowFactory should preserve frameless main-window creation.');
assert.match(helper, /export function getMainWindowVisualOptions\b/, 'mainWindowFactory should expose platform-specific native visual options.');
assert.match(helper, /platform === 'win32'/, 'Windows should use the native Acrylic-compatible window path.');
assert.match(helper, /shouldPreferWin32AcrylicFallback/, 'Windows visual options should branch between Win10 Win32 Acrylic and Win11 Electron Acrylic.');
assert.match(helper, /transparent:\s*false/, 'Windows 11 Electron Acrylic should use an opaque native BrowserWindow surface.');
assert.match(helper, /backgroundColor:\s*'#F2F2F2'/, 'Windows 11 Electron Acrylic should start from a neutral native surface color.');
assert.match(helper, /transparent:\s*true/, 'Windows 10 and non-Windows platforms should preserve transparent fallback window creation.');
assert.match(helper, /backgroundColor:\s*'#00000000'/, 'Windows 10 and non-Windows platforms should preserve transparent fallback backgrounds.');
assert.match(helper, /skipTaskbar:\s*true/, 'mainWindowFactory should preserve skipTaskbar default.');
assert.match(helper, /alwaysOnTop:\s*initialAlwaysOnTop/, 'mainWindowFactory should preserve initial always-on-top wiring.');
assert.match(helper, /preload:\s*path\.join\(__dirname,\s*'preload\.js'\)/, 'mainWindowFactory should own the preload path.');
assert.match(helper, /backgroundThrottling:\s*false/, 'mainWindowFactory should preserve disabled background throttling.');
assert.match(helper, /applyNativeBackgroundMaterial\(win\)/, 'mainWindowFactory should apply native background material.');
assert.match(helper, /applyToolWindowStyle\(win\)/, 'mainWindowFactory should apply the tool-window style.');
assert.match(helper, /scheduleAiTimers\(\)/, 'mainWindowFactory should keep the AI timer setup in the main-window bootstrap order.');
assert.match(helper, /createTray\(\)/, 'mainWindowFactory should keep tray creation in the main-window bootstrap order.');
assert.match(helper, /loadMainRenderer\(\)/, 'mainWindowFactory should keep the main renderer load in the bootstrap order.');
assert.match(helper, /registerMainWindowEvents\(\)/, 'mainWindowFactory should register main-window events during bootstrap.');
assert.match(helper, /registerWindowIpc\(\)/, 'mainWindowFactory should register window IPC during bootstrap.');
assert.match(helper, /registerSettingsIpc\(\)/, 'mainWindowFactory should register settings IPC during bootstrap.');
assert.match(helper, /registerTaskContextMenuIpc\(\)/, 'mainWindowFactory should register task context-menu IPC during bootstrap.');
assert.match(helper, /registerCompanionIpc\(\)/, 'mainWindowFactory should register companion IPC during bootstrap.');
assert.match(helper, /registerAiReviewIpc\(\)/, 'mainWindowFactory should register AI review IPC during bootstrap.');
assert.match(helper, /registerObsidianIpc\(\)/, 'mainWindowFactory should register Obsidian IPC during bootstrap.');

assert.match(startup, /from '\.\/mainWindowFactory'/, 'mainWindowStartup should import main-window factory helpers from mainWindowFactory.');
assert.match(startup, /const win = createMainBrowserWindow\(\{/, 'mainWindowStartup should delegate BrowserWindow creation through createMainBrowserWindow.');
assert.match(startup, /setupMainBrowserWindow\(win,\s*createBootstrap\(win\)\)/, 'mainWindowStartup should delegate fixed main-window setup through the injected bootstrap builder and factory helper.');
assert.match(composition, /from '\.\/mainWindowBootstrap'/, 'main-window composition should import bootstrap callback assembly from mainWindowBootstrap.');
assert.match(main, /from '\.\/mainRuntimeState'/, 'main should import runtime state for main-window ownership.');
assert.match(composition, /setMainWindow:\s*runtimeState\.setMainWindow/, 'main-window composition should inject runtimeState.setMainWindow into startup.');
assert.doesNotMatch(main, /const win = createMainBrowserWindow\(\{/, 'main should not create the main BrowserWindow inline after startup extraction.');
assert.doesNotMatch(main, /setupMainBrowserWindow\(win,\s*createBootstrap\(win\)\)/, 'main should not call main-window factory bootstrap inline after startup extraction.');
assert.doesNotMatch(main, /new BrowserWindow\(/, 'main should not create the main BrowserWindow inline after extraction.');
assert.match(bootstrap, /loadMainRenderer:\s*\(\)\s*=>\s*loadRenderer\(win,\s*\{\s*view:\s*'main'\s*\}\s*\)/, 'mainWindowBootstrap should pass main-renderer loading into the factory bootstrap as an explicit callback.');
assert.match(bootstrap, /registerMainWindowEvents:\s*\(\)\s*=>\s*registerMainWindowEventHandlers\(\{/, 'mainWindowBootstrap should pass event wiring into the factory bootstrap as an explicit callback.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate IPC callback construction to the focused registration helper.');
assert.match(bootstrap, /\.\.\.createMainWindowIpcRegistrations\(/, 'mainWindowBootstrap should spread IPC callbacks into the factory bootstrap shape.');
assert.match(ipcRegistration, /registerWindowIpc:\s*\(\)\s*=>\s*registerWindowIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the window IPC callback.');
assert.match(ipcRegistration, /registerSettingsIpc:\s*\(\)\s*=>\s*registerSettingsIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the settings IPC callback.');
assert.match(ipcRegistration, /registerTaskContextMenuIpc:\s*\(\)\s*=>\s*registerTaskContextMenuIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the task context-menu IPC callback.');
assert.match(ipcRegistration, /registerCompanionIpc:\s*\(\)\s*=>\s*registerCompanionIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the companion IPC callback.');
assert.match(ipcRegistration, /registerAiReviewIpc:\s*\(\)\s*=>\s*registerAiReviewIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the AI review IPC callback.');
assert.match(ipcRegistration, /registerObsidianIpc:\s*\(\)\s*=>\s*registerObsidianIpcHandlers\(\{/, 'mainWindowIpcRegistration should construct the Obsidian IPC callback.');

assert.equal(
  scripts['verify:electron-main-window-factory-module'],
  'tsx scripts/verify-electron-main-window-factory-module.ts',
  'package.json should expose the focused main-window factory verifier.',
);
assertCleanupCoreIncludes('verify:electron-main-window-factory-module', 'cleanup-core should include the focused main-window factory verifier.');

assert.match(helper, /sandbox:\s*true/, 'mainWindowFactory should enable renderer sandbox.');
assert.match(helper, /nodeIntegration:\s*false/, 'mainWindowFactory should disable nodeIntegration.');
assert.match(helper, /contextIsolation:\s*true/, 'mainWindowFactory should enable contextIsolation.');
console.log('electron main-window factory module verification passed');

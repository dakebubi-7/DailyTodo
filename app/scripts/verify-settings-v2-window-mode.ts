import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const bootstrap = readFileSync(join(root, 'electron/mainWindowBootstrap.ts'), 'utf8');
const bootstrapTypes = readFileSync(join(root, 'electron/mainWindowBootstrapTypes.ts'), 'utf8');
const ipcRegistration = readFileSync(join(root, 'electron/mainWindowIpcRegistration.ts'), 'utf8');
const settingsModeState = readFileSync(join(root, 'electron/settingsModeState.ts'), 'utf8');
const windowIpc = readFileSync(join(root, 'electron/windowIpc.ts'), 'utf8');
const windowState = readFileSync(join(root, 'electron/windowState.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const appRuntimeEffects = readFileSync(join(root, 'src/app/useAppRuntimeEffects.ts'), 'utf8');

assert.match(main, /createSettingsModeState\(\{ initialRestoreWidth: RESET_WINDOW_WIDTH \}\)/, 'main should create shared settings-mode state.');
assert.match(main, /settingsMode,/, 'main should pass settings mode state into window bootstrap.');
assert.doesNotMatch(main, /let settingsModeOpen\s*=\s*false/, 'main should not track settings-mode open state inline after extraction.');
assert.doesNotMatch(main, /ipcMain\.handle\('window:setSettingsMode'/, 'main should not register window:setSettingsMode inline after extraction.');
assert.match(settingsModeState, /export type SettingsModeState\b/, 'settingsModeState should export the shared settings-mode state type.');
assert.match(settingsModeState, /let open = false/, 'settingsModeState should own the open flag.');
assert.match(settingsModeState, /let restoreWidth = initialRestoreWidth/, 'settingsModeState should remember the previous compact width.');
assert.match(bootstrapTypes, /from '\.\/settingsModeState'/, 'bootstrap dependency types should depend on the shared settings-mode state type.');
assert.match(bootstrapTypes, /settingsMode:\s*SettingsModeState;/, 'bootstrap dependency types should receive settings-mode state explicitly.');
assert.match(bootstrap, /from '\.\/mainWindowBootstrapTypes'/, 'bootstrap should depend on its focused dependency contract.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'bootstrap should delegate settings-mode IPC composition through the focused helper.');
assert.match(ipcRegistration, /registerWindowIpcHandlers\([\s\S]*settingsMode,/, 'mainWindowIpcRegistration should pass settings-mode state into window IPC registration.');
assert.match(windowIpc, /from '\.\/windowState'/, 'windowIpc should import settings window helpers from windowState.');
assert.match(windowIpc, /ipcMain\.handle\('window:setSettingsMode'/, 'windowIpc should register window:setSettingsMode.');
assert.match(windowIpc, /const shouldOpenSettings = open === true/, 'windowIpc should narrow runtime settings-mode inputs with strict true.');
assert.match(windowIpc, /const width = getSettingsWindowWidth\(workArea\.width\);/, 'open width should use settings window width helper.');
assert.match(windowIpc, /win\.setMinimumSize\(width,\s*RESET_WINDOW_HEIGHT\)/, 'opening settings should raise the minimum window width.');
assert.match(windowIpc, /win\.setMinimumSize\(MIN_WINDOW_WIDTH,\s*RESET_WINDOW_HEIGHT\)/, 'closing or resetting settings should restore compact minimum size.');
assert.match(windowIpc, /if \(!settingsMode\.isOpen\(\)\) \{\s*return \{ ok: true, width: bounds\.width \};\s*\}/, 'closing before opening should be a no-op.');
assert.doesNotMatch(windowIpc, /if \(open\) \{/, 'windowIpc should not use broad truthiness for runtime settings-mode input.');
assert.doesNotMatch(main, /function getSettingsWindowWidth\b/, 'main should not define getSettingsWindowWidth inline after extraction.');
assert.doesNotMatch(main, /const SETTINGS_WINDOW_WIDTH\b/, 'main should not own the settings window width constant after extraction.');
assert.match(windowState, /const SETTINGS_WINDOW_WIDTH\s*=\s*800/, 'windowState should define settings window width');
assert.match(windowState, /export function getSettingsWindowWidth\(workAreaWidth: number\)/, 'windowState should centralize settings window width calculation');
assert.match(windowState, /Math\.min\(SETTINGS_WINDOW_WIDTH,\s*Math\.max\(MIN_WINDOW_WIDTH,\s*workAreaWidth - 40\)\)/, 'settings width should clamp to work area');
assert.match(preload, /setSettingsMode:\s*\(open: unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setSettingsMode', open\)/, 'preload should forward runtime settings-mode values as unknown.');
assert.match(viteEnv, /setSettingsMode:\s*\(open: unknown\)\s*=>\s*Promise<unknown>/, 'vite-env should expose unknown settings-mode inputs and return values.');
assert.doesNotMatch(viteEnv, /setSettingsMode:\s*\(open:\s*unknown\)\s*=>\s*Promise<\{ ok: boolean; width\?: number \}>/, 'vite-env should not claim trusted settings-mode result objects.');
assert.match(appRuntimeEffects, /syncSettingsMode\(appState\.settingsOpen\)/, 'App runtime effects should sync settingsOpen to Electron through the shell effects helper.');


const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
assert.match(
  globalsCss,
  /\.settings-panel\s*\{[\s\S]*?left:\s*15rem;[\s\S]*?right:\s*0\.75rem;/,
  'Settings panel should keep a fixed compact left strip for the main todo UI.',
);
assert.doesNotMatch(
  globalsCss,
  /left:\s*max\(15rem,\s*calc\(100% - 34rem/,
  'Settings panel must not grow the left main strip when the settings window is wider.',
);

console.log('verify-settings-v2-window-mode passed');

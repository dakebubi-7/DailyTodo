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
const windowIpcPath = join(root, 'electron/windowIpc.ts');
const viteEnvPath = join(root, 'src/vite-env.d.ts');
const settingsControlsPath = join(root, 'src/components/settings/SettingsControls.tsx');
const appUiStatePersistencePath = join(root, 'src/app/appUiStatePersistence.ts');
const titleBarPath = join(root, 'src/components/TitleBar.tsx');
const titleBarWindowModePath = join(root, 'src/components/useTitleBarWindowMode.ts');
const titleBarMoreMenuPath = join(root, 'src/components/useTitleBarMoreMenu.ts');

const main = readFileSync(mainPath, 'utf8');
const composition = readFileSync(compositionPath, 'utf8');
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const ipcRegistration = readFileSync(ipcRegistrationPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const settingsControls = readFileSync(settingsControlsPath, 'utf8');
const appUiStatePersistence = readFileSync(appUiStatePersistencePath, 'utf8');
const titleBar = readFileSync(titleBarPath, 'utf8');
assert.ok(existsSync(titleBarWindowModePath), 'TitleBar window-mode subscriptions should live in a focused hook.');
const titleBarWindowMode = readFileSync(titleBarWindowModePath, 'utf8');
assert.ok(existsSync(titleBarMoreMenuPath), 'TitleBar more-menu lifecycle should live in a focused hook.');
const titleBarMoreMenu = readFileSync(titleBarMoreMenuPath, 'utf8');

assert.ok(existsSync(windowIpcPath), 'Electron window IPC module should exist.');

const windowIpc = readFileSync(windowIpcPath, 'utf8');

assert.match(windowIpc, /export function registerWindowIpcHandlers\b/, 'windowIpc should export registerWindowIpcHandlers.');
assert.match(windowIpc, /export function applyConfiguredGlassAndRoundedShape\b/, 'windowIpc should expose the invisible-glass application result helper.');
assert.match(
  windowIpc,
  /const nativeGlassApplied = setConfiguredGlass\(normalizeInvisibleGlassPayload\(payload\)\) === true;/,
  'windowIpc should derive native-glass status from the actual performance-frost application result.',
);
assert.match(windowIpc, /return \{ nativeGlassApplied \};/, 'windowIpc should return the native-glass status to the renderer.');
assert.match(
  windowIpc,
  /ipcMain\.handle\('window:setInvisibleGlass',[\s\S]*?return applyConfiguredGlassAndRoundedShape\(/,
  'window:setInvisibleGlass should return the applied native-glass result instead of assuming success.',
);
assert.match(
  bootstrap,
  /notifyNativeGlassApplied: \(applied\) => \{[\s\S]*?window:nativeGlassAppliedChanged[\s\S]*?applied/,
  'main-window bootstrap should publish native-material outcome changes through a dedicated channel.',
);
assert.doesNotMatch(
  bootstrap,
  /notifyRenderer: \(active\) => \{[^}]*window:nativeGlassAppliedChanged/,
  'native material state must not be conflated with the performance-frost channel.',
);
assert.doesNotMatch(
  bootstrap,
  /notifyNativeGlassApplied: \(applied\) => \{[^}]*window:performanceFrostChanged/,
  'native material outcome notifications must not reuse the performance-frost channel.',
);
assert.match(
  preload,
  /onNativeGlassAppliedChanged: \(callback: \(applied: boolean\) => void\) => \{[\s\S]*?ipcRenderer\.on\('window:nativeGlassAppliedChanged', listener\)/,
  'preload should expose the dedicated native-material outcome listener.',
);
assert.match(
  viteEnv,
  /onNativeGlassAppliedChanged: \(callback: \(applied: boolean\) => void\) => \(\) => void/,
  'ambient renderer typings should expose the native-material outcome listener.',
);
assert.match(windowIpc, /type RegisterWindowIpcHandlersOptions\b/, 'windowIpc should define explicit registration dependencies.');
assert.match(windowIpc, /BrowserWindow/, 'windowIpc should type the target BrowserWindow dependency.');
assert.match(windowIpc, /ElectronStoreLike/, 'windowIpc should use a small store interface instead of owning store creation.');
assert.match(windowIpc, /import \{[^}]*isWindowMode[^}]*togglePinnedMode[^}]*type WindowMode[^}]*\} from '\.\.\/shared\/windowMode'/s, 'windowIpc should import the shared window-mode runtime guard.');

for (const channel of [
  'window:minimize',
  'window:close',
  'window:getWindowMode',
  'window:setWindowMode',
  'window:getAlwaysOnTop',
  'window:toggleAlwaysOnTop',
  'window:resetPosition',
  'window:setSettingsMode',
  'window:getLockWindowPosition',
  'window:setLockWindowPosition',
  'window:setCompactMode',
  'window:getCompactMode',
  'window:getAutoStart',
  'window:setAutoStart',
]) {
  assert.match(windowIpc, new RegExp(`ipcMain\\.handle\\('${channel.replace(':', ':')}'`), `windowIpc should register ${channel}.`);
  assert.doesNotMatch(main, new RegExp(`ipcMain\\.handle\\('${channel.replace(':', ':')}'`), `main should not register ${channel} inline.`);
}

assert.match(composition, /from '\.\/mainWindowBootstrap'/, 'main-window composition should import the bootstrap helper that wires window IPC.');
assert.match(bootstrap, /from '\.\/mainWindowIpcRegistration'/, 'mainWindowBootstrap should delegate window IPC registration through the focused IPC composition helper.');
assert.match(ipcRegistration, /from '\.\/windowIpc'/, 'mainWindowIpcRegistration should import window IPC registration from windowIpc.');
assert.match(ipcRegistration, /registerWindowIpcHandlers\(/, 'mainWindowIpcRegistration should call registerWindowIpcHandlers.');
assert.match(windowIpc, /togglePinnedMode/, 'windowIpc should preserve legacy always-on-top toggle semantics.');
assert.match(
  windowIpc,
  /window:setWindowMode'[\s\S]*if \(!isWindowMode\(mode\)\) \{[\s\S]*return getWindowMode\(\);[\s\S]*setWindowMode\(win, mode\)/,
  'windowIpc should narrow runtime window-mode values before calling setWindowMode.',
);
assert.match(
  windowIpc,
  /window:setWindowMode'[\s\S]*mode: unknown[\s\S]*if \(!isWindowMode\(mode\)\)/,
  'windowIpc window-mode setter should expose unknown runtime modes before narrowing.',
);
assert.match(
  preload,
  /setWindowMode:\s*\(mode:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setWindowMode', mode\)/,
  'preload setWindowMode should forward unknown runtime modes.',
);
assert.match(
  viteEnv,
  /setWindowMode:\s*\(mode:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'setWindowMode should expose unknown modes and unknown return values at the ambient preload boundary.',
);
assert.match(
  viteEnv,
  /getWindowMode:\s*\(\)\s*=>\s*Promise<unknown>/,
  'getWindowMode should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /getWindowMode:\s*\(\)\s*=>\s*Promise<import\('\.\.\/shared\/windowMode'\)\.WindowMode>/,
  'getWindowMode should not claim a trusted WindowMode return.',
);
assert.doesNotMatch(
  viteEnv,
  /setWindowMode:\s*\(mode:\s*unknown\)\s*=>\s*Promise<import\('\.\.\/shared\/windowMode'\)\.WindowMode>/,
  'setWindowMode should not claim a trusted WindowMode return.',
);
assert.match(windowIpc, /getSettingsWindowWidth/, 'windowIpc should preserve settings-mode sizing logic.');
assert.match(
  windowIpc,
  /window:setSettingsMode'[\s\S]*open: unknown[\s\S]*const shouldOpenSettings = open === true/,
  'windowIpc settings-mode setter should expose unknown runtime open values before strict boolean narrowing.',
);
assert.match(
  preload,
  /setSettingsMode:\s*\(open:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setSettingsMode', open\)/,
  'preload setSettingsMode should forward unknown runtime open values.',
);
assert.match(
  viteEnv,
  /setSettingsMode:\s*\(open:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'setSettingsMode should expose unknown open values and unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /setSettingsMode:\s*\(open:\s*unknown\)\s*=>\s*Promise<\{ ok: boolean; width\?: number \}>/,
  'setSettingsMode should not claim trusted settings-mode result objects at the ambient preload boundary.',
);
assert.doesNotMatch(
  windowIpc,
  /if \(open\) \{/,
  'windowIpc settings-mode setter should not use broad truthiness for runtime IPC input.',
);
assert.match(
  windowIpc,
  /const shouldOpenSettings = open === true;[\s\S]*if \(shouldOpenSettings\) \{/,
  'windowIpc settings-mode setter should open only for a strict true runtime value.',
);
assert.doesNotMatch(
  windowIpc,
  /lockWindowPosition: Boolean\(locked\)/,
  'windowIpc lock-position setter should not coerce malformed truthy runtime values to true.',
);
assert.match(
  windowIpc,
  /window:setLockWindowPosition'[\s\S]*locked: unknown[\s\S]*const nextLockWindowPosition = locked === true/,
  'windowIpc lock-position setter should expose unknown runtime locked values before strict boolean narrowing.',
);
assert.match(
  preload,
  /setLockWindowPosition:\s*\(locked:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setLockWindowPosition', locked\)/,
  'preload setLockWindowPosition should forward unknown runtime locked values.',
);
assert.match(
  viteEnv,
  /getAlwaysOnTop:\s*\(\)\s*=>\s*Promise<unknown>/,
  'getAlwaysOnTop should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /getAlwaysOnTop:\s*\(\)\s*=>\s*Promise<boolean>/,
  'getAlwaysOnTop should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  viteEnv,
  /toggleAlwaysOnTop:\s*\(\)\s*=>\s*Promise<unknown>/,
  'toggleAlwaysOnTop should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /toggleAlwaysOnTop:\s*\(\)\s*=>\s*Promise<boolean>/,
  'toggleAlwaysOnTop should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(titleBar, /await toggleAlwaysOnTop\(\);/, 'TitleBar should delegate pin toggling to its window-mode hook.');
assert.match(
  titleBarWindowMode,
  /function setPinnedIfChanged\([\s\S]*if \(pinnedRef\.current === nextPinned\) return;[\s\S]*pinnedRef\.current = nextPinned;[\s\S]*setPinned\(nextPinned\)/,
  'TitleBar window-mode hook should retain the current pinned state reference when a refresh reports the same value.',
);
assert.match(titleBar, /from '\.\/useTitleBarWindowMode'/, 'TitleBar should compose its focused window-mode subscription hook.');
assert.match(titleBarWindowMode, /export function useTitleBarWindowMode\(\)/, 'TitleBar window-mode hook should expose the pinned state and toggle action.');
assert.match(titleBarWindowMode, /onWindowModeChanged/, 'TitleBar window-mode hook should retain IPC mode-change subscription behavior.');
assert.doesNotMatch(titleBar, /onWindowModeChanged/, 'TitleBar should not keep window-mode IPC subscription wiring after hook extraction.');
assert.doesNotMatch(titleBar, /event\.target as HTMLElement/, 'TitleBar should narrow pointer event targets with an Element guard instead of casting.');
assert.match(titleBar, /from '\.\/useTitleBarMoreMenu'/, 'TitleBar should compose its focused more-menu lifecycle hook.');
assert.match(titleBarMoreMenu, /event\.target instanceof Element \? event\.target : null/, 'TitleBar more-menu hook should guard pointer event targets before closest() checks.');
assert.match(
  viteEnv,
  /getLockWindowPosition:\s*\(\)\s*=>\s*Promise<unknown>/,
  'getLockWindowPosition should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /getLockWindowPosition:\s*\(\)\s*=>\s*Promise<boolean>/,
  'getLockWindowPosition should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  viteEnv,
  /setLockWindowPosition:\s*\(locked:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'setLockWindowPosition should expose unknown locked values and unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /setLockWindowPosition:\s*\(locked:\s*unknown\)\s*=>\s*Promise<boolean>/,
  'setLockWindowPosition should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  windowIpc,
  /const nextLockWindowPosition = locked === true;[\s\S]*const currentSettings = getAppSettings\(\);[\s\S]*if \(currentSettings\.lockWindowPosition === nextLockWindowPosition\) return nextLockWindowPosition;[\s\S]*lockWindowPosition: nextLockWindowPosition/,
  'windowIpc lock-position setter should skip no-op window z-order work for the current setting.',
);
assert.doesNotMatch(
  windowIpc,
  /Boolean\(store\.get\((compactModeKey|autoStartKey), false\)\)/,
  'windowIpc boolean settings should not coerce malformed truthy stored values to true.',
);
assert.match(
  windowIpc,
  /store\.get\(compactModeKey, false\) === true/,
  'windowIpc should treat only a strict true compact-mode store value as enabled.',
);
assert.match(
  windowIpc,
  /store\.get\(autoStartKey, false\) === true/,
  'windowIpc should treat only a strict true autostart store value as enabled.',
);
assert.match(
  windowIpc,
  /const nextCompactMode = compactMode === true;[\s\S]*if \(store\.get\(compactModeKey\) === nextCompactMode\) return;[\s\S]*store\.set\(compactModeKey, nextCompactMode\)/,
  'windowIpc should skip compact-mode persistence when the stored boolean already matches.',
);
assert.match(
  windowIpc,
  /window:setCompactMode'[\s\S]*compactMode: unknown[\s\S]*const nextCompactMode = compactMode === true/,
  'windowIpc compact-mode setter should expose unknown runtime compact-mode values before strict boolean narrowing.',
);
assert.match(
  preload,
  /setWindowCompactMode:\s*\(compactMode:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setCompactMode', compactMode\)/,
  'preload setWindowCompactMode should forward unknown runtime compact-mode values.',
);
assert.match(
  viteEnv,
  /setWindowCompactMode:\s*\(compactMode:\s*unknown\)\s*=>\s*Promise<void>/,
  'setWindowCompactMode should expose unknown compact-mode values at the ambient preload boundary.',
);
assert.doesNotMatch(
  windowIpc,
  /store\.set\(compactModeKey, compactMode\)/,
  'windowIpc should not persist raw runtime compact-mode IPC values.',
);
assert.match(
  windowIpc,
  /const nextAutoStart = enabled === true;[\s\S]*if \(store\.get\(autoStartKey\) === nextAutoStart\) return nextAutoStart;[\s\S]*store\.set\(autoStartKey, nextAutoStart\)[\s\S]*openAtLogin: nextAutoStart[\s\S]*return nextAutoStart/,
  'windowIpc should skip unchanged autostart writes and system login-item updates.',
);
assert.match(
  windowIpc,
  /window:setAutoStart'[\s\S]*enabled: unknown[\s\S]*const nextAutoStart = enabled === true/,
  'windowIpc autostart setter should expose unknown runtime enabled values before strict boolean narrowing.',
);
assert.match(
  preload,
  /setAutoStart:\s*\(enabled:\s*unknown\)\s*=>\s*ipcRenderer\.invoke\('window:setAutoStart', enabled\)/,
  'preload setAutoStart should forward unknown runtime enabled values.',
);
assert.match(
  viteEnv,
  /getWindowCompactMode:\s*\(\)\s*=>\s*Promise<unknown>/,
  'getWindowCompactMode should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /getWindowCompactMode:\s*\(\)\s*=>\s*Promise<boolean>/,
  'getWindowCompactMode should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  appUiStatePersistence,
  /getWindowCompactMode\(\)\.then\(\(value\) => \{[\s\S]*lastPersistedCompactMode = value === true;[\s\S]*handlers\.setCompactMode\(lastPersistedCompactMode\)/,
  'App UI state loading should narrow compact-mode results before recording the persistence baseline and updating state.',
);
assert.match(
  viteEnv,
  /getAutoStart:\s*\(\)\s*=>\s*Promise<unknown>/,
  'getAutoStart should expose unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /getAutoStart:\s*\(\)\s*=>\s*Promise<boolean>/,
  'getAutoStart should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  settingsControls,
  /getAutoStart\(\)\.then\(\(value\) => setAutoStartIfChanged\(autoStartRef, setAutoStart, value === true\)\)/,
  'AutoStartToggle should narrow getAutoStart results before updating state through its no-op guard.',
);
assert.doesNotMatch(
  settingsControls,
  /getAutoStart\(\)\.then\(setAutoStart\)/,
  'AutoStartToggle should not pass unknown auto-start results directly into React state.',
);
assert.match(
  viteEnv,
  /setAutoStart:\s*\(enabled:\s*unknown\)\s*=>\s*Promise<unknown>/,
  'setAutoStart should expose unknown enabled values and unknown return values at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /setAutoStart:\s*\(enabled:\s*unknown\)\s*=>\s*Promise<boolean>/,
  'setAutoStart should not claim trusted boolean return values at the ambient preload boundary.',
);
assert.match(
  settingsControls,
  /setAutoStart\(enabled\)\.then\(\(value\) => \{[\s\S]*setAutoStartIfChanged\(autoStartRef, setAutoStart, value === true\);[\s\S]*\}\)/,
  'AutoStartToggle should parse setAutoStart results as the returned enabled state before applying its no-op guard.',
);
assert.match(
  settingsControls,
  /function setAutoStartIfChanged\([\s\S]*if \(autoStartRef\.current === nextAutoStart\) return;[\s\S]*autoStartRef\.current = nextAutoStart;[\s\S]*setAutoStart\(nextAutoStart\)/,
  'AutoStartToggle should retain its state reference when Electron reports the already-rendered auto-start value.',
);
assert.match(
  settingsControls,
  /const autoStartRef = useRef\(false\);[\s\S]*getAutoStart\(\)\.then\(\(value\) => setAutoStartIfChanged\(autoStartRef, setAutoStart, value === true\)\);[\s\S]*setAutoStart\(enabled\)\.then\(\(value\) => \{[\s\S]*setAutoStartIfChanged\(autoStartRef, setAutoStart, value === true\);/,
  'AutoStartToggle should use the same no-op guard for initial reads and mutation responses.',
);
assert.doesNotMatch(
  settingsControls,
  /if \(ok\) setAutoStart\(enabled\)/,
  'AutoStartToggle should not treat the auto-start return value as a trusted success flag.',
);
assert.doesNotMatch(
  windowIpc,
  /store\.set\(autoStartKey, enabled\)/,
  'windowIpc should not persist raw runtime autostart IPC values.',
);
assert.match(windowIpc, /setLoginItemSettings/, 'windowIpc should preserve autostart login-item behavior.');
assert.doesNotMatch(windowIpc, /createSafeStore|new Store\(/, 'windowIpc should not create or own Electron Store.');
assert.match(
  preload,
  /onWindowModeChanged:\s*\(callback:\s*\(mode:\s*unknown\)\s*=>\s*void\)\s*=>\s*\{/,
  'preload onWindowModeChanged should expose unknown runtime mode payloads.',
);
assert.match(
  preload,
  /const listener = \(_event:\s*unknown,\s*mode:\s*unknown\)\s*=>\s*callback\(mode\)/,
  'preload onWindowModeChanged should forward IPC mode payloads as unknown.',
);
assert.match(
  viteEnv,
  /onWindowModeChanged:\s*\(callback:\s*\(mode:\s*unknown\)\s*=>\s*void\)\s*=>\s*\(\)\s*=>\s*void/,
  'onWindowModeChanged should expose unknown mode payloads at the ambient preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /onWindowModeChanged:\s*\(callback:\s*\(mode:\s*import\('\.\.\/shared\/windowMode'\)\.WindowMode\)\s*=>\s*void\)/,
  'vite-env should not claim window-mode change payloads are already trusted WindowMode values.',
);

console.log('electron window IPC module verification passed');

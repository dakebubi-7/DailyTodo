import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const viteEnv = readFileSync(join(root, 'src/vite-env.d.ts'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

assert.match(main, /const SETTINGS_WINDOW_WIDTH\s*=\s*720/, 'main should define settings window width');
assert.match(main, /let settingsModeOpen\s*=\s*false/, 'main should track settings mode state');
assert.match(main, /let settingsModeRestoreWidth\s*=\s*RESET_WINDOW_WIDTH/, 'main should remember the previous compact width');
assert.match(main, /ipcMain\.handle\('window:setSettingsMode'/, 'main should register window:setSettingsMode');
assert.match(main, /function getSettingsWindowWidth\(workAreaWidth: number\)/, 'main should centralize settings window width calculation');
assert.match(main, /Math\.min\(SETTINGS_WINDOW_WIDTH,\s*Math\.max\(MIN_WINDOW_WIDTH,\s*workAreaWidth - 40\)\)/, 'settings width should clamp to work area');
assert.match(main, /const width = getSettingsWindowWidth\(workArea\.width\);/, 'open width should use settings window width helper');
assert.match(main, /win\.setMinimumSize\(width,\s*RESET_WINDOW_HEIGHT\)/, 'opening settings should raise the minimum window width');
assert.match(main, /win\.setMinimumSize\(MIN_WINDOW_WIDTH,\s*RESET_WINDOW_HEIGHT\)/, 'closing or resetting settings should restore compact minimum size');
assert.match(main, /if \(!settingsModeOpen\) \{\s*return \{ ok: true, width: bounds\.width \};\s*\}/, 'closing before opening should be a no-op');
assert.match(preload, /setSettingsMode:\s*\(open: boolean\)\s*=>\s*ipcRenderer\.invoke\('window:setSettingsMode', open\)/, 'preload should expose setSettingsMode');
assert.match(viteEnv, /setSettingsMode:\s*\(open: boolean\)\s*=>\s*Promise<\{ ok: boolean; width\?: number \}>/, 'vite-env should type setSettingsMode');
assert.match(app, /setSettingsMode\?\.\(settingsOpen\)/, 'App should sync settingsOpen to Electron');

console.log('verify-settings-v2-window-mode passed');
